'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Monitor, Plus, Edit, Trash2, Eye, Loader2, AlertCircle, MapPin, Package, RefreshCw } from 'lucide-react';
import { PageLayout, DataTable, FilterBar, ConfirmActionDialog, UnifiedPagination, StatusBadge } from '@/components/ui-custom';
import type { ColumnDef } from '@/components/ui-custom';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMachineStore } from '@/lib/stores/machineStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { MachineAdapter } from '@/lib/adapters/machine.adapter';
import type { Machine } from '@/lib/interfaces/machine.interface';

const STATUS_FILTER_VALUES = ['online', 'offline'] as const;
type MachineStatusFilter = '' | (typeof STATUS_FILTER_VALUES)[number];
const STATUS_FILTER_SET = new Set<string>(STATUS_FILTER_VALUES);

function machineStatusToVariant(status: string): 'success' | 'error' | 'default' {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'error';
  return 'default';
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
    machines,
    isLoading,
    error,
    fetchMachines,
    refreshMachines,
    setFilters,
    clearError,
    deleteMachine,
    isDeleting,
    deleteError,
    clearDeleteError,
    pagination,
    currentFilters,
  } = useMachineStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MachineStatusFilter>(statusParamValue);
  const [typeFilter, setTypeFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    machineId: number | string | null;
    machineName: string;
  }>({ isOpen: false, machineId: null, machineName: '' });

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
      page: 1,
      limit: 20,
    };
    setFilters(filters);
    fetchMachines(filters);
  }, [debouncedSearch, statusFilter, typeFilter, fetchMachines, setFilters]);

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
    setDebouncedSearch('');
    router.replace('/maquinas', { scroll: false });
  };

  const hasFilters = !!(searchTerm || statusFilter || typeFilter);

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Limpiar filtros
        </Button>
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
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-dark">{m.name}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (m) => (
        <StatusBadge
          label={MachineAdapter.getStatusText(m.status)}
          variant={machineStatusToVariant(m.status)}
        />
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
      key: 'creada',
      header: 'Creada',
      cell: (m) => <span className="text-sm text-muted">{new Date(m.created_at).toLocaleString('es-ES')}</span>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (m) => (
        <StatusBadge
          label={m.type?.toUpperCase() === 'PULSES' ? 'PULSOS' : m.type || '-'}
          variant="default"
        />
      ),
    },
    {
      key: 'actions',
      header: <span className="text-right block">Acciones</span>,
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
              <Link href={`/maquinas/${m.id}/slots`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-purple-600 hover:bg-gray-100 transition-colors">
                <Package className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Gestionar Slots</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/maquinas/${m.id}/editar`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-gray-100 transition-colors">
                <Edit className="h-4 w-4" />
              </Link>
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
      actions={
        <div className="flex items-center space-x-3">
          <Button
            className="flex items-center gap-2 font-semibold shadow-sm bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900"
            disabled={isLoading}
            onClick={() => refreshMachines()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Actualizar</span>
              </>
            )}
          </Button>
          <Button asChild className="btn-primary flex items-center gap-2 font-semibold shadow-sm">
            <Link href="/maquinas/nueva">
              <Plus className="h-4 w-4" />
              <span>Nueva Máquina</span>
            </Link>
          </Button>
        </div>
      }
    >
      {error && machines.length > 0 && (
        <div className="card p-4 bg-red-50 border border-red-200 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={() => window.location.reload()} className="ml-auto btn-secondary text-sm">Reintentar</button>
          </div>
        </div>
      )}

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o ubicación..."
        filters={filterControls}
      />

      {/* Vista móvil: tarjetas */}
      <div className="sm:hidden space-y-3">
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
              <Link href="/maquinas/nueva" className="btn-primary mt-4 text-sm">Crear primera máquina</Link>
            )}
          </div>
        ) : (
          filteredMachines.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">{m.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge
                    label={MachineAdapter.getStatusText(m.status)}
                    variant={machineStatusToVariant(m.status)}
                  />
                  <StatusBadge
                    label={m.type?.toUpperCase() === 'PULSES' ? 'PULSOS' : m.type || '-'}
                    variant="default"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/maquinas/${m.id}`}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-primary hover:bg-blue-50 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Ver</span>
                </Link>
                <Link
                  href={`/maquinas/${m.id}/slots`}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Slots</span>
                </Link>
                <Link
                  href={`/maquinas/${m.id}/editar`}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Editar</span>
                </Link>
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteDialog({ isOpen: true, machineId: m.id, machineName: m.name })}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Eliminar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden sm:block">
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
              <Link href="/maquinas/nueva" className="btn-primary">Crear primera máquina</Link>
            ) : undefined
          }
          title="Máquinas"
          count={filteredMachines.length}
          keyExtractor={(m) => m.id}
        />
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
