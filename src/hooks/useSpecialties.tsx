import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface CreateSpecialtyInput {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateSpecialtyInput extends Partial<CreateSpecialtyInput> {
  id: string;
}

// Fetch all specialties
export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching specialties:', error);
        throw new Error(`Error al cargar especialidades: ${error.message}`);
      }

      return data as Specialty[];
    },
  });
}

// Fetch single specialty
export function useSpecialty(id: string | undefined) {
  return useQuery({
    queryKey: ['specialties', id],
    queryFn: async () => {
      if (!id) throw new Error('Specialty ID is required');
      
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching specialty:', error);
        throw new Error(`Error al cargar especialidad: ${error.message}`);
      }

      return data as Specialty;
    },
    enabled: !!id,
  });
}

// Create specialty
export function useCreateSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSpecialtyInput) => {
      const { data, error } = await supabase
        .from('specialties')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Especialidad creada', {
        description: 'La especialidad ha sido agregada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear especialidad', {
        description: error.message,
      });
    },
  });
}

// Update specialty
export function useUpdateSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSpecialtyInput) => {
      const { data, error } = await supabase
        .from('specialties')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      queryClient.invalidateQueries({ queryKey: ['specialties', variables.id] });
      toast.success('Especialidad actualizada', {
        description: 'Los datos de la especialidad han sido actualizados',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar especialidad', {
        description: error.message,
      });
    },
  });
}

// Delete specialty
export function useDeleteSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Especialidad eliminada', {
        description: 'La especialidad ha sido eliminada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar especialidad', {
        description: error.message,
      });
    },
  });
}
