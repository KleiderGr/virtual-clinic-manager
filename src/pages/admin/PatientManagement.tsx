import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { usePatients, usePatient } from '@/hooks/usePatients';
import { Search, Eye, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';

export default function PatientManagement() {
  const { data: patients, isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { data: selectedPatient, isLoading: patientLoading } = usePatient(selectedPatientId || undefined);

  const filteredPatients = patients?.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.full_name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  return (
    <AdminLayout>
      <SEO
        title="Gestión de Pacientes - Admin"
        description="Gestión de pacientes de la clínica"
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Administra los pacientes registrados en la clínica
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {patients?.length || 0} pacientes
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPatients && filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.full_name}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(patient.created_at), "d 'de' MMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(patient.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Paciente</DialogTitle>
                            <DialogDescription>
                              Información del paciente e historial de citas
                            </DialogDescription>
                          </DialogHeader>
                          
                          {patientLoading ? (
                            <div className="space-y-4">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-32 w-full" />
                            </div>
                          ) : selectedPatient ? (
                            <div className="space-y-6">
                              {/* Patient Info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                                <div>
                                  <p className="text-sm text-muted-foreground">Nombre</p>
                                  <p className="font-medium">{selectedPatient.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="font-medium">{selectedPatient.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Teléfono</p>
                                  <p className="font-medium">{selectedPatient.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                                  <p className="font-medium">
                                    {format(new Date(selectedPatient.created_at), "d 'de' MMM, yyyy", { locale: es })}
                                  </p>
                                </div>
                              </div>

                              {/* Appointments History */}
                              <div>
                                <h3 className="font-semibold mb-3">Historial de Citas</h3>
                                {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                                  <div className="space-y-2">
                                    {selectedPatient.appointments.map((appointment) => (
                                      <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {format(new Date(appointment.appointment_date), "d 'de' MMM, yyyy", { locale: es })}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {appointment.start_time}
                                          </p>
                                        </div>
                                        <Badge
                                          variant={
                                            appointment.status === 'confirmed'
                                              ? 'default'
                                              : appointment.status === 'cancelled'
                                              ? 'destructive'
                                              : 'secondary'
                                          }
                                        >
                                          {appointment.status}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay citas registradas
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
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
