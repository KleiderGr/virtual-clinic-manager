import { z } from 'zod';

export const bookingSchema = z.object({
  patientName: z.string().min(1, 'El nombre es requerido'),
  patientEmail: z.string().email('Email inválido'),
  patientPhone: z.string().min(7, 'El teléfono es requerido'),
  specialty: z.string().optional(),
  doctorId: z.string().min(1, 'Por favor, selecciona un doctor'),
  date: z.string().min(1, 'Por favor, selecciona una fecha'),
  time: z.string().min(1, 'Por favor, selecciona un horario'),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
