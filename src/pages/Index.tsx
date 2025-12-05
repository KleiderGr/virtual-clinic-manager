import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DoctorCard from '@/components/doctors/DoctorCard';
import { doctors, specialties } from '@/data/mockData';
import {
  Calendar,
  Shield,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Heart,
  Sparkles,
  Baby,
  Stethoscope,
} from 'lucide-react';

import SEO from '@/components/SEO';

const Index = () => {
  const featuredDoctors = doctors.slice(0, 3);

  const features = [
    {
      icon: Calendar,
      title: 'Agenda Fácil',
      description: 'Reserva tu cita en menos de 2 minutos, disponible 24/7',
    },
    {
      icon: Clock,
      title: 'Sin Esperas',
      description: 'Horarios puntuales y confirmación instantánea',
    },
    {
      icon: Shield,
      title: '100% Seguro',
      description: 'Tus datos médicos protegidos con la máxima seguridad',
    },
    {
      icon: Users,
      title: 'Expertos',
      description: 'Doctores certificados con años de experiencia',
    },
  ];

  const specialtyIcons = {
    'Cardiología': Heart,
    'Dermatología': Sparkles,
    'Pediatría': Baby,
    'Medicina General': Stethoscope,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Clínica Virtual X - Agenda tu Cita Médica Online"
        description="Agenda tu cita médica con los mejores especialistas. Cardiología, Dermatología, Pediatría y más. Sin filas, sin esperas, confirmación instantánea."
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-hero">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-info/5 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-20 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                Más de 10,000 citas agendadas
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
                Tu salud, a un{' '}
                <span className="text-gradient">click de distancia</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up stagger-1">
                Agenda tu cita médica con los mejores especialistas. Sin filas,
                sin esperas, desde cualquier lugar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-2">
                <Link to="/book">
                  <Button variant="hero" size="xl">
                    <Calendar className="h-5 w-5" />
                    Agendar Cita Ahora
                  </Button>
                </Link>
                <Link to="/doctors">
                  <Button variant="outline" size="xl">
                    Ver Doctores
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 animate-slide-up stagger-3">
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-gradient">50+</p>
                  <p className="text-sm text-muted-foreground">Doctores</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-gradient">8</p>
                  <p className="text-sm text-muted-foreground">Especialidades</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-gradient">4.9</p>
                  <p className="text-sm text-muted-foreground">Calificación</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                ¿Por qué elegirnos?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Diseñado para hacer tu experiencia médica lo más simple y
                cómoda posible
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-primary text-primary-foreground mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Specialties Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nuestras Especialidades
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Contamos con especialistas en diversas áreas de la medicina
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specialties.slice(0, 8).map((specialty) => {
                const Icon = specialtyIcons[specialty as keyof typeof specialtyIcons] || Stethoscope;
                return (
                  <Link
                    key={specialty}
                    to={`/book?specialty=${encodeURIComponent(specialty)}`}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground text-center">
                      {specialty}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Doctors Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Doctores Destacados
                </h2>
                <p className="text-muted-foreground">
                  Conoce a algunos de nuestros especialistas más valorados
                </p>
              </div>
              <Link to="/doctors" className="mt-4 md:mt-0">
                <Button variant="outline">
                  Ver Todos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              ¿Listo para cuidar tu salud?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Agenda tu primera cita hoy y comienza tu camino hacia una mejor
              salud
            </p>
            <Link to="/book">
              <Button
                size="xl"
                className="bg-background text-primary hover:bg-background/90 shadow-xl"
              >
                <Calendar className="h-5 w-5" />
                Agendar Mi Cita
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
