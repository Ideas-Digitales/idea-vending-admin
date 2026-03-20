'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Monitor, Plus, Edit, Trash2, Eye, Loader2, AlertCircle, MapPin,
  LayoutGrid, LayoutList, AlertTriangle, ChevronDown, BarChart2, CreditCard,
} from 'lucide-react';
import { EditMaquinaModal } from '@/components/modals/EditMaquinaModal';
import { CreateMaquinaModal } from '@/components/modals/CreateMaquinaModal';
import { PageLayout, DataTable, FilterBar, ConfirmActionDialog, UnifiedPagination, StatusBadge } from '@/components/ui-custom';
import type { ColumnDef } from '@/components/ui-custom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMachineStore } from '@/lib/stores/machineStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { MachineAdapter } from '@/lib/adapters/machine.adapter';
import type { Machine } from '@/lib/interfaces/machine.interface';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import type { Step } from '@/components/help/TourRunner';
import { getSlotsAction } from '@/lib/actions/slots';
import { SlotAdapter } from '@/lib/adapters/slot.adapter';
import { useMetricsFilterStore } from '@/lib/stores/metricsFilterStore';
import {
  PeriodSelector, EnterpriseMetricsSelector, MaquinasMetricsPanel,
} from '@/components/metrics';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

const MACHINES_TOUR_STEPS: Step[] = [
  {
    element: '[data-tour="machines-create"]',
    popover: {
      title: 'Registrar máquina',
      description: 'Agrega una nueva máquina al sistema: nombre, ubicación, tipo de protocolo (MDB, MDB-DEX, PULSOS) y empresa asociada.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="machines-filter"]',
    popover: {
      title: 'Filtros y vistas',
      description: '<p>Busca por nombre o ubicación, y filtra por estado o protocolo.</p><p>Con los botones de la derecha puedes cambiar entre <b>vista tabla</b> (más columnas) y <b>vista tarjetas</b> (más visual, con indicador de stock por colores).</p>',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="machines-list"]',
    popover: {
      title: 'Tus máquinas',
      description: '<p>Cada máquina muestra su estado (verde = en línea, rojo = fuera de línea) y el nivel de inventario de sus slots.</p><p>El borde de la tarjeta cambia de color: <b>verde</b> = stock OK, <b>amarillo</b> = algún slot bajo, <b>rojo</b> = offline o vacíos.</p>',
      side: 'top',
    },
  },
  {
    element: '[data-tour="machines-actions"]',
    popover: {
      title: 'Acciones rápidas',
      description: '<p><b>👁 Ver</b> — detalle con inventario, métricas y configuración.</p><p><b>💳 Pagos</b> — historial de transacciones de esa máquina.</p><p><b>✏️ Editar</b> — nombre, ubicación o tipo.</p><p><b>🗑 Eliminar</b> — requiere confirmación.</p>',
      side: 'left',
      align: 'start',
    },
  },
];

const STATUS_FILTER_VALUES = ['online', 'offline'] as const;
type MachineStatusFilter = '' | (typeof STATUS_FILTER_VALUES)[number];
const STATUS_FILTER_SET = new Set<string>(STATUS_FILTER_VALUES);

function machineStatusToVariant(status: string): 'success' | 'error' | 'default' {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'error';
  return 'default';
}

type StockSummary = { total: number; lowCount: number; emptyCount: number };

function StockIndicator({ summary, loading }: { summary?: StockSummary; loading?: boolean }) {
  if (loading) return <div className="h-4 w-10 bg-gray-100 rounded animate-pulse" />;
  if (!summary || summary.total === 0) return <span className="text-xs text-muted">—</span>;
  if (summary.emptyCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        {summary.emptyCount} vacío{summary.emptyCount > 1 ? 's' : ''}
      </span>
    );
  }
  if (summary.lowCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        {summary.lowCount} bajo
      </span>
    );
  }
  return <span className="text-xs text-emerald-600 font-medium">OK · {summary.total} slots</span>;
}

export default function MaquinasInfiniteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParamValue = useMemo<MachineStatusFilter>(() => {
    const param = searchParams?.get('status');
    if (param && STATUS_FILTER_SET.has(param)) return param as MachineStatusFilter;
    return '';
  }, [searchParams]);

  const {
    machines, isLoading, error, fetchMachines, setFilters, clearError,
    deleteMachine, isDeleting, deleteError, clearDeleteError,
    pagination, currentFilters,
  } = useMachineStore();

  const [searchTerm, setSearchTerm]           = useState('');
  const [statusFilter, setStatusFilter]       = useState<MachineStatusFilter>(statusParamValue);
  const [typeFilter, setTypeFilter]           = useState('');
  const [enterpriseFilter, setEnterpriseFilter] = useState<{ id: number | null; name: string | null }>({ id: null, name: null });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode]               = useState<'card' | 'table'>('table');
  const [metricsOpen, setMetricsOpen]         = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean; machineId: number | string | null; machineName: string;
  }>({ isOpen: false, machineId: null, machineName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; machineId: number | string | null }>({
    open: false, machineId: null,
  });
  const [createModal, setCreateModal] = useState(false);

  // Stock lazy loading
  const [stockMap, setStockMap]       = useState<Record<number, StockSummary>>({});
  const [loadingStock, setLoadingStock] = useState<Record<number, boolean>>({});
  const fetchedMachineIdsRef           = useRef<Set<number>>(new Set());

  // Metrics filter
  const { selectedEnterpriseId, period, setPeriod } = useMetricsFilterStore();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setStatusFilter((prev) => (prev === statusParamValue ? prev : statusParamValue));
  }, [statusParamValue]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  useEffect(() => {
    const filters = {
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      enterprise_id: enterpriseFilter.id ?? undefined,
      page: 1,
      limit: 20,
    };
    setFilters(filters);
    fetchMachines(filters);
  }, [debouncedSearch, statusFilter, typeFilter, enterpriseFilter.id, fetchMachines, setFilters]);

  useEffect(() => {
    clearError();
    clearDeleteError();
  }, [clearError, clearDeleteError]);

  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const matchesSearch =
        !searchTerm ||
        machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || machine.status === statusFilter;
      const matchesType = !typeFilter || machine.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [machines, searchTerm, statusFilter, typeFilter]);

  // Lazy-load slot stock for each visible machine
  useEffect(() => {
    const toFetch = filteredMachines.filter(m => !fetchedMachineIdsRef.current.has(m.id));
    if (toFetch.length === 0) return;

    toFetch.forEach(m => {
      fetchedMachineIdsRef.current.add(m.id);
      setLoadingStock(prev => ({ ...prev, [m.id]: true }));
      getSlotsAction(m.id)
        .then(res => {
          if (res.success && res.slots) {
            const slots = res.slots;
            setStockMap(prev => ({
              ...prev,
              [m.id]: {
                total:      slots.length,
                lowCount:   slots.filter(s => SlotAdapter.isLowStock(s)).length,
                emptyCount: slots.filter(s => SlotAdapter.isEmpty(s)).length,
              },
            }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingStock(prev => ({ ...prev, [m.id]: false })));
    });
  }, [filteredMachines]);

  const handlePageChange = useCallback(
    async (page: number) => {
      const newFilters = { ...currentFilters, page };
      setFilters(newFilters);
      await fetchMachines(newFilters);
    },
    [currentFilters, setFilters, fetchMachines]
  );

  const handlePageSizeChange = useCallback(
    async (limit: number) => {
      const newFilters = { ...currentFilters, page: 1, limit };
      setFilters(newFilters);
      await fetchMachines(newFilters);
    },
    [currentFilters, setFilters, fetchMachines]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.machineId) return;
    try {
      const success = await deleteMachine(deleteDialog.machineId);
      if (success) {
        notify.success('Máquina eliminada exitosamente');
        setDeleteDialog({ isOpen: false, machineId: null, machineName: '' });
      } else {
        notify.error(deleteError || 'Error al eliminar máquina');
      }
    } catch {
      notify.error('Error inesperado al eliminar máquina');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setEnterpriseFilter({ id: null, name: null });
    setDebouncedSearch('');
    router.replace('/maquinas', { scroll: false });
  };

  const hasFilters = !!(searchTerm || statusFilter || typeFilter || enterpriseFilter.id);

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      {/* Filtro de empresa */}
      <div className="w-full sm:w-56">
        <EnterpriseSearchInput
          selectedEnterpriseId={enterpriseFilter.id}
          onEnterpriseSelect={(e: Enterprise | null) => {
            setEnterpriseFilter({ id: e?.id ?? null, name: e?.name ?? null });
          }}
          placeholder="Todas las empresas"
          compact
        />
      </div>

      <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v as MachineStatusFilter)}>
        <SelectTrigger className="w-full sm:w-[180px] h-11 bg-white border-2 border-gray-200 rounded-xl shadow-sm text-sm">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="online">En línea</SelectItem>
          <SelectItem value="offline">Fuera de línea</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-full sm:w-[160px] h-11 bg-white border-2 border-gray-200 rounded-xl shadow-sm text-sm">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="MDB-DEX">MDB-DEX</SelectItem>
          <SelectItem value="MDB">MDB</SelectItem>
          <SelectItem value="PULSES">PULSOS</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
      )}
    </div>
  );

  const columns: ColumnDef<Machine>[] = [
    {
      key: 'id',
      header: 'ID',
      cell: (m) => <span className="text-sm font-medium text-dark">{m.id}</span>,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (m) => (
        <Link href={`/maquinas/${m.id}`} className="flex items-center group cursor-pointer">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3 shrink-0">
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-dark group-hover:text-primary transition-colors">{m.name}</span>
        </Link>
      ),
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      cell: (m) => (
        <div className="flex items-start">
          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-dark whitespace-pre-line">{m.location}</span>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (m) => (
        <StockIndicator summary={stockMap[m.id]} loading={loadingStock[m.id]} />
      ),
    },
    {
      key: 'tipo',
      header: (
        <div className="flex items-center gap-1">
          Tipo
          <HelpTooltip text="MDB: protocolo estándar para máquinas expendedoras. MDB-DEX: incluye interfaz DEX para auditoría avanzada. PULSOS: control mediante señales eléctricas." side="top" />
        </div>
      ),
      cell: (m) => (
        <StatusBadge
          label={m.type?.toUpperCase() === 'PULSES' ? 'PULSOS' : m.type || '-'}
          variant="default"
        />
      ),
    },
    {
      key: 'actions',
      header: <span data-tour="machines-actions" className="text-right block">Acciones</span>,
      cell: (m) => (
        <div className="flex items-center justify-end space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/maquinas/${m.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary hover:bg-gray-100 transition-colors">
                <Eye className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Ver detalles</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/pagos?machine_id=${m.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-purple-600 hover:bg-gray-100 transition-colors">
                <CreditCard className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Ver pagos</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setEditModal({ open: true, machineId: m.id })}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-gray-100 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:bg-gray-100"
                disabled={isDeleting}
                onClick={() => setDeleteDialog({ isOpen: true, machineId: m.id, machineName: m.name })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <PageLayout
      icon={Monitor}
      title="Gestión de Máquinas"
      subtitle="Monitoreo y administración de máquinas expendedoras"
      requiredPermissions={['machines.read.all', 'machines.read.enterprise_owned']}
      permissionMatch="any"
      tourSteps={MACHINES_TOUR_STEPS}
      actions={
        <div data-tour="machines-create">
          <Button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Nueva Máquina</span>
          </Button>
        </div>
      }
    >
      {/* ── Panel de métricas colapsable ── */}
      <div className="card overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setMetricsOpen(p => !p)}
          className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-dark">Métricas de máquinas</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${metricsOpen ? 'rotate-180' : ''}`} />
        </button>
        {metricsOpen && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <EnterpriseMetricsSelector />
              <PeriodSelector period={period} onChange={setPeriod} variant="light" />
            </div>
            <MaquinasMetricsPanel enterpriseId={selectedEnterpriseId} period={period} />
          </div>
        )}
      </div>

      {error && machines.length > 0 && (
        <div className="card p-4 bg-red-50 border border-red-200 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={() => window.location.reload()} className="ml-auto btn-secondary text-sm">Reintentar</button>
          </div>
        </div>
      )}

      <div data-tour="machines-filter">
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre o ubicación..."
          filters={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {filterControls}
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden ml-auto">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  title="Vista tabla"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  title="Vista tarjetas"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          }
        />
      </div>

      <div data-tour="machines-list">

        {/* Vista tarjetas */}
        <div className={viewMode === 'card' ? '' : 'hidden'}>
          {isLoading && machines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Cargando máquinas...</p>
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Monitor className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium text-dark">No hay máquinas</p>
              <p className="text-xs text-muted mt-1">
                {hasFilters ? 'No coincide con los filtros aplicados.' : 'Aún no hay máquinas registradas.'}
              </p>
              {!hasFilters && (
                <button onClick={() => setCreateModal(true)} className="btn-primary mt-4 text-sm">Crear primera máquina</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMachines.map((m) => {
                const isOnline = m.status === 'online';
                const summary  = stockMap[m.id];
                const hasAlert = summary && (summary.emptyCount > 0 || summary.lowCount > 0);
                const borderCls = isOnline
                  ? hasAlert
                    ? 'border-amber-200 ring-1 ring-amber-50'
                    : 'border-emerald-200 ring-1 ring-emerald-50'
                  : 'border-red-200 ring-1 ring-red-50';
                return (
                  <div key={m.id} className={`bg-white rounded-xl border p-3.5 hover:shadow-md transition-all duration-200 ${borderCls}`}>
                    {/* Header: icon + name + status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isOnline ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          <Monitor className={`h-4 w-4 ${isOnline ? 'text-emerald-600' : 'text-red-500'}`} />
                        </div>
                        <p className="text-sm font-semibold text-dark truncate leading-tight">{m.name}</p>
                      </div>
                      <StatusBadge
                        label={MachineAdapter.getStatusText(m.status)}
                        variant={machineStatusToVariant(m.status)}
                      />
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-muted mb-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>

                    {/* Type + ID */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-muted bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                        {m.type?.toUpperCase() === 'PULSES' ? 'PULSOS' : m.type || '—'}
                      </span>
                      <span className="text-[10px] text-muted">ID: {m.id}</span>
                    </div>

                    {/* Stock */}
                    <div className="pb-3 mb-3 border-b border-gray-100">
                      <StockIndicator summary={summary} loading={loadingStock[m.id]} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                      <Link
                        href={`/maquinas/${m.id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg bg-primary/8 text-primary hover:bg-primary/15 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Link>
                      <Link
                        href={`/pagos?machine_id=${m.id}`}
                        title="Ver pagos"
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setEditModal({ open: true, machineId: m.id })}
                        title="Editar"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        disabled={isDeleting}
                        onClick={() => setDeleteDialog({ isOpen: true, machineId: m.id, machineName: m.name })}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vista tabla */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredMachines}
              isLoading={isLoading && machines.length === 0}
              emptyIcon={Monitor}
              emptyTitle="No hay máquinas"
              emptyMessage={
                hasFilters
                  ? 'No se encontraron máquinas que coincidan con los filtros aplicados.'
                  : 'Aún no hay máquinas registradas en el sistema.'
              }
              emptyAction={
                !hasFilters ? (
                  <button onClick={() => setCreateModal(true)} className="btn-primary">Crear primera máquina</button>
                ) : undefined
              }
              title="Máquinas"
              count={filteredMachines.length}
              keyExtractor={(m) => m.id}
            />
          </div>
        )}

      </div>

      {pagination?.meta && (
        <div className="mt-6">
          <UnifiedPagination
            meta={pagination.meta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
            itemName="máquinas"
          />
        </div>
      )}

      <CreateMaquinaModal
        open={createModal}
        onOpenChange={setCreateModal}
        onCreated={() => fetchMachines({ ...currentFilters, page: 1 })}
      />

      <EditMaquinaModal
        open={editModal.open}
        onOpenChange={(open) => setEditModal(prev => ({ ...prev, open }))}
        machineId={editModal.machineId}
        onSaved={() => fetchMachines({ ...currentFilters })}
      />

      <ConfirmActionDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ isOpen: false, machineId: null, machineName: '' });
            clearDeleteError();
          }
        }}
        title="Eliminar Máquina"
        description={`¿Estás seguro de que deseas eliminar la máquina "${deleteDialog.machineName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="danger"
      />
    </PageLayout>
  );
}
