import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Availability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  doctor_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export interface CreateAvailabilityInput {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration?: number;
  is_active?: boolean;
}

export interface UpdateAvailabilityInput extends Partial<CreateAvailabilityInput> {
  id: string;
}

export interface CreateBlockedDateInput {
  doctor_id: string;
  blocked_date: string;
  reason?: string;
}

// Fetch availability for a doctor
export function useAvailability(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['availability', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('Doctor ID is required');

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week');

      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!doctorId,
  });
}

// Fetch blocked dates for a doctor
export function useBlockedDates(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['blocked_dates', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('Doctor ID is required');

      const { data, error} = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('blocked_date');

      if (error) throw error;
      return data as BlockedDate[];
    },
    enabled: !!doctorId,
  });
}

// Create availability
export function useCreateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAvailabilityInput) => {
      const { data, error } = await supabase
        .from('availability')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability', variables.doctor_id] });
      toast.success('Disponibilidad creada', {
        description: 'La disponibilidad ha sido agregada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear disponibilidad', {
        description: error.message,
      });
    },
  });
}

// Update availability
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAvailabilityInput) => {
      const { data, error } = await supabase
        .from('availability')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability', data.doctor_id] });
      toast.success('Disponibilidad actualizada', {
        description: 'La disponibilidad ha sido actualizada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar disponibilidad', {
        description: error.message,
      });
    },
  });
}

// Delete availability
export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the doctor_id before deleting
      const { data: availability } = await supabase
        .from('availability')
        .select('doctor_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return availability?.doctor_id;
    },
    onSuccess: (doctorId) => {
      if (doctorId) {
        queryClient.invalidateQueries({ queryKey: ['availability', doctorId] });
      }
      toast.success('Disponibilidad eliminada', {
        description: 'La disponibilidad ha sido eliminada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar disponibilidad', {
        description: error.message,
      });
    },
  });
}

// Block date
export function useBlockDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBlockedDateInput) => {
      const { data, error } = await supabase
        .from('blocked_dates')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blocked_dates', variables.doctor_id] });
      toast.success('Fecha bloqueada', {
        description: 'La fecha ha sido bloqueada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al bloquear fecha', {
        description: error.message,
      });
    },
  });
}

// Unblock date
export function useUnblockDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the doctor_id before deleting
      const { data: blockedDate } = await supabase
        .from('blocked_dates')
        .select('doctor_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return blockedDate?.doctor_id;
    },
    onSuccess: (doctorId) => {
      if (doctorId) {
        queryClient.invalidateQueries({ queryKey: ['blocked_dates', doctorId] });
      }
      toast.success('Fecha desbloqueada', {
        description: 'La fecha ha sido desbloqueada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al desbloquear fecha', {
        description: error.message,
      });
    },
  });
}
