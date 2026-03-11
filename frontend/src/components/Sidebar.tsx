import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  FileText,
  Users,
  User,
  LogOut,
  GraduationCap,
  BookOpen,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = {
  profesor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/formularios', icon: FileText, label: 'Mis Formularios' },
    { to: '/grupos', icon: Users, label: 'Mis Grupos' },
    { to: '/perfil', icon: User, label: 'Mi Perfil' },
  ],
  alumno: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/formularios', icon: BookOpen, label: 'Formularios' },
    { to: '/grupos', icon: Users, label: 'Mis Grupos' },
    { to: '/perfil', icon: User, label: 'Mi Perfil' },
  ],
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const items = user ? navItems[user.rol as keyof typeof navItems] : navItems.alumno;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-uat-gradient shadow-xl transition-transform duration-300',
        'lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-uat-gold rounded-lg flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">UAT Forms</h1>
            <p className="text-blue-200 text-xs">Universidad Autónoma de Tamaulipas</p>
          </div>
        </div>
        <button
          className="lg:hidden text-white/70 hover:text-white transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-uat-gold flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{user.nombre}</p>
              <p className="text-blue-200 text-xs capitalize">{user.rol}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-uat-gold' : 'text-blue-200 group-hover:text-white'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-uat-gold" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
