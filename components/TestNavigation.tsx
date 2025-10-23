'use client';

import { useRouter } from 'next/navigation';
import { Home, Package, Monitor, BarChart3, TestTube } from 'lucide-react';

export default function TestNavigation() {
  const router = useRouter();

  const routes = [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/productos', name: 'Productos', icon: Package },
    { path: '/maquinas', name: 'Máquinas', icon: Monitor },
    { path: '/reportes', name: 'Reportes', icon: BarChart3 },
    { path: '/test', name: 'Test', icon: TestTube },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-dark mb-3">Navegación de Prueba</h3>
      <div className="space-y-2">
        {routes.map((route) => (
          <button
            key={route.path}
            onClick={() => router.push(route.path)}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <route.icon className="h-4 w-4 text-primary" />
            <span className="text-dark">{route.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
