import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Availability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  slot_duration: number; // in minutes
  created_at: string;
}

export interface CreateAvailabilityInput {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

// Fetch availability for a specific doctor
export function useDoctorAvailability(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['availability', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week');

      if (error) {
        console.error('Error fetching availability:', error);
        return [];
      }

      return data as Availability[];
    },
    enabled: !!doctorId,
  });
}

// Bulk replace availability (delete all and insert new ones)
export function useReplaceAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ doctorId, availability }: { doctorId: string; availability: Omit<CreateAvailabilityInput, 'doctor_id'>[] }) => {
      // Delete existing availability
      await supabase
        .from('availability')
        .delete()
        .eq('doctor_id', doctorId);

      // Insert new availability if any
      if (availability.length > 0) {
        const items = availability.map(item => ({
          ...item,
          doctor_id: doctorId,
        }));

        const { data, error } = await supabase
          .from('availability')
          .insert(items)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability', variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Horarios guardados');
    },
    onError: (error: Error) => {
      toast.error('Error al guardar horarios', {
        description: error.message,
      });
    },
  });
}
