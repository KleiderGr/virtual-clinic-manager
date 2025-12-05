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
import { useCreateDoctor, useUpdateDoctor, type Doctor } from '@/hooks/useDoctors';
import { Loader2 } from 'lucide-react';

const doctorSchema = z.object({
  specialty_id: z.string().min(1, 'La especialidad es requerida'),
  license_number: z.string().min(5, 'La licencia debe tener al menos 5 caracteres'),
  bio: z.string().optional(),
  consultation_fee: z.coerce.number().min(0, 'La tarifa debe ser mayor a 0').default(0),
  years_experience: z.coerce.number().min(0, 'La experiencia debe ser mayor a 0').default(0),
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
  const isEditing = !!doctor;

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
          specialty_id: doctor.specialty_id || '',
          license_number: doctor.license_number,
          bio: doctor.bio || '',
          consultation_fee: doctor.consultation_fee,
          years_experience: doctor.years_experience,
          is_active: doctor.is_active,
        }
      : {
          specialty_id: '',
          license_number: '',
          bio: '',
          consultation_fee: 0,
          years_experience: 0,
          is_active: true,
        },
  });

  const isActive = watch('is_active');

  const onSubmit = async (data: DoctorFormValues) => {
    try {
      if (isEditing) {
        await updateDoctor.mutateAsync({
          id: doctor.id,
          ...data,
        });
      } else {
        await createDoctor.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      // Error handled in hooks
    }
  };

  const isPending = createDoctor.isPending || updateDoctor.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Specialty */}
      <div className="space-y-2">
        <Label htmlFor="specialty_id">Especialidad *</Label>
        <Select
          value={watch('specialty_id')}
          onValueChange={(value) => setValue('specialty_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una especialidad" />
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

      {/* License Number */}
      <div className="space-y-2">
        <Label htmlFor="license_number">Número de Licencia *</Label>
        <Input
          id="license_number"
          {...register('license_number')}
          placeholder="LIC-12345"
        />
        {errors.license_number && (
          <p className="text-sm text-destructive">{errors.license_number.message}</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Biografía</Label>
        <Textarea
          id="bio"
          {...register('bio')}
          placeholder="Describe la experiencia y especialización del doctor..."
          rows={4}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      {/* Consultation Fee */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="consultation_fee">Tarifa de Consulta ($)</Label>
          <Input
            id="consultation_fee"
            type="number"
            step="0.01"
            {...register('consultation_fee')}
            placeholder="50.00"
          />
          {errors.consultation_fee && (
            <p className="text-sm text-destructive">{errors.consultation_fee.message}</p>
          )}
        </div>

        {/* Years Experience */}
        <div className="space-y-2">
          <Label htmlFor="years_experience">Años de Experiencia</Label>
          <Input
            id="years_experience"
            type="number"
            {...register('years_experience')}
            placeholder="5"
          />
          {errors.years_experience && (
            <p className="text-sm text-destructive">{errors.years_experience.message}</p>
          )}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Estado Activo</Label>
          <p className="text-sm text-muted-foreground">
            El doctor estará disponible para agendar citas
          </p>
        </div>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue('is_active', checked)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="submit"
          variant="hero"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>{isEditing ? 'Actualizar Doctor' : 'Crear Doctor'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
