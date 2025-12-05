import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

interface ScheduleInputProps {
  value: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const SLOT_DURATIONS = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
];

export default function ScheduleInput({ value, onChange, disabled }: ScheduleInputProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>(value);

  const addSlot = () => {
    const newSlot: ScheduleSlot = {
      day_of_week: 1, // Monday by default
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: 30,
    };
    const newSlots = [...slots, newSlot];
    setSlots(newSlots);
    onChange(newSlots);
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
    onChange(newSlots);
  };

  const updateSlot = (index: number, field: keyof ScheduleSlot, value: string | number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
    onChange(newSlots);
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Desconocido';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Horario de Atención</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Horario
        </Button>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No hay horarios configurados. Haz clic en "Agregar Horario" para empezar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{getDayLabel(slot.day_of_week)}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlot(index)}
                  disabled={disabled}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Day of Week */}
                <div className="space-y-2">
                  <Label htmlFor={`day-${index}`} className="text-xs">
                    Día
                  </Label>
                  <Select
                    value={slot.day_of_week.toString()}
                    onValueChange={(val) => updateSlot(index, 'day_of_week', parseInt(val))}
                    disabled={disabled}
                  >
                    <SelectTrigger id={`day-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor={`start-${index}`} className="text-xs">
                    Hora Inicio
                  </Label>
                  <Input
                    id={`start-${index}`}
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                    disabled={disabled}
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor={`end-${index}`} className="text-xs">
                    Hora Fin
                  </Label>
                  <Input
                    id={`end-${index}`}
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                    disabled={disabled}
                  />
                </div>

                {/* Slot Duration */}
                <div className="space-y-2">
                  <Label htmlFor={`duration-${index}`} className="text-xs">
                    Duración Cita
                  </Label>
                  <Select
                    value={slot.slot_duration.toString()}
                    onValueChange={(val) => updateSlot(index, 'slot_duration', parseInt(val))}
                    disabled={disabled}
                  >
                    <SelectTrigger id={`duration-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Configura los días y horarios en los que el doctor estará disponible para citas.
        La duración de la cita determina los intervalos de tiempo disponibles.
      </p>
    </div>
  );
}
