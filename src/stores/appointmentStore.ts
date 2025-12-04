import { create } from 'zustand';
import { Appointment, Availability, BlockedDate } from '@/types/clinic';
import { initialAppointments, availabilities, blockedDates } from '@/data/mockData';

interface AppointmentStore {
  appointments: Appointment[];
  availabilities: Availability[];
  blockedDates: BlockedDate[];
  addAppointment: (appointment: Appointment) => void;
  cancelAppointment: (id: string) => void;
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getAppointmentsByDate: (date: string) => Appointment[];
  isTimeSlotAvailable: (doctorId: string, date: string, time: string) => boolean;
  getDoctorAvailability: (doctorId: string, dayOfWeek: number) => Availability[];
  isDoctorBlocked: (doctorId: string, date: string) => boolean;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: initialAppointments,
  availabilities: availabilities,
  blockedDates: blockedDates,

  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),

  cancelAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
      ),
    })),

  getAppointmentsByDoctor: (doctorId) => {
    return get().appointments.filter(
      (apt) => apt.doctorId === doctorId && apt.status !== 'cancelled'
    );
  },

  getAppointmentsByDate: (date) => {
    return get().appointments.filter(
      (apt) => apt.date === date && apt.status !== 'cancelled'
    );
  },

  isTimeSlotAvailable: (doctorId, date, time) => {
    const appointments = get().appointments;
    return !appointments.some(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.date === date &&
        apt.time === time &&
        apt.status !== 'cancelled'
    );
  },

  getDoctorAvailability: (doctorId, dayOfWeek) => {
    return get().availabilities.filter(
      (avail) => avail.doctorId === doctorId && avail.dayOfWeek === dayOfWeek
    );
  },

  isDoctorBlocked: (doctorId, date) => {
    return get().blockedDates.some(
      (blocked) => blocked.doctorId === doctorId && blocked.date === date
    );
  },
}));
