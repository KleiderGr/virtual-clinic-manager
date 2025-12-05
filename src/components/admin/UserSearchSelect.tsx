import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface UserOption {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface UserSearchSelectProps {
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function UserSearchSelect({ value, onChange, disabled, error }: UserSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users with search and pagination
  const { data, isLoading } = useQuery({
    queryKey: ['user-search', debouncedSearch, page],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone', { count: 'exact' });

      // Apply search filter if exists
      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      const { data, error, count } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('full_name');

      if (error) throw error;

      return {
        users: data as UserOption[],
        total: count || 0,
        hasMore: count ? (page + 1) * pageSize < count : false,
      };
    },
  });

  // Get selected user info
  const { data: selectedUser } = useQuery({
    queryKey: ['user-selected', value],
    queryFn: async () => {
      if (!value) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', value)
        .single();

      if (error) return null;
      return data as UserOption;
    },
    enabled: !!value,
  });

  const handleSelect = (user: UserOption) => {
    onChange(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const loadMore = () => {
    setPage(p => p + 1);
  };

  return (
    <div className="space-y-2">
      <Label>Usuario *</Label>
      
      {/* Selected User Display */}
      {value && selectedUser && !isOpen && (
        <div
          className={cn(
            "border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && setIsOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{selectedUser.full_name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
            {!disabled && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      )}

      {/* Search Input */}
      {(!value || isOpen) && (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario por nombre o email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            onFocus={() => setIsOpen(true)}
          />
        </div>
      )}

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div className="border rounded-lg shadow-lg bg-background">
          <ScrollArea className="h-[200px]">
            {isLoading && page === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data?.users && data.users.length > 0 ? (
              <div className="p-1 space-y-1">
                {data.users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "p-1 px-3 rounded-lg cursor-pointer transition-colors hover:bg-primary/10",
                      value === user.id && "bg-primary/10"
                    )}
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        )}
                      </div>
                      {value === user.id && (
                        <Badge variant="default" className="text-xs">Seleccionado</Badge>
                      )}
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {data.hasMore && (
                  <div className="p-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Cargando...
                        </>
                      ) : (
                        'Mostrar más'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
              </div>
            )}
          </ScrollArea>

          {/* Close Button */}
          <div className="border-t p-1">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        {isOpen 
          ? `Mostrando ${data?.users.length || 0} de ${data?.total || 0} usuarios`
          : 'Haz clic para seleccionar un usuario'
        }
      </p>
    </div>
  );
}
