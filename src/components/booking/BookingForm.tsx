import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Appointment, Specialty } from '@/types/clinic';
import { doctors, availabilities, blockedDates } from '@/data/mockData';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { getAvailableSlots } from '@/utils/scheduling';
import SpecialtyFilter from './SpecialtyFilter';
import TimeSlotPicker from './TimeSlotPicker';
import { bookingSchema, BookingFormValues } from '@/utils/validation';

interface BookingFormProps {
  onSuccess?: (appointment: Appointment) => void;
}

const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const [searchParams] = useSearchParams();
  const preselectedDoctor = searchParams.get('doctor');

  const { appointments, addAppointment } = useAppointmentStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      specialty: '',
      doctorId: preselectedDoctor || '',
      date: '',
      time: '',
    },
  });

  const selectedDoctorId = watch('doctorId');
  const selectedDate = watch('date');
  const selectedSpecialty = watch('specialty');

  // Set preselected doctor's specialty
  useEffect(() => {
    if (preselectedDoctor) {
      const doctor = doctors.find((d) => d.id === preselectedDoctor);
      if (doctor) {
        setValue('doctorId', preselectedDoctor);
        setValue('specialty', doctor.specialty);
      }
    }
  }, [preselectedDoctor, setValue]);

  // Filter doctors by selected specialty
  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialty) return doctors;
    return doctors.filter((d) => d.specialty === selectedSpecialty);
  }, [selectedSpecialty]);

  // Get available time slots when doctor and date are selected
  const availableSlots = useMemo(() => {
    if (!selectedDoctorId || !selectedDate) return [];
    return getAvailableSlots(
      selectedDoctorId,
      selectedDate,
      availabilities,
      appointments,
      blockedDates
    );
  }, [selectedDoctorId, selectedDate, appointments]);

  const onSubmit = async (data: BookingFormValues) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const selectedDoctor = doctors.find((d) => d.id === data.doctorId);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: `patient-${Date.now()}`,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      doctorId: data.doctorId,
      doctorName: selectedDoctor?.name || '',
      specialty: (data.specialty || selectedDoctor?.specialty) as Specialty,
      date: data.date,
      time: data.time,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    addAppointment(newAppointment);
    setCreatedAppointment(newAppointment);
    setIsSuccess(true);
    reset();

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
              {format(new Date(createdAppointment.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
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
            reset({
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              {...register('patientName')}
            />
            {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
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
                {...register('patientEmail')}
              />
            </div>
            {errors.patientEmail && <p className="text-sm text-destructive">{errors.patientEmail.message}</p>}
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
                {...register('patientPhone')}
              />
            </div>
            {errors.patientPhone && <p className="text-sm text-destructive">{errors.patientPhone.message}</p>}
          </div>
        </div>
      </div>

      {/* Specialty Selection */}
      <Controller
        name="specialty"
        control={control}
        render={({ field }) => (
          <SpecialtyFilter
            selected={field.value as Specialty | ''}
            onSelect={(val) => {
              field.onChange(val);
              setValue('doctorId', '');
              setValue('time', '');
            }}
          />
        )}
      />

      {/* Doctor Selection */}
      <div className="space-y-3">
        <Label>Selecciona un Doctor</Label>
        <Controller
          name="doctorId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val);
                setValue('time', '');
              }}
            >
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
          )}
        />
        {errors.doctorId && <p className="text-sm text-destructive">{errors.doctorId.message}</p>}
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label>Selecciona una Fecha</Label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-12 justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? (
                    format(new Date(field.value), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ?  new Date(`${field.value} 00:00`) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      field.onChange(format(date, 'yyyy-MM-dd'));
                      setValue('time', '');
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const day = date.getDay();
                    return date < today || day === 0 || day === 6;
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
      </div>

      {/* Time Slot Selection */}
      <Controller
        name="time"
        control={control}
        render={({ field }) => (
          <TimeSlotPicker
            availableSlots={availableSlots}
            selectedTime={field.value}
            onSelect={field.onChange}
            disabled={!selectedDoctorId || !selectedDate}
          />
        )}
      />
      {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}

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
