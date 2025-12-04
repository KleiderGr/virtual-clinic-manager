import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarIcon, CheckCircle, User, Mail, Phone, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BookingFormData, Specialty, Appointment } from '@/types/clinic';
import { doctors, specialties, availabilities, blockedDates } from '@/data/mockData';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { getAvailableSlots } from '@/utils/scheduling';
import SpecialtyFilter from './SpecialtyFilter';
import TimeSlotPicker from './TimeSlotPicker';

interface BookingFormProps {
  onSuccess?: (appointment: Appointment) => void;
}

const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const [searchParams] = useSearchParams();
  const preselectedDoctor = searchParams.get('doctor');
  
  const { appointments, addAppointment } = useAppointmentStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    specialty: '',
    doctorId: preselectedDoctor || '',
    date: '',
    time: '',
  });

  // Set preselected doctor's specialty
  useEffect(() => {
    if (preselectedDoctor) {
      const doctor = doctors.find((d) => d.id === preselectedDoctor);
      if (doctor) {
        setFormData((prev) => ({
          ...prev,
          doctorId: preselectedDoctor,
          specialty: doctor.specialty,
        }));
      }
    }
  }, [preselectedDoctor]);

  // Filter doctors by selected specialty
  const filteredDoctors = useMemo(() => {
    if (!formData.specialty) return doctors;
    return doctors.filter((d) => d.specialty === formData.specialty);
  }, [formData.specialty]);

  // Get available time slots when doctor and date are selected
  const availableSlots = useMemo(() => {
    if (!formData.doctorId || !formData.date) return [];
    return getAvailableSlots(
      formData.doctorId,
      formData.date,
      availabilities,
      appointments,
      blockedDates
    );
  }, [formData.doctorId, formData.date, appointments]);

  const handleSpecialtyChange = (specialty: Specialty | '') => {
    setFormData((prev) => ({
      ...prev,
      specialty,
      doctorId: '',
      time: '',
    }));
  };

  const handleDoctorChange = (doctorId: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorId,
      time: '',
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd'),
        time: '',
      }));
    }
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  const validateForm = (): boolean => {
    if (!formData.patientName.trim()) {
      toast.error('Por favor, ingresa tu nombre');
      return false;
    }
    if (!formData.patientEmail.trim() || !formData.patientEmail.includes('@')) {
      toast.error('Por favor, ingresa un email válido');
      return false;
    }
    if (!formData.patientPhone.trim()) {
      toast.error('Por favor, ingresa tu teléfono');
      return false;
    }
    if (!formData.doctorId) {
      toast.error('Por favor, selecciona un doctor');
      return false;
    }
    if (!formData.date) {
      toast.error('Por favor, selecciona una fecha');
      return false;
    }
    if (!formData.time) {
      toast.error('Por favor, selecciona un horario');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);
    
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: `patient-${Date.now()}`,
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      patientPhone: formData.patientPhone,
      doctorId: formData.doctorId,
      doctorName: selectedDoctor?.name || '',
      specialty: (formData.specialty || selectedDoctor?.specialty) as Specialty,
      date: formData.date,
      time: formData.time,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    addAppointment(newAppointment);
    setCreatedAppointment(newAppointment);
    setIsSuccess(true);
    setIsSubmitting(false);

    toast.success('¡Cita agendada con éxito!', {
      description: 'Te hemos enviado un email de confirmación',
    });

    onSuccess?.(newAppointment);
  };

  if (isSuccess && createdAppointment) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ¡Cita Confirmada!
        </h2>
        <p className="text-muted-foreground mb-8">
          Hemos enviado los detalles a tu email
        </p>
        
        <div className="max-w-sm mx-auto bg-secondary/50 rounded-xl p-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doctor:</span>
            <span className="font-medium">{createdAppointment.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Especialidad:</span>
            <span className="font-medium">{createdAppointment.specialty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">
              {format(new Date(createdAppointment.date), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hora:</span>
            <span className="font-medium">{createdAppointment.time}</span>
          </div>
        </div>

        <Button
          variant="hero"
          size="lg"
          className="mt-8"
          onClick={() => {
            setIsSuccess(false);
            setCreatedAppointment(null);
            setFormData({
              patientName: '',
              patientEmail: '',
              patientPhone: '',
              specialty: '',
              doctorId: '',
              date: '',
              time: '',
            });
          }}
        >
          Agendar Otra Cita
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Patient Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Información del Paciente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              value={formData.patientName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, patientName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="juan@email.com"
                className="pl-10"
                value={formData.patientEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, patientEmail: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+34 612 345 678"
                className="pl-10"
                value={formData.patientPhone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, patientPhone: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Selection */}
      <SpecialtyFilter
        selected={formData.specialty as Specialty | ''}
        onSelect={handleSpecialtyChange}
      />

      {/* Doctor Selection */}
      <div className="space-y-3">
        <Label>Selecciona un Doctor</Label>
        <Select value={formData.doctorId} onValueChange={handleDoctorChange}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Elige un doctor..." />
          </SelectTrigger>
          <SelectContent>
            {filteredDoctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                <div className="flex items-center gap-3">
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doctor.specialty} • ⭐ {doctor.rating}
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label>Selecciona una Fecha</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full h-12 justify-start text-left font-normal',
                !formData.date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date ? (
                format(new Date(formData.date), "EEEE, d 'de' MMMM", { locale: es })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date) : undefined}
              onSelect={handleDateChange}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const day = date.getDay();
                // Disable past dates and weekends
                return date < today || day === 0 || day === 6;
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slot Selection */}
      <TimeSlotPicker
        availableSlots={availableSlots}
        selectedTime={formData.time}
        onSelect={handleTimeSelect}
        disabled={!formData.doctorId || !formData.date}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            Confirmar Cita
          </>
        )}
      </Button>
    </form>
  );
};

export default BookingForm;
