
import { createClient } from 'npm:@supabase/supabase-js@2.45.0'
import { z } from 'npm:zod@3.23.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['admin', 'doctor', 'patient']).default('patient'),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const json = await req.json();
    const parseResult = userSchema.safeParse(json);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation Error', 
          details: parseResult.error.errors 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    const { email, password, full_name, phone, role } = parseResult.data;

    // 1. Create user in Supabase Auth
    const { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since admin created it
      user_metadata: {
        full_name,
        phone,
      },
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    if (!userData.user) {
      throw new Error('User creation failed unexpectedly');
    }

    // 2. Assign role
    // We assume the user_roles table exists as per useUsers.tsx
    // user_id, role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: role,
      });

    if (roleError) {
      // Cleanup: Delete the user if role assignment fails to maintain consistency
      await supabaseClient.auth.admin.deleteUser(userData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to assign role: ' + roleError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // 3. Return success
    return new Response(
      JSON.stringify({ 
        user: userData.user,
        message: 'User created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
