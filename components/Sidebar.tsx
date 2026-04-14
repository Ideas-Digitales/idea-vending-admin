'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, ShoppingCart, Monitor, Users, Building2, LogOut,
  CreditCard, X, Loader2, ChevronLeft, ChevronRight, PackageSearch, LayoutTemplate,
} from 'lucide-react';
import { useAuthStore, useUser } from '@/lib/stores/authStore';
import { ROLE_LABELS } from '@/lib/constants/roles';
import type { UserRole } from '@/lib/constants/roles';

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const user = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sidebarCubes = [
    { className: 'top-6 right-4 w-32 h-32 bg-white/10 rounded-3xl animate-float',         delay: '0s'   },
    { className: 'top-32 right-10 w-24 h-24 bg-white/8 rounded-2xl animate-float-reverse', delay: '0.6s' },
    { className: 'top-52 right-6 w-20 h-20 bg-white/7 rounded-2xl animate-pulse-glow',     delay: '1.2s' },
    { className: 'bottom-24 right-12 w-24 h-24 bg-white/9 rounded-3xl animate-float',      delay: '1.8s' },
    { className: 'bottom-8 right-4 w-16 h-16 bg-white/6 rounded-2xl animate-float-reverse',delay: '2.4s' },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try { await logout(); } catch (error) { console.error('Error durante logout:', error); }
    finally { router.push('/login'); }
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
    { name: 'Dashboard',  href: '/dashboard',  icon: BarChart3,    current: pathname === '/dashboard' },
    { name: 'Pagos',      href: '/pagos',      icon: CreditCard,   current: pathname === '/pagos',     requiredPermissions: ['payments.read.all', 'payments.read.enterprise_owned'] },
    { name: 'Reposición', href: '/reposicion', icon: PackageSearch, current: pathname === '/reposicion', requiredPermissions: ['machines.read.all', 'machines.read.enterprise_owned'] },
    { name: 'Máquinas',   href: '/maquinas',   icon: Monitor,         current: pathname === '/maquinas',   requiredPermissions: ['machines.read.all', 'machines.read.enterprise_owned'] },
    { name: 'Plantillas', href: '/plantillas', icon: LayoutTemplate,  current: pathname.startsWith('/plantillas'), onlyRoles: ['admin'] },
    { name: 'Productos',  href: '/productos',  icon: ShoppingCart,    current: pathname === '/productos',  requiredPermissions: ['products.read.all', 'products.read.enterprise_owned'] },
    { name: 'Empresas',   href: '/empresas',   icon: Building2,    current: pathname === '/empresas',  requiredPermissions: ['enterprises.read.all', 'enterprises.read.own'] },
    { name: 'Usuarios',   href: '/usuarios',   icon: Users,        current: pathname === '/usuarios',  requiredPermissions: ['users.read.all'] },
  ];

  const hasFullAccess = user?.role === 'admin';

  const visibleItems = navigationItems.filter(item => {
    if (item.onlyRoles) return user?.role ? item.onlyRoles.includes(user.role as UserRole) : false;
    if (hasFullAccess) return true;
    if (!item.requiredPermissions?.length) return true;
    const perms = user?.permissions ?? [];
    return item.match === 'all'
      ? item.requiredPermissions.every(p => perms.includes(p))
      : item.requiredPermissions.some(p => perms.includes(p));
  });

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={`relative flex-shrink-0 bg-[#3157b2] text-white shadow-2xl h-screen sticky top-0 overflow-hidden flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Animated cubes — hidden when collapsed to avoid clutter */}
      {!collapsed && (
        <div className="absolute inset-y-0 right-0 w-full pointer-events-none">
          {sidebarCubes.map((cube, i) => (
            <div key={i} className={`absolute opacity-70 blur-[1px] ${cube.className}`} style={{ animationDelay: cube.delay }} />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">

        {/* ── Logo ────────────────────────────────────────────────────────── */}
        <div className={`flex items-center border-b border-white/15 ${collapsed ? 'px-3 py-4 justify-center' : 'px-6 py-4 gap-3'}`}>
          <img
            src="/icon_ideavending.png"
            alt="Ideas Digitales"
            width={36}
            height={36}
            className="h-9 w-9 object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-lg font-bold text-white leading-tight truncate">Ideas Digitales</span>
              <span className="text-xs text-white/70 font-medium">Plataforma Vending</span>
            </div>
          )}
          {/* Mobile close */}
          {!collapsed && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── User Info ───────────────────────────────────────────────────── */}
        <div className={`border-b border-white/15 ${collapsed ? 'px-3 py-3 flex justify-center' : 'px-6 py-4'}`}>
          {collapsed ? (
            <div
              className="h-9 w-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
              title={user?.name || 'Usuario'}
            >
              <span className="text-white text-sm font-semibold">{userInitial}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-white/70 truncate font-medium">{roleLabel}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'}`}>
          {visibleItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              data-cy={`nav-${item.href.replace('/', '')}`}
              title={collapsed ? item.name : undefined}
              className={`flex items-center rounded-lg transition-colors border ${
                collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
              } ${
                item.current
                  ? 'text-[#3157b2] bg-white border-white font-semibold shadow-sm'
                  : 'text-white/80 border-white/0 hover:bg-white/15 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* ── Logout ──────────────────────────────────────────────────────── */}
        <div className={`border-t border-white/15 ${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            data-cy="sidebar-logout"
            title={collapsed ? (isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión') : undefined}
            className={`flex items-center w-full rounded-lg transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed text-white/80 hover:bg-white/10 hover:text-white ${
              collapsed ? 'justify-center py-3 px-0' : 'px-4 py-3'
            }`}
          >
            {isLoggingOut
              ? <Loader2 className={`h-5 w-5 flex-shrink-0 animate-spin ${collapsed ? '' : 'mr-3'}`} />
              : <LogOut  className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
            }
            {!collapsed && <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>}
          </button>
        </div>

        {/* ── Collapse toggle (desktop only) ──────────────────────────────── */}
        <div className={`hidden md:flex border-t border-white/10 ${collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2'}`}>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menú' : 'Comprimir menú'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium w-full justify-center"
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <><ChevronLeft className="h-4 w-4" /><span>Comprimir</span></>
            }
          </button>
        </div>

      </div>
    </div>
  );
}
