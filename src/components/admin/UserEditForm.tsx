import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUpdateUser, useAssignRole, useRevokeRole, type UserWithRoles } from '@/hooks/useUsers';
import { Loader2, Shield, UserPlus, X, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppRole } from '@/lib/permissions';
import { Separator } from '@/components/ui/separator';

const userSchema = z.object({
  full_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserEditFormProps {
  user: UserWithRoles;
  onSuccess: () => void;
}

const AVAILABLE_ROLES: { role: AppRole; label: string; description: string; color: string }[] = [
  {
    role: 'admin',
    label: 'Administrador',
    description: 'Acceso completo al sistema',
    color: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    description: 'Gestión de citas y pacientes',
    color: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  {
    role: 'patient',
    label: 'Paciente',
    description: 'Agendar y consultar citas',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  },
];

export default function UserEditForm({ user, onSuccess }: UserEditFormProps) {
  const updateUser = useUpdateUser();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const [pendingRoleAction, setPendingRoleAction] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: user.full_name,
      phone: user.phone || '',
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    await updateUser.mutateAsync({
      id: user.id,
      ...data,
    });
    onSuccess();
  };

  const handleAssignRole = async (role: AppRole) => {
    setPendingRoleAction(role);
    try {
      await assignRole.mutateAsync({ userId: user.id, role });
    } finally {
      setPendingRoleAction(null);
    }
  };

  const handleRevokeRole = async (roleId: string, roleName: string) => {
    setPendingRoleAction(roleName);
    try {
      await revokeRole.mutateAsync({ roleId, userId: user.id });
    } finally {
      setPendingRoleAction(null);
    }
  };

  const userHasRole = (role: AppRole) => {
    return user.roles.some((r) => r.role === role);
  };

  const getRoleId = (role: AppRole) => {
    return user.roles.find((r) => r.role === role)?.id;
  };

  const isPending = updateUser.isPending || assignRole.isPending || revokeRole.isPending;

  return (
    <div className="space-y-6">
      {/* User Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Información del Usuario
          </h3>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Juan Pérez"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="hero"
            disabled={isPending}
            className="w-full"
          >
            {updateUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>

      <Separator />

      {/* Role Management */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            Gestión de Roles
          </h3>
          <p className="text-xs text-muted-foreground">
            Asigna o revoca roles para controlar el acceso del usuario
          </p>
        </div>

        <div className="grid gap-3">
          {AVAILABLE_ROLES.map((roleConfig) => {
            const hasRole = userHasRole(roleConfig.role);
            const roleId = getRoleId(roleConfig.role);
            const isProcessing = pendingRoleAction === roleConfig.role;

            return (
              <div
                key={roleConfig.role}
                className={cn(
                  'border rounded-lg p-4 transition-all',
                  hasRole
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{roleConfig.label}</p>
                      {hasRole && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {roleConfig.description}
                    </p>
                  </div>

                  {hasRole ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => roleId && handleRevokeRole(roleId, roleConfig.role)}
                      disabled={isProcessing || user.roles.length === 1}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Revocar
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignRole(roleConfig.role)}
                      disabled={isProcessing}
                      className={cn(
                        'border-primary text-primary hover:bg-primary/10'
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Asignar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {user.roles.length === 1 && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <p className="text-xs text-accent">
              ℹ️ No puedes revocar el último rol. Un usuario debe tener al menos un rol asignado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
