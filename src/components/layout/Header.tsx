import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, User, Stethoscope, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Inicio', icon: null },
    { href: '/book', label: 'Agendar Cita', icon: Calendar },
    { href: '/doctors', label: 'Doctores', icon: Stethoscope },
    { href: '/dashboard', label: 'Mi Panel', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md group-hover:shadow-lg transition-shadow">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-gradient">Clínica Virtual X</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant={isActive(link.href) ? 'secondary' : 'ghost'}
                className={cn(
                  'gap-2',
                  isActive(link.href) && 'bg-primary/10 text-primary'
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link to="/book">
            <Button variant="hero" size="lg">
              <Calendar className="h-4 w-4" />
              Reservar Ahora
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container mx-auto flex flex-col gap-2 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={isActive(link.href) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    isActive(link.href) && 'bg-primary/10 text-primary'
                  )}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link to="/book" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="hero" className="w-full mt-2">
                <Calendar className="h-4 w-4" />
                Reservar Ahora
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
