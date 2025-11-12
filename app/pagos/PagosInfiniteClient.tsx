'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle, XCircle, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MachineStylePagination from '@/components/MachineStylePagination';
import { usePaymentStore } from '@/lib/stores/paymentStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { PaymentFilters } from '@/lib/interfaces/payment.interface';

export default function PagosInfiniteClient() {
  // Store state
  const {
    payments,
    isLoading,
    error,
    fetchPayments,
    refreshPayments,
    clearError,
    pagination,
    currentFilters,
    hasNextPage,
    hasPrevPage,
    getTotalPayments,
  } = usePaymentStore();

  // Local UI state - Simple pagination only
  const [filters, setFiltersState] = useState<PaymentFilters>({
    page: 1,
    limit: 15,
  });

  useEffect(() => {
    // Solo cargar pagos si no hay datos y no estamos cargando
    if (payments.length === 0 && !isLoading && !error) {
      fetchPayments();
    }
  }, [payments.length, isLoading, error, fetchPayments]);

  // Mostrar toast para errores
  useEffect(() => {
    if (error) {
      notify.error(`Error al cargar pagos: ${error}`);
    }
  }, [error]);

  // Load payments on mount
  useEffect(() => {
    fetchPayments(filters);
  }, [filters, fetchPayments]);

  // Handle page change
  const handlePageChange = useCallback(async (page: number) => {
    try {
      const newFilters = {
        ...currentFilters,
        page,
      };

      await fetchPayments(newFilters);
    } catch (error) {
      console.error('Error al cambiar página de pagos:', error);
    }
  }, [currentFilters, fetchPayments]);

  // Handle page size change
  const handlePageSizeChange = useCallback(async (limit: number) => {
    try {
      const newFilters = {
        ...currentFilters,
        page: 1, // Reset to first page when changing page size
        limit,
      };

      await fetchPayments(newFilters);
    } catch (error) {
      console.error('Error al cambiar tamaño de página de pagos:', error);
    }
  }, [currentFilters, fetchPayments]);

  // Helper functions
  const getStatusColor = (successful: boolean) => {
    return successful 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (successful: boolean) => {
    return successful 
      ? <CheckCircle className="h-4 w-4" />
      : <XCircle className="h-4 w-4" />;
  };

  const getStatusName = (successful: boolean) => {
    return successful ? 'Exitoso' : 'Fallido';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // No statistics needed - removed cards

  // Payments are already filtered by the API, no need for client-side filtering
  const displayedPayments = payments;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
                <button
                  onClick={refreshPayments}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Error state */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error al cargar pagos</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => { clearError(); refreshPayments(); }}
                  className="ml-3 text-red-800 hover:text-red-900"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Removed stats cards and filters - only table and pagination */}

          {/* Payments Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">Lista de Transacciones</h3>
              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando...</span>
                </div>
              )}
            </div>
            
            {displayedPayments.length === 0 && !isLoading ? (
              <div className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos</h3>
                <p className="text-gray-500">No se encontraron transacciones con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID / Operación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarjeta
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
                    {displayedPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark">#{payment.id}</div>
                          <div className="text-sm text-muted">{payment.operation_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark">{payment.product}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-dark">
                            {formatAmount(payment.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark">{payment.card_brand}</div>
                          <div className="text-sm text-muted">**** {payment.last_digits}</div>
                          <div className="text-xs text-muted capitalize">{payment.card_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(payment.successful)}`}>
                            {getStatusIcon(payment.successful)}
                            <span className="ml-1">{getStatusName(payment.successful)}</span>
                          </span>
                          <div className="text-xs text-muted mt-1">{payment.response_message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark">{payment.machine_name || 'Sin máquina'}</div>
                          {payment.machine_id && (
                            <div className="text-sm text-muted">ID: {payment.machine_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                          {new Date(payment.date).toLocaleString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination?.meta && (
            <MachineStylePagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={isLoading}
              itemName="pagos"
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
