import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { useDoctors, useDeleteDoctor, useSpecialties } from '@/hooks/useDoctors';
import { UserPlus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import DoctorForm from '@/components/admin/DoctorForm';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import type { Doctor } from '@/hooks/useDoctors';

export default function DoctorManagement() {
  const { data: doctors, isLoading } = useDoctors();
  const { data: specialties } = useSpecialties();
  const deleteDoctor = useDeleteDoctor();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredDoctors = doctors?.filter((doctor) => {
    const searchLower = searchTerm.toLowerCase();
    const name = doctor.profiles?.full_name?.toLowerCase() || '';
    const specialty = doctor.specialty?.name?.toLowerCase() || '';
    const license = doctor.license_number.toLowerCase();
    
    return name.includes(searchLower) || 
           specialty.includes(searchLower) || 
           license.includes(searchLower);
  });

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoctor.mutateAsync(id);
  };

  return (
    <AdminLayout>
      <SEO
        title="Gestión de Doctores - Admin"
        description="Gestión de doctores de la clínica"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Doctores</h1>
            <p className="text-muted-foreground mt-1">
              Administra los doctores de la clínica
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg">
                <UserPlus className="h-4 w-4" />
                Agregar Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Doctor</DialogTitle>
                <DialogDescription>
                  Completa los datos del doctor para agregarlo al sistema
                </DialogDescription>
              </DialogHeader>
              <DoctorForm
                specialties={specialties || []}
                onSuccess={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, especialidad o licencia..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDoctors && filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      {doctor.profiles?.full_name || 'Sin nombre'}
                    </TableCell>
                    <TableCell>{doctor.specialty?.name || 'Sin especialidad'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {doctor.license_number}
                    </TableCell>
                    <TableCell>{doctor.years_experience} años</TableCell>
                    <TableCell>${doctor.consultation_fee}</TableCell>
                    <TableCell>
                      <Badge variant={doctor.is_active ? 'default' : 'secondary'}>
                        {doctor.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar doctor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente
                                el doctor y todos sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doctor.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteDoctor.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Eliminar'
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron doctores' : 'No hay doctores registrados'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Doctor</DialogTitle>
            <DialogDescription>
              Actualiza la información del doctor
            </DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <DoctorForm
              doctor={selectedDoctor}
              specialties={specialties || []}
              onSuccess={() => {
                setIsEditOpen(false);
                setSelectedDoctor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
