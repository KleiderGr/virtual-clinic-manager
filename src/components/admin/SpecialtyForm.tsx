import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateSpecialty, useUpdateSpecialty, type Specialty } from '@/hooks/useSpecialties';
import { Loader2 } from 'lucide-react';

interface SpecialtyFormProps {
  specialty?: Specialty;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
}

export default function SpecialtyForm({ specialty, onSuccess }: SpecialtyFormProps) {
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const isEditing = !!specialty;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: specialty?.name || '',
      description: specialty?.description || '',
      icon: specialty?.icon || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateSpecialty.mutateAsync({
          id: specialty.id,
          ...data,
        });
      } else {
        await createSpecialty.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      // Error handled by mutation
      console.error('Form submission error:', error);
    }
  };

  const isPending = createSpecialty.isPending || updateSpecialty.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name', {
            required: 'El nombre es requerido',
            minLength: {
              value: 3,
              message: 'El nombre debe tener al menos 3 caracteres',
            },
          })}
          placeholder="Ej: Cardiología"
          disabled={isPending}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descripción de la especialidad..."
          rows={4}
          disabled={isPending}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <Label htmlFor="icon">
          Icono (Lucide Icon Name)
        </Label>
        <Input
          id="icon"
          {...register('icon')}
          placeholder="Ej: heart, brain, activity"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Nombre del icono de Lucide React (opcional)
        </p>
        {errors.icon && (
          <p className="text-sm text-destructive">{errors.icon.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="hero"
          disabled={isPending}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Actualizar' : 'Crear'} Especialidad
        </Button>
      </div>
    </form>
  );
}
