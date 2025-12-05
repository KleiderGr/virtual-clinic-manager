import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Doctores',
      href: '/admin/doctors',
      icon: UserCog,
    },
    {
      title: 'Pacientes',
      href: '/admin/patients',
      icon: Users,
    },
    {
      title: 'Usuarios',
      href: '/admin/users',
      icon: Shield,
    },
    {
      title: 'Especialidades',
      href: '/admin/specialties',
      icon: Stethoscope,
    },
    {
      title: 'Configuración',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-r border-border bg-card transition-all duration-300 hidden md:flex flex-col',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
          <div className="p-4 flex items-center justify-between">
            {!collapsed && (
              <h2 className="font-semibold text-lg">Panel Admin</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Separator />
          
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive(item.href) ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive(item.href) && 'bg-primary/10 text-primary',
                        collapsed && 'justify-center'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
