import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAssignRole, useCreateUser, useRevokeRole, useUpdateUser, type UserWithRoles } from '@/hooks/useUsers';
import type { AppRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Clock, Loader2, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const userSchema = z.object({
  full_name: z.string().min(3, 'Mínimo 3 caracteres').nonempty('El nombre es requerido'),
  phone: z.string()
    .trim()
    .optional()
    .superRefine((val, ctx) => {
      if (!val || val.trim() === "") return;

      if (!/^(04(12|14|16|24|26)|02\d{2})[\-]?\d{3}[\-]?\d{4}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Formato de teléfono inválido. Debe ser de 11 dígitos (04XX/02XX).",
        });
      }
    })
    .transform(val => (val ? val.replace(/-/g, "") : undefined)),
  email: z.string().email('Email inválido').nonempty('El email es requerido'),
  active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserEditFormProps {
  user?: UserWithRoles;
  onSuccess: (password?: string) => void;
}

const ROLES: { role: AppRole; label: string }[] = [
  { role: 'admin', label: 'Admin' },
  { role: 'doctor', label: 'Doctor' },
  { role: 'patient', label: 'Paciente' },
];

export default function UserEditForm({ user, onSuccess }: UserEditFormProps) {
  const isCreateMode = !user;

  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();

  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(
    user?.roles.map((r) => r.role) || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty: isFormDirty },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      active: user?.active ?? true,
    },
  });

  const isRolesDirty = useMemo(() => {
    if (isCreateMode) return selectedRoles.length > 0;

    if (selectedRoles.length !== user!.roles.length) return true;
    const currentRolesSet = new Set(user!.roles.map((r) => r.role));
    return !selectedRoles.every((r) => currentRolesSet.has(r));
  }, [selectedRoles, user, isCreateMode]);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) => {
      if (!isCreateMode && prev.includes(role) && prev.length <= 1) {
        return prev;
      }
      return prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role];
    });
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (isCreateMode) {
        if (!selectedRoles.length) {
          toast.error('Debe seleccionar al menos un rol');
          return;
        }
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + 'Aa1!';

        await createUser.mutateAsync({
          email: data.email,
          password,
          full_name: data.full_name,
          phone: data.phone,
          role: selectedRoles[0],
        });

        toast.success('Usuario creado correctamente');
        onSuccess(password);
      } else {
        const promises = [];

        if (isFormDirty) {
          promises.push(
            updateUser.mutateAsync({
              id: user!.id,
              ...data,
            })
          );
        }

        if (isRolesDirty) {
          const currentRoleNames = new Set(user!.roles.map((r) => r.role));

          const rolesToAdd = selectedRoles.filter(r => !currentRoleNames.has(r));
          rolesToAdd.forEach(role => {
            promises.push(assignRole.mutateAsync({ userId: user!.id, role }));
          });

          const selectedRoleNames = new Set(selectedRoles);
          const rolesToRemove = user!.roles.filter(r => !selectedRoleNames.has(r.role));
          rolesToRemove.forEach(userRole => {
            promises.push(
              revokeRole.mutateAsync({
                roleId: userRole.id,
                userId: user!.id,
                roleName: userRole.role
              })
            );
          });
        }

        await Promise.all(promises);
        toast.success('Cambios guardados correctamente');
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const isPending = updateUser.isPending || assignRole.isPending || revokeRole.isPending || createUser.isPending;
  const hasChanges = isCreateMode ? true : (isFormDirty || isRolesDirty);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            Información del usuario
          </h3>
          <p className="text-xs text-muted-foreground">
            {isCreateMode
              ? 'Ingresa los datos para registrar un nuevo usuario en el sistema'
              : 'Información general del usuario'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Nombre completo</Label>
          <Input {...register('full_name')} placeholder="Nombre completo" />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            {...register('email')}
            placeholder="ejemplo@correo.com"
            disabled={!isCreateMode}
            className={!isCreateMode ? "bg-muted" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input {...register('phone')} placeholder="04XX/02XX-XXXX" />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <Label>Estado</Label>
            <p className="text-xs text-muted-foreground">Activo/Inactivo</p>
          </div>
          <Switch
            checked={watch('active')}
            onCheckedChange={(checked) => setValue('active', checked, { shouldDirty: true })}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              Gestión de Roles
            </h3>
            <p className="text-xs text-muted-foreground">
              Selecciona los roles que debe tener el usuario
            </p>
          </div>

          <div className="grid gap-3">
            {ROLES.map((roleConfig) => {
              const isSelected = selectedRoles.includes(roleConfig.role);
              const isOriginal = !isCreateMode && user!.roles.some(r => r.role === roleConfig.role);
              const isModified = isCreateMode ? isSelected : (isSelected !== isOriginal);

              return (
                <div
                  key={roleConfig.role}
                  onClick={() => toggleRole(roleConfig.role)}
                  className={cn(
                    'flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{roleConfig.label}</p>
                      {isSelected && isOriginal && (
                        <Badge variant="default" className="text-xs transition-colors">
                          <Check className="h-3 w-3 mr-1" />
                          Asignado
                        </Badge>
                      )}
                      {(isModified && (!isOriginal || isCreateMode)) && (
                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "h-5 w-5 rounded-full border border-primary flex items-center justify-center transition-all",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-transparent"
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedRoles.length <= 1 && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
              <p className="text-xs text-accent">
                ℹ️ Un usuario debe tener al menos un rol asignado.
              </p>
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !hasChanges}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {isCreateMode ? 'Creando...' : 'Guardando...'}
          </>
        ) : (
          <>{isCreateMode ? 'Crear Usuario' : 'Guardar Cambios'}</>
        )}
      </Button>
    </form>
  );
}
