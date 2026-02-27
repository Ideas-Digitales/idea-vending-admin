'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, ShoppingCart, Monitor, Users, Building2, LogOut, CreditCard, LineChart, X, Loader2 } from 'lucide-react';
import { useAuthStore, useUser } from '@/lib/stores/authStore';
import { ROLE_LABELS } from '@/lib/constants/roles';
import type { UserRole } from '@/lib/constants/roles';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const user = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sidebarCubes = [
    { className: 'top-6 right-4 w-32 h-32 bg-white/10 rounded-3xl animate-float', delay: '0s' },
    { className: 'top-32 right-10 w-24 h-24 bg-white/8 rounded-2xl animate-float-reverse', delay: '0.6s' },
    { className: 'top-52 right-6 w-20 h-20 bg-white/7 rounded-2xl animate-pulse-glow', delay: '1.2s' },
    { className: 'bottom-24 right-12 w-24 h-24 bg-white/9 rounded-3xl animate-float', delay: '1.8s' },
    { className: 'bottom-8 right-4 w-16 h-16 bg-white/6 rounded-2xl animate-float-reverse', delay: '2.4s' },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      router.push('/login');
    }
  };

  const roleLabel = user?.role ? (ROLE_LABELS[user.role as UserRole] ?? 'Usuario') : 'Usuario';

  type NavigationItem = {
    name: string;
    href: string;
    icon: typeof BarChart3;
    current: boolean;
    requiredPermissions?: string[];
    match?: 'any' | 'all';
    onlyRoles?: UserRole[];
  };

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      current: pathname === '/dashboard'
    },
    {
      name: 'Usuarios',
      href: '/usuarios',
      icon: Users,
      current: pathname === '/usuarios',
      requiredPermissions: ['users.read.all']
    },
    {
      name: 'Empresas',
      href: '/empresas',
      icon: Building2,
      current: pathname === '/empresas',
      requiredPermissions: ['enterprises.read.all', 'enterprises.read.own']
    },
    {
      name: 'Máquinas',
      href: '/maquinas',
      icon: Monitor,
      current: pathname === '/maquinas',
      requiredPermissions: ['machines.read.all', 'machines.read.enterprise_owned']
    },
    {
      name: 'Productos',
      href: '/productos',
      icon: ShoppingCart,
      current: pathname === '/productos',
      requiredPermissions: ['products.read.all', 'products.read.enterprise_owned']
    },
    {
      name: 'Pagos',
      href: '/pagos',
      icon: CreditCard,
      current: pathname === '/pagos',
      requiredPermissions: ['payments.read.all', 'payments.read.enterprise_owned']
    },
    {
      name: 'Métricas',
      href: '/metricas',
      icon: LineChart,
      current: pathname === '/metricas',
      onlyRoles: ['customer'],
    },
  ];

  const hasFullAccess = user?.role === 'admin';

  return (
    <div className="relative w-64 flex-shrink-0 bg-[#3157b2] text-white shadow-2xl h-screen sticky top-0 overflow-hidden">
      {/* Animated cubes */}
      <div className="absolute inset-y-0 right-0 w-full pointer-events-none">
        {sidebarCubes.map((cube, index) => (
          <div
            key={index}
            className={`absolute opacity-70 blur-[1px] ${cube.className}`}
            style={{ animationDelay: cube.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-white/15 gap-3">
        <img
          src="/icon_ideavending.png"
          alt="Ideas Digitales"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
        <div className="flex flex-col flex-1">
          <span className="text-lg font-bold text-white leading-tight">Ideas Digitales</span>
          <span className="text-xs text-white/70 font-medium">Plataforma Vending</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-white/15">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-white/70 truncate font-medium">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigationItems
          .filter((item) => {
            // Si el ítem tiene restricción de roles, verificar sin importar el rol del usuario
            if (item.onlyRoles) {
              return user?.role ? item.onlyRoles.includes(user.role as UserRole) : false;
            }

            if (hasFullAccess) {
              return true;
            }

            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
              return true;
            }

            const userPermissions = user?.permissions ?? [];
            const matchType = item.match ?? 'any';

            if (matchType === 'all') {
              return item.requiredPermissions.every((permission) => userPermissions.includes(permission));
            }

            return item.requiredPermissions.some((permission) => userPermissions.includes(permission));
          })
          .map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            data-cy={`nav-${item.href.replace('/', '')}`}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors border ${
              item.current
                ? 'text-[#3157b2] bg-white border-white font-semibold shadow-sm'
                : 'text-white/80 border-white/0 hover:bg-white/15 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-white/15">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-cy="sidebar-logout"
          className="flex items-center w-full px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoggingOut
            ? <Loader2 className="h-5 w-5 mr-3 flex-shrink-0 animate-spin" />
            : <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
          }
          <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
        </button>
      </div>
      </div>
    </div>
  );
}
