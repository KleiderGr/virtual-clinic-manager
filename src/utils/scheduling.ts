import { Availability, Appointment } from '@/types/clinic';

/**
 * Generates time slots in 15-minute intervals between start and end times
 */
export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    slots.push(
      `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    );
    
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }
  
  return slots;
}

/**
 * Gets all available time slots for a doctor on a specific date
 */
export function getAvailableSlots(
  doctorId: string,
  date: string,
  availabilities: Availability[],
  appointments: Appointment[],
  blockedDates: { doctorId: string; date: string }[]
): string[] {
  // Check if date is blocked
  const isBlocked = blockedDates.some(
    (blocked) => blocked.doctorId === doctorId && blocked.date === date
  );
  if (isBlocked) return [];

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date(date).getDay();
  
  // Get doctor's availability for this day
  const doctorAvailability = availabilities.filter(
    (a) => a.doctorId === doctorId && a.dayOfWeek === dayOfWeek
  );
  
  if (doctorAvailability.length === 0) return [];

  // Generate all possible slots from availability windows
  const allSlots = new Set<string>();
  doctorAvailability.forEach((avail) => {
    generateTimeSlots(avail.startTime, avail.endTime).forEach((slot) =>
      allSlots.add(slot)
    );
  });

  // Get booked appointments for this doctor on this date
  const bookedSlots = new Set(
    appointments
      .filter(
        (apt) =>
          apt.doctorId === doctorId &&
          apt.date === date &&
          apt.status !== 'cancelled'
      )
      .map((apt) => apt.time)
  );

  // Filter out booked slots
  const availableSlots = Array.from(allSlots).filter(
    (slot) => !bookedSlots.has(slot)
  );

  // Sort slots chronologically
  return availableSlots.sort((a, b) => {
    const [aHour, aMin] = a.split(':').map(Number);
    const [bHour, bMin] = b.split(':').map(Number);
    return aHour * 60 + aMin - (bHour * 60 + bMin);
  });
}

/**
 * Finds the next available doctor for a specialty with an available slot
 * Returns the doctor ID and the first available slot
 */
export function findNextAvailableDoctor(
  specialty: string,
  date: string,
  doctors: { id: string; specialty: string }[],
  availabilities: Availability[],
  appointments: Appointment[],
  blockedDates: { doctorId: string; date: string }[]
): { doctorId: string; time: string } | null {
  // Filter doctors by specialty (if specified)
  const eligibleDoctors = specialty
    ? doctors.filter((d) => d.specialty === specialty)
    : doctors;

  // For each doctor, get their available slots and find the earliest
  let earliestSlot: { doctorId: string; time: string } | null = null;

  for (const doctor of eligibleDoctors) {
    const slots = getAvailableSlots(
      doctor.id,
      date,
      availabilities,
      appointments,
      blockedDates
    );

    if (slots.length > 0) {
      const firstSlot = slots[0];
      
      if (
        !earliestSlot ||
        compareTimeSlots(firstSlot, earliestSlot.time) < 0
      ) {
        earliestSlot = { doctorId: doctor.id, time: firstSlot };
      }
    }
  }

  return earliestSlot;
}

/**
 * Compares two time slots (returns negative if a is earlier, positive if later)
 */
function compareTimeSlots(a: string, b: string): number {
  const [aHour, aMin] = a.split(':').map(Number);
  const [bHour, bMin] = b.split(':').map(Number);
  return aHour * 60 + aMin - (bHour * 60 + bMin);
}

/**
 * Formats a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Gets dates for the next N days starting from today
 */
export function getNextDays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}
