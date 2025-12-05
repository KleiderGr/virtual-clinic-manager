import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/lib/permissions';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserWithRoles extends UserProfile {
  roles: UserRole[];
}

// Type for profiles from Supabase (may not have active/deleted_at yet)
interface ProfileFromDB {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  active?: boolean | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to safely call log_admin_action
async function logAdminAction(action: string, targetUserId: string, details?: Record<string, unknown>) {
  try {
    // Try to call the RPC function if it exists
    await supabase.rpc('log_admin_action', {
      p_action: action,
      p_target_user_id: targetUserId,
      p_details: details || null,
    });
  } catch (error) {
    // Silently fail if function doesn't exist yet (types not updated)
    console.warn('log_admin_action not available:', error);
  }
}

// Fetch all users with their roles (with pagination)
export function useUsers(page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: async () => {
      // Fetch profiles with count
      const { data: profiles, error: profilesError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('active', true) // Only active users
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return {
          users: [] as UserWithRoles[],
          total: 0,
          pages: 0,
        };
      }

      // Fetch roles for these users
      const userIds = profiles.map((p) => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles as ProfileFromDB[]).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        active: profile.active ?? true,
        deleted_at: profile.deleted_at ?? null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        roles: (roles || []).filter((role) => role.user_id === profile.id) as UserRole[],
      }));

      return {
        users: usersWithRoles,
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize),
      };
    },
    // Add retry logic for network errors
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fetch single user with roles
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('active', true) // Only active users
        .single();

      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', id);

      if (rolesError) throw rolesError;

      const profileData = profile as ProfileFromDB;

      return {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        active: profileData.active ?? true,
        deleted_at: profileData.deleted_at ?? null,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        roles: (roles || []) as UserRole[],
      } as UserWithRoles;
    },
    enabled: !!id,
  });
}

// Update user profile
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; full_name?: string; phone?: string; avatar_url?: string }) => {
      // Sanitize inputs
      const sanitized: Record<string, string> = {};
      
      if (updates.full_name) sanitized.full_name = updates.full_name.trim();
      if (updates.phone) sanitized.phone = updates.phone.trim();
      if (updates.avatar_url) sanitized.avatar_url = updates.avatar_url.trim();

      const { data, error } = await supabase
        .from('profiles')
        .update(sanitized)
        .eq('id', id)
        .eq('active', true) // Only update active users
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      toast.success('Usuario actualizado', {
        description: 'Los datos del usuario han sido actualizados',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar usuario', {
        description: error.message,
      });
    },
  });
}

// Assign role to user
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Validate role
      const validRoles: AppRole[] = ['patient', 'doctor', 'admin'];
      if (!validRoles.includes(role)) {
        throw new Error('Rol inválido');
      }

      // Check if role already exists (double-check on client side)
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();

      if (existing) {
        throw new Error('El usuario ya tiene este rol asignado');
      }

      // Insert new role
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) {
        // Handle specific errors
        if (error.message.includes('already has this role')) {
          throw new Error('El usuario ya tiene este rol asignado');
        }
        throw error;
      }

      // Log the action (optional, won't fail if function doesn't exist)
      await logAdminAction(`assign_role_${role}`, userId, { role });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      toast.success('Rol asignado', {
        description: 'El rol ha sido asignado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al asignar rol', {
        description: error.message,
      });
    },
  });
}

// Revoke role from user
export function useRevokeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, userId, roleName }: { roleId: string; userId: string; roleName: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        // Handle specific errors
        if (error.message.includes('last role')) {
          throw new Error('No puedes eliminar el último rol del usuario');
        }
        throw error;
      }

      // Log the action (optional, won't fail if function doesn't exist)
      await logAdminAction(`revoke_role_${roleName}`, userId, { role: roleName, role_id: roleId });

      return { roleId, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', data.userId] });
      toast.success('Rol revocado', {
        description: 'El rol ha sido revocado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al revocar rol', {
        description: error.message,
      });
    },
  });
}

// Soft delete user (replaces admin.deleteUser)
export function useSoftDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Soft delete by setting active = false
      const updateData = {
        active: false,
        deleted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Log the action (optional, won't fail if function doesn't exist)
      await logAdminAction('soft_delete_user', userId, { deleted_at: updateData.deleted_at });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario desactivado', {
        description: 'El usuario ha sido desactivado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al desactivar usuario', {
        description: error.message,
      });
    },
  });
}

// Restore soft-deleted user
export function useRestoreUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const updateData = {
        active: true,
        deleted_at: null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Log the action (optional, won't fail if function doesn't exist)
      await logAdminAction('restore_user', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario restaurado', {
        description: 'El usuario ha sido reactivado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al restaurar usuario', {
        description: error.message,
      });
    },
  });
}
