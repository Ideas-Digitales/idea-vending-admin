'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3, ShoppingCart, Monitor, Users, Building2, LogOut } from 'lucide-react';
import { useAuthStore, useUser } from '@/lib/stores/authStore';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, updateUser } = useAuthStore();
  const user = useUser();

  const sidebarCubes = [
    { className: 'top-6 right-4 w-32 h-32 bg-white/10 rounded-3xl animate-float', delay: '0s' },
    { className: 'top-32 right-10 w-24 h-24 bg-white/8 rounded-2xl animate-float-reverse', delay: '0.6s' },
    { className: 'top-52 right-6 w-20 h-20 bg-white/7 rounded-2xl animate-pulse-glow', delay: '1.2s' },
    { className: 'bottom-24 right-12 w-24 h-24 bg-white/9 rounded-3xl animate-float', delay: '1.8s' },
    { className: 'bottom-8 right-4 w-16 h-16 bg-white/6 rounded-2xl animate-float-reverse', delay: '2.4s' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error durante logout:', error);
      router.push('/login');
    }
  };

  // SOLUCIÓN TEMPORAL: Forzar permisos correctos para admin (evitar setState durante render)
  useEffect(() => {
    if (user && user.role === 'admin' && Array.isArray(user.permissions) && !user.permissions.includes('manage_enterprises')) {
      const correctPermissions = ['read', 'write', 'delete', 'manage_users', 'manage_machines', 'manage_enterprises'];
      updateUser({ permissions: correctPermissions });
    }
  }, [user?.role, JSON.stringify(user?.permissions || [])]);

  const navigationItems = [
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
      permission: 'manage_users'
    },
    {
      name: 'Máquinas',
      href: '/maquinas',
      icon: Monitor,
      current: pathname === '/maquinas',
      permission: 'manage_machines'
    },
    {
      name: 'Productos',
      href: '/productos',
      icon: ShoppingCart,
      current: pathname === '/productos'
    },
    {
      name: 'Empresas',
      href: '/empresas',
      icon: Building2,
      current: pathname === '/empresas',
      permission: 'manage_enterprises'
    }
  ];

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
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white leading-tight">Ideas Digitales</span>
          <span className="text-xs text-white/70 font-medium">Plataforma Vending</span>
        </div>
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
              {user?.role === 'admin' ? 'Administrador' : 
               user?.role === 'operator' ? 'Operador' : 'Usuario'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigationItems
          .filter(item => {
            const hasPermission = !item.permission || user?.permissions.includes(item.permission);
            return hasPermission;
          })
          .map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors border ${
              item.current
                ? 'text-[#3157b2] bg-white border-white font-semibold shadow-sm'
                : 'text-white/80 border-white/0 hover:bg-white/15 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </a>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-white/15">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors font-medium"
        >
          <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
      </div>
    </div>
  );
}
