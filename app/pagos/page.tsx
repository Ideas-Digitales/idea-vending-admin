'use client';

import { CreditCard, Search, Filter, Calendar, DollarSign, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/stores/authStore';

function PagosContent() {
  const user = useUser();

  const pagos = [
    {
      id: 'PAY001',
      amount: 2500,
      currency: 'CLP',
      status: 'completed',
      method: 'credit_card',
      machineId: 'VM001',
      machineName: 'Máquina Edificio A',
      customerEmail: 'cliente1@email.com',
      productName: 'Coca Cola 350ml',
      transactionDate: '2024-01-03 10:30:00',
      paymentGateway: 'Transbank'
    },
    {
      id: 'PAY002',
      amount: 1800,
      currency: 'CLP',
      status: 'pending',
      method: 'debit_card',
      machineId: 'VM002',
      machineName: 'Máquina Cafetería',
      customerEmail: 'cliente2@email.com',
      productName: 'Papas Lays Original',
      transactionDate: '2024-01-03 09:45:00',
      paymentGateway: 'Webpay'
    },
    {
      id: 'PAY003',
      amount: 1200,
      currency: 'CLP',
      status: 'failed',
      method: 'mobile_payment',
      machineId: 'VM001',
      machineName: 'Máquina Edificio A',
      customerEmail: 'cliente3@email.com',
      productName: 'Agua Mineral 500ml',
      transactionDate: '2024-01-03 08:20:00',
      paymentGateway: 'Khipu'
    },
    {
      id: 'PAY004',
      amount: 2200,
      currency: 'CLP',
      status: 'completed',
      method: 'credit_card',
      machineId: 'VM003',
      machineName: 'Máquina Oficinas',
      customerEmail: 'cliente4@email.com',
      productName: 'Chocolate Snickers',
      transactionDate: '2024-01-03 07:15:00',
      paymentGateway: 'Transbank'
    },
    {
      id: 'PAY005',
      amount: 1900,
      currency: 'CLP',
      status: 'refunded',
      method: 'debit_card',
      machineId: 'VM002',
      machineName: 'Máquina Cafetería',
      customerEmail: 'cliente5@email.com',
      productName: 'Galletas Oreo',
      transactionDate: '2024-01-02 18:30:00',
      paymentGateway: 'Webpay'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'refunded': return <TrendingUp className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Tarjeta de Crédito';
      case 'debit_card': return 'Tarjeta de Débito';
      case 'mobile_payment': return 'Pago Móvil';
      default: return method;
    }
  };

  const totalAmount = pagos.reduce((sum, pago) => sum + pago.amount, 0);
  const completedPayments = pagos.filter(p => p.status === 'completed');
  const pendingPayments = pagos.filter(p => p.status === 'pending');
  const failedPayments = pagos.filter(p => p.status === 'failed');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Pagos</h1>
                  <p className="text-muted">Monitorea transacciones y pagos del sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted" />
                <span className="text-sm text-muted">Últimas 24 horas</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Total Transacciones</p>
                  <p className="text-2xl font-bold text-dark">{pagos.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Monto Total</p>
                  <p className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Completados</p>
                  <p className="text-2xl font-bold text-green-600">{completedPayments.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">Pendientes/Fallidos</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingPayments.length + failedPayments.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Search */}
          <div className="mb-6 card p-6">
            <h3 className="text-lg font-bold text-dark mb-4">Búsqueda Avanzada de Pagos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ID de transacción..."
                  className="input-field pl-10"
                />
              </div>
              <input
                type="email"
                placeholder="Email del cliente..."
                className="input-field"
              />
              <select className="input-field">
                <option value="">Todos los estados</option>
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
                <option value="failed">Fallido</option>
                <option value="refunded">Reembolsado</option>
              </select>
              <select className="input-field">
                <option value="">Método de pago</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="debit_card">Tarjeta de Débito</option>
                <option value="mobile_payment">Pago Móvil</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <input
                type="date"
                className="input-field"
                placeholder="Fecha desde"
              />
              <input
                type="date"
                className="input-field"
                placeholder="Fecha hasta"
              />
              <button className="btn-primary flex items-center justify-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Aplicar Filtros</span>
              </button>
            </div>
          </div>

          {/* Payments Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark">Lista de Transacciones</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Transacción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Máquina
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark">{pago.id}</div>
                        <div className="text-sm text-muted">{pago.paymentGateway}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark">{pago.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark">{pago.productName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-dark">
                          ${pago.amount.toLocaleString()} {pago.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark">{getMethodName(pago.method)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pago.status)}`}>
                          {getStatusIcon(pago.status)}
                          <span className="ml-1">{getStatusName(pago.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark">{pago.machineName}</div>
                        <div className="text-sm text-muted">{pago.machineId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {new Date(pago.transactionDate).toLocaleString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods Summary */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Métodos de Pago</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Tarjeta de Crédito</span>
                  <span className="text-sm font-semibold text-dark">
                    {pagos.filter(p => p.method === 'credit_card').length} transacciones
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Tarjeta de Débito</span>
                  <span className="text-sm font-semibold text-dark">
                    {pagos.filter(p => p.method === 'debit_card').length} transacciones
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Pago Móvil</span>
                  <span className="text-sm font-semibold text-dark">
                    {pagos.filter(p => p.method === 'mobile_payment').length} transacciones
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Gateways de Pago</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Transbank</span>
                  <span className="text-sm font-semibold text-dark">
                    {pagos.filter(p => p.paymentGateway === 'Transbank').length} transacciones
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Webpay</span>
                  <span className="text-sm font-semibold text-dark">
                    {pagos.filter(p => p.paymentGateway === 'Webpay').length} transacciones
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Khipu</span>
                  <span className="text-sm font-semibold text-dark">
                    {pagos.filter(p => p.paymentGateway === 'Khipu').length} transacciones
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PagosPage() {
  return (
    <ProtectedRoute requiredPermissions={['read']}>
      <PagosContent />
    </ProtectedRoute>
  );
}
