import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Password strength checker
function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength <= 2) return { strength, label: 'Débil', color: 'bg-destructive' };
  if (strength <= 3) return { strength, label: 'Media', color: 'bg-accent' };
  return { strength, label: 'Fuerte', color: 'bg-success' };
}

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName, data.phone);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in AuthContext with toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Crear Cuenta - Clínica Virtual X"
        description="Crea tu cuenta en Clínica Virtual X y comienza a gestionar tus citas médicas de forma fácil y rápida"
      />

      {/* Header with back button */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 gradient-hero">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-info/5 blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative shadow-lg border-border/50">
          <CardHeader className="space-y-1 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary text-primary-foreground mx-auto mb-4">
              <UserPlus className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
            <CardDescription>
              Completa el formulario para crear tu cuenta
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    className="pl-10"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="pl-10"
                    {...register('phone')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                
                {/* Password strength indicator */}
                {password && passwordStrength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            i < passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-secondary'
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn('text-xs font-medium', passwordStrength.color.replace('bg-', 'text-'))}>
                      Seguridad: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register('confirmPassword')}
                  />
                  {watch('confirmPassword') && !errors.confirmPassword && watch('confirmPassword') === password && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-success" />
                  )}
                  {errors.confirmPassword && (
                    <XCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Crear Cuenta
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
