import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  availableSlots: string[];
  selectedTime: string;
  onSelect: (time: string) => void;
  disabled?: boolean;
}

const TimeSlotPicker = ({
  availableSlots,
  selectedTime,
  onSelect,
  disabled = false,
}: TimeSlotPickerProps) => {
  if (disabled) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Horarios Disponibles
        </label>
        <div className="bg-secondary/50 rounded-xl p-8 text-center">
          <p className="text-muted-foreground">
            Selecciona una fecha para ver los horarios disponibles
          </p>
        </div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Horarios Disponibles
        </label>
        <div className="bg-destructive/10 rounded-xl p-8 text-center">
          <p className="text-destructive font-medium">
            No hay horarios disponibles para esta fecha
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Por favor, selecciona otra fecha
          </p>
        </div>
      </div>
    );
  }

  // Group slots by morning/afternoon
  const morningSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.split(':')[0]);
    return hour < 13;
  });

  const afternoonSlots = availableSlots.filter((slot) => {
    const hour = parseInt(slot.split(':')[0]);
    return hour >= 13;
  });

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Horarios Disponibles ({availableSlots.length} disponibles)
      </label>

      {morningSlots.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Mañana
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {morningSlots.map((time) => (
              <button
                key={time}
                onClick={() => onSelect(time)}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedTime === time
                    ? 'gradient-primary text-primary-foreground shadow-md'
                    : 'bg-secondary hover:bg-primary/10 hover:text-primary'
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {afternoonSlots.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tarde
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {afternoonSlots.map((time) => (
              <button
                key={time}
                onClick={() => onSelect(time)}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedTime === time
                    ? 'gradient-primary text-primary-foreground shadow-md'
                    : 'bg-secondary hover:bg-primary/10 hover:text-primary'
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
