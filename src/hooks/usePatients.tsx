import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PatientWithAppointments extends Patient {
  appointments: {
    id: string;
    appointment_date: string;
    start_time: string;
    status: string;
  }[];
}

// Fetch all patients
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
  });
}

// Fetch single patient with appointments
export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      if (!id) throw new Error('Patient ID is required');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, appointment_date, start_time, status')
        .eq('patient_id', id)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      return {
        ...profile,
        appointments: appointments || [],
      } as PatientWithAppointments;
    },
    enabled: !!id,
  });
}

// Update patient
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; full_name?: string; phone?: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
      toast.success('Paciente actualizado', {
        description: 'Los datos del paciente han sido actualizados',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar paciente', {
        description: error.message,
      });
    },
  });
}
