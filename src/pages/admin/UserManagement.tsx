import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUsers, useSoftDeleteUser } from '@/hooks/useUsers';
import { Search, Edit, Trash2, Shield, Loader2, UserCog, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SEO from '@/components/SEO';
import UserEditForm from '@/components/admin/UserEditForm';
import type { UserWithRoles } from '@/hooks/useUsers';

export default function UserManagement() {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { data: usersData, isLoading } = useUsers(page, pageSize);
  const softDeleteUser = useSoftDeleteUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const users = usersData?.users || [];
  const totalPages = usersData?.pages || 0;
  const totalUsers = usersData?.total || 0;

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadges = (roles: UserWithRoles['roles']) => {
    if (roles.length === 0) {
      return <Badge variant="secondary">Sin roles</Badge>;
    }

    const roleColors: Record<string, string> = {
      admin: 'bg-destructive text-destructive-foreground',
      doctor: 'bg-primary text-primary-foreground',
      patient: 'bg-secondary text-secondary-foreground',
    };

    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((role) => (
          <Badge key={role.id} className={roleColors[role.role] || 'bg-secondary'}>
            {role.role}
          </Badge>
        ))}
      </div>
    );
  };

  const handleEdit = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleSoftDelete = async (userId: string) => {
    await softDeleteUser.mutateAsync(userId);
  };

  return (
    <AdminLayout>
      <SEO
        title="Gestión de Usuarios - Admin"
        description="Gestión completa de usuarios del sistema"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCog className="h-8 w-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-2">
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-info">Panel de Control de Acceso</p>
              <p className="text-xs text-info/80">
                Asigna roles (Admin, Doctor, Paciente) para controlar el acceso a las funcionalidades del sistema.
                Los cambios se aplican inmediatamente.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Pagination */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {users.length > 0 ? page * pageSize + 1 : 0}-{Math.min((page + 1) * pageSize, totalUsers)} de {totalUsers} usuarios
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1 || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Usuario</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Teléfono</TableHead>
                <TableHead className="font-semibold">Roles</TableHead>
                <TableHead className="font-semibold">Fecha de Registro</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <span>{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phone || 'N/A'}</TableCell>
                    <TableCell>{getRoleBadges(user.roles)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={isEditOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          if (!open) {
                            setIsEditOpen(false);
                            setSelectedUser(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              className="hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Editar Usuario y Roles
                              </DialogTitle>
                              <DialogDescription>
                                Actualiza la información del usuario y gestiona sus roles de acceso
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <UserEditForm
                                user={selectedUser}
                                onSuccess={() => {
                                  setIsEditOpen(false);
                                  setSelectedUser(null);
                                }}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El usuario "{user.full_name}" será <strong>desactivado</strong> (no eliminado permanentemente).
                                No podrá iniciar sesión pero sus datos se conservarán. Puedes reactivarlo después si es necesario.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleSoftDelete(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {softDeleteUser.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Desactivar Usuario'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
