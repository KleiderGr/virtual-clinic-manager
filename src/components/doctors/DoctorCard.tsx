import { Doctor } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: Doctor;
  className?: string;
}

const DoctorCard = ({ doctor, className }: DoctorCardProps) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

      <div className="relative p-6">
        {/* Avatar and Info */}
        <div className="flex items-start gap-4">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="h-20 w-20 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {doctor.name}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
              {doctor.specialty}
            </span>
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium text-foreground">{doctor.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({doctor.reviewCount} reseñas)
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {doctor.bio}
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link to={`/book?doctor=${doctor.id}`} className="flex-1">
            <Button variant="hero" className="w-full">
              <Calendar className="h-4 w-4" />
              Agendar
            </Button>
          </Link>
          <Link to={`/doctors/${doctor.id}`}>
            <Button variant="outline">Ver Perfil</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
