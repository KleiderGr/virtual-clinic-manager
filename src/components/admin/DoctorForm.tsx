import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCreateDoctor, useUpdateDoctor, type Doctor, type CreateDoctorInput } from '@/hooks/useDoctors';
import { useReplaceAvailability, useDoctorAvailability } from '@/hooks/useAvailability';
import UserSearchSelect from './UserSearchSelect';
import ScheduleInput, { type ScheduleSlot } from './ScheduleInput';
import { Loader2 } from 'lucide-react';

const doctorSchema = z.object({
  user_id: z.string().min(1, 'Debes seleccionar un usuario'),
  specialty_id: z.string().min(1, 'La especialidad es requerida'),
  license_number: z.string().min(5, 'Mínimo 5 caracteres'),
  bio: z.string().optional(),
  consultation_fee: z.coerce.number().min(0).default(0),
  years_experience: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

interface DoctorFormProps {
  doctor?: Doctor;
  specialties: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export default function DoctorForm({ doctor, specialties, onSuccess }: DoctorFormProps) {
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const replaceAvailability = useReplaceAvailability();
  const { data: existingAvailability } = useDoctorAvailability(doctor?.id);
  const isEditing = !!doctor;

  const initialSchedule: ScheduleSlot[] = existingAvailability?.map(slot => ({
    day_of_week: slot.day_of_week,
    start_time: slot.start_time,
    end_time: slot.end_time,
    slot_duration: slot.slot_duration,
  })) || [];

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(initialSchedule);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: isEditing
      ? {
          user_id: doctor.user_id || '',
          specialty_id: doctor.specialty_id || '',
          license_number: doctor.license_number,
          bio: doctor.bio || '',
          consultation_fee: doctor.consultation_fee,
          years_experience: doctor.years_experience,
          is_active: doctor.is_active,
        }
      : {
          user_id: '',
          specialty_id: '',
          license_number: '',
          bio: '',
          consultation_fee: 0,
          years_experience: 0,
          is_active: true,
        },
  });

  const onSubmit = async (data: DoctorFormValues) => {
    try {
      let doctorId: string;

      if (isEditing) {
        await updateDoctor.mutateAsync({ id: doctor.id, ...data });
        doctorId = doctor.id;
      } else {
        // Cast to CreateDoctorInput to ensure types match (Zod validation guarantees this)
        const result = await createDoctor.mutateAsync(data as unknown as CreateDoctorInput);
        doctorId = typeof result === 'object' ? (result as any).id : result;
      }

      if (scheduleSlots.length > 0 && doctorId) {
        await replaceAvailability.mutateAsync({
          doctorId,
          availability: scheduleSlots,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isPending = createDoctor.isPending || updateDoctor.isPending || replaceAvailability.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Información Básica</h3>

        <UserSearchSelect
          value={watch('user_id')}
          onChange={(value) => setValue('user_id', value)}
          disabled={isPending || isEditing}
          error={errors.user_id?.message}
        />

        <div className="space-y-2">
          <Label>Especialidad *</Label>
          <Select
            value={watch('specialty_id')}
            onValueChange={(value) => setValue('specialty_id', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona especialidad" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.specialty_id && (
            <p className="text-sm text-destructive">{errors.specialty_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Licencia *</Label>
          <Input {...register('license_number')} placeholder="LIC-12345" disabled={isPending} />
          {errors.license_number && (
            <p className="text-sm text-destructive">{errors.license_number.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tarifa ($)</Label>
            <Input type="number" step="0.01" {...register('consultation_fee')} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label>Años Exp.</Label>
            <Input type="number" {...register('years_experience')} disabled={isPending} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Biografía</Label>
          <Textarea {...register('bio')} rows={3} disabled={isPending} />
        </div>

        <div className="flex items-center justify-between border rounded-lg p-3">
          <Label>Activo</Label>
          <Switch
            checked={watch('is_active')}
            onCheckedChange={(checked) => setValue('is_active', checked)}
            disabled={isPending}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">Horario</h3>
        <ScheduleInput value={scheduleSlots} onChange={setScheduleSlots} disabled={isPending} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Guardando...
          </>
        ) : (
          <>{isEditing ? 'Actualizar' : 'Crear'} Doctor</>
        )}
      </Button>
    </form>
  );
}
