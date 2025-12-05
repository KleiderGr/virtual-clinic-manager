import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Doctor {
  id: string;
  user_id: string | null;
  specialty_id: string | null;
  license_number: string;
  bio: string | null;
  consultation_fee: number;
  years_experience: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields (note: profiles is singular in response when using foreign key)
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  specialty?: {
    name: string;
  } | null;
}

export interface CreateDoctorInput {
  user_id?: string;
  specialty_id: string;
  license_number: string;
  bio?: string;
  consultation_fee?: number;
  years_experience?: number;
  is_active?: boolean;
}

export interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  id: string;
}

// Fetch all doctors
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          specialty:specialties(name),
          profiles(full_name, email, phone, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching doctors:', error);
        throw new Error(`Error al cargar doctores: ${error.message}`);
      }

      return data as unknown as Doctor[];
    },
  });
}

// Fetch single doctor
export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: ['doctors', id],
    queryFn: async () => {
      if (!id) throw new Error('Doctor ID is required');
      
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          specialty:specialties(name),
          profiles(full_name, email, phone, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching doctor:', error);
        throw new Error(`Error al cargar doctor: ${error.message}`);
      }

      return data as unknown as Doctor;
    },
    enabled: !!id,
  });
}

// Create doctor
export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDoctorInput) => {
      const { data, error } = await supabase
        .from('doctors')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor creado', {
        description: 'El doctor ha sido agregado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear doctor', {
        description: error.message,
      });
    },
  });
}

// Update doctor
export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDoctorInput) => {
      const { data, error } = await supabase
        .from('doctors')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', variables.id] });
      toast.success('Doctor actualizado', {
        description: 'Los datos del doctor han sido actualizados',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar doctor', {
        description: error.message,
      });
    },
  });
}

// Delete doctor
export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor eliminado', {
        description: 'El doctor ha sido eliminado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar doctor', {
        description: error.message,
      });
    },
  });
}

// Fetch specialties (helper)
export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}
