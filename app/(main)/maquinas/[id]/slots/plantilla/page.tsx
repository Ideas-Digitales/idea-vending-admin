'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Search, Grid3x3, AlignJustify,
  Layers, Plus, Package, X, CheckCircle2, Loader2, Factory, Server, Box,
  ShoppingCart, LayoutTemplate, Coffee, GripVertical, type LucideIcon,
} from 'lucide-react';
import { Monitor } from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import SlotInspectorPanel from '@/components/slots/SlotInspectorPanel';
import { getMachineAction } from '@/lib/actions/machines';
import { getProductsAction } from '@/lib/actions/products';
import { getSlotsAction } from '@/lib/actions/slots';
import { applyMachineTemplateAction, getMachineTemplatesAction } from '@/lib/actions/machine-templates';
import type { Producto } from '@/lib/interfaces/product.interface';
import type { MachineTemplate } from '@/lib/interfaces/machine-template.interface';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'machine' | 'list' | 'compact';
type Step = 1 | 2 | 3;
type DragData =
  | { type: 'product'; product: Producto }
  | { type: 'slot';    slotId: string; product: Producto };

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

// ── Constants & helpers ───────────────────────────────────────────────────────

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  crane: Factory, jofemar: Server, bianchi: Box,
  sielaff: ShoppingCart, ivs: LayoutTemplate, 'n&w': Coffee,
};

function getTemplateIcon(template: MachineTemplate): LucideIcon {
  const key = `${template.brand ?? ''} ${template.name}`.toLowerCase();
  const match = Object.entries(TEMPLATE_ICONS).find(([brand]) => key.includes(brand));
  return match?.[1] ?? Package;
}

function getProductColor(productId: number | string): string {
  const palette = ['#3157b2','#d97706','#16a34a','#dc2626','#7c3aed','#0891b2','#ea580c','#4f46e5'];
  const n = typeof productId === 'number' ? productId : Number(String(productId).replace(/\D/g,'')) || 0;
  return palette[Math.abs(n) % palette.length];
}

function mapTemplateToSlots(template: MachineTemplate, products: Producto[]): GeneratedSlot[] {
  const productMap = new Map(products.map((p) => [Number(p.id), p]));
  return (template.slots ?? [])
    .map((slot) => ({
      id: `${slot.column ?? 'X'}${slot.row ?? slot.mdb_code}`,
      label: slot.label,
      column: slot.column ?? '',
      row: slot.row ?? 0,
      mdb_code: slot.mdb_code,
      product_id: null,
      product: null,
      capacity: slot.default_capacity ?? null,
      current_stock: 0,
      x: slot.x ?? null,
      y: slot.y ?? null,
      width: slot.width ?? null,
      height: slot.height ?? null,
    }))
    .sort((a, b) => a.mdb_code - b.mdb_code)
    .map((slot) => ({
      ...slot,
      product: slot.product_id ? (productMap.get(slot.product_id) ?? null) : null,
    }));
}

// ── MiniGrid ──────────────────────────────────────────────────────────────────

function MiniGrid({ columns, rows, color = '#3157b2' }: { columns: number; rows: number; color?: string }) {
  return (
    <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <div key={i} className="rounded-[2px]" style={{ width: 8, height: 8, backgroundColor: color, opacity: 0.3 }} />
      ))}
    </div>
  );
}

// ── TemplateCard ──────────────────────────────────────────────────────────────

function TemplateCard({ template, selected, onSelect }: {
  template: MachineTemplate; selected: boolean; onSelect: () => void;
}) {
  const Icon = getTemplateIcon(template);
  const slotCount = template.slot_count ?? template.columns * template.rows;
  return (
    <button onClick={onSelect}
      className={`relative text-left w-full rounded-2xl border-2 transition-all hover:shadow-md ${
        selected ? 'border-primary bg-primary/4 shadow-md shadow-primary/10' : 'border-gray-100 bg-white hover:border-primary/30'
      }`}
    >
      {/* ── Mobile: horizontal compact row ── */}
      <div className="flex items-center gap-3 p-4 sm:hidden">
        <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-dark truncate">{template.name}</p>
          <p className="text-xs text-muted">
            {template.brand ?? 'Sin marca'} · {template.columns}×{template.rows} · {slotCount} slots
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MiniGrid columns={Math.min(template.columns, 5)} rows={Math.min(template.rows, 3)} color={selected ? '#3157b2' : '#9ca3af'} />
          {selected
            ? <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>
            : <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
          }
        </div>
      </div>

      {/* ── Desktop: vertical card ── */}
      <div className="hidden sm:block p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-dark leading-tight">{template.name}</p>
            <p className="text-xs text-muted mt-0.5">{template.brand ?? 'Sin marca'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">
          {template.description || 'Sin descripción'}
        </p>
        <div className="flex items-end justify-between gap-2">
          <span className="text-xs text-muted">
            {template.columns} cols × {template.rows} filas ·{' '}
            <strong className="text-dark">{slotCount} slots</strong>
          </span>
          <MiniGrid columns={template.columns} rows={template.rows} color={selected ? '#3157b2' : '#6b7280'} />
        </div>
        {selected && (
          <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

// ── ProductPanel (left sidebar) ───────────────────────────────────────────────

function ProductPanel({ template, products, search, setSearch, dragData, onDragStart, onDragEnd }: {
  template: MachineTemplate;
  products: Producto[];
  search: string;
  setSearch: (s: string) => void;
  dragData: DragData | null;
  onDragStart: (product: Producto) => void;
  onDragEnd: () => void;
}) {
  const Icon = getTemplateIcon(template);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Template info */}
      <div className="p-4 shrink-0 flex flex-col items-center gap-2.5 border-b border-gray-100">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="h-7 w-7 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-dark leading-tight">{template.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {template.columns}×{template.rows} · {template.slot_count ?? template.columns * template.rows} slots
          </p>
        </div>
        <MiniGrid columns={Math.min(template.columns, 10)} rows={Math.min(template.rows, 8)} />
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
              {search ? `Sin resultados` : 'Sin productos'}
            </p>
          ) : (
            filtered.map((product) => {
              const isBeingDragged = dragData?.type === 'product' && dragData.product.id === product.id;
              return (
                <div key={product.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'copy'; onDragStart(product); }}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                    bg-white border cursor-grab active:cursor-grabbing select-none transition-all
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

// ── Helpers de span ───────────────────────────────────────────────────────────

function deriveSpan(width: number | null, totalCols: number): number {
  if (!width || totalCols === 0) return 1;
  const cellW = 100 / totalCols;
  return Math.max(1, Math.min(totalCols, Math.round(width / cellW)));
}

// ── MachineGridView ───────────────────────────────────────────────────────────

function MachineGridView({ slots, columns, rows, products, activeSlot, setActiveSlot, onAssign, onEdit, dragData, dragOverSlot, onDrop, onDragOver, onDragLeave, onSlotDragStart, onDragEnd }: {
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
}) {
  const slotMap = useMemo(() => {
    const map: Record<string, GeneratedSlot> = {};
    slots.forEach((slot) => { map[`${slot.column}${slot.row}`] = slot; });
    return map;
  }, [slots]);

  const isDragging = !!dragData;

  return (
    <div className="p-4 sm:p-5 overflow-auto h-full">
      <div className="inline-block min-w-full">
        {/* Column headers */}
        <div className="grid mb-1.5" style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(90px, 1fr))` }}>
          <div />
          {columns.map((col) => (
            <div key={col} className="text-center text-xs font-bold text-primary py-1">{col}</div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, index) => index + 1).map((row) => {
          const coveredCols = new Set<number>();
          return (
            <div key={row} className="grid mb-1.5" style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(90px, 1fr))` }}>
              <div className="flex items-center justify-center text-xs font-bold text-gray-400 pr-1">{row}</div>
              {columns.map((col, ci) => {
                if (coveredCols.has(ci)) return null;

                const slot = slotMap[`${col}${row}`];
                if (!slot) return <div key={col} />;

                const span         = deriveSpan(slot.width, columns.length);
                const isActive     = activeSlot === slot.id;
                const isDropTarget = dragOverSlot === slot.id && isDragging;
                const productColor = slot.product ? getProductColor(slot.product.id) : null;

                for (let s = 1; s < span; s++) coveredCols.add(ci + s);

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
                      className={`w-full rounded-xl border-2 flex flex-col items-center justify-between
                        gap-1 py-2.5 px-2 min-h-[90px] transition-all group
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
                      style={slot.product && productColor && !isDropTarget && !isActive
                        ? { borderColor: `${productColor}55`, backgroundColor: `${productColor}0d` }
                        : {}}
                    >
                      {/* Label */}
                      <span className="text-sm font-bold text-[#203c84] text-center leading-tight px-1">
                        {slot.label}
                      </span>

                      {/* Producto */}
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

                      {/* Pills: MDB + Cap */}
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
                        onEditField={(field, value) => onEdit(slot.id, field, value)}
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
                      onEditField={(field, value) => onEdit(slot.id, field, value)}
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

function SlotCompactView({ slots, columns, products, onAssign, onEdit }: {
  slots: GeneratedSlot[];
  columns: string[];
  products: Producto[];
  onAssign: (id: string, product: Producto | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) => void;
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
        <div key={column} className="min-w-[110px]">
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
                      activeSlot === slot.id
                        ? 'border-primary bg-primary/4'
                        : slot.product
                          ? 'border-gray-200/80 bg-white hover:border-primary/40'
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
                      onEditField={(field, value) => onEdit(slot.id, field, value)}
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

export default function PlantillaMaquinaPage() {
  const params    = useParams();
  const machineId = params.id as string;

  const [step, setStep]                       = useState<Step>(1);
  const [templates, setTemplates]             = useState<MachineTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MachineTemplate | null>(null);
  const [products, setProducts]               = useState<Producto[]>([]);
  const [slots, setSlots]                     = useState<GeneratedSlot[]>([]);
  const [activeSlot, setActiveSlot]           = useState<string | null>(null);
  const [viewMode, setViewMode]               = useState<ViewMode>('machine');
  const [machineName, setMachineName]         = useState('');
  const [machineEnterpriseId, setMachineEnterpriseId] = useState<number | null>(null);
  const [existingSlotsCount, setExistingSlotsCount] = useState(0);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [applyResult, setApplyResult]         = useState<{ slots_created: number; products_assigned: number } | null>(null);
  const [isPending, startTransition]          = useTransition();

  // Default to list view on mobile (grid view works best on desktop)
  useEffect(() => {
    if (window.innerWidth < 1024) setViewMode('list');
  }, []);

  // Drag-and-drop
  const [dragData, setDragData]       = useState<DragData | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  // Product panel
  const [productSearch, setProductSearch] = useState('');
  const [showProductPanel, setShowProductPanel] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true); setError(null);
      const [machineRes, templatesRes, slotsRes] = await Promise.all([
        getMachineAction(machineId, { include: 'enterprise' }), getMachineTemplatesAction(), getSlotsAction(machineId),
      ]);
      if (cancelled) return;
      if (!machineRes.success || !machineRes.machine) {
        setError(machineRes.error || 'No fue posible cargar la máquina.'); setLoading(false); return;
      }
      setMachineName(machineRes.machine.name);
      setMachineEnterpriseId(machineRes.machine.enterprise_id);
      setExistingSlotsCount(slotsRes.success && slotsRes.slots ? slotsRes.slots.length : 0);
      if (!templatesRes.success || !templatesRes.templates) {
        setError(templatesRes.error || 'No fue posible cargar las plantillas.'); setLoading(false); return;
      }
      setTemplates(templatesRes.templates);
      const productsRes = await getProductsAction({ page: 1, limit: 200, enterpriseId: machineRes.machine.enterprise_id });
      if (cancelled) return;
      setProducts(productsRes.success && productsRes.products ? productsRes.products : []);
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [machineId]);

  const effectiveCols = selectedTemplate?.columns ?? 0;
  const effectiveRows = selectedTemplate?.rows ?? 0;
  const columns = useMemo(() => {
    const set = new Set(slots.map((s) => s.column).filter(Boolean));
    if (set.size > 0) return Array.from(set).sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
    });
    return 'ABCDEFGHIJ'.slice(0, effectiveCols).split('');
  }, [effectiveCols, slots]);
  const assignedCount = slots.filter((s) => s.product_id !== null).length;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSelectTemplate(template: MachineTemplate) {
    setSelectedTemplate(template);
    setSlots(mapTemplateToSlots(template, products));
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

  // Drag-and-drop handlers
  function handleProductDragStart(product: Producto) {
    setDragData({ type: 'product', product });
  }

  function handleSlotDragStart(slotId: string, product: Producto) {
    setDragData({ type: 'slot', slotId, product });
  }

  function handleDragEnd() {
    setDragData(null);
    setDragOverSlot(null);
  }

  function handleDrop(targetSlotId: string) {
    if (!dragData) return;

    if (dragData.type === 'product') {
      handleAssign(targetSlotId, dragData.product);
    } else if (dragData.type === 'slot' && dragData.slotId !== targetSlotId) {
      const sourceProduct = dragData.product;
      const targetSlot    = slots.find((s) => s.id === targetSlotId);
      const targetProduct = targetSlot?.product ?? null;
      setSlots((cur) => cur.map((s) => {
        if (s.id === dragData.slotId) return { ...s, product_id: targetProduct ? Number(targetProduct.id) : null, product: targetProduct };
        if (s.id === targetSlotId)    return { ...s, product_id: Number(sourceProduct.id), product: sourceProduct };
        return s;
      }));
    }

    setDragData(null);
    setDragOverSlot(null);
  }

  function handleApplyTemplate() {
    if (!selectedTemplate) return;
    startTransition(async () => {
      const response = await applyMachineTemplateAction(machineId, {
        template_id: selectedTemplate.id,
        replace_existing_slots: true,
        slots: slots.map((s) => ({
          label: s.label, column: s.column, row: s.row, mdb_code: s.mdb_code,
          product_id: s.product_id, capacity: s.capacity, current_stock: s.current_stock,
          x: s.x, y: s.y, width: s.width, height: s.height,
        })),
      });
      if (!response.success || !response.data) {
        setError(response.error || 'No fue posible aplicar la plantilla.'); return;
      }
      setApplyResult({ slots_created: response.data.slots_created, products_assigned: response.data.products_assigned });
    });
  }

  // ── Loading / success states ──────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <PageHeader icon={Monitor} title="Aplicar plantilla" subtitle={machineName || `Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=productos`} variant="white" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando plantillas y productos...
          </div>
        </main>
      </>
    );
  }

  if (applyResult) {
    return (
      <>
        <PageHeader icon={Monitor} title="Aplicar plantilla" subtitle={machineName || `Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=productos`} variant="white" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark">Plantilla aplicada</h2>
              <p className="text-sm text-muted mt-1">
                Se crearon <strong>{applyResult.slots_created} slots</strong> y se asignaron <strong>{applyResult.products_assigned}</strong> productos.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Plantilla</span>
                <span className="font-medium text-dark">{selectedTemplate?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Distribución</span>
                <span className="font-medium text-dark">{effectiveCols} cols × {effectiveRows} filas</span>
              </div>
            </div>
            <Link href={`/maquinas/${machineId}?tab=productos`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
              Ver inventario <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader icon={Monitor} title="Aplicar plantilla" subtitle={machineName || `Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=productos`} variant="white" />

      <main className={`flex-1 flex flex-col ${step === 2 ? 'overflow-hidden' : 'overflow-auto'}`}>

        {/* Step indicator */}
        <div className="bg-white border-b border-gray-100 shrink-0">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center gap-1.5">
              {([
                { n: 1 as Step, label: 'Seleccionar plantilla' },
                { n: 2 as Step, label: 'Configurar slots' },
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
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-dark">Elige la plantilla de tu máquina</h2>
                  <p className="text-sm text-muted mt-0.5">Selecciona una plantilla para crear los slots de esta máquina.</p>
                </div>
                <Link href="/maquinas/plantillas/crear"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Nueva
                </Link>
              </div>
              {existingSlotsCount > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Esta máquina ya tiene <strong>{existingSlotsCount} slots</strong>. Al aplicar una plantilla se reemplazarán por los nuevos slots generados.
                </div>
              )}
              {templates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-muted space-y-4">
                  <p>No hay plantillas disponibles todavía.</p>
                  <Link href="/maquinas/plantillas/crear"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <Plus className="h-4 w-4" /> Crear primera plantilla
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {templates.map((t) => (
                    <TemplateCard key={t.id} template={t} selected={selectedTemplate?.id === t.id} onSelect={() => handleSelectTemplate(t)} />
                  ))}
                </div>
              )}
              <div className="pt-1">
                <button onClick={() => setStep(2)} disabled={!selectedTemplate}
                  className="w-full sm:w-auto sm:ml-auto sm:flex inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: two-panel layout ── */}
        {step === 2 && selectedTemplate && (
          <div className="flex-1 flex overflow-hidden relative">

            {/* Left panel: template image + products */}
            {/* On mobile: full-screen overlay when showProductPanel=true; on desktop: always visible sidebar */}
            <div className={`
              ${showProductPanel ? 'flex' : 'hidden'} lg:flex
              absolute inset-0 lg:relative lg:inset-auto z-30 lg:z-auto
              w-full lg:w-56 xl:w-64
              border-r border-gray-100 shrink-0 flex-col overflow-hidden bg-white
            `}>
              {/* Mobile close bar */}
              <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <span className="text-sm font-semibold text-dark">Productos</span>
                <button onClick={() => setShowProductPanel(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProductPanel
                key={selectedTemplate.id}
                template={selectedTemplate}
                products={products}
                search={productSearch}
                setSearch={setProductSearch}
                dragData={dragData}
                onDragStart={handleProductDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>

            {/* Right panel: slot grid */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

              {/* Subheader */}
              <div className="px-3 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile: toggle product panel */}
                  <button
                    onClick={() => setShowProductPanel(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    <Package className="h-3.5 w-3.5" />
                    Productos
                  </button>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-dark truncate block sm:inline">{selectedTemplate.name}</span>
                    <span className="sm:ml-2 text-xs text-muted tabular-nums">
                      {effectiveCols}×{effectiveRows} · {slots.length} slots
                    </span>
                    {assignedCount > 0 && (
                      <span className="ml-1.5 text-xs text-primary font-medium">· {assignedCount} asignados</span>
                    )}
                  </div>
                </div>

                {/* View mode */}
                <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm shrink-0">
                  {([
                    { mode: 'machine' as ViewMode, icon: Grid3x3,      label: 'Grilla'    },
                    { mode: 'list'    as ViewMode, icon: AlignJustify, label: 'Lista'     },
                    { mode: 'compact' as ViewMode, icon: Layers,       label: 'Compacta'  },
                  ] as const).map(({ mode, icon: Icon, label }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold transition-colors ${viewMode === mode ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:block">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid / list / compact */}
              <div className="flex-1 overflow-hidden">
                {viewMode === 'machine' && (
                  <MachineGridView
                    slots={slots} columns={columns} rows={effectiveRows} products={products}
                    activeSlot={activeSlot} setActiveSlot={setActiveSlot}
                    onAssign={handleAssign} onEdit={handleSlotEdit}
                    dragData={dragData} dragOverSlot={dragOverSlot}
                    onDrop={handleDrop}
                    onDragOver={(id) => setDragOverSlot(id)}
                    onDragLeave={() => setDragOverSlot(null)}
                    onSlotDragStart={handleSlotDragStart}
                    onDragEnd={handleDragEnd}
                  />
                )}
                {viewMode === 'list' && (
                  <SlotListView slots={slots} products={products} totalColumns={columns.length} onAssign={handleAssign} onEdit={handleSlotEdit} />
                )}
                {viewMode === 'compact' && (
                  <SlotCompactView slots={slots} columns={columns} products={products} onAssign={handleAssign} onEdit={handleSlotEdit} />
                )}
              </div>

              {/* Bottom navigation */}
              <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 bg-white">
                <span className="text-xs text-muted hidden sm:block sm:mr-auto">La asignación es opcional y se aplica al crear los slots.</span>
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
                <p className="text-sm text-muted mt-1">Se crearán slots reales en esta máquina usando la plantilla seleccionada.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    {(() => { const Icon = selectedTemplate ? getTemplateIcon(selectedTemplate) : Package; return <Icon className="h-5 w-5 text-primary" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">{selectedTemplate?.name}</p>
                    <p className="text-xs text-muted">{selectedTemplate?.brand ?? 'Sin marca'}</p>
                  </div>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Columnas',       value: effectiveCols },
                    { label: 'Filas',          value: effectiveRows },
                    { label: 'Total slots',    value: slots.length  },
                    { label: 'Con producto',   value: assignedCount },
                    { label: 'Con capacidad',  value: slots.filter(s => s.capacity !== null).length },
                    { label: 'Sin capacidad',  value: slots.filter(s => s.capacity === null).length },
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
                    Se crearán <strong>{slots.length} slots</strong> nuevos en <strong>{machineName || `la máquina #${machineId}`}</strong>
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
                <button onClick={handleApplyTemplate} disabled={isPending || !selectedTemplate}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Aplicar plantilla
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
