import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUpdateUser, useAssignRole, useRevokeRole, type UserWithRoles } from '@/hooks/useUsers';
import { Loader2, Check, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { AppRole } from '@/lib/permissions';

const userSchema = z.object({
  full_name: z.string().min(3, 'Mínimo 3 caracteres'),
  phone: z.string().optional(),
  active: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserEditFormProps {
  user: UserWithRoles;
  onSuccess: () => void;
}

const ROLES: { role: AppRole; label: string }[] = [
  { role: 'admin', label: 'Admin' },
  { role: 'doctor', label: 'Doctor' },
  { role: 'patient', label: 'Paciente' },
];

export default function UserEditForm({ user, onSuccess }: UserEditFormProps) {
  const updateUser = useUpdateUser();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: user.full_name,
      phone: user.phone || '',
      active: user.active,
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    await updateUser.mutateAsync({
      id: user.id,
      ...data,
    });
    onSuccess();
  };

  const handleRoleToggle = async (role: AppRole) => {
    setPendingRole(role);
    try {
      const hasRole = user.roles.some(r => r.role === role);
      if (hasRole) {
        const roleId = user.roles.find(r => r.role === role)?.id;
        if (roleId && user.roles.length > 1) {
          await revokeRole.mutateAsync({ 
            roleId, 
            userId: user.id,
            roleName: role
          });
        }
      } else {
        await assignRole.mutateAsync({ userId: user.id, role });
      }
    } finally {
      setPendingRole(null);
    }
  };

  const isPending = updateUser.isPending || assignRole.isPending || revokeRole.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input {...register('full_name')} placeholder="Nombre completo" />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input {...register('phone')} placeholder="+1234567890" />
        </div>

        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <Label>Estado</Label>
            <p className="text-xs text-muted-foreground">Activo/Inactivo</p>
          </div>
          <Switch
            checked={watch('active')}
            onCheckedChange={(checked) => setValue('active', checked)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Roles</Label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(({ role, label }) => {
            const hasRole = user.roles.some(r => r.role === role);
            const isLoading = pendingRole === role;
            
            return (
              <Button
                key={role}
                type="button"
                variant={hasRole ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleToggle(role)}
disabled={isPending || (hasRole && user.roles.length === 1)}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : hasRole ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <UserPlus className="h-3 w-3 mr-1" />
                )}
                {label}
              </Button>
            );
          })}
        </div>
        {user.roles.length === 1 && (
          <p className="text-xs text-muted-foreground">
            No puedes revocar el único rol del usuario
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Guardando...
          </>
        ) : (
          <>Guardar Cambios</>
        )}
      </Button>
    </form>
  );
}
