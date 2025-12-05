import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoctors } from '@/hooks/useDoctors';
import { usePatients } from '@/hooks/usePatients';
import { useUsers } from '@/hooks/useUsers';
import { Users, UserCog, Calendar, TrendingUp, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

export default function AdminDashboard() {
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: users, isLoading: usersLoading } = useUsers();

  const stats = [
    {
      title: 'Total Usuarios',
      value: users?.length || 0,
      icon: Shield,
      description: 'Usuarios registrados',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      loading: usersLoading,
    },
    {
      title: 'Total Doctores',
      value: doctors?.length || 0,
      icon: UserCog,
      description: `${doctors?.filter((d) => d.is_active).length || 0} activos`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      loading: doctorsLoading,
    },
    {
      title: 'Total Pacientes',
      value: patients?.length || 0,
      icon: Users,
      description: 'Pacientes registrados',
      color: 'text-info',
      bgColor: 'bg-info/10',
      loading: patientsLoading,
    },
    {
      title: 'Citas del Mes',
      value: '-',
      icon: Calendar,
      description: 'Próximamente',
      color: 'text-success',
      bgColor: 'bg-success/10',
      loading: false,
    },
  ];

  return (
    <AdminLayout>
      <SEO
        title="Admin Dashboard - Clínica Virtual X"
        description="Panel de administración de Clínica Virtual X"
      />

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Resumen general de la clínica
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctores Recientes</CardTitle>
              <CardDescription>Últimos doctores agregados</CardDescription>
            </CardHeader>
            <CardContent>
              {doctorsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : doctors && doctors.length > 0 ? (
                <div className="space-y-3">
                  {doctors.slice(0, 5).map((doctor) => (
                    <div key={doctor.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {doctor.profile?.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.specialty?.name || 'Sin especialidad'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay doctores registrados</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pacientes Recientes</CardTitle>
              <CardDescription>Últimos pacientes registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : patients && patients.length > 0 ? (
                <div className="space-y-3">
                  {patients.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-info" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{patient.full_name}</p>
                        <p className="text-xs text-muted-foreground">{patient.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay pacientes registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
