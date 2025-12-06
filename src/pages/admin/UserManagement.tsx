import SEO from '@/components/SEO';
import UserEditForm from '@/components/admin/UserEditForm';
import AdminLayout from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserWithRoles } from '@/hooks/useUsers';
import { useUpdateUser, useUsers } from '@/hooks/useUsers';
import { ChevronLeft, ChevronRight, Edit, Search, Shield, UserCog } from 'lucide-react';
import { useState } from 'react';

export default function UserManagement() {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { data: usersData, isLoading } = useUsers(page, pageSize);
  const updateUser = useUpdateUser();
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
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadges = (roles: UserWithRoles['roles']) => {
    if (roles.length === 0) return <Badge variant="secondary">Sin roles</Badge>;

    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((role) => (
          <Badge key={role.id} variant={role.role === 'admin' ? 'destructive' : 'default'}>
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

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    await updateUser.mutateAsync({
      id: userId,
      // Toggle active status (inverse of current)
    });
  };

  return (
    <AdminLayout>
      <SEO
        title="Gestión de Usuarios"
        description="Gestión de usuarios del sistema"
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
              {totalUsers || 0} usuarios registrados
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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.phone || 'Sin teléfono'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadges(user.roles)}</TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen} modal>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
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
    </AdminLayout>
  );
}
