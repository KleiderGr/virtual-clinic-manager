import { createContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  role: 'patient' | 'doctor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  roles: UserRole[];
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithIdToken: (token: string, nonce?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isDoctor: boolean;
  isPatient: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and roles
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      setRoles(rolesData as UserRole[]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Error al cargar datos del usuario');
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setTimeout(() => {
        setLoading(false);
      }, 350);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setTimeout(() => {
        setLoading(false);
      }, 350);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('¡Bienvenido!', {
        description: 'Has iniciado sesión exitosamente',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Error al iniciar sesión', {
        description: authError.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Verifica tu email y contraseña.'
          : authError.message,
      });
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Error al iniciar sesión con Google', {
        description: authError.message,
      });
      throw error;
    }
  };

  // Sign in with ID Token (Google One Tap)
  const signInWithIdToken = async (token: string, nonce?: string) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token,
        nonce,
      });

      if (error) throw error;
      
      toast.success('¡Bienvenido!', {
        description: 'Has iniciado sesión con Google exitosamente',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Error al iniciar sesión con Google One Tap', {
        description: authError.message,
      });
      throw error;
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          },
        },
      });

      if (error) throw error;
      
      toast.success('¡Cuenta creada!', {
        description: 'Tu cuenta ha sido creada exitosamente',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Error al crear cuenta', {
        description: authError.message,
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Sesión cerrada', {
        description: 'Has cerrado sesión exitosamente',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error('Error al cerrar sesión', {
        description: authError.message,
      });
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchUserData(user.id);
      
      toast.success('Perfil actualizado', {
        description: 'Tus datos han sido actualizados exitosamente',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
      throw error;
    }
  };

  // Computed role flags
  const isAdmin = roles.some((r) => r.role === 'admin');
  const isDoctor = roles.some((r) => r.role === 'doctor');
  const isPatient = roles.some((r) => r.role === 'patient');

  const value: AuthContextType = {
    user,
    profile,
    roles,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signInWithIdToken,
    signUp,
    signOut,
    updateProfile,
    isAdmin,
    isDoctor,
    isPatient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
