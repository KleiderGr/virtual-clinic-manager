import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppointments, useCancelAppointment, useAppointmentsSubscription } from '@/hooks/useAppointments';
import { useDoctors } from '@/hooks/useDoctors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  XCircle,
  CheckCircle,
  AlertCircle,
  CalendarPlus,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
import SEO from '@/components/SEO';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { data: appointments, isLoading } = useAppointments();
  const { data: doctors } = useDoctors();
  const cancelAppointmentMutation = useCancelAppointment();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Enable real-time subscriptions
  useAppointmentsSubscription();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAppointments = appointments
    ?.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      if (filter === 'upcoming') return aptDate >= today && apt.status !== 'cancelled';
      if (filter === 'past') return aptDate < today || apt.status === 'cancelled';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.start_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.start_time}`);
      return filter === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20 border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-0">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCancelAppointment = async (id: string) => {
    await cancelAppointmentMutation.mutateAsync(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Mi Panel - Clínica Virtual X"
        description="Gestiona tus citas médicas, revisa tu historial y agenda nuevas consultas desde tu panel personal."
        type="article"
      />
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-6">
                <User className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Mi Panel de Citas
              </h1>
              <p className="text-muted-foreground">
                Gestiona todas tus citas médicas desde un solo lugar
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {appointments?.filter((a) => a.status !== 'cancelled').length || 0}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">Total de Citas</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {appointments?.filter((a) => a.status === 'confirmed' && new Date(a.appointment_date) >= today).length || 0}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">Próximas</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {doctors?.length || 0}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">Doctores</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'upcoming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('upcoming')}
                >
                  Próximas
                </Button>
                <Button
                  variant={filter === 'past' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('past')}
                >
                  Historial
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Todas
                </Button>
              </div>
              <Link to="/book">
                <Button variant="hero">
                  <CalendarPlus className="h-4 w-4" />
                  Nueva Cita
                </Button>
              </Link>
            </div>

            {/* Appointments List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredAppointments && filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const doctor = doctors?.find((d) => d.id === appointment.doctor_id);
                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        'bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow',
                        appointment.status === 'cancelled' && 'opacity-60'
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Doctor Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {doctor?.profile?.full_name || 'Doctor no disponible'}
                            </h3>
                            <p className="text-sm text-primary">{doctor?.specialty?.name || 'Especialidad'}</p>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">
                              {format(new Date(appointment.appointment_date), "d 'de' MMM, yyyy", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">
                              {appointment.start_time}
                            </span>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-3">
                          {getStatusBadge(appointment.status)}
                          {appointment.status !== 'cancelled' && new Date(appointment.appointment_date) >= today && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  Cancelar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Tu cita con{' '}
                                    {doctor?.profile?.full_name || 'el doctor'} será cancelada.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={cancelAppointmentMutation.isPending}
                                  >
                                    {cancelAppointmentMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Sí, cancelar'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No tienes citas {filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'pasadas' : ''}
                </h3>
                <p className="text-muted-foreground mb-6">
                  Agenda tu primera cita con nuestros especialistas
                </p>
                <Link to="/book">
                  <Button variant="hero">
                    <CalendarPlus className="h-4 w-4" />
                    Agendar Cita
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
