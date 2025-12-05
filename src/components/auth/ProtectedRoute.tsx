import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AppRole } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { hasRole } = usePermissions();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mx-auto mb-4">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 items-center">
            <p className="text-sm text-muted-foreground text-center">
              Esta sección está restringida para usuarios con rol de{' '}
              <span className="font-semibold text-foreground">{requiredRole}</span>.
            </p>
            <Link to="/">
              <Button variant="hero">Volver al Inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
