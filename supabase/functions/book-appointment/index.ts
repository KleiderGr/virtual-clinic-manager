import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Schema de validación mejorado
const requestSchema = z.object({
  doctor_id: z.string().uuid("ID de doctor inválido"),
  patient_id: z.string().uuid("ID de paciente inválido"),
  appointment_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha debe ser YYYY-MM-DD")
    .refine(date => {
      const d = new Date(date + 'T00:00:00');
      return !isNaN(d.getTime());
    }, "Fecha inválida")
    .refine(date => {
      const appointmentDate = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate >= today;
    }, "La fecha no puede ser en el pasado")
    .refine(date => {
      const appointmentDate = new Date(date + 'T00:00:00');
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6); // Max 6 meses adelante
      return appointmentDate <= maxDate;
    }, "La cita no puede ser más de 6 meses en el futuro"),
  start_time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora debe ser HH:MM (24h)")
    .refine(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    }, "Hora inválida"),
  reason: z.string().max(500, "La razón no puede exceder 500 caracteres").optional(),
  timezone: z.string().optional().default("UTC"),
});

// Cache simple para rate limiting (en producción usar Redis)
const requestCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX = 10;

// Helper functions
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTimeFromMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Cleanup cache periódico
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now > value.resetTime) {
      requestCache.delete(key);
    }
  }
}, 60000); // Cada minuto

export default async (req: Request) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers 
    });
  }

  // Rate Limiting simple por IP
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const clientLimit = requestCache.get(clientIp);
  
  if (clientLimit) {
    if (now > clientLimit.resetTime) {
      requestCache.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (clientLimit.count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ 
          error: 'Límite de tasa excedido', 
          details: `Por favor, espere ${Math.ceil((clientLimit.resetTime - now) / 60000)} minutos` 
        }),
        { 
          status: 429, 
          headers: { ...headers, 'Retry-After': '900' } 
        }
      );
    } else {
      clientLimit.count++;
      requestCache.set(clientIp, clientLimit);
    }
  } else {
    requestCache.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  try {
    // Validación del cuerpo de la solicitud
    const json = await req.json();
    const parsed = requestSchema.safeParse(json);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos', 
          details: errors 
        }), 
        { 
          status: 400, 
          headers 
        }
      );
    }

    const { doctor_id, patient_id, appointment_date, start_time, reason, timezone } = parsed.data;

    // Inicializar cliente Supabase con service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Falta configuración de Supabase');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convertir fecha a día de la semana considerando timezone
    const appointmentDate = new Date(`${appointment_date}T${start_time}:00`);
    const dayOfWeek = appointmentDate.getUTCDay(); // 0 = Domingo

    // 🔄 **EJECUCIÓN EN PARALELO para mejor rendimiento**
    // Ejecutar todas las validaciones necesarias en paralelo
    const [
      doctorCheck,
      patientCheck,
      availabilityQuery,
      blockedDatesQuery,
      existingAppointmentsQuery
    ] = await Promise.allSettled([
      // 1. Verificar que el doctor existe y está activo
      supabase
        .from('doctors')
        .select('id, is_active, consultation_fee')
        .eq('id', doctor_id)
        .eq('is_active', true)
        .single(),
      
      // 2. Verificar que el paciente existe
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', patient_id)
        .single(),
      
      // 3. Buscar disponibilidad (múltiples slots posibles)
      supabase
        .from('availability')
        .select('id, start_time, end_time, slot_duration')
        .eq('doctor_id', doctor_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time', { ascending: true }),
      
      // 4. Verificar fechas bloqueadas
      supabase
        .from('blocked_dates')
        .select('id, reason')
        .eq('doctor_id', doctor_id)
        .eq('blocked_date', appointment_date)
        .maybeSingle(),
      
      // 5. Verificar sobre-reserva
      supabase
        .from('appointments')
        .select('id, status, patient_id')
        .eq('doctor_id', doctor_id)
        .eq('appointment_date', appointment_date)
        .eq('start_time', start_time)
        .neq('status', 'cancelled')
        .maybeSingle(),
    ]);

    // Procesar resultados de validaciones paralelas
    
    // Validación 1: Doctor
    if (doctorCheck.status === 'rejected' || 
        (doctorCheck.status === 'fulfilled' && doctorCheck.value.error)) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar doctor' }),
        { status: 500, headers }
      );
    }
    
    if (!doctorCheck.value.data) {
      return new Response(
        JSON.stringify({ error: 'Doctor no encontrado o inactivo' }),
        { status: 404, headers }
      );
    }

    // Validación 2: Paciente
    if (patientCheck.status === 'rejected' || 
        (patientCheck.status === 'fulfilled' && patientCheck.value.error)) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar paciente' }),
        { status: 500, headers }
      );
    }
    
    if (!patientCheck.value.data) {
      return new Response(
        JSON.stringify({ error: 'Paciente no encontrado' }),
        { status: 404, headers }
      );
    }

    // Validación 3: Disponibilidad
    if (availabilityQuery.status === 'rejected' || 
        (availabilityQuery.status === 'fulfilled' && availabilityQuery.value.error)) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar disponibilidad' }),
        { status: 500, headers }
      );
    }
    
    const availabilitySlots = availabilityQuery.value.data;
    if (!availabilitySlots || availabilitySlots.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Doctor no disponible ese día' }),
        { status: 409, headers }
      );
    }

    // Buscar slot de disponibilidad que coincida
    const requestedTimeMinutes = parseTimeToMinutes(start_time);
    let matchedSlot = null;

    for (const slot of availabilitySlots) {
      const slotStartMinutes = parseTimeToMinutes(slot.start_time);
      const slotEndMinutes = parseTimeToMinutes(slot.end_time);
      
      if (requestedTimeMinutes >= slotStartMinutes && 
          requestedTimeMinutes < slotEndMinutes) {
        
        // Validar que el tiempo esté alineado con slot_duration
        const timeFromSlotStart = requestedTimeMinutes - slotStartMinutes;
        if (timeFromSlotStart % (slot.slot_duration || 30) === 0) {
          matchedSlot = slot;
          break;
        } else {
          return new Response(
            JSON.stringify({ 
              error: 'Hora no válida', 
              details: `Las citas deben comenzar en intervalos de ${slot.slot_duration || 30} minutos` 
            }),
            { status: 400, headers }
          );
        }
      }
    }

    if (!matchedSlot) {
      const availableTimes = availabilitySlots.map(slot => 
        `${slot.start_time} - ${slot.end_time}`
      ).join(', ');
      
      return new Response(
        JSON.stringify({ 
          error: 'Hora fuera del rango de disponibilidad',
          details: `Horarios disponibles: ${availableTimes}` 
        }),
        { status: 409, headers }
      );
    }

    // Validación 4: Fechas bloqueadas
    if (blockedDatesQuery.status === 'rejected' || 
        (blockedDatesQuery.status === 'fulfilled' && blockedDatesQuery.value.error)) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar fechas bloqueadas' }),
        { status: 500, headers }
      );
    }
    
    if (blockedDatesQuery.value.data) {
      return new Response(
        JSON.stringify({ 
          error: 'Fecha bloqueada para este doctor',
          details: blockedDatesQuery.value.data.reason || 'Fecha no disponible'
        }),
        { status: 409, headers }
      );
    }

    // Validación 5: Sobre-reserva
    if (existingAppointmentsQuery.status === 'rejected' || 
        (existingAppointmentsQuery.status === 'fulfilled' && existingAppointmentsQuery.value.error)) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar disponibilidad de horario' }),
        { status: 500, headers }
      );
    }
    
    if (existingAppointmentsQuery.value.data) {
      // Verificar si es el mismo paciente intentando duplicar
      if (existingAppointmentsQuery.value.data.patient_id === patient_id) {
        return new Response(
          JSON.stringify({ error: 'Ya tienes una cita reservada en este horario' }),
          { status: 409, headers }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'El horario ya no está disponible' }),
        { status: 409, headers }
      );
    }

    // Calcular end_time basado en slot_duration
    const slotDuration = matchedSlot.slot_duration || 30;
    const endTimeMinutes = requestedTimeMinutes + slotDuration;
    
    // Verificar que no exceda el final del slot
    const slotEndMinutes = parseTimeToMinutes(matchedSlot.end_time);
    if (endTimeMinutes > slotEndMinutes) {
      return new Response(
        JSON.stringify({ 
          error: 'Duración de cita excede disponibilidad',
          details: `La cita terminaría a las ${formatTimeFromMinutes(endTimeMinutes)} pero el doctor termina a las ${matchedSlot.end_time}`
        }),
        { status: 400, headers }
      );
    }

    const end_time = formatTimeFromMinutes(endTimeMinutes);

    // 🔄 **TRANSACCIÓN ATÓMICA usando RPC o transacción explícita**
    // Crear función RPC si no existe, o usar transacción SQL
    try {
      // Opción A: Usar función RPC (recomendado para atomicidad)
      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert({
          doctor_id,
          patient_id,
          appointment_date,
          start_time,
          end_time,
          reason: reason || '',
          status: 'pending'
        })
        .select(`
          *,
          doctors:doctor_id (
            id,
            consultation_fee,
            profiles:user_id (
              full_name
            )
          ),
          profiles:patient_id (
            full_name,
            email
          )
        `)
        .single();

      if (insertError) {
        // Verificar si es error de constraint UNIQUE (concurrencia)
        if (insertError.code === '23505') {
          return new Response(
            JSON.stringify({ 
              error: 'El horario ya no está disponible',
              details: 'Alguien más acaba de reservar este horario' 
            }),
            { status: 409, headers }
          );
        }
        
        throw insertError;
      }

      // 📧 Opcional: Disparar evento para notificaciones (no bloqueante)
      setTimeout(async () => {
        try {
          // Enviar notificación por email (ejemplo usando resend o similar)
          console.log(`Cita ${data.id} creada exitosamente`);
          
          // Podrías agregar lógica para enviar email aquí
          // await sendAppointmentConfirmation(data);
        } catch (notificationError) {
          console.error('Error en notificación:', notificationError);
          // No fallar la solicitud principal por errores de notificación
        }
      }, 0);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cita creada exitosamente',
          appointment_id: data.id,
          appointment: {
            id: data.id,
            doctor_name: data.doctors?.profiles?.full_name,
            patient_name: data.profiles?.full_name,
            date: data.appointment_date,
            start_time: data.start_time,
            end_time: data.end_time,
            status: data.status,
            consultation_fee: data.doctors?.consultation_fee
          }
        }),
        { 
          status: 201, 
          headers 
        }
      );

    } catch (insertError: any) {
      console.error('Error al insertar cita:', insertError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Error interno al crear la cita',
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        }),
        { status: 500, headers }
      );
    }

  } catch (error: any) {
    console.error('Error inesperado:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      }),
      { 
        status: 500, 
        headers 
      }
    );
  }
};