'use client';

import { Building2, Plus, Search, MapPin, Users, Monitor, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

function EmpresasContent() {
  const user = useUser();

  const empresas = [
    {
      id: 1,
      name: 'Ideas Digitales SpA',
      rut: '76.123.456-7',
      email: 'contacto@ideasdigitales.dev',
      phone: '+56 9 1234 5678',
      address: 'Av. Providencia 1234, Santiago',
      city: 'Santiago',
      country: 'Chile',
      status: 'active',
      plan: 'enterprise',
      machinesCount: 15,
      usersCount: 8,
      monthlyRevenue: 2450000,
      createdAt: '2024-01-01 10:00:00',
      lastActivity: '2024-01-03 11:30:00'
    },
    {
      id: 2,
      name: 'Corporación Vending Chile',
      rut: '96.789.012-3',
      email: 'admin@vendingchile.cl',
      phone: '+56 2 2345 6789',
      address: 'Las Condes 5678, Las Condes',
      city: 'Santiago',
      country: 'Chile',
      status: 'active',
      plan: 'professional',
      machinesCount: 8,
      usersCount: 5,
      monthlyRevenue: 1200000,
      createdAt: '2024-01-02 14:30:00',
      lastActivity: '2024-01-03 09:15:00'
    },
    {
      id: 3,
      name: 'Snack Solutions Ltda',
      rut: '77.345.678-9',
      email: 'info@snacksolutions.cl',
      phone: '+56 9 8765 4321',
      address: 'Vitacura 9012, Vitacura',
      city: 'Santiago',
      country: 'Chile',
      status: 'inactive',
      plan: 'basic',
      machinesCount: 3,
      usersCount: 2,
      monthlyRevenue: 450000,
      createdAt: '2023-12-15 16:45:00',
      lastActivity: '2024-01-01 08:20:00'
    },
    {
      id: 4,
      name: 'Máquinas del Norte SA',
      rut: '78.901.234-5',
      email: 'ventas@maquinasnorte.cl',
      phone: '+56 55 123 4567',
      address: 'Antofagasta 3456, Antofagasta',
      city: 'Antofagasta',
      country: 'Chile',
      status: 'active',
      plan: 'professional',
      machinesCount: 12,
      usersCount: 6,
      monthlyRevenue: 1800000,
      createdAt: '2024-01-01 12:20:00',
      lastActivity: '2024-01-03 10:45:00'
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'Empresarial';
      case 'professional': return 'Profesional';
      case 'basic': return 'Básico';
      default: return plan;
    }
  };

  const totalEmpresas = empresas.length;
  const empresasActivas = empresas.filter(e => e.status === 'active').length;
  const totalMaquinas = empresas.reduce((sum, e) => sum + e.machinesCount, 0);
  const ingresosTotales = empresas.reduce((sum, e) => sum + e.monthlyRevenue, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Empresas</h1>
                  <p className="text-muted">Administra empresas clientes y sus suscripciones</p>
                </div>
              </div>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nueva Empresa</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Total Empresas</p>
                  <p className="text-2xl font-bold text-dark">{totalEmpresas}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Empresas Activas</p>
                  <p className="text-2xl font-bold text-green-600">{empresasActivas}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Total Máquinas</p>
                  <p className="text-2xl font-bold text-purple-600">{totalMaquinas}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-green-600">${ingresosTotales.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 card p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empresas por nombre, RUT o email..."
                  className="input-field pl-10"
                />
              </div>
              <select className="input-field">
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <select className="input-field">
                <option value="">Todos los planes</option>
                <option value="enterprise">Empresarial</option>
                <option value="professional">Profesional</option>
                <option value="basic">Básico</option>
              </select>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {empresas.map((empresa) => (
              <div key={empresa.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark">{empresa.name}</h3>
                      <p className="text-sm text-muted">{empresa.rut}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(empresa.status)}`}>
                      {empresa.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(empresa.plan)}`}>
                      {getPlanName(empresa.plan)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{empresa.address}, {empresa.city}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted">
                    <span>📧 {empresa.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted">
                    <span>📱 {empresa.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Monitor className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-lg font-bold text-dark">{empresa.machinesCount}</span>
                    </div>
                    <p className="text-xs text-muted">Máquinas</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-lg font-bold text-dark">{empresa.usersCount}</span>
                    </div>
                    <p className="text-xs text-muted">Usuarios</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-lg font-bold text-dark">${(empresa.monthlyRevenue / 1000).toFixed(0)}K</span>
                    </div>
                    <p className="text-xs text-muted">Ingresos/mes</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-muted">
                    Última actividad: {new Date(empresa.lastActivity).toLocaleDateString('es-ES')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 p-1">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 p-1">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Plans Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {empresas.filter(e => e.plan === 'enterprise').length}
              </div>
              <div className="text-muted">Plan Empresarial</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {empresas.filter(e => e.plan === 'professional').length}
              </div>
              <div className="text-muted">Plan Profesional</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-gray-600 mb-2">
                {empresas.filter(e => e.plan === 'basic').length}
              </div>
              <div className="text-muted">Plan Básico</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function EmpresasPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_enterprises']}>
      <EmpresasContent />
    </ProtectedRoute>
  );
}
