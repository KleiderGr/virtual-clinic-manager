export type Specialty = 
  | 'Cardiología'
  | 'Dermatología'
  | 'Pediatría'
  | 'Ginecología'
  | 'Traumatología'
  | 'Neurología'
  | 'Oftalmología'
  | 'Medicina General';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: Specialty;
  avatar: string;
  bio: string;
  rating: number;
  reviewCount: number;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
}

export interface Availability {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface BlockedDate {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  reason: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialty: Specialty;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BookingFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  specialty: Specialty | '';
  doctorId: string;
  date: string;
  time: string;
}
