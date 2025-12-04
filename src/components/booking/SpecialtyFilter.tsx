import { Specialty } from '@/types/clinic';
import { specialties } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Sparkles, 
  Baby, 
  Users, 
  Bone, 
  Brain, 
  Eye, 
  Stethoscope 
} from 'lucide-react';

interface SpecialtyFilterProps {
  selected: Specialty | '';
  onSelect: (specialty: Specialty | '') => void;
}

const specialtyIcons: Record<Specialty, React.ElementType> = {
  'Cardiología': Heart,
  'Dermatología': Sparkles,
  'Pediatría': Baby,
  'Ginecología': Users,
  'Traumatología': Bone,
  'Neurología': Brain,
  'Oftalmología': Eye,
  'Medicina General': Stethoscope,
};

const SpecialtyFilter = ({ selected, onSelect }: SpecialtyFilterProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Selecciona una especialidad
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelect('')}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
            selected === ''
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card hover:border-primary/30 hover:bg-secondary'
          )}
        >
          <Stethoscope className="h-6 w-6" />
          <span className="text-xs font-medium">Todas</span>
        </button>
        {specialties.map((specialty) => {
          const Icon = specialtyIcons[specialty];
          return (
            <button
              key={specialty}
              onClick={() => onSelect(specialty)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                selected === specialty
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-secondary'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium text-center">{specialty}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SpecialtyFilter;
