import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentInput {
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

// Fetch appointments for current user
export function useAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });
}

// Fetch single appointment
export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Appointment ID is required');

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    enabled: !!id,
  });
}

// Create appointment using RPC function
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      if (!user) throw new Error('User not authenticated');

      // Direct insert instead of RPC call
      const { error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: input.doctor_id,
          patient_id: user.id,
          appointment_date: input.appointment_date,
          start_time: input.start_time,
          end_time: input.end_time,
          reason: input.reason,
          status: 'confirmed',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita agendada', {
        description: 'Tu cita ha sido agendada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al agendar cita', {
        description: error.message,
      });
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita cancelada', {
        description: 'Tu cita ha sido cancelada exitosamente',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al cancelar cita', {
        description: error.message,
      });
    },
  });
}

// Subscribe to appointment changes (for real-time updates)
export function useAppointmentsSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['appointments', 'subscription', user?.id],
    queryFn: () => {
      if (!user) return null;

      const subscription = supabase
        .channel('appointments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            // Invalidate and refetch appointments when changes occur
            queryClient.invalidateQueries({ queryKey: ['appointments', user.id] });
          }
        )
        .subscribe();

      return subscription;
    },
    enabled: !!user,
    staleTime: Infinity, // Subscription doesn't really have data to return
  });
}
