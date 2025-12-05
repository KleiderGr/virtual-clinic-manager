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
import { useSpecialties, useDeleteSpecialty, type Specialty } from '@/hooks/useSpecialties';
import { Plus, Search, Edit, Trash2, Loader2, Stethoscope } from 'lucide-react';
import SpecialtyForm from '@/components/admin/SpecialtyForm';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

export default function SpecialtyManagement() {
  const { data: specialties, isLoading } = useSpecialties();
  const deleteSpecialty = useDeleteSpecialty();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredSpecialties = specialties?.filter((specialty) => {
    const searchLower = searchTerm.toLowerCase();
    const name = specialty.name.toLowerCase();
    const description = specialty.description?.toLowerCase() || '';
    
    return name.includes(searchLower) || description.includes(searchLower);
  });

  const handleEdit = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSpecialty.mutateAsync(id);
  };

  return (
    <AdminLayout>
      <SEO
        title="Gestión de Especialidades - Admin"
        description="Gestión de especialidades médicas de la clínica"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Especialidades</h1>
            <p className="text-muted-foreground mt-1">
              Administra las especialidades médicas de la clínica
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg">
                <Plus className="h-4 w-4" />
                Agregar Especialidad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Especialidad</DialogTitle>
                <DialogDescription>
                  Completa los datos de la especialidad médica
                </DialogDescription>
              </DialogHeader>
              <SpecialtyForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar especialidad..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredSpecialties?.length || 0} especialidades
          </Badge>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Icono</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSpecialties && filteredSpecialties.length > 0 ? (
                filteredSpecialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-primary" />
                        </div>
                        {specialty.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {specialty.description || <span className="text-muted-foreground italic">Sin descripción</span>}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">
                        {specialty.icon || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(specialty)}
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
                              <AlertDialogTitle>¿Eliminar especialidad?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente
                                la especialidad <strong>{specialty.name}</strong>.
                                {' '}Los doctores asociados NO se eliminarán.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(specialty.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteSpecialty.isPending ? (
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
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron especialidades' : 'No hay especialidades registradas'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Especialidad</DialogTitle>
            <DialogDescription>
              Actualiza la información de la especialidad médica
            </DialogDescription>
          </DialogHeader>
          {selectedSpecialty && (
            <SpecialtyForm
              specialty={selectedSpecialty}
              onSuccess={() => {
                setIsEditOpen(false);
                setSelectedSpecialty(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
