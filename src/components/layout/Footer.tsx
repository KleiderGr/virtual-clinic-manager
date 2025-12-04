import { Stethoscope, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient">Clínica Virtual X</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu salud es nuestra prioridad. Agenda tus citas médicas de forma fácil y rápida.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/book" className="hover:text-primary transition-colors">Agendar Cita</Link></li>
              <li><Link to="/doctors" className="hover:text-primary transition-colors">Nuestros Doctores</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Mi Panel</Link></li>
            </ul>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Especialidades</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Cardiología</li>
              <li>Dermatología</li>
              <li>Pediatría</li>
              <li>Medicina General</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contacto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                +34 900 123 456
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                info@clinicax.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Madrid, España
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Clínica Virtual X. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
