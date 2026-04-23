'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMachineAction, updateMachineAction } from '@/lib/actions/machines';
import { aggregatePaymentsAction, getPaymentsAction } from '@/lib/actions/payments';
import { getProductsAction, createProductAction, getProductAction } from '@/lib/actions/products';
import { Machine } from '@/lib/interfaces/machine.interface';
import type { Payment } from '@/lib/interfaces/payment.interface';
import { useSlotStore } from '@/lib/stores/slotStore';
import { SlotAdapter } from '@/lib/adapters/slot.adapter';
import { Slot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import SlotFormModal from '@/components/slots/SlotFormModal';
import SlotInspectorPanel from '@/components/slots/SlotInspectorPanel';
import {
  Monitor, Wifi, WifiOff, MapPin, Calendar, Activity, Package,
  Shield, RotateCcw, QrCode, TrendingUp, TrendingDown, BarChart2,
  ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Copy, Check, CreditCard,
  Plus, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw,
  Save, X, Info, LayoutGrid, LayoutList, ClipboardList, Printer, Clipboard,
  AlertCircle, Lightbulb, Building2, Tag, Hash, Clock, Settings, Search, Grid3x3, GripVertical,
  ImageIcon,
} from 'lucide-react';
import { useMqttReboot } from '@/lib/hooks/useMqttReboot';
import { PageHeader, ConfirmActionDialog } from '@/components/ui-custom';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import { useUser } from '@/lib/stores/authStore';
import Link from 'next/link';
import { HelpTooltip } from '@/components/help/HelpTooltip';
import { TourRunner, type Step } from '@/components/help/TourRunner';
import { uploadMachineImage, validateImageFile } from '@/lib/utils/imageUpload';
import {
  clp, getPeriodRange, getGroupBy, mapDualAxisData,
  PERIOD_LABELS, type Period,
} from '@/lib/utils/metricsHelpers';
import { SalesDualAxisChart, KpiSkeleton, type SeriesType } from '@/components/metrics/MetricsCharts';
import MachineProductsPanel from '@/components/metrics/MachineProductsPanel';
import PaymentDetailModal from '@/app/(main)/pagos/PaymentDetailModal';
import { EditProductoModal } from '@/components/modals/EditProductoModal';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const MachineQRLabel = dynamic(() => import('@/components/MachineQRLabel'), { ssr: false });

// ── SlotCard ──────────────────────────────────────────────────────────────────
// Diseño unificado: misma estructura que MachineGridView en aplicar-plantilla

type StockLevel = 'disabled' | 'unknown' | 'critical' | 'low' | 'incomplete' | 'full';

const STOCK_COLORS: Record<StockLevel, string> = {
  disabled: 'text-slate-500', unknown: 'text-gray-400', critical: 'text-red-600',
  low: 'text-amber-600', incomplete: 'text-blue-600', full: 'text-emerald-600',
};
const STOCK_BAR_COLORS: Record<StockLevel, string> = {
  disabled: 'bg-slate-400', unknown: 'bg-gray-300', critical: 'bg-red-500',
  low: 'bg-amber-400', incomplete: 'bg-blue-400', full: 'bg-emerald-500',
};
const STOCK_LABELS: Record<StockLevel, string> = {
  disabled: 'Sin control', unknown: 'Sin registrar', critical: 'Crítico',
  low: 'Stock bajo', incomplete: 'Incompleto', full: 'Lleno',
};
const STOCK_URGENCY: Record<StockLevel, number> = {
  disabled: 6, unknown: 5, critical: 0, low: 1, incomplete: 2, full: 3,
};

function slotTracksStock(slot: Slot, machine?: Machine | null): boolean {
  return slot.manage_stock ?? machine?.manage_stock ?? true;
}

function slotStockLevel(slot: Slot, machine?: Machine | null): StockLevel {
  if (!slotTracksStock(slot, machine)) return 'disabled';
  if (slot.capacity === null) return 'unknown';
  if (slot.current_stock === null) return 'unknown';
  const stock = slot.current_stock;
  const cap   = slot.capacity;
  if (cap === 0) return 'unknown';
  if (stock === 0) return 'critical';
  if (SlotAdapter.isFull(slot)) return 'full';
  const pct = stock / cap;
  if (pct < 0.1) return 'critical';
  if (pct < 0.3) return 'low';
  return 'incomplete';
}

function getProductColor(productId: number | string): string {
  const palette = ['#3157b2','#d97706','#16a34a','#dc2626','#7c3aed','#0891b2','#ea580c','#4f46e5'];
  const n = typeof productId === 'number' ? productId : Number(String(productId).replace(/\D/g,'')) || 0;
  return palette[Math.abs(n) % palette.length];
}

function SlotCard({ slot, machine, products, totalColumns, productPickerSlotId, setProductPickerSlotId, onProductChange, onFieldChange, onStockUpdate, onEdit, onDelete, isDragTarget, onDragOver, onDragLeave, onDrop }: {
  slot: Slot;
  machine?: Machine | null;
  products: Producto[];
  totalColumns: number;
  productPickerSlotId: number | null;
  setProductPickerSlotId: (id: number | null) => void;
  onProductChange: (slot: Slot, product: Producto | null) => void;
  onFieldChange: (slot: Slot, field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) => void;
  onStockUpdate: (slot: Slot) => void;
  onEdit: (slot: Slot) => void;
  onDelete: (slot: Slot) => void;
  isDragTarget?: boolean;
  onDragOver?: React.DragEventHandler;
  onDragLeave?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;
}) {
  const tracksStock = slotTracksStock(slot, machine);
  const level       = slotStockLevel(slot, machine);
  const pct         = SlotAdapter.getStockPercentage({ ...slot, manage_stock: tracksStock }) ?? 0;
  const productName = slot.product?.name ?? products.find(p => Number(p.id) === slot.product_id)?.name;
  const isOpen      = productPickerSlotId === slot.id;
  const productColor = productName
    ? getProductColor(slot.product?.id ?? slot.product_id ?? 0)
    : null;

  const borderCls = isDragTarget
    ? 'border-primary/60 bg-primary/5 shadow-sm ring-2 ring-primary/20'
    : level === 'critical'   ? 'border-red-200/80 bg-red-50/10' :
      level === 'low'        ? 'border-amber-200/80 bg-amber-50/10' :
      level === 'incomplete' ? 'border-blue-200/80 bg-white' :
      level === 'disabled'   ? 'border-slate-200/80 bg-slate-50/40' :
      level === 'unknown'    ? 'border-dashed border-gray-200/80 bg-white' :
                               'border-gray-200/80 bg-white';

  const badgeCls =
    level === 'critical'   ? 'bg-red-50 text-red-600 border-red-200' :
    level === 'low'        ? 'bg-amber-50 text-amber-600 border-amber-200' :
    level === 'incomplete' ? 'bg-blue-50 text-blue-600 border-blue-200' :
    level === 'disabled'   ? 'bg-slate-100 text-slate-600 border-slate-200' :
    level === 'unknown'    ? 'bg-gray-100 text-gray-400 border-gray-200' :
                             'bg-emerald-50 text-emerald-600 border-emerald-200';

  return (
    <div
      className={`group relative rounded-xl border-2 flex flex-col items-center gap-1.5 py-2.5 px-2 transition-all hover:shadow-sm ${borderCls}`}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop?.(e); }}
    >
      {/* Acciones — overlay absoluto, solo visible en hover */}
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
        {tracksStock && (
          <button onClick={() => onStockUpdate(slot)} title="Actualizar stock" className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors">
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
        <button onClick={() => onEdit(slot)} title="Editar" className="p-0.5 rounded text-blue-500 hover:bg-blue-50 transition-colors">
          <Edit className="h-3 w-3" />
        </button>
        <button onClick={() => onDelete(slot)} title="Eliminar" className="p-0.5 rounded text-red-400 hover:bg-red-50 transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Badge de estado */}
      <span className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badgeCls}`}>
        {STOCK_LABELS[level]}
      </span>

      {/* Imagen del producto */}
      <div className="w-10 h-10 flex items-center justify-center">
        {slot.product?.image ? (
          <img
            src={slot.product.image}
            alt={slot.product.name}
            className="w-10 h-10 object-contain rounded-md"
          />
        ) : (
          <span className="text-[22px]">📦</span>
        )}
      </div>

      {/* Label */}
      <span className="text-sm font-bold text-[#203c84] text-center leading-tight w-full truncate px-1">
        {slot.label}
      </span>

      {/* Producto — chip con color igual al panel lateral */}
      <div className="relative w-full">
        {isDragTarget ? (
          <div className="w-full flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-lg border border-dashed border-primary/40 text-primary">
            <span className="text-[10px] font-medium">+ soltar aquí</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setProductPickerSlotId(isOpen ? null : slot.id)}
              className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-left transition-all border"
              style={productColor
                ? { borderColor: `${productColor}40`, backgroundColor: `${productColor}10` }
                : { borderStyle: 'dashed', borderColor: '#e5e7eb' }
              }
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: productColor ?? '#d1d5db' }} />
              <span className={`text-[10px] flex-1 truncate ${productName ? 'font-medium text-dark' : 'text-gray-400'}`}>
                {productName ?? '+ asignar'}
              </span>
            </button>
            {isOpen && (
              <SlotInspectorPanel
                slot={slot}
                products={products}
                totalColumns={totalColumns}
                onEditField={(field, value) => onFieldChange(slot, field, value)}
                onAssign={(p) => onProductChange(slot, p)}
                onClose={() => setProductPickerSlotId(null)}
                actions={
                  <>
                    {tracksStock && (
                      <button
                        onClick={() => onStockUpdate(slot)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reponer
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(slot)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(slot)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </>
                }
              />
            )}
          </>
        )}
      </div>

      {/* Barra de stock */}
      {level === 'disabled' ? (
        <div className="w-full bg-slate-100 rounded-full h-1" />
      ) : level === 'unknown' ? (
        <div className="w-full bg-gray-100 rounded-full h-1"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 4px,#e5e7eb 4px,#e5e7eb 8px)' }} />
      ) : slot.capacity !== null && slot.current_stock !== null ? (
        <div className="w-full bg-gray-100 rounded-full h-1">
          <div className={`h-1 rounded-full transition-all ${STOCK_BAR_COLORS[level]}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}

      {/* Pills */}
      <div className="flex flex-wrap items-center gap-1 justify-center w-full">
        <div className="flex items-center gap-0.5 bg-gray-50/80 rounded-md px-1.5 py-0.5">
          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none select-none">MDB</span>
          <span className="text-[10px] font-mono text-gray-400">{slot.mdb_code}</span>
        </div>
        {(tracksStock && (slot.capacity !== null || slot.current_stock !== null)) && (
          <div className={`flex items-center gap-0.5 bg-gray-50/80 rounded-md px-1.5 py-0.5 ${STOCK_COLORS[level]}`}>
            <span className="text-[8px] font-bold uppercase tracking-widest leading-none select-none opacity-60">Stk</span>
            <span className="text-[10px] font-mono font-semibold">
              {level === 'unknown' ? `?/${slot.capacity}` : `${slot.current_stock ?? 0}/${slot.capacity ?? '?'}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Tab = 'pagos' | 'inventario' | 'reposicion' | 'configuracion';
type PaymentSortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

const CARD_TYPE_LABELS: Record<string, string> = { 'CR': 'Crédito', 'DB': 'Débito', 'P ': 'Prepago' };
const CARD_BRAND_LABELS: Record<string, string> = {
  'VI': 'Visa', 'MC': 'Mastercard', 'AX': 'Amex',
  'DC': 'Diners', 'MG': 'Magna', 'DB': 'Redcompra', 'P': '—',
};
function formatCardType(t?: string | null) {
  if (!t) return '';
  return CARD_TYPE_LABELS[t] ?? CARD_TYPE_LABELS[t.trim()] ?? t;
}
function formatCardBrand(b?: string | null) {
  if (!b) return '';
  return CARD_BRAND_LABELS[b.trim()] ?? b;
}

// ── Helpers de estado ─────────────────────────────────────────────────────────
const getStatusColor = (s: string) =>
  s?.toLowerCase() === 'online'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-700 border-red-200';
const getStatusLabel = (s: string) =>
  s?.toLowerCase() === 'online' ? 'En línea' : 'Fuera de línea';

const PAYMENT_SORT_OPTIONS: Array<{ value: PaymentSortOption; label: string }> = [
  { value: 'date_desc', label: 'Más recientes primero' },
  { value: 'date_asc', label: 'Más antiguos primero' },
  { value: 'amount_desc', label: 'Monto mayor a menor' },
  { value: 'amount_asc', label: 'Monto menor a mayor' },
];

function getPaymentSort(sortOption: PaymentSortOption) {
  switch (sortOption) {
    case 'date_asc':
      return [{ field: 'date', direction: 'asc' as const }];
    case 'amount_desc':
      return [{ field: 'amount', direction: 'desc' as const }];
    case 'amount_asc':
      return [{ field: 'amount', direction: 'asc' as const }];
    case 'date_desc':
    default:
      return [{ field: 'date', direction: 'desc' as const }];
  }
}

const MACHINE_DETAIL_TOUR: Step[] = [
  {
    element: '[data-tour="machine-actions"]',
    popover: {
      title: 'Barra de acciones',
      description: '<p>Aquí encuentras el estado actual de la máquina y las acciones rápidas:</p><p>• <b>Estado</b> — indicador en tiempo real (en línea / fuera de línea).</p><p>• <b>QR</b> — genera e imprime el código QR de la máquina.</p><p>• <b>Reiniciar</b> — envía comando de reinicio por MQTT (solo si está en línea).</p>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="machine-tabs"]',
    popover: {
      title: 'Secciones de la máquina',
      description: '<p>• <b>Pagos</b> — métricas de ventas, KPIs y gráfico de tendencias.</p><p>• <b>Productos</b> — gestión de inventario: stock por slot, herramienta de reposición con lista para imprimir o copiar.</p><p>• <b>Configuración</b> — editar nombre, ubicación y ajustes avanzados.</p>',
      side: 'bottom',
    },
  },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function MaquinaDetallePage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const machineId    = params.id as string;
  const user         = useUser();
  const isAdmin      = user?.role === 'admin';

  const activeTab = (searchParams.get('tab') as Tab | null) ?? 'pagos';
  const setTab    = useCallback((tab: Tab) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // ── Máquina ──────────────────────────────────────────────────────────────
  const [machine, setMachine]     = useState<Machine | null>(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isQROpen, setIsQROpen]         = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { rebootMachine, isLoading: rebootLoading, hasCredentials } = useMqttReboot();

  const handleReboot = async () => {
    if (!machine) return;
    if (!window.confirm(`¿Reiniciar la máquina "${machine.name}"?`)) return;
    try { await rebootMachine(machine.id); } catch { /* ignorar */ }
  };

  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    getMachineAction(machineId, { include: 'mqttUser,enterprise' })
      .then(r => {
        if (r.success && r.machine) setMachine(r.machine);
        else setLoadError(r.error || 'Máquina no encontrada');
      })
      .catch(() => setLoadError('Error al cargar la máquina'))
      .finally(() => setLoading(false));
  }, [machineId]);

  // ── Métricas (tab Resumen) ────────────────────────────────────────────────
  const [period, setPeriod]         = useState<Period>('month');
  const [aggCurrent, setAggCurrent] = useState<{ total_amount: number; total_count: number } | null>(null);
  const [aggPrev, setAggPrev]       = useState<{ total_amount: number; total_count: number } | null>(null);
  const [chartData, setChartData]   = useState<{ label: string; tooltipLabel: string; amount: number; count: number }[]>([]);
  const [amountType, setAmountType] = useState<SeriesType>('bar');
  const [countType,  setCountType]  = useState<SeriesType>('line');
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!machineId) return;
    setLoadingMetrics(true);
    setAggCurrent(null); setAggPrev(null); setChartData([]);
    const id = Number(machineId);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const groupBy = getGroupBy(period);
    Promise.all([
      aggregatePaymentsAction({ machine_id: id, start_date: start,     end_date: end,                     successful: true }),
      aggregatePaymentsAction({ machine_id: id, start_date: prevStart, end_date: prevEnd,                  successful: true }),
      aggregatePaymentsAction({ machine_id: id, start_date: start,     end_date: end, group_by: groupBy,  successful: true }),
    ]).then(([curr, prev, chart]) => {
      if (curr.success)  setAggCurrent({ total_amount: curr.total_amount ?? 0, total_count: curr.total_count ?? 0 });
      if (prev.success)  setAggPrev({ total_amount: prev.total_amount ?? 0, total_count: prev.total_count ?? 0 });
      if (chart.success) setChartData(mapDualAxisData(chart.data, groupBy, period));
    }).catch(() => {}).finally(() => setLoadingMetrics(false));
  }, [machineId, period]);

  const totalAmount = aggCurrent?.total_amount ?? 0;
  const totalCount  = aggCurrent?.total_count  ?? 0;
  const avgTicket   = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
  const growthPct   = aggCurrent && aggPrev && aggPrev.total_amount > 0
    ? Math.round(((aggCurrent.total_amount - aggPrev.total_amount) / aggPrev.total_amount) * 100)
    : null;

  // ── Pagos recientes (tab Resumen) ─────────────────────────────────────────
  const [payments, setPayments]             = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsPage, setPaymentsPage]     = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentsSort, setPaymentsSort]     = useState<PaymentSortOption>('date_desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const PAYMENTS_PER_PAGE = 10;

  useEffect(() => {
    setPaymentsPage(1);
  }, [paymentsSort]);

  useEffect(() => {
    if (activeTab !== 'pagos' || !machineId) return;
    setLoadingPayments(true);
    getPaymentsAction({
      machine_id: Number(machineId),
      page: paymentsPage,
      limit: PAYMENTS_PER_PAGE,
      sort: getPaymentSort(paymentsSort),
    })
      .then(res => {
        if (res.success && res.payments) {
          setPayments(res.payments);
          if (res.pagination) setPaymentsTotalPages(res.pagination.meta.last_page ?? 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPayments(false));
  }, [activeTab, machineId, paymentsPage, paymentsSort]);

  // ── Slots (tab Productos) ─────────────────────────────────────────────────
  const {
    slots, isLoading: slotsLoading, error: slotsError,
    fetchSlots, updateSlot, deleteSlot, clearErrors: clearSlotErrors, clearSlots, patchProductInSlots,
  } = useSlotStore();
  const { publishSlotOperation, isPublishing } = useMqttSlot();

  const [slotsFetched, setSlotsFetched]     = useState(false);
  const [slotsViewMode, setSlotsViewMode]   = useState<'grid' | 'card' | 'table'>('card');
  const [showProductSidebar, setShowProductSidebar] = useState(false);
  const [replenOpen, setReplenOpen]         = useState(false);
  const [copiedRepl, setCopiedRepl]       = useState(false);

  const [slotToDelete, setSlotToDelete]       = useState<Slot | null>(null);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [stockUpdateSlot, setStockUpdateSlot] = useState<Slot | null>(null);
  const [newStockValue, setNewStockValue]     = useState(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // ── Bulk capacity ─────────────────────────────────────────────────────────
  const [bulkCapacityInput, setBulkCapacityInput] = useState('');
  const [isBulkUpdating, setIsBulkUpdating]       = useState(false);
  const [bulkCapacityDone, setBulkCapacityDone]   = useState(false);

  async function handleBulkCapacity() {
    const value = parseInt(bulkCapacityInput, 10);
    if (isNaN(value) || value < 0 || slots.length === 0) return;
    setIsBulkUpdating(true);
    setBulkCapacityDone(false);
    await Promise.all(slots.map((s) => updateSlot(Number(machineId), s.id, { capacity: value })));
    setIsBulkUpdating(false);
    setBulkCapacityDone(true);
    setTimeout(() => setBulkCapacityDone(false), 2500);
  }

  // ── Modal de slot (crear / editar) ────────────────────────────────────────
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit]       = useState<Slot | null>(null);
  const [productPickerSlotId, setProductPickerSlotId] = useState<number | null>(null);
  const [products, setProducts]           = useState<Producto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productPanelSearch, setProductPanelSearch] = useState('');
  const [dragProduct, setDragProduct]     = useState<Producto | null>(null);
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);
  const [dragOverSlotId, setDragOverSlotId] = useState<number | null>(null);

  // ── Creación rápida de producto ───────────────────────────────────────────
  const [showQuickCreate, setShowQuickCreate]     = useState(false);
  const [quickCreateName, setQuickCreateName]     = useState('');
  const [quickCreateError, setQuickCreateError]   = useState<string | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editProductModalId, setEditProductModalId] = useState<number | null>(null);

  const handleQuickCreateProduct = async () => {
    const name = quickCreateName.trim();
    if (name.length < 2) { setQuickCreateError('Mínimo 2 caracteres'); return; }
    if (!machine?.enterprise_id) return;
    setIsCreatingProduct(true);
    setQuickCreateError(null);
    const result = await createProductAction({ name, enterprise_id: machine.enterprise_id });
    setIsCreatingProduct(false);
    if (result.success && result.product) {
      setProducts(prev => [result.product!, ...prev]);
      setQuickCreateName('');
      setShowQuickCreate(false);
    } else {
      setQuickCreateError(result.error ?? 'No fue posible crear el producto');
    }
  };

  useEffect(() => {
    if ((activeTab === 'inventario' || activeTab === 'reposicion') && machineId && !slotsFetched) {
      fetchSlots(Number(machineId));
      setSlotsFetched(true);
    }
  }, [activeTab, machineId, slotsFetched, fetchSlots]);

  useEffect(() => () => { clearSlots(); clearSlotErrors(); }, [clearSlots, clearSlotErrors]);

  // Fetch products once machine (with enterprise_id) is loaded
  useEffect(() => {
    if (!machine?.enterprise_id) return;
    setIsLoadingProducts(true);
    getProductsAction({ page: 1, limit: 200, enterpriseId: machine.enterprise_id })
      .then(res => { if (res.success && res.products) setProducts(res.products); })
      .catch(() => {})
      .finally(() => setIsLoadingProducts(false));
  }, [machine?.enterprise_id]);

  // Ordenar slots por urgencia
  const sortedSlots = useMemo(() =>
    [...slots].sort((a, b) => STOCK_URGENCY[slotStockLevel(a, machine)] - STOCK_URGENCY[slotStockLevel(b, machine)]),
    [slots, machine]
  );

  // Slots que necesitan reposición (todo lo que no está lleno)
  const replenSlots = useMemo(() =>
    sortedSlots.filter(s => {
      const level = slotStockLevel(s, machine);
      return level !== 'disabled' && level !== 'full';
    }),
    [sortedSlots, machine]
  );

  const alertCount      = useMemo(() => slots.filter(s => {
    const level = slotStockLevel(s, machine);
    return level !== 'disabled' && level !== 'full';
  }).length, [slots, machine]);
  const criticalCount   = useMemo(() => slots.filter(s => slotStockLevel(s, machine) === 'critical').length, [slots, machine]);
  const lowCount        = useMemo(() => slots.filter(s => slotStockLevel(s, machine) === 'low').length, [slots, machine]);
  const incompleteCount = useMemo(() => slots.filter(s => slotStockLevel(s, machine) === 'incomplete').length, [slots, machine]);
  const fullCount       = useMemo(() => slots.filter(s => slotStockLevel(s, machine) === 'full').length, [slots, machine]);
  const disabledCount   = useMemo(() => slots.filter(s => slotStockLevel(s, machine) === 'disabled').length, [slots, machine]);

  // Estructura de retícula derivada de los slots con column/row
  const gridStructure = useMemo(() => {
    const withGrid = slots.filter(s => s.column && s.row != null);
    if (withGrid.length === 0) return null;
    const cols  = [...new Set(withGrid.map(s => s.column as string))].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
    });
    const rows  = [...new Set(withGrid.map(s => s.row as number))].sort((a, b) => a - b);
    const map   = new Map(withGrid.map(s => [`${s.column}-${s.row}`, s]));
    const extra = slots.filter(s => !s.column || s.row == null);
    return { cols, rows, map, extra };
  }, [slots]);

  // Activa automáticamente la vista retícula cuando los slots tienen estructura de cuadrícula
  useEffect(() => {
    if (gridStructure) setSlotsViewMode('grid');
  }, [!!gridStructure]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyReplenishmentList = () => {
    if (!machine) return;
    const lines = [
      `LISTA DE REPOSICIÓN — ${machine.name}`,
      `Fecha: ${new Date().toLocaleDateString('es-CL')}`,
      `${'─'.repeat(45)}`,
      ...replenSlots.map(s => {
        const needed = (s.capacity ?? 0) - (s.current_stock ?? 0);
        const lvl = slotStockLevel(s, machine);
        const status = lvl === 'critical' ? '[CRÍTICO]' : lvl === 'low' ? '[BAJO]' : '[INCOMPLETO]';
        const pName = s.product?.name ?? products.find(p => Number(p.id) === s.product_id)?.name;
        return `${status} ${s.label} (${s.mdb_code}) — necesita ${needed} uds. (stock: ${s.current_stock}/${s.capacity})${pName ? ` — ${pName}` : s.product_id ? ` — Prod. #${s.product_id}` : ''}`;

      }),
      `${'─'.repeat(45)}`,
      `Total a reponer: ${replenSlots.reduce((sum, s) => sum + (s.capacity ?? 0) - (s.current_stock ?? 0), 0)} unidades en ${replenSlots.length} slots`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRepl(true);
    setTimeout(() => setCopiedRepl(false), 2500);
  };

  const printReplenishmentList = () => {
    if (!machine) return;
    const rows = replenSlots.map(s => {
      const needed = (s.capacity ?? 0) - (s.current_stock ?? 0);
      const level  = slotStockLevel(s, machine);
      const badge  = level === 'critical'
        ? '<span style="color:#dc2626;font-weight:700">CRÍTICO</span>'
        : level === 'low'
          ? '<span style="color:#d97706;font-weight:700">BAJO</span>'
          : '<span style="color:#2563eb;font-weight:700">INCOMPLETO</span>';
      return `<tr>
        <td>${s.label}</td>
        <td style="font-family:monospace">${s.mdb_code}</td>
        <td>${(s.product?.name ?? products.find(p => Number(p.id) === s.product_id)?.name) || (s.product_id ? `#${s.product_id}` : '—')}</td>
        <td>${s.current_stock ?? 0} / ${s.capacity ?? '?'}</td>
        <td style="font-weight:700;color:#1d4ed8">${needed}</td>
        <td>${badge}</td>
        <td style="width:160px"></td>
      </tr>`;
    }).join('');
    const total = replenSlots.reduce((sum, s) => sum + (s.capacity ?? 0) - (s.current_stock ?? 0), 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Reposición — ${machine.name}</title>
      <style>
        body{font-family:-apple-system,sans-serif;padding:32px;color:#111;max-width:900px;margin:0 auto}
        h1{font-size:22px;margin-bottom:4px}
        .meta{color:#666;font-size:14px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:14px}
        th{background:#f4f4f5;padding:8px 12px;text-align:left;border-bottom:2px solid #e4e4e7;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#52525b}
        td{padding:10px 12px;border-bottom:1px solid #e4e4e7;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        .total{margin-top:16px;text-align:right;font-size:13px;color:#52525b}
        @media print{body{padding:16px}}
      </style></head><body>
      <h1>Lista de Reposición</h1>
      <div class="meta">Máquina: <strong>${machine.name}</strong> &nbsp;·&nbsp; Fecha: ${new Date().toLocaleDateString('es-CL', { dateStyle: 'long' })} &nbsp;·&nbsp; ${replenSlots.length} slots</div>
      <table>
        <thead><tr>
          <th>Slot</th><th>Código MDB</th><th>Producto ID</th>
          <th>Stock actual</th><th>Unidades a reponer</th><th>Estado</th><th>✓ Repuesto</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Total a reponer: <strong>${total} unidades</strong></div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    const ok = await deleteSlot(Number(machineId), slotToDelete.id);
    setIsDeleting(false);
    if (ok) {
      try { await publishSlotOperation({ action: 'delete', machineId: Number(machineId), slotId: slotToDelete.id }); }
      catch { /* ignorar */ }
      setSlotToDelete(null);
    }
  };

  const handleStockUpdateClick = (slot: Slot) => {
    if (!slotTracksStock(slot, machine)) return;
    setStockUpdateSlot(slot);
    setNewStockValue(slot.current_stock || 0);
  };

  const handleQuickProductChange = async (slot: Slot, product: Producto | null) => {
    setProductPickerSlotId(null);
    await updateSlot(Number(machineId), slot.id, { product_id: product ? Number(product.id) : null });
  };

  const handleQuickSlotFieldChange = async (
    slot: Slot,
    field: 'label' | 'mdb_code' | 'capacity' | 'width',
    value: string | number | null
  ) => {
    await updateSlot(Number(machineId), slot.id, { [field]: value });
  };

  const handleStockUpdateConfirm = async () => {
    if (!stockUpdateSlot) return;
    setIsUpdatingStock(true);
    const updated = await updateSlot(Number(machineId), stockUpdateSlot.id, { current_stock: newStockValue });
    setIsUpdatingStock(false);
    if (updated) {
      try {
        await publishSlotOperation({
          action: 'update', machineId: Number(machineId), slotId: updated.id,
          slotData: {
            id: updated.id, mdb_code: updated.mdb_code, label: updated.label,
            product_id: updated.product_id, machine_id: Number(machineId),
            capacity: updated.capacity, current_stock: updated.current_stock,
          },
        });
      } catch { /* ignorar */ }
      setStockUpdateSlot(null);
    }
  };

  // ── Configuración (tab Configuración) ─────────────────────────────────────
  const [formData, setFormData]       = useState({ name: '', location: '', manage_stock: true, enterprise_id: 0 });
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError]   = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (machine) setFormData({
      name: machine.name,
      location: machine.location,
      manage_stock: machine.manage_stock ?? true,
      enterprise_id: machine.enterprise_id,
    });
  }, [machine]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaveError(null); setSaveSuccess(false);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    const result = await updateMachineAction(machineId, {
      name: formData.name,
      location: formData.location,
      manage_stock: formData.manage_stock,
    });
    setSaving(false);
    if (result.success && result.machine) {
      if (imageFile) {
        await uploadMachineImage(machineId, imageFile);
      }
      setMachine({
        ...result.machine,
        enterprise_id: result.machine.enterprise_id || formData.enterprise_id,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(result.error ?? 'Error al guardar');
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ── MQTT (tab Información) ────────────────────────────────────────────────
  const [mqttOpen, setMqttOpen] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied]     = useState<string | null>(null);

  const toggleReveal = (key: string) => setRevealed(p => ({ ...p, [key]: !p[key] }));
  const copyField    = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Estados de carga / error ──────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <PageHeader icon={Monitor} title="Detalles de la Máquina" backHref="/maquinas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted">Cargando detalles de la máquina...</p>
          </div>
        </div>
      </>
    );
  }

  if (loadError || !machine) {
    return (
      <>
        <PageHeader icon={Monitor} title="Detalles de la Máquina" backHref="/maquinas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Monitor className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar máquina</h3>
            <p className="text-muted mb-4">{loadError}</p>
            <Link href="/maquinas" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </>
    );
  }

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'pagos',         label: 'Pagos',         icon: <BarChart2 className="h-4 w-4" /> },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: <Package className="h-4 w-4" />,
      badge: slotsFetched && (criticalCount + lowCount) > 0 ? criticalCount + lowCount : undefined,
    },
    { id: 'reposicion',    label: 'Reposición',    icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="h-4 w-4" /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        icon={Monitor}
        title={machine.name}
        subtitle="Detalle y gestión de inventario"
        backHref="/maquinas"
        variant="white"
        actions={<TourRunner steps={MACHINE_DETAIL_TOUR} theme="light" />}
      />

      <main className="flex-1 overflow-auto">
        {/* ── Barra de acción — en desktop solo visible en tab productos ── */}
        <div className={`border-b border-gray-100 bg-white ${activeTab !== 'inventario' ? 'lg:hidden' : ''}`}>
          <div data-tour="machine-actions" className="px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2">
            {/* Machine avatar — solo en mobile, en desktop está en el sidebar */}
            {(imagePreview || machine.image) && (
              <div className="lg:hidden w-10 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <img
                  src={imagePreview || machine.image || ''}
                  alt={machine.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <span className={`lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(machine.status)}`}>
              <Activity className="h-3 w-3" />
              {getStatusLabel(machine.status)}
            </span>
            {machine.mqtt_user?.connection_status ? (
              <span className="lg:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-emerald-700 bg-emerald-50 border border-emerald-200">
                <Wifi className="h-3 w-3" /> MQTT
              </span>
            ) : (
              <span className="lg:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-50 border border-gray-200">
                <WifiOff className="h-3 w-3" /> Sin MQTT
              </span>
            )}
            <div className="flex-1" />
            {activeTab === 'inventario' && (
              <>
                <Link
                  href={`/maquinas/${machineId}/slots/reticula`}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-primary/40 text-primary text-xs font-semibold bg-white hover:bg-primary/5 transition-colors"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cuadrícula</span>
                </Link>
                <Link
                  href={`/maquinas/${machineId}/slots/plantilla`}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-primary/40 text-primary text-xs font-semibold bg-white hover:bg-primary/5 transition-colors"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Plantilla</span>
                </Link>
                <button
                  onClick={() => { setSlotToEdit(null); setSlotModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nuevo slot</span>
                </button>
              </>
            )}
            {/* QR y Reiniciar — solo en mobile; en desktop están en el sidebar */}
            <button
              onClick={() => setIsQROpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#3157b2]/40 text-[#3157b2] text-xs font-semibold bg-white hover:bg-[#3157b2]/5 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Generar QR</span>
            </button>
            <button
              onClick={handleReboot}
              disabled={rebootLoading || !hasCredentials}
              title={!hasCredentials ? 'Sin credenciales MQTT' : undefined}
              className="lg:hidden inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-red-200 text-red-600 text-xs font-semibold bg-white hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${rebootLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{rebootLoading ? 'Reiniciando...' : 'Reiniciar'}</span>
            </button>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="border-b border-gray-200 bg-white">
          <div data-tour="machine-tabs" className="px-4 sm:px-6 overflow-x-auto overflow-y-hidden">
            <nav className="flex gap-0 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-dark hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="ml-0.5 inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none py-0.5">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Contenido ────────────────────────────────────────────────────── */}
        <div className="flex items-start">
          <div className="flex-1 min-w-0 px-3 pt-3 pb-3">
          <div className="space-y-5">

            {/* ════════════════════════════════════════════════════════════════
                Tab: Productos
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'inventario' && (
              <div className="space-y-4">

                {/* Error */}
                {slotsError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 flex-1">{slotsError}</p>
                    <button onClick={clearSlotErrors}><X className="h-4 w-4 text-red-400" /></button>
                  </div>
                )}

                {/* Loading */}
                {slotsLoading && (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-primary mr-3" />
                    <span className="text-muted">Cargando inventario...</span>
                  </div>
                )}

                {/* Empty state */}
                {!slotsLoading && slots.length === 0 && !slotsError && (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-dark mb-2">Sin productos configurados</h3>
                    <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
                      Agrega compartimentos con sus productos y configuración de stock para gestionar el inventario.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link
                        href={`/maquinas/${machineId}/slots/plantilla`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        <LayoutGrid className="h-4 w-4" />
                        Usar plantilla
                      </Link>
                      <button
                        onClick={() => { setSlotToEdit(null); setSlotModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Slot manual
                      </button>
                    </div>
                  </div>
                )}

                {!slotsLoading && slots.length > 0 && (
                  <>
                    {/* ── Panel de estado de inventario ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`rounded-xl border p-3 sm:p-4 ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-muted mb-1">Críticos</p>
                        <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{criticalCount}</p>
                        <p className="text-xs text-muted mt-0.5">vacíos o &lt;10%</p>
                      </div>
                      <div className={`rounded-xl border p-3 sm:p-4 ${lowCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-muted mb-1">Stock bajo</p>
                        <p className={`text-2xl font-bold ${lowCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{lowCount}</p>
                        <p className="text-xs text-muted mt-0.5">10–30% de capacidad</p>
                      </div>
                      <div className={`rounded-xl border p-3 sm:p-4 ${incompleteCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-muted mb-1">Incompletos</p>
                        <p className={`text-2xl font-bold ${incompleteCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{incompleteCount}</p>
                        <p className="text-xs text-muted mt-0.5">30–99% de capacidad</p>
                      </div>
                      <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-3 sm:p-4">
                        <p className="text-xs font-medium text-muted mb-1">Llenos</p>
                        <p className="text-2xl font-bold text-emerald-600">{fullCount}</p>
                        <p className="text-xs text-muted mt-0.5">al 100% de capacidad</p>
                      </div>
                    </div>

                    {/* ── Layout: panel productos + vistas de slots ── */}
                    <div className="flex gap-4 items-start relative">

                      {/* Panel de productos — sidebar en desktop, overlay en móvil */}
                      {slotsViewMode !== 'table' && (
                        <div className={`
                          ${showProductSidebar ? 'flex' : 'hidden'} lg:flex
                          absolute inset-0 lg:relative lg:inset-auto z-30 lg:z-auto
                          w-full lg:w-[200px]
                          shrink-0 lg:sticky lg:top-4
                          rounded-xl border border-gray-200 bg-white overflow-hidden flex-col
                        `} style={{ maxHeight: 'calc(100vh - 180px)' }}>
                          {/* Barra de cierre (solo móvil) */}
                          <div className="lg:hidden flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
                            <span className="text-sm font-semibold text-dark">Productos</span>
                            <button onClick={() => setShowProductSidebar(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="px-3 pt-3 pb-2 border-b border-gray-100 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Productos</p>
                              <button
                                onClick={() => { setShowQuickCreate(v => !v); setQuickCreateName(''); setQuickCreateError(null); }}
                                title="Crear producto rápido"
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                  showQuickCreate
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-400 hover:bg-primary/10 hover:text-primary'
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Formulario de creación rápida */}
                            {showQuickCreate && (
                              <div className="mb-2 rounded-lg border border-primary/20 bg-primary/3 p-2.5 space-y-2">
                                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Nuevo producto</p>
                                <input
                                  autoFocus
                                  type="text"
                                  value={quickCreateName}
                                  onChange={(e) => { setQuickCreateName(e.target.value); setQuickCreateError(null); }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickCreateProduct();
                                    if (e.key === 'Escape') { setShowQuickCreate(false); setQuickCreateName(''); }
                                  }}
                                  placeholder="Nombre del producto…"
                                  maxLength={100}
                                  className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-primary bg-white transition-colors ${
                                    quickCreateError ? 'border-red-400' : 'border-primary/30'
                                  }`}
                                />
                                {quickCreateError && (
                                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-2.5 w-2.5 shrink-0" />{quickCreateError}
                                  </p>
                                )}
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => { setShowQuickCreate(false); setQuickCreateName(''); setQuickCreateError(null); }}
                                    className="px-2.5 py-1 text-[10px] font-medium rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={handleQuickCreateProduct}
                                    disabled={isCreatingProduct || quickCreateName.trim().length < 2}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                                  >
                                    {isCreatingProduct
                                      ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                      : <Check className="h-2.5 w-2.5" />}
                                    Crear
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Buscar..."
                                value={productPanelSearch}
                                onChange={(e) => setProductPanelSearch(e.target.value)}
                                className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                              />
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                            <div
                              draggable
                              onDragStart={() => { setDragProduct(null); setIsDraggingProduct(true); }}
                              onDragEnd={() => { setDragProduct(null); setIsDraggingProduct(false); setDragOverSlotId(null); }}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-dashed border-gray-200 cursor-grab active:cursor-grabbing select-none hover:border-gray-300 transition-all"
                            >
                              <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-300 shrink-0" />
                              <span className="text-xs text-gray-400 flex-1 truncate italic">Sin producto</span>
                              <GripVertical className="h-3 w-3 text-gray-300 shrink-0" />
                            </div>

                            {(productPanelSearch.trim()
                              ? products.filter(p => p.name.toLowerCase().includes(productPanelSearch.toLowerCase()))
                              : products
                            ).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-6">Sin resultados</p>
                            ) : (
                              (productPanelSearch.trim()
                                ? products.filter(p => p.name.toLowerCase().includes(productPanelSearch.toLowerCase()))
                                : products
                              ).map(product => {
                                const color = getProductColor(product.id);
                                const isBeingDragged = dragProduct?.id === product.id;
                                return (
                                  <div
                                    key={product.id}
                                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border transition-all ${
                                      isBeingDragged ? 'opacity-40 border-primary/30' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                  >
                                    <div
                                      draggable
                                      onDragStart={() => { setDragProduct(product); setIsDraggingProduct(true); }}
                                      onDragEnd={() => { setDragProduct(null); setIsDraggingProduct(false); setDragOverSlotId(null); }}
                                      className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing select-none"
                                    >
                                      {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-5 h-5 rounded object-cover shrink-0 border border-gray-100" />
                                      ) : (
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                      )}
                                      <span className="text-xs text-dark truncate flex-1">{product.name}</span>
                                    </div>
                                    <button
                                      onClick={() => setEditProductModalId(Number(product.id))}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-primary hover:bg-primary/8 transition-all shrink-0"
                                      title="Editar producto"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <GripVertical className="h-3 w-3 text-gray-300 shrink-0" />
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="px-3 py-2 border-t border-gray-100 shrink-0">
                            <p className="text-[10px] text-gray-400 text-center">Arrastra al slot · o toca para asignar</p>
                          </div>
                        </div>
                      )}

                      {/* Área de slots (flex-1) */}
                      <div className="flex-1 min-w-0 space-y-3">

                    {/* ── Encabezado del inventario completo ── */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-dark">
                        Inventario · {slots.length} slot{slots.length !== 1 ? 's' : ''}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Botón "Productos" — solo visible en móvil y cuando la vista no es tabla */}
                        {slotsViewMode !== 'table' && (
                          <button
                            onClick={() => setShowProductSidebar(true)}
                            className="lg:hidden inline-flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <Package className="h-3.5 w-3.5" />
                            Productos
                          </button>
                        )}
                        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                          {gridStructure && (
                            <button
                              onClick={() => setSlotsViewMode('grid')}
                              title="Vista cuadrícula"
                              className={`p-1.5 transition-colors ${slotsViewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                              <Grid3x3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSlotsViewMode('card')}
                            title="Tarjetas"
                            className={`p-1.5 transition-colors ${slotsViewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setSlotsViewMode('table')}
                            title="Tabla"
                            className={`p-1.5 transition-colors ${slotsViewMode === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                          >
                            <LayoutList className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => { setSlotToEdit(null); setSlotModalOpen(true); }}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Nuevo slot</span>
                        </button>
                      </div>
                    </div>

                    {/* ── Bulk capacity ── */}
                    {slots.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted shrink-0">Capacidad masiva:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            placeholder="Ej. 10"
                            value={bulkCapacityInput}
                            onChange={(e) => { setBulkCapacityInput(e.target.value); setBulkCapacityDone(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleBulkCapacity()}
                            className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors placeholder-gray-300"
                          />
                          <button
                            onClick={handleBulkCapacity}
                            disabled={isBulkUpdating || bulkCapacityInput === '' || slots.length === 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-primary/40 text-primary bg-white hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isBulkUpdating
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : bulkCapacityDone
                                ? <Check className="h-3 w-3 text-emerald-500" />
                                : null}
                            {isBulkUpdating ? 'Aplicando…' : bulkCapacityDone ? 'Listo' : `Aplicar a ${slots.length} slots`}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Vista tabla ── */}
                    {slotsViewMode === 'table' && (
                      <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50/70 border-b border-gray-100">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Slot</th>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide hidden sm:table-cell">Código MDB</th>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide hidden md:table-cell">Producto</th>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Stock</th>
                              <th className="px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {sortedSlots.map(slot => {
                              const level  = slotStockLevel(slot, machine);
                              const tracksStock = slotTracksStock(slot, machine);
                              const pct    = SlotAdapter.getStockPercentage({ ...slot, manage_stock: tracksStock }) ?? 0;
                              return (
                                <tr key={slot.id} className={`hover:bg-gray-50/60 transition-colors ${level === 'critical' ? 'bg-red-50/30' : level === 'low' ? 'bg-amber-50/20' : level === 'incomplete' ? 'bg-blue-50/10' : level === 'disabled' ? 'bg-slate-50/70' : ''}`}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${level === 'critical' ? 'bg-red-500' : level === 'low' ? 'bg-amber-400' : level === 'incomplete' ? 'bg-blue-400' : level === 'unknown' ? 'bg-gray-400' : level === 'disabled' ? 'bg-slate-400' : 'bg-emerald-500'}`}>
                                        {level === 'critical' ? '!' : level === 'low' ? '↓' : level === 'incomplete' ? '~' : level === 'unknown' ? '?' : level === 'disabled' ? '∅' : '✓'}
                                      </span>
                                      <span className="font-medium text-dark">{slot.label}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-muted hidden sm:table-cell">{slot.mdb_code}</td>
                                  <td className="px-4 py-3 text-xs hidden md:table-cell">
                                    {(() => {
                                      const productName = slot.product?.name ?? products.find(p => Number(p.id) === slot.product_id)?.name;
                                      const isOpen = productPickerSlotId === slot.id;
                                      return (
                                        <div className="relative">
                                          <button
                                            type="button"
                                            onClick={() => setProductPickerSlotId(isOpen ? null : slot.id)}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all group"
                                          >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${productName ? 'bg-primary/60' : 'bg-gray-300'}`} />
                                            <span className={productName ? 'text-dark font-medium' : 'italic text-muted'}>
                                              {productName ?? 'Sin producto'}
                                            </span>
                                            <Edit className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                          </button>
                                          {isOpen && (
                                            <SlotInspectorPanel
                                              slot={slot}
                                              products={products}
                                              totalColumns={gridStructure?.cols.length ?? 0}
                                              onEditField={(field, value) => handleQuickSlotFieldChange(slot, field, value)}
                                              onAssign={(p) => handleQuickProductChange(slot, p)}
                                              onClose={() => setProductPickerSlotId(null)}
                                              actions={
                                                <>
                                                  {tracksStock && (
                                                    <button
                                                      onClick={() => handleStockUpdateClick(slot)}
                                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    >
                                                      <RefreshCw className="h-3.5 w-3.5" />
                                                      Reponer
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => { setSlotToEdit(slot); setSlotModalOpen(true); }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                  >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    Editar
                                                  </button>
                                                  <button
                                                    onClick={() => setSlotToDelete(slot)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Eliminar
                                                  </button>
                                                </>
                                              }
                                            />
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {!tracksStock ? (
                                      <span className="text-xs text-slate-500 italic">Sin control</span>
                                    ) : slot.capacity !== null && slot.current_stock !== null ? (
                                      <div className="flex items-center gap-2 min-w-[130px]">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                          <div className={`h-1.5 rounded-full ${STOCK_BAR_COLORS[level]}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className={`text-xs font-semibold whitespace-nowrap ${STOCK_COLORS[level]}`}>
                                          {slot.current_stock}/{slot.capacity}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted italic">Sin datos</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-0.5">
                                      {tracksStock && (
                                        <button
                                          onClick={() => handleStockUpdateClick(slot)}
                                          title="Actualizar stock"
                                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                        >
                                          <RefreshCw className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                      <button onClick={() => { setSlotToEdit(slot); setSlotModalOpen(true); }} title="Editar" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors">
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => setSlotToDelete(slot)} title="Eliminar" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* ── Vista retícula ── */}
                    {slotsViewMode === 'grid' && gridStructure && (
                      <div className="space-y-4">
                        <div className="overflow-x-auto pb-2">
                          <div className="inline-block min-w-full">
                            {/* Cabeceras de columna — igual a MachineGridView de aplicar plantilla */}
                            <div className="grid mb-1.5" style={{ gridTemplateColumns: `28px repeat(${gridStructure.cols.length}, minmax(80px, 1fr))` }}>
                              <div />
                              {gridStructure.cols.map(col => (
                                <div key={col} className="text-center text-xs font-bold text-primary py-1">{col}</div>
                              ))}
                            </div>

                            {/* Filas */}
                            {gridStructure.rows.map(row => {
                              const coveredCols = new Set<number>();
                              return (
                                <div key={row} className="grid mb-1.5" style={{ gridTemplateColumns: `28px repeat(${gridStructure.cols.length}, minmax(80px, 1fr))` }}>
                                  <div className="flex items-center justify-center text-xs font-bold text-gray-400 pr-1">{row}</div>
                                  {gridStructure.cols.map((col, ci) => {
                                    if (coveredCols.has(ci)) return null;
                                    const slot = gridStructure.map.get(`${col}-${row}`);
                                    if (!slot) return <div key={`e-${col}-${row}`} className="mx-0.5 rounded-xl border-2 border-dashed border-gray-100" />;
                                    const span = (() => {
                                      if (!slot.width || gridStructure.cols.length === 0) return 1;
                                      const cellW = 100 / gridStructure.cols.length;
                                      return Math.max(1, Math.min(gridStructure.cols.length, Math.round(slot.width / cellW)));
                                    })();
                                    for (let s = 1; s < span; s++) coveredCols.add(ci + s);
                                    return (
                                      <div key={slot.id} className="px-0.5" style={span > 1 ? { gridColumn: `span ${span}` } : undefined}>
                                        <SlotCard
                                          slot={slot}
                                          machine={machine}
                                          products={products}
                                          totalColumns={gridStructure.cols.length}
                                          productPickerSlotId={productPickerSlotId}
                                          setProductPickerSlotId={setProductPickerSlotId}
                                          onProductChange={handleQuickProductChange}
                                          onFieldChange={handleQuickSlotFieldChange}
                                          onStockUpdate={handleStockUpdateClick}
                                          onEdit={(s) => { setSlotToEdit(s); setSlotModalOpen(true); }}
                                          onDelete={setSlotToDelete}
                                          isDragTarget={dragOverSlotId === slot.id}
                                          onDragOver={() => { if (isDraggingProduct) setDragOverSlotId(slot.id); }}
                                          onDragLeave={() => setDragOverSlotId(null)}
                                          onDrop={() => {
                                            if (isDraggingProduct) handleQuickProductChange(slot, dragProduct);
                                            setDragOverSlotId(null); setDragProduct(null); setIsDraggingProduct(false);
                                          }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Slots sin posición en retícula */}
                        {gridStructure.extra.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted mb-2">
                              Slots adicionales · {gridStructure.extra.length}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                              {gridStructure.extra.map(slot => (
                                <SlotCard
                                  key={slot.id}
                                  slot={slot}
                                  machine={machine}
                                  products={products}
                                  totalColumns={gridStructure.cols.length}
                                  productPickerSlotId={productPickerSlotId}
                                  setProductPickerSlotId={setProductPickerSlotId}
                                  onProductChange={handleQuickProductChange}
                                  onFieldChange={handleQuickSlotFieldChange}
                                  onStockUpdate={handleStockUpdateClick}
                                  onEdit={(s) => { setSlotToEdit(s); setSlotModalOpen(true); }}
                                  onDelete={setSlotToDelete}
                                  isDragTarget={dragOverSlotId === slot.id}
                                  onDragOver={() => setDragOverSlotId(slot.id)}
                                  onDragLeave={() => setDragOverSlotId(null)}
                                  onDrop={() => {
                                    handleQuickProductChange(slot, dragProduct);
                                    setDragOverSlotId(null); setDragProduct(null);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Vista tarjetas ── */}
                    {slotsViewMode === 'card' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                        {sortedSlots.map(slot => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            machine={machine}
                            products={products}
                            totalColumns={gridStructure?.cols.length ?? 0}
                            productPickerSlotId={productPickerSlotId}
                            setProductPickerSlotId={setProductPickerSlotId}
                            onProductChange={handleQuickProductChange}
                            onFieldChange={handleQuickSlotFieldChange}
                            onStockUpdate={handleStockUpdateClick}
                            onEdit={(s) => { setSlotToEdit(s); setSlotModalOpen(true); }}
                            onDelete={setSlotToDelete}
                            isDragTarget={dragOverSlotId === slot.id}
                            onDragOver={() => setDragOverSlotId(slot.id)}
                            onDragLeave={() => setDragOverSlotId(null)}
                            onDrop={() => {
                              handleQuickProductChange(slot, dragProduct);
                              setDragOverSlotId(null); setDragProduct(null);
                            }}
                          />
                        ))}
                      </div>
                    )}

                      </div>{/* /flex-1 */}
                    </div>{/* /flex gap-4 */}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Reposición ──────────────────────────────────────────── */}
            {activeTab === 'reposicion' && (
              <div className="space-y-5">

                {/* Loading */}
                {slotsLoading && (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-primary mr-3" />
                    <span className="text-muted">Cargando inventario...</span>
                  </div>
                )}

                {!slotsLoading && slots.length === 0 && (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-base font-semibold text-dark mb-1">Sin slots configurados</h3>
                    <p className="text-sm text-muted">Configura los slots en la pestaña Productos para ver el estado de reposición.</p>
                  </div>
                )}

                {!slotsLoading && slots.length > 0 && (
                  <>
                    {/* ── Resumen de estado ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`rounded-xl border p-4 ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-muted mb-1">Críticos</p>
                        <p className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>{criticalCount}</p>
                        <p className="text-xs text-muted mt-0.5">vacíos o menos del 10%</p>
                      </div>
                      <div className={`rounded-xl border p-4 ${lowCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-muted mb-1">Stock bajo</p>
                        <p className={`text-3xl font-bold ${lowCount > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{lowCount}</p>
                        <p className="text-xs text-muted mt-0.5">entre 10% y 30%</p>
                      </div>
                      <div className={`rounded-xl border p-4 ${incompleteCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-medium text-muted mb-1">Incompletos</p>
                        <p className={`text-3xl font-bold ${incompleteCount > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{incompleteCount}</p>
                        <p className="text-xs text-muted mt-0.5">entre 30% y 99%</p>
                      </div>
                      <div className="rounded-xl border bg-white border-gray-100 p-4">
                        <p className="text-xs font-medium text-muted mb-1">Unidades faltantes</p>
                        <p className="text-3xl font-bold text-primary">
                          {replenSlots.reduce((s, sl) => s + (sl.capacity ?? 0) - (sl.current_stock ?? 0), 0)}
                        </p>
                        <p className="text-xs text-muted mt-0.5">en {replenSlots.length} slots a atender</p>
                      </div>
                    </div>

                    {disabledCount > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">Slots sin control de stock: {disabledCount}</p>
                        <p className="text-xs text-slate-600 mt-1">No se incluyen en alertas, reposición ni métricas de inventario.</p>
                      </div>
                    )}

                    {/* ── Lista de slots a reponer ── */}
                    {replenSlots.length === 0 ? (
                      <div className="card p-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="h-7 w-7 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-dark mb-1">Todo abastecido</h3>
                        <p className="text-xs text-muted">
                          {alertCount === 0 && disabledCount > 0
                            ? 'No hay slots que requieran reposición. Los slots sin control quedan fuera de este panel.'
                            : 'Todos los slots controlados están al máximo de su capacidad configurada.'}
                        </p>
                      </div>
                    ) : (
                      <div className="card overflow-hidden">
                        {/* Cabecera con acciones */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                          <div>
                            <span className="text-sm font-semibold text-dark">Slots que necesitan atención</span>
                            <span className="ml-2 text-xs text-muted">{replenSlots.length} de {slots.length - disabledCount} slots controlados</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={copyReplenishmentList}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            >
                              {copiedRepl
                                ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado</>
                                : <><Clipboard className="h-3.5 w-3.5" /> Copiar lista</>
                              }
                            </button>
                            <button
                              onClick={printReplenishmentList}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <Printer className="h-3.5 w-3.5" /> Imprimir
                            </button>
                          </div>
                        </div>

                        {/* Tabla */}
                        <table className="w-full text-sm">
                          <thead className="border-b border-gray-100">
                            <tr>
                              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Slot</th>
                              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted uppercase tracking-wide hidden sm:table-cell">Producto</th>
                              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">Faltante</th>
                              <th className="px-5 py-2.5 text-xs font-medium text-muted uppercase tracking-wide text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {replenSlots.map(slot => {
                              const level  = slotStockLevel(slot, machine);
                              const needed = (slot.capacity ?? 0) - (slot.current_stock ?? 0);
                              const pct    = SlotAdapter.getStockPercentage({ ...slot, manage_stock: true }) ?? 0;
                              const productName = slot.product?.name ?? products.find(p => Number(p.id) === slot.product_id)?.name;
                              return (
                                <tr
                                  key={slot.id}
                                  className={`transition-colors ${
                                    level === 'critical'   ? 'bg-red-50/20 hover:bg-red-50/40' :
                                    level === 'low'        ? 'bg-amber-50/10 hover:bg-amber-50/30' :
                                                             'hover:bg-gray-50/60'
                                  }`}
                                >
                                  <td className="px-5 py-3.5">
                                    <p className="text-sm font-semibold text-dark">{slot.label}</p>
                                    <p className="text-xs font-mono text-muted">MDB {slot.mdb_code}</p>
                                    <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      level === 'critical'   ? 'bg-red-50 text-red-700 border-red-200' :
                                      level === 'low'        ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      level === 'unknown'    ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                                               'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {level === 'critical' ? <XCircle className="h-2.5 w-2.5" /> : level === 'low' ? <AlertTriangle className="h-2.5 w-2.5" /> : level === 'unknown' ? <AlertCircle className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                      {STOCK_LABELS[level]}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 hidden sm:table-cell">
                                    {productName
                                      ? <p className="text-sm text-dark truncate max-w-[160px]">{productName}</p>
                                      : <span className="text-xs text-muted italic">Sin asignar</span>
                                    }
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    {level === 'unknown' ? (
                                      <div className="inline-flex flex-col items-end gap-1">
                                        <span className="text-xs text-gray-400 italic">Sin registrar</span>
                                        <span className="text-[10px] text-muted">máx. {slot.capacity} uds.</span>
                                      </div>
                                    ) : slot.capacity !== null ? (
                                      <div className="inline-flex flex-col items-end gap-1">
                                        <div>
                                          <span className={`text-xl font-bold ${STOCK_COLORS[level]}`}>{needed}</span>
                                          <span className="text-xs text-muted ml-1">uds.</span>
                                        </div>
                                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                          <div className={`h-1.5 rounded-full ${STOCK_BAR_COLORS[level]}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted">{slot.current_stock ?? 0}/{slot.capacity}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted">—</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      onClick={() => handleStockUpdateClick(slot)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                      Reponer
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50/60 border-t border-gray-200">
                            <tr>
                              <td colSpan={2} className="px-5 py-2.5 text-xs font-semibold text-dark">
                                {replenSlots.length} slots necesitan reposición
                              </td>
                              <td className="px-5 py-2.5 text-right">
                                <span className="text-sm font-bold text-dark">
                                  {replenSlots.reduce((s, sl) => s + (sl.capacity ?? 0) - (sl.current_stock ?? 0), 0)}
                                </span>
                                <span className="text-xs text-muted ml-1">uds. en total</span>
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* ── Slots completos (referencia) ── */}
                    {fullCount > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer list-none px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-muted select-none">
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                          <span>{fullCount} slots llenos (100%)</span>
                        </summary>
                        <div className="mt-2 card overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50/70 border-b border-gray-100">
                              <tr>
                                <th className="text-left px-4 py-2 text-xs font-medium text-muted uppercase tracking-wide">Slot</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-muted uppercase tracking-wide hidden sm:table-cell">Producto</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-muted uppercase tracking-wide">Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {slots.filter(s => slotStockLevel(s, machine) === 'full').map(slot => {
                                const pct = SlotAdapter.getStockPercentage({ ...slot, manage_stock: true }) ?? 0;
                                const productName = slot.product?.name ?? products.find(p => Number(p.id) === slot.product_id)?.name;
                                return (
                                  <tr key={slot.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <p className="text-sm font-semibold text-dark">{slot.label}</p>
                                      <p className="text-xs font-mono text-muted">MDB {slot.mdb_code}</p>
                                    </td>
                                    <td className="px-4 py-2.5 hidden sm:table-cell">
                                      {productName
                                        ? <span className="text-sm text-dark">{productName}</span>
                                        : <span className="text-xs text-muted italic">Sin asignar</span>
                                      }
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-dark font-semibold">{slot.current_stock}/{slot.capacity}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                Tab: Resumen
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'pagos' && (
              <div className="space-y-4">
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-dark">Métricas de ventas</h3>
                      <HelpTooltip text="Ventas e ingresos de esta máquina comparados con el período anterior equivalente." side="right" />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      {(['day', 'month', 'year'] as Period[]).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${period === p ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {PERIOD_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                    <div className="px-5 py-4">
                      <p className="text-xs text-muted mb-1 flex items-center gap-1">
                        Ingresos <HelpTooltip text="Total vendido en el período." side="top" />
                      </p>
                      {loadingMetrics ? <KpiSkeleton /> : <p className="text-xl font-bold text-dark">{clp(totalAmount)}</p>}
                      {!loadingMetrics && growthPct !== null && (
                        <p className={`text-xs font-semibold mt-0.5 flex items-center gap-0.5 ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {growthPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {growthPct >= 0 ? '+' : ''}{growthPct}% vs período anterior
                        </p>
                      )}
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs text-muted mb-1">Ventas</p>
                      {loadingMetrics ? <KpiSkeleton /> : <p className="text-xl font-bold text-dark">{totalCount.toLocaleString('es-CL')}</p>}
                      <p className="text-xs text-muted mt-0.5">transacciones</p>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs text-muted mb-1 flex items-center gap-1">
                        Ticket promedio <HelpTooltip text="Total ÷ número de ventas." side="top" />
                      </p>
                      {loadingMetrics ? <KpiSkeleton /> : <p className="text-xl font-bold text-dark">{clp(avgTicket)}</p>}
                      <p className="text-xs text-muted mt-0.5">por venta</p>
                    </div>
                  </div>

                  {/* Selector de tipo de serie */}
                  <div className="px-5 py-2.5 border-t border-gray-100 flex items-center gap-4 flex-wrap">
                    {(
                      [
                        { label: 'Monto',  type: amountType, setType: setAmountType, color: 'bg-primary' },
                        { label: 'Ventas', type: countType,  setType: setCountType,  color: 'bg-emerald-500' },
                      ] as { label: string; type: SeriesType; setType: (v: SeriesType) => void; color: string }[]
                    ).map(({ label, type, setType, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                        <span className="text-xs text-muted">{label}</span>
                        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5">
                          <button
                            onClick={() => setType('line')}
                            title="Línea"
                            className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                              type === 'line' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >〜</button>
                          <button
                            onClick={() => setType('bar')}
                            title="Barras"
                            className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                              type === 'bar' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >▌</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 pb-4">
                    {loadingMetrics
                      ? <div className="h-44 bg-gray-50 rounded-xl animate-pulse" />
                      : chartData.every(d => d.amount === 0)
                        ? <div className="h-44 flex items-center justify-center text-sm text-muted bg-gray-50 rounded-xl">Sin ventas en este período</div>
                        : <SalesDualAxisChart data={chartData} amountType={amountType} countType={countType} />
                    }
                  </div>
                </div>

                {/* ── Productos vendidos ── */}
                <MachineProductsPanel
                  machineId={Number(machineId)}
                  enterpriseId={machine?.enterprise_id ?? undefined}
                  period={period}
                />

                {/* ── Listado de pagos ── */}
                <div className="card overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-dark">Pagos recientes</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <select
                          value={paymentsSort}
                          onChange={(e) => setPaymentsSort(e.target.value as PaymentSortOption)}
                          className="pl-3 pr-7 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none text-dark"
                        >
                          {PAYMENT_SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      {paymentsTotalPages > 1 && (
                        <span className="text-xs text-muted">
                          Página {paymentsPage} de {paymentsTotalPages}
                        </span>
                      )}
                      <Link
                        href={`/pagos?machine_id=${machineId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Ver todos los pagos</span>
                        <span className="sm:hidden">Ver todos</span>
                      </Link>
                    </div>
                  </div>

                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-muted">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm">Cargando pagos...</span>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted">
                      Sin pagos registrados para esta máquina
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="hidden sm:table-cell px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Operación</TableHead>
                            <TableHead className="px-4 sm:px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</TableHead>
                            <TableHead className="px-4 sm:px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</TableHead>
                            <TableHead className="hidden md:table-cell px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta</TableHead>
                            <TableHead className="px-4 sm:px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</TableHead>
                            <TableHead className="hidden sm:table-cell px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</TableHead>
                            <TableHead className="px-4 sm:px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map(p => (
                            <TableRow key={p.id} className="hover:bg-blue-50/60">
                              <TableCell className="hidden sm:table-cell px-6 py-2.5 whitespace-nowrap">
                                <div className="text-sm font-medium text-dark">#{p.id}</div>
                                <div className="text-xs text-muted">{p.operation_number ?? '—'}</div>
                              </TableCell>
                              <TableCell className="px-4 sm:px-6 py-2.5">
                                <div className="text-sm font-medium text-dark">{p.product || <span className="italic text-muted">—</span>}</div>
                                <div className="text-xs text-muted sm:hidden">
                                  {new Date(p.date || p.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 sm:px-6 py-2.5 whitespace-nowrap">
                                <div className="text-sm font-bold text-dark">{clp(p.amount ?? 0)}</div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell px-6 py-2.5 whitespace-nowrap">
                                <div className="text-sm text-dark">{formatCardBrand(p.card_brand) || '—'}</div>
                                {p.last_digits && <div className="text-xs text-muted">**** {p.last_digits}</div>}
                                {p.card_type && <div className="text-xs text-muted">{formatCardType(p.card_type)}</div>}
                              </TableCell>
                              <TableCell className="px-4 sm:px-6 py-2.5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${
                                  p.successful
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                  {p.successful ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                  <span className="ml-1 hidden sm:inline">{p.successful ? 'Exitoso' : 'Fallido'}</span>
                                </span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell px-6 py-2.5 whitespace-nowrap text-sm text-muted">
                                {new Date(p.date || p.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                              </TableCell>
                              <TableCell className="px-4 sm:px-6 py-2.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayment(p)}
                                  className="inline-flex items-center rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5 transition"
                                >
                                  <span className="hidden sm:inline">Ver detalle</span>
                                  <span className="sm:hidden">Ver</span>
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Paginación */}
                  {!loadingPayments && paymentsTotalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                        disabled={paymentsPage <= 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Anterior
                      </button>
                      <span className="text-xs text-muted">{paymentsPage} / {paymentsTotalPages}</span>
                      <button
                        onClick={() => setPaymentsPage(p => Math.min(paymentsTotalPages, p + 1))}
                        disabled={paymentsPage >= paymentsTotalPages}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                Tab: Configuración + Información (fusionadas)
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'configuracion' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── Columna izquierda: formulario editable ───────────────── */}
                <div className="lg:col-span-3 space-y-4">

                  {/* Alertas */}
                  {saveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                      <p className="text-sm text-emerald-800 font-medium">Cambios guardados correctamente</p>
                    </div>
                  )}
                  {saveError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{saveError}</p>
                    </div>
                  )}

                  <div className="card overflow-hidden">
                    {/* Card header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-dark">Configuración de la máquina</h3>
                        <p className="text-xs text-muted">Edita los datos identificativos visibles en toda la plataforma</p>
                      </div>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-6">

                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-medium text-dark mb-1.5 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-primary" />
                          Nombre de la máquina <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text" name="name"
                          value={formData.name} onChange={handleFormChange}
                          required maxLength={100}
                          className="input-field"
                          placeholder="Ej: Snack Mall Costanera #1"
                        />
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2.5">
                          <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-700 space-y-0.5">
                            <p className="font-semibold">Recomendación para el nombre</p>
                            <p>Usa el formato <span className="font-mono bg-blue-100 px-1 rounded">Tipo + Lugar + Número</span>, por ejemplo: <em>"Snack Aeropuerto T2 #3"</em> o <em>"Bebidas Metro Baquedano"</em>. Un nombre descriptivo facilita identificar la máquina rápidamente en listas y reportes.</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-dark mb-1.5 flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5 text-primary" />
                          Imagen referencial
                        </label>
                        <div className="flex items-start gap-4">
                          {/* Avatar preview */}
                          <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                            {(imagePreview || machine?.image) ? (
                              <img
                                src={imagePreview || machine?.image || ''}
                                alt={`Vista previa de ${formData.name || 'máquina'}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Monitor className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          {/* Upload control */}
                          <div className="flex flex-col gap-1.5">
                            <label className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                              {imageFile ? imageFile.name : 'Seleccionar imagen'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  if (!file) return;
                                  const err = validateImageFile(file);
                                  if (err) { setImageError(err); e.target.value = ''; return; }
                                  setImageError(null);
                                  setImageFile(file);
                                  if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                                  setImagePreview(URL.createObjectURL(file));
                                }}
                              />
                            </label>
                            {imageError
                              ? <p className="text-xs text-red-500 font-medium">{imageError}</p>
                              : <p className="text-xs text-muted">PNG, JPG o WEBP · máx. 5 MB. Ayuda a identificar la máquina visualmente en listas y reportes.</p>
                            }
                          </div>
                        </div>
                      </div>

                      {/* Ubicación */}
                      <div>
                        <label className="block text-sm font-medium text-dark mb-1.5 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          Ubicación <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="location"
                          value={formData.location} onChange={handleFormChange}
                          required rows={3}
                          className="input-field resize-none"
                          placeholder="Ej: Av. Costanera Sur 2727, Las Condes — Food court nivel 2, frente a escaleras mecánicas"
                        />
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2.5">
                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-800 space-y-1">
                            <p className="font-semibold">¿Qué incluir en la ubicación?</p>
                            <ul className="space-y-0.5 list-none">
                              <li className="flex items-start gap-1.5"><span className="text-amber-500 font-bold mt-0.5">·</span><span><strong>Dirección completa:</strong> calle, número, comuna y ciudad</span></li>
                              <li className="flex items-start gap-1.5"><span className="text-amber-500 font-bold mt-0.5">·</span><span><strong>Área específica:</strong> nivel, piso, ala o sector del edificio</span></li>
                              <li className="flex items-start gap-1.5"><span className="text-amber-500 font-bold mt-0.5">·</span><span><strong>Referencia visual:</strong> "junto a la entrada principal", "frente a ascensores"</span></li>
                            </ul>
                            <p className="text-amber-700">Una ubicación detallada ahorra tiempo al personal de mantención y reposición.</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={formData.manage_stock}
                            onChange={(e) => {
                              setSaveError(null);
                              setSaveSuccess(false);
                              setFormData(prev => ({ ...prev, manage_stock: e.target.checked }));
                            }}
                            disabled={saving}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block text-sm font-medium text-dark">Controlar stock a nivel de máquina</span>
                            <span className="block mt-1 text-xs text-muted">
                              Al desactivarlo, los slots que heredan esta configuración quedan fuera de alertas, reposición y paneles de inventario.
                            </span>
                          </span>
                        </label>
                      </div>


                      <div className="flex justify-end pt-2 border-t border-gray-100">
                        <button
                          type="submit" disabled={saving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                          suppressHydrationWarning
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* ── Columna derecha: información de solo lectura ──────────── */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Estado y conexión */}
                  <div className="card p-5">
                    <h4 className="text-sm font-semibold text-dark mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Estado y conexión
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(machine.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${machine.status?.toLowerCase() === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                          {getStatusLabel(machine.status)}
                        </span>
                        {machine.mqtt_user?.connection_status ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                            <Wifi className="h-3 w-3" /> MQTT conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200">
                            <WifiOff className="h-3 w-3" /> MQTT desconectado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Datos de la máquina */}
                  <div className="card p-5">
                    <h4 className="text-sm font-semibold text-dark mb-4 flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-primary" />
                      Datos de la máquina
                    </h4>
                    <dl className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Hash className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-muted font-medium mb-0.5">ID interno</dt>
                          <dd className="text-sm font-mono font-semibold text-dark">#{machine.id}</dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Monitor className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-muted font-medium mb-0.5">Tipo</dt>
                          <dd className="text-sm text-dark font-medium">{machine.type}</dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-muted font-medium mb-0.5">Empresa</dt>
                          <dd className="text-sm text-dark font-medium truncate">{machine.enterprise?.name ?? '—'}</dd>
                          <dd className="text-xs font-mono text-muted">ID: {machine.enterprise_id}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  {/* Fechas */}
                  <div className="card p-5">
                    <h4 className="text-sm font-semibold text-dark mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Historial
                    </h4>
                    <dl className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div>
                          <dt className="text-xs text-muted font-medium mb-0.5">Creada</dt>
                          <dd className="text-sm text-dark">{new Date(machine.created_at).toLocaleDateString('es-CL', { dateStyle: 'long' })}</dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div>
                          <dt className="text-xs text-muted font-medium mb-0.5">Última actualización</dt>
                          <dd className="text-sm text-dark">{new Date(machine.updated_at).toLocaleDateString('es-CL', { dateStyle: 'long' })}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  {/* MQTT */}
                  {machine.mqtt_user && (
                    <div className="card overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setMqttOpen(p => !p)}
                        className="w-full px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Shield className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-semibold text-dark block">Credenciales MQTT</span>
                            <span className="text-xs text-muted">Configuración avanzada de conexión</span>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mqttOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mqttOpen && (
                        <div className="border-t border-gray-100 px-5 py-4 space-y-1">
                          <div className="mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">Estas credenciales son confidenciales. No las compartas ni las expongas en lugares públicos.</p>
                          </div>
                          {([
                            { key: 'username',  label: 'Usuario',    value: machine.mqtt_user.username,                   sensitive: false },
                            { key: 'password',  label: 'Contraseña', value: machine.mqtt_user.original_password ?? '—',   sensitive: true  },
                            { key: 'client_id', label: 'Client ID',  value: machine.mqtt_user.client_id || 'No asignado', sensitive: false },
                          ] as const).map(({ key, label, value, sensitive }) => {
                            const isRevealed = revealed[key];
                            const display    = sensitive && !isRevealed ? '•'.repeat(Math.min(value.length, 16)) : value;
                            return (
                              <div key={key} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
                                <div className="min-w-0">
                                  <p className="text-xs text-muted mb-0.5">{label}</p>
                                  <p className={`text-sm font-mono font-medium text-dark select-none ${sensitive && !isRevealed ? 'tracking-widest' : ''}`}>{display}</p>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {sensitive && (
                                    <button type="button" onClick={() => toggleReveal(key)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                  )}
                                  <button type="button" onClick={() => copyField(key, value)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                    {copied === key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              Sidebar derecho: imagen + info de la máquina (solo desktop)
          ══════════════════════════════════════════════════════════════════ */}
        <aside className={`hidden lg:flex flex-col bg-white border border-gray-200 rounded-2xl shrink-0 relative transition-all duration-300 ease-in-out overflow-hidden my-3 mr-3 shadow-md sticky top-3 self-start max-h-[calc(100vh-5rem)] ${sidebarCollapsed ? 'w-12' : 'w-64'}`}>

          {sidebarCollapsed ? (
            /* ── Colapsado ── */
            <div className="relative flex flex-col items-center h-full min-h-[220px]">
              {/* Fondo: imagen desenfocada o gradiente */}
              {(imagePreview || machine.image) ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img src={imagePreview || machine.image || ''} alt="" className="w-full h-full object-cover scale-150 blur-md" />
                  <div className="absolute inset-0 bg-[#3157b2]/60" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#3157b2]/70 to-[#3157b2]/90" />
              )}
              {/* Toggle */}
              <button
                onClick={() => setSidebarCollapsed(v => !v)}
                title="Expandir panel"
                className="relative z-10 mt-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 shadow-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1" />
              {/* Thumbnail + estado anclados abajo */}
              <div className="relative z-10 flex flex-col items-center gap-2 mb-3">
                <div
                  className={`w-2 h-2 rounded-full ${machine.status?.toLowerCase() === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}
                  title={getStatusLabel(machine.status)}
                />
                {(imagePreview || machine.image) && (
                  <div className="w-9 aspect-[3/5] rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <img src={imagePreview || machine.image || ''} alt={machine.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Expandido: imagen + bento info ── */
            <div className="flex-1 overflow-y-auto">

              {/* Imagen de máquina — full width, sin padding */}
              <div className="relative">
                {(imagePreview || machine.image) ? (
                  <div className="aspect-[3/5] w-full">
                    <img
                      src={imagePreview || machine.image || ''}
                      alt={machine.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/5] w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-gray-50 to-gray-100">
                    <Monitor className="h-10 w-10 text-gray-200" />
                    <span className="text-xs text-gray-400">Sin imagen</span>
                  </div>
                )}
                {/* Toggle — overlay top-left */}
                <button
                  onClick={() => setSidebarCollapsed(v => !v)}
                  title="Colapsar panel"
                  className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white transition-all"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
                {/* Badges — overlay bottom */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm bg-white/80 ${getStatusColor(machine.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${machine.status?.toLowerCase() === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                    {getStatusLabel(machine.status)}
                  </span>
                  {machine.mqtt_user?.connection_status ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-emerald-700 bg-emerald-50/90 border border-emerald-200 backdrop-blur-sm">
                      <Wifi className="h-2.5 w-2.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-gray-500 bg-white/80 border border-gray-200 backdrop-blur-sm">
                      <WifiOff className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Máquina</p>
                <h2 className="text-sm font-bold text-dark leading-snug break-words">{machine.name}</h2>
                {machine.type && (
                  <span className="text-[10px] font-medium text-muted uppercase tracking-wide">{machine.type}</span>
                )}
              </div>

              {/* Bento info */}
              <div className="p-3 space-y-2">

                {machine.enterprise && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted font-medium">Empresa</p>
                      <p className="text-xs font-semibold text-dark break-words">{machine.enterprise.name}</p>
                    </div>
                  </div>
                )}

                {machine.location && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted font-medium">Ubicación</p>
                      <p className="text-xs font-medium text-dark leading-relaxed break-words">{machine.location}</p>
                    </div>
                  </div>
                )}

                {slotsFetched && slots.length > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted font-medium">Inventario</p>
                      <p className="text-xs font-semibold text-dark">{slots.length} slot{slots.length !== 1 ? 's' : ''}</p>
                      {criticalCount > 0 && (
                        <p className="text-[10px] font-bold text-red-600 mt-0.5">{criticalCount} crítico{criticalCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Acciones */}
              <div className="px-3 pb-4 space-y-1.5">
                <button
                  onClick={() => setIsQROpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Generar QR
                </button>
                <button
                  onClick={handleReboot}
                  disabled={rebootLoading || !hasCredentials}
                  title={!hasCredentials ? 'Sin credenciales MQTT' : undefined}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${rebootLoading ? 'animate-spin' : ''}`} />
                  {rebootLoading ? 'Reiniciando...' : 'Reiniciar'}
                </button>
              </div>

            </div>
          )}
        </aside>

        </div>{/* flex items-start */}
      </main>

      {/* QR */}
      {isQROpen && machine && <MachineQRLabel machine={machine} onClose={() => setIsQROpen(false)} />}

      {/* Modal actualizar stock */}
      {stockUpdateSlot && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-dark mb-1">Actualizar Stock</h3>
            <p className="text-sm text-muted mb-4">
              <span className="font-medium text-dark">{stockUpdateSlot.label}</span> · {stockUpdateSlot.mdb_code}
            </p>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Nuevo stock {stockUpdateSlot.capacity !== null && <span className="text-muted font-normal">(máx. {stockUpdateSlot.capacity})</span>}
            </label>
            <input
              type="number" value={newStockValue}
              onChange={e => setNewStockValue(Number(e.target.value))}
              min="0" max={stockUpdateSlot.capacity || undefined}
              className="input-field mb-2" disabled={isUpdatingStock}
            />
            {stockUpdateSlot.capacity !== null && newStockValue > stockUpdateSlot.capacity && (
              <p className="text-xs text-red-600 mb-3">El stock no puede superar la capacidad</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStockUpdateSlot(null)} disabled={isUpdatingStock || isPublishing} className="flex-1 btn-secondary">Cancelar</button>
              <button
                onClick={handleStockUpdateConfirm}
                disabled={isUpdatingStock || isPublishing || (stockUpdateSlot.capacity !== null && newStockValue > stockUpdateSlot.capacity)}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {(isUpdatingStock || isPublishing)
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{isPublishing ? 'Sincronizando...' : 'Guardando...'}</>
                  : 'Guardar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      <ConfirmActionDialog
        isOpen={!!slotToDelete}
        onOpenChange={open => { if (!open) setSlotToDelete(null); }}
        title="Eliminar slot"
        description={`¿Eliminar "${slotToDelete?.label || slotToDelete?.mdb_code}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting || isPublishing}
        variant="danger"
      />

      {/* Modal crear / editar slot */}
      <SlotFormModal
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        machineId={Number(machineId)}
        slot={slotToEdit}
        gridColumns={gridStructure?.cols.length}
        products={products}
        isLoadingProducts={isLoadingProducts}
        onSuccess={() => fetchSlots(Number(machineId))}
      />

      <PaymentDetailModal
        payment={selectedPayment}
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        enterpriseName={null}
        machineDetails={machine ?? null}
        machineDetailsLoading={false}
        machineDetailsError={null}
      />

      <EditProductoModal
        open={editProductModalId !== null}
        onOpenChange={(open) => { if (!open) setEditProductModalId(null); }}
        productId={editProductModalId}
        onSaved={() => {
          const savedId = editProductModalId;
          setEditProductModalId(null);
          if (savedId === null) return;
          getProductAction(savedId).then(res => {
            if (!res.success || !res.product) return;
            const updated = res.product;
            // Actualizar panel de productos
            setProducts(prev => prev.map(p => Number(p.id) === savedId ? updated : p));
            // Propagar imagen a todos los slots que usan este producto
            patchProductInSlots(savedId, { image: updated.image ?? null, name: updated.name });
          });
        }}
      />
    </>
  );
}
