'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Search, Grid3x3, AlignJustify,
  Layers, Plus, X, CheckCircle2, Loader2, Monitor, GripVertical,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import SlotInspectorPanel from '@/components/slots/SlotInspectorPanel';
import { getMachineAction } from '@/lib/actions/machines';
import { getProductsAction } from '@/lib/actions/products';
import { getSlotsAction } from '@/lib/actions/slots';
import { applyGridAction } from '@/lib/actions/machine-templates';
import { deriveSlotSpan } from '@/lib/utils/slotSpan';
import type { Producto } from '@/lib/interfaces/product.interface';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'machine' | 'list' | 'compact';
type SlotSize = 'x1' | 'x2' | 'x3';
type Step = 1 | 2 | 3;
type DragData =
  | { type: 'product'; product: Producto }
  | { type: 'slot'; slotId: string; product: Producto };

interface GeneratedSlot {
  id: string;
  label: string;
  column: string;
  row: number;
  mdb_code: number;
  product_id: number | null;
  product: Producto | null;
  capacity: number | null;
  current_stock: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function columnLetter(index: number): string {
  let letter = '';
  let i = index;
  do {
    letter = String.fromCharCode(65 + (i % 26)) + letter;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return letter;
}

type LabelMode = 'letters' | 'numbers';

function generateGrid(rows: number, columns: number, labelMode: LabelMode, bulkCapacity: number | null): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  let mdbCode = 1;
  for (let col = 0; col < columns; col++) {
    const colLetter = columnLetter(col);
    for (let row = 1; row <= rows; row++) {
      const code = mdbCode++;
      slots.push({
        id: `${colLetter}${row}`,
        label: labelMode === 'numbers' ? String(code) : `${colLetter}${row}`,
        column: colLetter,
        row,
        mdb_code: code,
        product_id: null,
        product: null,
        capacity: bulkCapacity,
        current_stock: null,
        x: null, y: null, width: null, height: null,
      });
    }
  }
  return slots;
}

function getProductColor(productId: number | string): string {
  const palette = ['#3157b2', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5'];
  const n = typeof productId === 'number' ? productId : Number(String(productId).replace(/\D/g, '')) || 0;
  return palette[Math.abs(n) % palette.length];
}

// ── GridPreview ───────────────────────────────────────────────────────────────

function GridPreview({ rows, columns }: { rows: number; columns: number }) {
  const clampedCols = Math.min(columns, 12);
  const clampedRows = Math.min(rows, 8);
  return (
    <div className="inline-grid gap-[4px]" style={{ gridTemplateColumns: `repeat(${clampedCols}, 1fr)` }}>
      {Array.from({ length: clampedCols * clampedRows }).map((_, i) => (
        <div key={i} className="rounded-[3px] bg-primary/25" style={{ width: 14, height: 14 }} />
      ))}
      {(rows > clampedRows || columns > clampedCols) && (
        <div className="col-span-full text-[10px] text-gray-400 mt-1 text-center">
          {rows * columns} slots en total
        </div>
      )}
    </div>
  );
}

// ── ProductPanel ──────────────────────────────────────────────────────────────

function ProductPanel({ rows, columns, products, search, setSearch, dragData, onDragStart, onDragEnd }: {
  rows: number;
  columns: number;
  products: Producto[];
  search: string;
  setSearch: (s: string) => void;
  dragData: DragData | null;
  onDragStart: (product: Producto) => void;
  onDragEnd: () => void;
}) {
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Grid summary */}
      <div className="shrink-0 border-b border-gray-100 p-4 flex flex-col items-center gap-3">
        <GridPreview rows={rows} columns={columns} />
        <div className="text-center">
          <p className="text-sm font-semibold text-dark">{columns} × {rows}</p>
          <p className="text-xs text-gray-400 mt-0.5">{columns * rows} slots</p>
        </div>
      </div>

      {/* Products list */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Productos</span>
          <span className="text-[10px] text-gray-400 tabular-nums">{filtered.length}</span>
        </div>

        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              {search ? 'Sin resultados' : 'Sin productos'}
            </p>
          ) : (
            filtered.map((product) => {
              const isBeingDragged = dragData?.type === 'product' && dragData.product.id === product.id;
              return (
                <div key={product.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'copy'; onDragStart(product); }}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border cursor-grab active:cursor-grabbing select-none transition-all
                    ${isBeingDragged ? 'opacity-40 border-primary/30' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getProductColor(product.id) }} />
                  <span className="text-xs text-dark truncate flex-1">{product.name}</span>
                  <GripVertical className="h-3 w-3 text-gray-300 shrink-0" />
                </div>
              );
            })
          )}
        </div>

        <p className="text-[10px] text-gray-400 text-center shrink-0 pb-0.5">
          Arrastra al slot · o haz clic en el slot
        </p>
      </div>
    </div>
  );
}

// ── MachineGridView ───────────────────────────────────────────────────────────

const SLOT_SIZE_CONFIG: Record<SlotSize, { minWidth: number; minHeight: number }> = {
  x1: { minWidth: 80,  minHeight: 80  },
  x2: { minWidth: 120, minHeight: 120 },
  x3: { minWidth: 170, minHeight: 170 },
};

function MachineGridView({ slots, columns, rows, products, activeSlot, setActiveSlot, onAssign, onEdit, dragData, dragOverSlot, onDrop, onDragOver, onDragLeave, onSlotDragStart, onDragEnd, slotSize }: {
  slots: GeneratedSlot[];
  columns: string[];
  rows: number;
  products: Producto[];
  activeSlot: string | null;
  setActiveSlot: (id: string | null) => void;
  onAssign: (id: string, product: Producto | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) => void;
  dragData: DragData | null;
  dragOverSlot: string | null;
  onDrop: (slotId: string) => void;
  onDragOver: (slotId: string) => void;
  onDragLeave: () => void;
  onSlotDragStart: (slotId: string, product: Producto) => void;
  onDragEnd: () => void;
  slotSize: SlotSize;
}) {
  const slotMap = useMemo(() => {
    const map: Record<string, GeneratedSlot> = {};
    slots.forEach((slot) => { map[`${slot.column}${slot.row}`] = slot; });
    return map;
  }, [slots]);

  const isDragging = !!dragData;
  const { minWidth, minHeight } = SLOT_SIZE_CONFIG[slotSize];
  const colTemplate = `28px repeat(${columns.length}, minmax(${minWidth}px, 1fr))`;

  return (
    <div className="p-4 sm:p-5 overflow-auto h-full">
      <div className="inline-block min-w-full">
        <div className="grid mb-1.5" style={{ gridTemplateColumns: colTemplate }}>
          <div />
          {columns.map((col) => (
            <div key={col} className="text-center text-xs font-bold text-primary py-1">{col}</div>
          ))}
        </div>

        {Array.from({ length: rows }, (_, index) => index + 1).map((row) => {
          const coveredCols = new Set<number>();
          return (
            <div key={row} className="grid mb-1.5" style={{ gridTemplateColumns: colTemplate }}>
              <div className="flex items-center justify-center text-xs font-bold text-gray-400 pr-1">{row}</div>
              {columns.map((col, colIdx) => {
                if (coveredCols.has(colIdx)) return null;
                const slot = slotMap[`${col}${row}`];
                if (!slot) return <div key={col} />;

                const span = Math.min(deriveSlotSpan(slot.width, columns.length), columns.length - colIdx);
                for (let i = colIdx + 1; i < colIdx + span; i++) coveredCols.add(i);

                const isActive = activeSlot === slot.id;
                const isDropTarget = dragOverSlot === slot.id && isDragging;
                const productColor = slot.product ? getProductColor(slot.product.id) : null;

                return (
                  <div key={col} className="px-0.5 relative"
                    style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
                    onDragOver={(e) => { e.preventDefault(); onDragOver(slot.id); }}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => { e.preventDefault(); onDrop(slot.id); }}
                  >
                    <button
                      draggable={!!slot.product}
                      onDragStart={(e) => {
                        if (slot.product) { e.dataTransfer.effectAllowed = 'move'; onSlotDragStart(slot.id, slot.product); }
                      }}
                      onDragEnd={onDragEnd}
                      onClick={() => setActiveSlot(isActive ? null : slot.id)}
                      style={{
                        minHeight,
                        ...(slot.product && productColor && !isDropTarget && !isActive
                          ? { borderColor: `${productColor}55`, backgroundColor: `${productColor}0d` }
                          : {}),
                      }}
                      className={`w-full rounded-xl border-2 flex flex-col items-center justify-between gap-1 py-2.5 px-2 transition-all group
                        ${isActive
                          ? 'border-primary bg-primary/4 shadow-md'
                          : isDropTarget
                            ? 'border-primary/60 bg-primary/6 shadow-sm ring-2 ring-primary/20'
                            : slot.product
                              ? 'border-gray-200/80 bg-white hover:border-primary/40 hover:shadow-sm'
                              : isDragging
                                ? 'border-dashed border-primary/30 bg-primary/3 hover:border-primary/50'
                                : 'border-dashed border-gray-200/80 bg-white hover:border-primary/30 hover:shadow-sm'
                        }`}
                    >
                      <span className="text-sm font-bold text-[#203c84] text-center leading-tight px-1">{slot.label}</span>
                      {slot.product ? (
                        <div className="flex items-center gap-1 w-full justify-center px-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: productColor ?? '#3157b2' }} />
                          <span className="text-[10px] text-gray-600 truncate leading-tight">{slot.product.name}</span>
                        </div>
                      ) : (
                        <span className={`text-[9px] transition-colors ${isDropTarget ? 'text-primary font-medium' : 'text-gray-300 group-hover:text-gray-400'}`}>
                          {isDropTarget ? '+ soltar aquí' : '+ asignar'}
                        </span>
                      )}
                      <div className="flex items-center gap-1 justify-center w-full">
                        <div className="flex items-center gap-0.5 bg-gray-50/80 rounded-md px-1.5 py-0.5">
                          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none select-none">MDB</span>
                          <span className="text-[10px] font-mono text-gray-400">{slot.mdb_code}</span>
                        </div>
                        <div className="flex items-center gap-0.5 bg-gray-50/80 rounded-md px-1.5 py-0.5">
                          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none select-none">Cap</span>
                          <span className="text-[10px] font-mono text-gray-400">{slot.capacity ?? '—'}</span>
                        </div>
                      </div>
                    </button>

                    {isActive && (
                      <SlotInspectorPanel
                        slot={slot}
                        products={products}
                        totalColumns={columns.length}
                        availableColumns={columns.length - colIdx}
                        onEditField={(field, value) => onEdit(slot.id, field as 'label' | 'mdb_code' | 'capacity' | 'width', value)}
                        onAssign={(product) => onAssign(slot.id, product)}
                        onClose={() => setActiveSlot(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SlotListView ──────────────────────────────────────────────────────────────

function SlotListView({ slots, products, totalColumns, onAssign, onEdit }: {
  slots: GeneratedSlot[];
  products: Producto[];
  totalColumns: number;
  onAssign: (id: string, product: Producto | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Etiqueta</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">MDB</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Cap. máx.</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Col</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Fila</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Producto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {slots.map((slot) => (
            <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-2">
                <input value={slot.label} onChange={(e) => onEdit(slot.id, 'label', e.target.value)}
                  className="font-mono text-xs font-bold text-dark bg-gray-100 px-2 py-0.5 rounded w-20" />
              </td>
              <td className="px-4 py-2">
                <input type="number" value={slot.mdb_code} onChange={(e) => onEdit(slot.id, 'mdb_code', Number(e.target.value))}
                  className="font-mono text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 w-16" />
              </td>
              <td className="px-4 py-2">
                <input type="number" min={0} placeholder="—"
                  value={slot.capacity ?? ''}
                  onChange={(e) => onEdit(slot.id, 'capacity', e.target.value === '' ? null : Number(e.target.value))}
                  className="font-mono text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 w-16" />
              </td>
              <td className="px-4 py-2.5 text-xs font-semibold text-primary hidden sm:table-cell">{slot.column}</td>
              <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{slot.row}</td>
              <td className="px-4 py-2.5">
                <div className="relative inline-block">
                  <button
                    onClick={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${slot.product ? 'border-transparent font-medium' : 'border-dashed border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    style={slot.product ? { backgroundColor: `${getProductColor(slot.product.id)}18`, color: getProductColor(slot.product.id), borderColor: `${getProductColor(slot.product.id)}40` } : {}}
                  >
                    {slot.product ? (
                      <><div className="w-2 h-2 rounded-full" style={{ backgroundColor: getProductColor(slot.product.id) }} />{slot.product.name}</>
                    ) : (
                      <><Plus className="h-3 w-3" />Asignar</>
                    )}
                  </button>
                  {activeSlot === slot.id && (
                    <SlotInspectorPanel
                      slot={slot}
                      products={products}
                      totalColumns={totalColumns}
                      onEditField={(field, value) => onEdit(slot.id, field as 'label' | 'mdb_code' | 'capacity' | 'width', value)}
                      onAssign={(product) => { onAssign(slot.id, product); setActiveSlot(null); }}
                      onClose={() => setActiveSlot(null)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SlotCompactView ───────────────────────────────────────────────────────────

const COMPACT_SIZE: Record<SlotSize, string> = {
  x1: 'min-w-[100px]',
  x2: 'min-w-[140px]',
  x3: 'min-w-[190px]',
};

function SlotCompactView({ slots, columns, products, onAssign, onEdit, slotSize }: {
  slots: GeneratedSlot[];
  columns: string[];
  products: Producto[];
  onAssign: (id: string, product: Producto | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) => void;
  slotSize: SlotSize;
}) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const byColumn = useMemo(() => {
    const map: Record<string, GeneratedSlot[]> = {};
    columns.forEach((c) => { map[c] = []; });
    slots.forEach((slot) => { map[slot.column]?.push(slot); });
    return map;
  }, [columns, slots]);

  return (
    <div className="p-4 sm:p-5 flex flex-wrap gap-3 overflow-auto h-full content-start">
      {columns.map((column) => (
        <div key={column} className={COMPACT_SIZE[slotSize]}>
          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[11px]">{column}</div>
            Col. {column}
          </div>
          <div className="flex flex-col gap-1.5">
            {byColumn[column]?.map((slot) => {
              const productColor = slot.product ? getProductColor(slot.product.id) : null;
              return (
                <div key={slot.id} className="relative">
                  <button
                    onClick={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                    className={`w-full rounded-xl border-2 flex flex-col items-center gap-1 py-2 px-2 transition-all hover:shadow-sm ${
                      activeSlot === slot.id ? 'border-primary bg-primary/4'
                        : slot.product ? 'border-gray-200/80 bg-white hover:border-primary/40'
                          : 'border-dashed border-gray-200/80 bg-white hover:border-primary/30'
                    }`}
                    style={slot.product && productColor && activeSlot !== slot.id
                      ? { borderColor: `${productColor}55`, backgroundColor: `${productColor}0d` }
                      : {}}
                  >
                    <span className="text-xs font-bold text-[#203c84]">{slot.label}</span>
                    {slot.product ? (
                      <div className="flex items-center gap-1 w-full justify-center">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: productColor ?? '#3157b2' }} />
                        <span className="text-[10px] truncate" style={{ color: productColor ?? '#3157b2' }}>{slot.product.name}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-gray-300">+ asignar</span>
                    )}
                    <div className="flex items-center gap-1 justify-center w-full">
                      <div className="flex items-center gap-0.5 bg-gray-50/80 rounded px-1 py-0.5">
                        <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest leading-none">MDB</span>
                        <span className="text-[9px] font-mono text-gray-400">{slot.mdb_code}</span>
                      </div>
                      <div className="flex items-center gap-0.5 bg-gray-50/80 rounded px-1 py-0.5">
                        <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest leading-none">Cap</span>
                        <span className="text-[9px] font-mono text-gray-400">{slot.capacity ?? '—'}</span>
                      </div>
                    </div>
                  </button>
                  {activeSlot === slot.id && (
                    <SlotInspectorPanel
                      slot={slot}
                      products={products}
                      totalColumns={columns.length}
                      availableColumns={columns.length - columns.indexOf(column)}
                      onEditField={(field, value) => onEdit(slot.id, field as 'label' | 'mdb_code' | 'capacity' | 'width', value)}
                      onAssign={(product) => { onAssign(slot.id, product); setActiveSlot(null); }}
                      onClose={() => setActiveSlot(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReticulaMaquinaPage() {
  const params    = useParams();
  const machineId = params.id as string;

  const [step, setStep]                             = useState<Step>(1);
  const [rows, setRows]                             = useState(5);
  const [columns, setColumns]                       = useState(4);
  const [labelMode, setLabelMode]                   = useState<LabelMode>('letters');
  const [bulkCapacity, setBulkCapacity]             = useState<number | null>(null);
  const [slots, setSlots]                           = useState<GeneratedSlot[]>([]);
  const [products, setProducts]                     = useState<Producto[]>([]);
  const [activeSlot, setActiveSlot]                 = useState<string | null>(null);
  const [viewMode, setViewMode]                     = useState<ViewMode>('machine');
  const [slotSize, setSlotSize]                     = useState<SlotSize>('x1');
  const [machineName, setMachineName]               = useState('');
  const [machineEnterpriseId, setMachineEnterpriseId] = useState<number | null>(null);
  const [existingSlotsCount, setExistingSlotsCount] = useState(0);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState<string | null>(null);
  const [applyResult, setApplyResult]               = useState<{ slots_created: number; products_assigned: number } | null>(null);
  const [isPending, startTransition]                = useTransition();

  useEffect(() => {
    if (window.innerWidth < 1024) setViewMode('list');
  }, []);

  const [dragData, setDragData]           = useState<DragData | null>(null);
  const [dragOverSlot, setDragOverSlot]   = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPanel, setShowProductPanel] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true); setError(null);
      const [machineRes, slotsRes] = await Promise.all([
        getMachineAction(machineId, { include: 'enterprise' }),
        getSlotsAction(machineId),
      ]);
      if (cancelled) return;
      if (!machineRes.success || !machineRes.machine) {
        setError(machineRes.error || 'No fue posible cargar la máquina.'); setLoading(false); return;
      }
      setMachineName(machineRes.machine.name);
      setMachineEnterpriseId(machineRes.machine.enterprise_id);
      setExistingSlotsCount(slotsRes.success && slotsRes.slots ? slotsRes.slots.length : 0);
      const productsRes = await getProductsAction({ page: 1, limit: 200, enterpriseId: machineRes.machine.enterprise_id });
      if (cancelled) return;
      setProducts(productsRes.success && productsRes.products ? productsRes.products : []);
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [machineId]);

  const columnLetters = useMemo(
    () => Array.from({ length: columns }, (_, i) => columnLetter(i)),
    [columns]
  );
  const assignedCount = slots.filter((s) => s.product_id !== null).length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleGenerateGrid() {
    setSlots(generateGrid(rows, columns, labelMode, bulkCapacity));
    setActiveSlot(null);
  }

  function handleAssign(slotId: string, product: Producto | null) {
    setSlots((cur) => cur.map((s) => s.id === slotId
      ? { ...s, product_id: product ? Number(product.id) : null, product }
      : s
    ));
    setActiveSlot(null);
  }

  function handleSlotEdit(slotId: string, field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) {
    setSlots((cur) => cur.map((s) => s.id === slotId ? { ...s, [field]: value } : s));
  }

  function handleProductDragStart(product: Producto) { setDragData({ type: 'product', product }); }
  function handleSlotDragStart(slotId: string, product: Producto) { setDragData({ type: 'slot', slotId, product }); }
  function handleDragEnd() { setDragData(null); setDragOverSlot(null); }

  function handleDrop(targetSlotId: string) {
    if (!dragData) return;
    if (dragData.type === 'product') {
      handleAssign(targetSlotId, dragData.product);
    } else if (dragData.type === 'slot' && dragData.slotId !== targetSlotId) {
      const sourceProduct = dragData.product;
      const targetSlot = slots.find((s) => s.id === targetSlotId);
      const targetProduct = targetSlot?.product ?? null;
      setSlots((cur) => cur.map((s) => {
        if (s.id === dragData.slotId) return { ...s, product_id: targetProduct ? Number(targetProduct.id) : null, product: targetProduct };
        if (s.id === targetSlotId) return { ...s, product_id: Number(sourceProduct.id), product: sourceProduct };
        return s;
      }));
    }
    setDragData(null); setDragOverSlot(null);
  }

  function handleGoToStep2() {
    handleGenerateGrid();
    setStep(2);
  }

  function handleApplyGrid() {
    startTransition(async () => {
      const response = await applyGridAction(machineId, {
        rows,
        columns,
        replace_existing_slots: true,
        slots: slots.map((s) => ({
          label: s.label, column: s.column, row: s.row, mdb_code: s.mdb_code,
          product_id: s.product_id, capacity: s.capacity, current_stock: s.current_stock,
          x: s.x, y: s.y, width: s.width, height: s.height,
        })),
      });
      if (!response.success || !response.data) {
        setError(response.error || 'No fue posible aplicar la cuadrícula.'); return;
      }
      setApplyResult({ slots_created: response.data.slots_created, products_assigned: response.data.products_assigned });
    });
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <PageHeader icon={Monitor} title="Cuadrícula rápida" subtitle={machineName || `Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=inventario`} variant="white" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        </main>
      </>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────

  if (applyResult) {
    return (
      <>
        <PageHeader icon={Monitor} title="Cuadrícula rápida" subtitle={machineName || `Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=inventario`} variant="white" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark">Cuadrícula aplicada</h2>
              <p className="text-sm text-muted mt-1">
                Se crearon <strong>{applyResult.slots_created} slots</strong> y se asignaron <strong>{applyResult.products_assigned}</strong> productos.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Cuadrícula</span>
                <span className="font-medium text-dark">{columns} cols × {rows} filas</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Total slots</span>
                <span className="font-medium text-dark">{applyResult.slots_created}</span>
              </div>
            </div>
            <Link href={`/maquinas/${machineId}?tab=inventario`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
              Ver inventario <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader icon={Monitor} title="Cuadrícula rápida" subtitle={machineName || `Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=inventario`} variant="white" />

      <main className={`flex-1 flex flex-col ${step === 2 ? 'overflow-hidden' : 'overflow-auto'}`}>

        {/* Step indicator */}
        <div className="bg-white border-b border-gray-100 shrink-0">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center gap-1.5">
              {([
                { n: 1 as Step, label: 'Configurar cuadrícula' },
                { n: 2 as Step, label: 'Asignar productos' },
                { n: 3 as Step, label: 'Confirmar' },
              ] as const).map((item, index) => (
                <div key={item.n} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-2 ${step >= item.n ? 'text-primary' : 'text-gray-400'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      step > item.n ? 'bg-primary border-primary text-white' : step === item.n ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-400 bg-white'
                    }`}>
                      {step > item.n ? <Check className="h-3.5 w-3.5" /> : item.n}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{item.label}</span>
                  </div>
                  {index < 2 && <ChevronRight className="h-4 w-4 text-gray-200 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 sm:px-6 pt-4 shrink-0">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            <div className="max-w-lg mx-auto space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-dark">Configura tu cuadrícula</h2>
                <p className="text-sm text-muted mt-0.5">Define cuántas filas y columnas tendrá la máquina. Se generarán los slots automáticamente.</p>
              </div>

              {existingSlotsCount > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Esta máquina ya tiene <strong>{existingSlotsCount} slots</strong>. Al aplicar la cuadrícula se reemplazarán por los nuevos slots generados.
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Columnas</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setColumns((c) => Math.max(1, c - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors font-bold text-lg leading-none">−</button>
                      <span className="text-2xl font-bold text-dark w-10 text-center tabular-nums">{columns}</span>
                      <button onClick={() => setColumns((c) => Math.min(50, c + 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors font-bold text-lg leading-none">+</button>
                    </div>
                    <input type="range" min={1} max={20} value={columns} onChange={(e) => setColumns(Number(e.target.value))}
                      className="w-full accent-primary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filas</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRows((r) => Math.max(1, r - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors font-bold text-lg leading-none">−</button>
                      <span className="text-2xl font-bold text-dark w-10 text-center tabular-nums">{rows}</span>
                      <button onClick={() => setRows((r) => Math.min(50, r + 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors font-bold text-lg leading-none">+</button>
                    </div>
                    <input type="range" min={1} max={20} value={rows} onChange={(e) => setRows(Number(e.target.value))}
                      className="w-full accent-primary" />
                  </div>
                </div>

                {/* Live preview */}
                <div className="flex flex-col items-center gap-3 py-4 border-t border-gray-50">
                  <GridPreview rows={rows} columns={columns} />
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span>{columns} columnas × {rows} filas</span>
                    <span className="font-bold text-dark">{columns * rows} slots en total</span>
                  </div>
                  {/* Sample labels preview */}
                  <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                    {labelMode === 'letters'
                      ? columnLetters.slice(0, 8).map((col) => (
                          <span key={col} className="text-[10px] font-mono font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded">{col}1</span>
                        ))
                      : Array.from({ length: Math.min(8, columns * rows) }, (_, i) => (
                          <span key={i} className="text-[10px] font-mono font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded">{i + 1}</span>
                        ))
                    }
                    {columns * rows > 8 && <span className="text-[10px] text-gray-400">+{columns * rows - 8} más</span>}
                  </div>
                </div>

                {/* Label mode + bulk capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre de slots</label>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setLabelMode('letters')}
                        className={`flex-1 py-2 text-xs font-semibold transition-colors ${labelMode === 'letters' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        Letras (A1, B2…)
                      </button>
                      <button
                        onClick={() => setLabelMode('numbers')}
                        className={`flex-1 py-2 text-xs font-semibold transition-colors ${labelMode === 'numbers' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        Números (1, 2…)
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {labelMode === 'letters'
                        ? 'Los slots se nombrarán por columna y fila: A1, A2, B1…'
                        : 'Los slots se numerarán consecutivamente: 1, 2, 3…'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Capacidad de todos los slots</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="Sin definir"
                        value={bulkCapacity ?? ''}
                        onChange={(e) => setBulkCapacity(e.target.value === '' ? null : Number(e.target.value))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors placeholder-gray-300"
                      />
                      {bulkCapacity !== null && (
                        <button onClick={() => setBulkCapacity(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">Se aplicará a todos los slots. Puedes ajustarla individualmente en el paso siguiente.</p>
                  </div>
                </div>
              </div>

              <button onClick={handleGoToStep2}
                className="w-full sm:w-auto sm:ml-auto sm:flex inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="flex-1 flex overflow-hidden relative">

            {/* Left panel */}
            <div className={`
              ${showProductPanel ? 'flex' : 'hidden'} lg:flex
              absolute inset-0 lg:relative lg:inset-auto z-30 lg:z-auto
              w-full lg:w-56 xl:w-64
              border-r border-gray-100 shrink-0 flex-col overflow-hidden bg-white
            `}>
              <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <span className="text-sm font-semibold text-dark">Productos</span>
                <button onClick={() => setShowProductPanel(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProductPanel
                rows={rows}
                columns={columns}
                products={products}
                search={productSearch}
                setSearch={setProductSearch}
                dragData={dragData}
                onDragStart={handleProductDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="px-3 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <button onClick={() => setShowProductPanel(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
                    <Grid3x3 className="h-3.5 w-3.5" />
                    Productos
                  </button>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-dark">{columns} cols × {rows} filas</span>
                    <span className="sm:ml-2 text-xs text-muted tabular-nums"> · {slots.length} slots</span>
                    {assignedCount > 0 && (
                      <span className="ml-1.5 text-xs text-primary font-medium">· {assignedCount} asignados</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Size selector — only for grid and compact views */}
                  {viewMode !== 'list' && (
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                      {(['x1', 'x2', 'x3'] as SlotSize[]).map((size) => (
                        <button key={size} onClick={() => setSlotSize(size)}
                          className={`px-2.5 py-2 text-xs font-bold transition-colors ${slotSize === size ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View mode */}
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    {([
                      { mode: 'machine' as ViewMode, icon: Grid3x3,      label: 'Grilla'   },
                      { mode: 'list'    as ViewMode, icon: AlignJustify, label: 'Lista'    },
                      { mode: 'compact' as ViewMode, icon: Layers,       label: 'Compacta' },
                    ] as const).map(({ mode, icon: Icon, label }) => (
                      <button key={mode} onClick={() => setViewMode(mode)}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold transition-colors ${viewMode === mode ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:block">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {viewMode === 'machine' && (
                  <MachineGridView
                    slots={slots} columns={columnLetters} rows={rows} products={products}
                    activeSlot={activeSlot} setActiveSlot={setActiveSlot}
                    onAssign={handleAssign} onEdit={handleSlotEdit}
                    dragData={dragData} dragOverSlot={dragOverSlot}
                    onDrop={handleDrop}
                    onDragOver={(id) => setDragOverSlot(id)}
                    onDragLeave={() => setDragOverSlot(null)}
                    onSlotDragStart={handleSlotDragStart}
                    onDragEnd={handleDragEnd}
                    slotSize={slotSize}
                  />
                )}
                {viewMode === 'list' && (
                  <SlotListView slots={slots} products={products} totalColumns={columns} onAssign={handleAssign} onEdit={handleSlotEdit} />
                )}
                {viewMode === 'compact' && (
                  <SlotCompactView slots={slots} columns={columnLetters} products={products} onAssign={handleAssign} onEdit={handleSlotEdit} slotSize={slotSize} />
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 bg-white">
                <span className="text-xs text-muted hidden sm:block sm:mr-auto">La asignación de productos es opcional.</span>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </button>
                  <button onClick={() => setStep(3)}
                    className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            <div className="max-w-lg mx-auto space-y-5">
              <div>
                <h2 className="text-lg font-bold text-dark">Confirmar creación de slots</h2>
                <p className="text-sm text-muted mt-1">Se crearán slots reales en esta máquina a partir de la cuadrícula configurada.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Grid3x3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">Cuadrícula {columns} × {rows}</p>
                    <p className="text-xs text-muted">Generada manualmente</p>
                  </div>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Columnas',      value: columns },
                    { label: 'Filas',         value: rows },
                    { label: 'Total slots',   value: slots.length },
                    { label: 'Con producto',  value: assignedCount },
                    { label: 'Con capacidad', value: slots.filter((s) => s.capacity !== null).length },
                    { label: 'Sin capacidad', value: slots.filter((s) => s.capacity === null).length },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted">{label}</p>
                      <p className="text-lg font-bold text-dark">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 bg-amber-50/70">
                  <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">Impacto sobre la máquina</p>
                  <p className="text-sm text-amber-800">
                    Se crearán <strong>{slots.length} slots</strong> en <strong>{machineName || `la máquina #${machineId}`}</strong>
                    {existingSlotsCount > 0
                      ? <> y se reemplazarán los <strong>{existingSlotsCount} slots</strong> actuales.</>
                      : <>. La máquina todavía no tiene slots cargados.</>}
                  </p>
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vista previa de slots</p>
                  <div className="flex flex-wrap gap-1.5">
                    {slots.slice(0, 24).map((slot) => (
                      <div key={slot.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
                        style={slot.product
                          ? { backgroundColor: `${getProductColor(slot.product.id)}18`, borderColor: `${getProductColor(slot.product.id)}50`, color: getProductColor(slot.product.id) }
                          : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {slot.label}
                      </div>
                    ))}
                    {slots.length > 24 && (
                      <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200">
                        +{slots.length - 24} más
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3">
                <button onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
                <button onClick={handleApplyGrid} disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Aplicar cuadrícula
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
