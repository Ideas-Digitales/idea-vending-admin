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
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-bold text-dark">Ideas Vending</h1>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-muted truncate font-medium">
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
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              item.current
                ? 'text-primary bg-blue-50 font-semibold'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </a>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium"
        >
          <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
          <span className="truncate">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
