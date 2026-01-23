'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Activity,
  Tag,
  CircleDollarSign,
  Hash,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MachineStylePagination from '@/components/MachineStylePagination';
import { usePaymentStore } from '@/lib/stores/paymentStore';
import { notify } from '@/lib/adapters/notification.adapter';
import { PaymentFilters, type Payment } from '@/lib/interfaces/payment.interface';
import { type Machine } from '@/lib/interfaces/machine.interface';
import { useRealtimePayments, type RealtimePaymentStatus } from '@/lib/hooks/useRealtimePayments';
import { getEnterprisesAction } from '@/lib/actions/enterprise';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';
import { getMachinesAction } from '@/lib/actions/machines';
import PaymentDetailModal from './PaymentDetailModal';

const createDefaultFilters = (): PaymentFilters => ({
  page: 1,
  limit: 15,
  include: 'machine',
});

const DEFAULT_REALTIME_RETENTION_MS = 60_000;
const REALTIME_HIGHLIGHT_MAX = 100;
const LIVE_SCROLL_CHUNK = 20;
const LIVE_SCROLL_THRESHOLD = 64;
const LIVE_RETENTION_OPTIONS = [
  { label: '30 segundos', value: 30_000 },
  { label: '60 segundos', value: 60_000 },
  { label: '2 minutos', value: 120_000 },
  { label: '5 minutos', value: 300_000 },
];

const toDateISO = (value: string, options?: { endOfDay?: boolean }): string | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return undefined;

  const date = new Date();
  date.setFullYear(year, month - 1, day);
  if (options?.endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const normalizeFiltersForQuery = (filters: PaymentFilters): PaymentFilters => {
  const normalized: PaymentFilters = {
    ...filters,
    page: 1,
    include: 'machine',
  };

  normalized.date_from = filters.date_from ? toDateISO(filters.date_from, { endOfDay: false }) : undefined;
  normalized.date_to = filters.date_to ? toDateISO(filters.date_to, { endOfDay: true }) : undefined;

  return normalized;
};

interface RealtimeHighlightRow {
  key: string;
  payment: Payment;
  receivedAt: number;
}

const openNativeDatePicker = (event: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
  const isTrusted = (event.nativeEvent as Event | undefined)?.isTrusted ?? true;
  if (!isTrusted) {
    return;
  }

  const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
    } catch (error) {
      console.warn('No se pudo abrir el selector de fecha:', error);
    }
  }
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 text-gray-600">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{label}</span>
      <span className="text-xs text-gray-700 break-words">{value ?? 'N/D'}</span>
    </div>
  );
}

function formatPaymentDate(payment: Payment) {
  const rawDate = payment.date ?? payment.created_at ?? payment.updated_at;
  if (!rawDate) {
    return 'Sin fecha';
  }
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin fecha';
  }
  return parsed.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

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
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isLoadingEnterprises, setIsLoadingEnterprises] = useState(true);
  const [enterpriseError, setEnterpriseError] = useState<string | null>(null);
  const [machineOptions, setMachineOptions] = useState<Machine[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(true);
  const [machineError, setMachineError] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [realtimeHighlights, setRealtimeHighlights] = useState<RealtimeHighlightRow[]>([]);
  const [liveVisibleCount, setLiveVisibleCount] = useState(LIVE_SCROLL_CHUNK);
  const liveScrollRef = useRef<HTMLDivElement | null>(null);
  const [liveRetentionMs, setLiveRetentionMs] = useState(DEFAULT_REALTIME_RETENTION_MS);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPaymentEnterpriseName, setSelectedPaymentEnterpriseName] = useState<string | null>(null);

  const realtimeMachineId = filters.machine_id ?? undefined;
  const realtimeEnterpriseId = filters.enterprise_id ?? undefined;
  const shouldAutoConnect = Boolean(realtimeEnterpriseId);

  const {
    status: realtimeStatus,
    isConnected: isRealtimeConnected,
    lastError: realtimeError,
    lastEvent,
    lastEventReceivedAt,
    hasCredentials: hasRealtimeCredentials,
    connect: connectRealtime,
    disconnect: disconnectRealtime,
  } = useRealtimePayments({
    autoConnect: shouldAutoConnect,
    showToast: false,
    machineId: realtimeMachineId,
    enterpriseId: realtimeEnterpriseId,
  });

  useEffect(() => {
    let isMounted = true;

    const loadEnterprises = async () => {
      try {
        const response = await getEnterprisesAction({ limit: 100 });
        if (!isMounted) return;

        if (response.success && response.enterprises) {
          setEnterprises(response.enterprises);
          setEnterpriseError(null);
        } else {
          setEnterprises([]);
          setEnterpriseError(response.error ?? 'No se pudieron cargar las empresas');
        }
      } catch (error) {
        console.error('Error al cargar empresas para pagos:', error);
        if (!isMounted) return;
        setEnterpriseError('Error al cargar empresas');
      } finally {
        if (isMounted) {
          setIsLoadingEnterprises(false);
        }
      }
    };

    loadEnterprises();

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    const loadMachines = async () => {
      setIsLoadingMachines(true);
      try {
        const response = await getMachinesAction({
          limit: 50,
          enterprise_id: filters.enterprise_id ?? undefined,
        });

        if (!isMounted) return;

        if (response.success && response.machines) {
          setMachineOptions(response.machines);
          setMachineError(null);
        } else {
          setMachineOptions([]);
          setMachineError(response.error ?? 'Error al cargar máquinas');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error al cargar máquinas para pagos:', error);
        setMachineOptions([]);
        setMachineError('Error al cargar máquinas');
      } finally {
        if (isMounted) {
          setIsLoadingMachines(false);
        }
      }
    };

    loadMachines();

    return () => {
      isMounted = false;
    };
  }, [filters.enterprise_id]);

  const updateDraftFilters = useCallback(<K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K] | '' | null) => {
    setDraftFilters((prev) => {
      const next = { ...prev } as PaymentFilters;

      if (value === '' || value === undefined || value === null) {
        delete next[key];
      } else {
        next[key] = value as PaymentFilters[K];
      }

      const normalized = normalizeFiltersForQuery(next);
      setFilters(normalized);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    const resetFilters = createDefaultFilters();
    setDraftFilters(resetFilters);
    setFilters(normalizeFiltersForQuery(resetFilters));
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

  const realtimeStatusMap: Record<RealtimePaymentStatus, { label: string; className: string }> = useMemo(
    () => ({
      connected: {
        label: 'Tiempo real activo',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm',
      },
      connecting: {
        label: 'Conectando a tiempo real...',
        className: 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm',
      },
      disconnected: {
        label: 'Tiempo real desconectado',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm',
      },
      idle: {
        label: 'Tiempo real en espera',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      },
      disabled: {
        label: hasRealtimeCredentials ? 'Tiempo real deshabilitado' : 'Sin credenciales MQTT',
        className: hasRealtimeCredentials
          ? 'bg-gray-100 text-gray-700 border-gray-200'
          : 'bg-gray-100 text-gray-500 border-gray-200',
      },
    }),
    [hasRealtimeCredentials]
  );

  const needsEnterpriseSelection = !realtimeEnterpriseId;
  const realtimeDescriptor = needsEnterpriseSelection
    ? {
        label: 'Selecciona una empresa para activar tiempo real',
        className: 'bg-gray-100 text-gray-500 border-gray-200',
      }
    : realtimeStatusMap[realtimeStatus] ?? realtimeStatusMap.idle;

  const handleRealtimeToggle = () => {
    if (!hasRealtimeCredentials) return;
    if (needsEnterpriseSelection) {
      notify.error('Selecciona una empresa para quedar a la escucha de sus topics.');
      return;
    }
    if (isRealtimeConnected) {
      disconnectRealtime();
    } else {
      connectRealtime();
    }
  };

  const realtimeButtonLabel = needsEnterpriseSelection
    ? 'Selecciona una empresa'
    : isRealtimeConnected
      ? 'Detener tiempo real'
      : 'Reconectar tiempo real';

  const liveModeButtonLabel = isLiveMode ? 'Salir de modo en vivo' : 'Modo en vivo';

  const realtimeButtonColors = needsEnterpriseSelection
    ? 'bg-white/10 text-white/50 border-white/30 cursor-not-allowed'
    : isRealtimeConnected
      ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400 shadow-sm shadow-emerald-900/20'
      : 'bg-blue-500 text-white border-blue-400 hover:bg-blue-400 shadow-sm shadow-blue-900/20';

  const liveModeButtonColors = isLiveMode
    ? 'bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-400 shadow-sm shadow-indigo-900/20'
    : 'bg-white/15 text-white border-white/30 hover:bg-white/25 backdrop-blur';

  const refreshButtonColors = 'bg-white/10 text-white border-white/25 hover:bg-white/20 backdrop-blur';

  const formatRealtimeTimestamp = (timestamp?: string | null) => {
    if (!timestamp) return 'Hace instantes';
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  useEffect(() => {
    if (!lastEvent) return;

    const key = lastEvent.id?.toString() ?? lastEvent.operation_number ?? `temp-${Date.now()}`;
    setRealtimeHighlights((prev) => {
      const filtered = prev.filter((item) => item.key !== key);
      const next = [
        {
          key,
          payment: lastEvent,
          receivedAt: Date.now(),
        },
        ...filtered,
      ];
      return next.slice(0, REALTIME_HIGHLIGHT_MAX);
    });
    setLiveVisibleCount((prev) => Math.min(Math.max(prev, LIVE_SCROLL_CHUNK), REALTIME_HIGHLIGHT_MAX));
  }, [lastEvent, lastEventReceivedAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeHighlights((prev) => prev.filter((item) => Date.now() - item.receivedAt < liveRetentionMs));
    }, 5_000);
    return () => clearInterval(interval);
  }, [liveRetentionMs]);

  useEffect(() => {
    setRealtimeHighlights((prev) => prev.filter((item) => Date.now() - item.receivedAt < liveRetentionMs));
  }, [liveRetentionMs]);

  useEffect(() => {
    setLiveVisibleCount((prev) => {
      if (realtimeHighlights.length === 0) {
        return LIVE_SCROLL_CHUNK;
      }
      const nextBase = Math.max(LIVE_SCROLL_CHUNK, prev);
      return Math.min(nextBase, realtimeHighlights.length);
    });
  }, [realtimeHighlights.length]);

  const handleLiveScroll = useCallback(() => {
    const container = liveScrollRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - LIVE_SCROLL_THRESHOLD;

    if (!isNearBottom) return;

    setLiveVisibleCount((prev) => {
      if (prev >= realtimeHighlights.length) {
        return prev;
      }
      return Math.min(prev + LIVE_SCROLL_CHUNK, realtimeHighlights.length);
    });
  }, [realtimeHighlights.length]);

  const realtimeHighlightKeys = useMemo(
    () =>
      realtimeHighlights.map((item) => item.payment.id?.toString() ?? item.payment.operation_number ?? item.key),
    [realtimeHighlights],
  );

  const displayedPayments = useMemo(() => {
    if (realtimeHighlightKeys.length === 0) {
      return payments;
    }
    return payments.filter((payment) => {
      const key = payment.id?.toString() ?? payment.operation_number ?? '';
      if (!key) return true;
      return !realtimeHighlightKeys.includes(key);
    });
  }, [payments, realtimeHighlightKeys]);

  const liveVisibleHighlights = useMemo(
    () => realtimeHighlights.slice(0, liveVisibleCount),
    [realtimeHighlights, liveVisibleCount],
  );

  const hasReachedLiveLimit = realtimeHighlights.length >= REALTIME_HIGHLIGHT_MAX;
  const liveRetentionLabel = useMemo(() => {
    const option = LIVE_RETENTION_OPTIONS.find((opt) => opt.value === liveRetentionMs);
    if (option) return option.label;
    if (liveRetentionMs >= 60_000) {
      return `${Math.round(liveRetentionMs / 60_000)} minutos`;
    }
    return `${Math.round(liveRetentionMs / 1_000)} segundos`;
  }, [liveRetentionMs]);

  const handleLiveEnterpriseChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setDraftFilters((prev) => ({
        ...prev,
        enterprise_id: value ? Number(value) : undefined,
      }));
      setFilters((prev) => ({
        ...prev,
        enterprise_id: value ? Number(value) : undefined,
        include: 'machine',
        page: 1,
      }));
    },
    [],
  );

  const handleLiveRetentionChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    setLiveRetentionMs(value);
  }, []);

  const toggleExpandedPayment = useCallback((paymentKey: string) => {
    setExpandedPaymentId((current) => (current === paymentKey ? null : paymentKey));
  }, []);

  const openPaymentDetail = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    if (payment.enterprise_id && enterprises.length > 0) {
      const enterprise = enterprises.find((entry) => entry.id === payment.enterprise_id);
      setSelectedPaymentEnterpriseName(enterprise?.name ?? null);
    } else {
      setSelectedPaymentEnterpriseName(null);
    }
  }, [enterprises]);

  const closePaymentDetail = useCallback(() => {
    setSelectedPayment(null);
    setSelectedPaymentEnterpriseName(null);
  }, []);

  // No statistics needed - removed cards

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
                  onClick={() => setIsLiveMode((prev) => !prev)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm border rounded-lg transition ${liveModeButtonColors} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Activity className={`h-4 w-4 ${isLiveMode ? 'text-white' : 'text-gray-500'}`} />
                  <span>{liveModeButtonLabel}</span>
                </button>
                <button
                  onClick={refreshPayments}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg border transition ${refreshButtonColors} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto flex flex-col">
          {realtimeError && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-900">Tiempo real desconectado</h3>
                  <p className="text-sm text-amber-800 mt-1">{realtimeError}</p>
                </div>
                {hasRealtimeCredentials && (
                  <button
                    onClick={connectRealtime}
                    className="ml-3 text-amber-900 hover:text-amber-950 text-sm font-medium"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          )}

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

          {isLiveMode ? (
            <div className="card mb-6 flex flex-col flex-1">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-dark">Operaciones en tiempo real</h3>
                <span className="text-xs font-medium text-blue-700">
                  {realtimeHighlights.length} activo{realtimeHighlights.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                <aside className="lg:w-80 xl:w-96 flex-shrink-0 border-r border-blue-100 bg-white/70 p-5 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-blue-800">Empresa en escucha</label>
                    {isLoadingEnterprises ? (
                      <div className="input flex items-center text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cargando empresas...
                      </div>
                    ) : enterpriseError ? (
                      <div className="text-xs text-red-600">{enterpriseError}</div>
                    ) : (
                      <select
                        value={filters.enterprise_id ?? ''}
                        onChange={handleLiveEnterpriseChange}
                        className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      >
                        <option value="">Selecciona una empresa</option>
                        {enterprises.map((enterprise) => (
                          <option key={enterprise.id} value={enterprise.id}>
                            {enterprise.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-blue-800">Persistencia de eventos</label>
                    <select
                      value={liveRetentionMs}
                      onChange={handleLiveRetentionChange}
                      className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                    >
                      {LIVE_RETENTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-muted">
                      Los pagos se ocultarán tras {liveRetentionLabel.toLowerCase()} sin recibir nuevos eventos.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">Tiempo real</p>
                      <p className="text-sm text-gray-600 leading-snug">
                        Controla la suscripción MQTT en vivo
                      </p>
                    </div>
                    <button
                      onClick={handleRealtimeToggle}
                      disabled={realtimeStatus === 'connecting' || needsEnterpriseSelection || !hasRealtimeCredentials}
                      className={`w-full inline-flex items-center justify-center gap-2 h-10 text-sm rounded-lg border transition ${realtimeButtonColors} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <RefreshCw className={`h-4 w-4 ${realtimeStatus === 'connecting' ? 'animate-spin' : ''}`} />
                      <span>{realtimeButtonLabel}</span>
                    </button>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Último evento</span>
                      <span className="font-semibold text-gray-900">{formatRealtimeTimestamp(lastEventReceivedAt)}</span>
                    </div>
                  </div>
                </aside>
                <div
                  ref={liveScrollRef}
                  onScroll={handleLiveScroll}
                  className="flex-1 min-h-0 overflow-y-auto p-4 bg-gradient-to-b from-blue-50/70 to-white"
                >
                  <div className="flex flex-col gap-3">
                    {realtimeHighlights.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted">
                        No hay operaciones en vivo en este momento.
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {liveVisibleHighlights.map(({ key, payment }) => {
                          const alignment = payment.successful
                            ? 'self-start items-start mr-auto'
                            : 'self-end items-end ml-auto';
                          const bubbleColors = payment.successful
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900';
                          const paymentKey = payment.id?.toString() ?? payment.operation_number ?? key;
                          const isExpanded = expandedPaymentId === paymentKey;

                          return (
                            <motion.div
                              key={key}
                              layout
                              initial={{ opacity: 0, y: 12, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.96 }}
                              transition={{ type: 'spring', stiffness: 240, damping: 24, mass: 0.7 }}
                              className={`flex flex-col w-full md:max-w-xl xl:max-w-2xl ${alignment}`}
                            >
                              <motion.div
                                layout
                                className={`w-full rounded-2xl border px-6 py-4 shadow-sm ${bubbleColors}`}
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                onClick={() => paymentKey && toggleExpandedPayment(paymentKey)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    paymentKey && toggleExpandedPayment(paymentKey);
                                  }
                                }}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-gray-900 space-y-0.5">
                                      <div className="flex items-center gap-1 text-gray-700">
                                        <Hash className="h-3.5 w-3.5 text-gray-500" />
                                        <span>ID {payment.id ?? 'N/D'}</span>
                                      </div>
                                      <p className="text-xs text-gray-600">Operación {payment.operation_number || 'Sin número'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
                                      <Tag className="h-4 w-4 text-gray-500" />
                                      <span>{payment.product ?? 'Producto desconocido'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <CreditCard className="h-4 w-4 text-gray-500" />
                                      <span>
                                        {payment.card_brand ?? 'Sin marca'} · **** {payment.last_digits ?? '0000'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right space-y-1 min-w-[130px]">
                                    <div className="flex items-center justify-end gap-1 text-sm uppercase tracking-wide text-gray-600">
                                      <CircleDollarSign className="h-4 w-4 text-gray-500" />
                                      <span>Monto</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatAmount(payment.amount)}</p>
                                  </div>
                                </div>
                              </motion.div>
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    layout
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="mt-2 w-full md:max-w-xl xl:max-w-2xl"
                                  >
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 text-xs text-gray-600 p-4 space-y-3 shadow-inner">
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <DetailRow label="Respuesta" value={`${payment.response_code} · ${payment.response_message}`} />
                                        <DetailRow label="Autorización" value={payment.authorization_code ?? 'N/D'} />
                                        <DetailRow label="Comercio" value={payment.commerce_code ?? 'N/D'} />
                                        <DetailRow label="Terminal" value={payment.terminal_id ?? 'N/D'} />
                                        <DetailRow label="Tipo tarjeta" value={payment.card_type ?? 'N/D'} />
                                        <DetailRow label="Cuotas" value={payment.shares_number ? `${payment.shares_number}x (${payment.share_type ?? 'sin tipo'})` : 'Pago único'} />
                                        <DetailRow label="Máquina" value={payment.machine_name ?? `ID ${payment.machine_id ?? 'N/D'}`} />
                                        <DetailRow label="Registrado" value={new Date(payment.created_at).toLocaleString('es-CL')} />
                                      </div>
                                      <div className="flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => openPaymentDetail(payment)}
                                          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 transition"
                                        >
                                          Ver detalle completo
                                        </button>
                                      </div>
                                      <div className="text-right text-[11px] text-gray-400">
                                        Última actualización {new Date(payment.updated_at).toLocaleTimeString('es-CL')}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <span className="text-xs text-muted mt-1">
                                {new Date(payment.date).toLocaleTimeString('es-CL')} · {payment.successful ? 'Aprobado' : 'Rechazado'}
                              </span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                    {hasReachedLiveLimit && liveVisibleCount >= realtimeHighlights.length && (
                      <div className="text-center text-xs text-muted pt-2">
                        Has llegado al máximo de {REALTIME_HIGHLIGHT_MAX} operaciones recientes. Pagos más antiguos no se muestran.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="card mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-dark">Filtros de búsqueda</h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-muted hover:text-dark"
                    type="button"
                  >
                    Limpiar filtros
                  </button>
                </div>
                <div className="p-6 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Búsqueda rápida</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-600">Buscar</label>
                      <input
                        type="text"
                        placeholder="Producto, operación, tarjeta..."
                        value={draftFilters.search ?? ''}
                        onChange={(event) => updateDraftFilters('search', event.target.value || undefined)}
                        className="input rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                        className="input rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="all">Todos</option>
                        <option value="success">Exitosos</option>
                        <option value="failed">Rechazados</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Empresa y máquina</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-600">Empresa</label>
                      {isLoadingEnterprises ? (
                        <div className="input rounded-lg border border-gray-300 bg-white px-3 py-2 flex items-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Cargando empresas...
                        </div>
                      ) : (
                        <select
                          value={draftFilters.enterprise_id ?? ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            const parsed = value ? Number(value) : undefined;
                            updateDraftFilters('enterprise_id', Number.isNaN(parsed) ? undefined : parsed ?? undefined);
                          }}
                          className="input rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Todas</option>
                          {enterprises.map((enterprise) => (
                            <option key={enterprise.id} value={enterprise.id}>
                              {enterprise.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-gray-500">
                        Selecciona una empresa para suscribirte a enterprises/{'{enterpriseId}'}/sales.
                      </p>
                      {enterpriseError && <p className="text-xs text-red-600">{enterpriseError}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-600">Máquina</label>
                      <select
                        value={draftFilters.machine_id ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateDraftFilters('machine_id', value ? Number(value) : undefined);
                        }}
                        className="input rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Todas las máquinas</option>
                        {machineOptions.map((machine) => (
                          <option key={machine.id} value={machine.id}>
                            #{machine.id} · {machine.name ?? 'Sin nombre'} ({machine.location ?? 'Sin ubicación'})
                          </option>
                        ))}
                      </select>
                      {isLoadingMachines && <p className="text-xs text-gray-500">Cargando máquinas...</p>}
                      {machineError && <p className="text-xs text-red-600">{machineError}</p>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rango de fechas</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-600">Desde</label>
                        <input
                          type="date"
                          value={draftFilters.date_from ?? ''}
                          onChange={(event) => updateDraftFilters('date_from', event.target.value || undefined)}
                          onClick={openNativeDatePicker}
                          onFocus={openNativeDatePicker}
                          className="input rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-600">Hasta</label>
                        <input
                          type="date"
                          value={draftFilters.date_to ?? ''}
                          onChange={(event) => updateDraftFilters('date_to', event.target.value || undefined)}
                          onClick={openNativeDatePicker}
                          onFocus={openNativeDatePicker}
                          className="input rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Define un rango con precisión para acotar los resultados.</p>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
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
                              {formatPaymentDate(payment)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openPaymentDetail(payment)}
                                className="inline-flex items-center rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5 transition"
                              >
                                Ver detalle
                              </button>
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
            </>
          )}
        </main>
      </div>
      <PaymentDetailModal
        payment={selectedPayment}
        open={Boolean(selectedPayment)}
        onClose={closePaymentDetail}
        enterpriseName={selectedPaymentEnterpriseName}
      />
    </div>
  );
}
