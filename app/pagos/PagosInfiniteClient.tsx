'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle, XCircle, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MachineStylePagination from '@/components/MachineStylePagination';
import { usePaymentStore } from '@/lib/stores/paymentStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { PaymentFilters } from '@/lib/interfaces/payment.interface';

const createDefaultFilters = (): PaymentFilters => ({
  page: 1,
  limit: 15,
  include: 'machine',
});

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
  } = usePaymentStore();

  // Local UI state - filtros aplicados y borrador
  const [filters, setFilters] = useState<PaymentFilters>(() => createDefaultFilters());
  const [draftFilters, setDraftFilters] = useState<PaymentFilters>(() => createDefaultFilters());

  // Mostrar toast para errores
  useEffect(() => {
    if (error) {
      notify.error(`Error al cargar pagos: ${error}`);
    }
  }, [error]);

  // Load payments when filters change
  useEffect(() => {
    fetchPayments({
      include: 'machine',
      ...filters,
    });
  }, [filters, fetchPayments]);

  const updateDraftFilters = useCallback(<K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K] | '' | null) => {
    setDraftFilters((prev) => {
      const next = { ...prev } as PaymentFilters;

      if (value === '' || value === undefined || value === null) {
        delete next[key];
      } else {
        next[key] = value as PaymentFilters[K];
      }

      return next;
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      page: 1,
      include: 'machine',
    }));
  }, [draftFilters]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = createDefaultFilters();
    setDraftFilters(resetFilters);
    setFilters(resetFilters);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
      include: 'machine',
    }));
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1,
      include: 'machine',
    }));
  }, []);

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

          {/* Filters */}
          <div className="card mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">Filtros de búsqueda</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-muted hover:text-dark"
                  type="button"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-white shadow-sm hover:opacity-90"
                  type="button"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
            <div className="p-6 grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Buscar</label>
                <input
                  type="text"
                  placeholder="Producto, operación, tarjeta..."
                  value={draftFilters.search ?? ''}
                  onChange={(event) => updateDraftFilters('search', event.target.value || undefined)}
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <select
                  value={draftFilters.successful === true ? 'success' : draftFilters.successful === false ? 'failed' : 'all'}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === 'success') {
                      updateDraftFilters('successful', true);
                    } else if (value === 'failed') {
                      updateDraftFilters('successful', false);
                    } else {
                      updateDraftFilters('successful', undefined);
                    }
                  }}
                  className="input"
                >
                  <option value="all">Todos</option>
                  <option value="success">Exitosos</option>
                  <option value="failed">Fallidos</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">ID de máquina</label>
                <input
                  type="number"
                  placeholder="Ej: 42"
                  value={draftFilters.machine_id ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    const parsed = value ? Number(value) : undefined;
                    updateDraftFilters('machine_id', Number.isNaN(parsed) ? undefined : parsed ?? undefined);
                  }}
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Marca de tarjeta</label>
                <input
                  type="text"
                  placeholder="Ej: Visa"
                  value={draftFilters.card_brand ?? ''}
                  onChange={(event) => updateDraftFilters('card_brand', event.target.value || undefined)}
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Tipo de tarjeta</label>
                <input
                  type="text"
                  placeholder="Crédito, débito..."
                  value={draftFilters.card_type ?? ''}
                  onChange={(event) => updateDraftFilters('card_type', event.target.value || undefined)}
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Desde</label>
                <input
                  type="date"
                  value={draftFilters.date_from ?? ''}
                  onChange={(event) => updateDraftFilters('date_from', event.target.value || undefined)}
                  className="input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Hasta</label>
                <input
                  type="date"
                  value={draftFilters.date_to ?? ''}
                  onChange={(event) => updateDraftFilters('date_to', event.target.value || undefined)}
                  className="input"
                />
              </div>
            </div>
          </div>

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
