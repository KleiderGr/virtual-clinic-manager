import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DoctorCard from '@/components/doctors/DoctorCard';
import { doctors, specialties } from '@/data/mockData';
import { Specialty } from '@/types/clinic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Stethoscope, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

import SEO from '@/components/SEO';

const Doctors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | ''>('');

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty =
        !selectedSpecialty || doctor.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [searchQuery, selectedSpecialty]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="Nuestros Doctores - Clínica Virtual X"
        description="Conoce a nuestro equipo de especialistas médicos. Doctores certificados en Cardiología, Dermatología, Pediatría y más."
      />
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-6">
                <Stethoscope className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nuestro Equipo Médico
              </h1>
              <p className="text-muted-foreground">
                Conoce a los especialistas que cuidan de tu salud
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 border-b border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o especialidad..."
                  className="pl-10 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Specialty Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Button
                  variant={selectedSpecialty === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpecialty('')}
                  className="flex-shrink-0"
                >
                  Todas
                </Button>
                {specialties.slice(0, 5).map((specialty) => (
                  <Button
                    key={specialty}
                    variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSpecialty(specialty)}
                    className="flex-shrink-0"
                  >
                    {specialty}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-6">
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 'es' : ''}{' '}
              encontrado{filteredDoctors.length !== 1 ? 's' : ''}
              {selectedSpecialty && ` en ${selectedSpecialty}`}
            </p>

            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className={cn(
                      'animate-slide-up opacity-0',
                      `stagger-${Math.min(index + 1, 5)}`
                    )}
                    style={{ animationFillMode: 'forwards' }}
                  >
                    <DoctorCard doctor={doctor} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No se encontraron doctores
                </h3>
                <p className="text-muted-foreground">
                  Intenta con otros filtros o términos de búsqueda
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Doctors;
