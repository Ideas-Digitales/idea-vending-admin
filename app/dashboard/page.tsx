'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Monitor
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

function DashboardContent() {
  const user = useUser();

  const stats = [
    {
      title: 'Ventas Hoy',
      value: '$12,345',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Productos Vendidos',
      value: '1,234',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Máquinas Activas',
      value: '3/4',
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Alertas',
      value: '2',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const quickActions = [
    { title: 'Ver Productos', href: '/productos', icon: ShoppingCart, color: 'text-blue-600' },
    { title: 'Monitorear Máquinas', href: '/maquinas', icon: Monitor, color: 'text-purple-600', permission: 'manage_machines' },
    { title: 'Ver Reportes', href: '/reportes', icon: BarChart3, color: 'text-green-600', permission: 'view_reports' },
    { title: 'Página de Prueba', href: '/test', icon: Settings, color: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
                <p className="text-muted">Bienvenido de vuelta, {user?.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-gray-400" />
                <div className="text-right">
                  <p className="text-sm font-medium text-dark">{user?.email}</p>
                  <p className="text-xs text-muted">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-dark">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor} flex-shrink-0 ml-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions
                .filter(action => !action.permission || user?.permissions.includes(action.permission))
                .map((action, index) => (
                <a
                  key={action.title}
                  href={action.href}
                  className="card p-6 hover:shadow-lg transition-all duration-200 block"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-gray-50 flex-shrink-0">
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-dark truncate">{action.title}</h4>
                      <p className="text-sm text-muted">Acceso rápido</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="card p-6 mt-8">
              <h3 className="text-lg font-bold text-dark mb-4">Actividad Reciente</h3>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">Venta realizada en Máquina #001</p>
                  <p className="text-xs text-muted">Hace 5 minutos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">Stock bajo en Máquina #003</p>
                  <p className="text-xs text-muted">Hace 1 hora</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">Error en Máquina #005</p>
                  <p className="text-xs text-muted">Hace 2 horas</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
