import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingForm from '@/components/booking/BookingForm';
import { Calendar, Clock, Shield, ArrowRight } from 'lucide-react';

const Book = () => {
  const steps = [
    { number: 1, title: 'Elige especialidad', icon: ArrowRight },
    { number: 2, title: 'Selecciona doctor', icon: ArrowRight },
    { number: 3, title: 'Escoge fecha y hora', icon: ArrowRight },
    { number: 4, title: 'Confirma tu cita', icon: null },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-6">
                <Calendar className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Agenda tu Cita Médica
              </h1>
              <p className="text-muted-foreground">
                Completa el formulario y recibe confirmación instantánea
              </p>
            </div>

            {/* Steps indicator */}
            <div className="hidden md:flex items-center justify-center gap-4 mt-10 max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {step.number}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {step.title}
                    </span>
                  </div>
                  {step.icon && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-3" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
                  <BookingForm />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Info Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
                  <h3 className="font-semibold text-foreground mb-4">
                    ¿Cómo funciona?
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Selecciona</p>
                        <p className="text-sm text-muted-foreground">
                          Elige especialidad, doctor y horario
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Confirma</p>
                        <p className="text-sm text-muted-foreground">
                          Ingresa tus datos y confirma
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">¡Listo!</p>
                        <p className="text-sm text-muted-foreground">
                          Recibe confirmación por email
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-br from-primary/5 to-info/5 border border-primary/20 rounded-2xl p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Beneficios
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">
                        Confirmación instantánea
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">
                        Sin cargos por cancelación
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">
                        Recordatorios automáticos
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Contact */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
                  <h3 className="font-semibold text-foreground mb-2">
                    ¿Necesitas ayuda?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nuestro equipo está disponible para asistirte
                  </p>
                  <p className="text-primary font-semibold">+34 900 123 456</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
