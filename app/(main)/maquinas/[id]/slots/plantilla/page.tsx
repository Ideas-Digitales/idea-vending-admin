'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Sparkles, Search,
  Grid3x3, AlignJustify, Layers, Plus, Package, Star, Minus, X,
  CheckCircle2, Cpu, Zap, Factory, Server, Box, ShoppingCart,
  LayoutTemplate, Coffee, Pencil, type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import { Monitor } from 'lucide-react';
import {
  MACHINE_TEMPLATES, MOCK_PRODUCTS,
  type MachineTemplate, type MockProduct,
} from '@/lib/data/machineTemplates';

// ── Icon map ───────────────────────────────────────────────────────────────────
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  'crane-167':      Factory,
  'jofemar-vision': Server,
  'bianchi-rondo':  Box,
  'sielaff-f3':     ShoppingCart,
  'ivs-slim':       LayoutTemplate,
  'nw-g-snack':     Coffee,
};

// ── Types ──────────────────────────────────────────────────────────────────────
type ViewMode = 'machine' | 'list' | 'compact';
type Step = 1 | 2 | 3;

interface GeneratedSlot {
  id: string;
  label: string;
  column: string;
  row: number;
  mdb_code: number;
  product: MockProduct | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const COL_LETTERS = 'ABCDEFGHIJ';

function generateSlots(columns: number, rows: number): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  for (let c = 0; c < columns; c++) {
    const col = COL_LETTERS[c];
    for (let r = 1; r <= rows; r++) {
      slots.push({ id: `${col}${r}`, label: `${col}${r}`, column: col, row: r, mdb_code: (c + 1) * 10 + r, product: null });
    }
  }
  return slots;
}

const CATEGORY_COLOR: Record<string, string> = {
  snack:    'bg-amber-50 text-amber-700 border-amber-200',
  beverage: 'bg-sky-50 text-sky-700 border-sky-200',
  combo:    'bg-violet-50 text-violet-700 border-violet-200',
  compact:  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// ── Mini grid preview ─────────────────────────────────────────────────────────
function MiniGrid({ columns, rows, color = '#3157b2' }: { columns: number; rows: number; color?: string }) {
  return (
    <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <div key={i} className="rounded-[2px]" style={{ width: 10, height: 10, backgroundColor: color, opacity: 0.25 }} />
      ))}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, selected, onSelect }: { template: MachineTemplate; selected: boolean; onSelect: () => void }) {
  const Icon = TEMPLATE_ICONS[template.id] ?? Package;
  return (
    <button
      onClick={onSelect}
      className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
        selected ? 'border-primary bg-primary/4 shadow-md shadow-primary/10' : 'border-gray-100 bg-white hover:border-primary/30'
      }`}
    >
      {template.popular && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Popular
        </span>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-dark leading-tight">{template.name}</p>
          <p className="text-xs text-muted mt-0.5">{template.brand}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">{template.description}</p>
      <div className="flex items-end justify-between gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted">{template.columns} cols × {template.rows} filas · <strong className="text-dark">{template.columns * template.rows} slots</strong></span>
          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLOR[template.category]}`}>{template.category}</span>
            {template.tags.map(t => (
              <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-100 bg-gray-50 text-gray-500">{t}</span>
            ))}
          </div>
        </div>
        <MiniGrid columns={template.columns} rows={template.rows} color={selected ? '#3157b2' : '#6b7280'} />
      </div>
      {selected && (
        <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

// ── Custom template card ──────────────────────────────────────────────────────
function CustomTemplateCard({ selected, columns, rows, onSelect, onChangeDimensions }: {
  selected: boolean; columns: number; rows: number;
  onSelect: () => void; onChangeDimensions: (c: number, r: number) => void;
}) {
  return (
    <div
      role="button" tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md cursor-pointer ${
        selected ? 'border-primary bg-primary/4 shadow-md shadow-primary/10' : 'border-dashed border-gray-200 bg-gray-50/50 hover:border-primary/30 hover:bg-white'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <Pencil className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-dark">Distribución personalizada</p>
          <p className="text-xs text-muted mt-0.5">Define tus propias columnas y filas</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Si tu máquina no está en la lista o tiene una distribución especial, configura la cantidad exacta de columnas y filas.
      </p>
      {selected && (
        <div className="space-y-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-4">
            {[
              { label: 'Columnas', val: columns, min: 1, max: 10, set: (v: number) => onChangeDimensions(v, rows) },
              { label: 'Filas',    val: rows,    min: 1, max: 15, set: (v: number) => onChangeDimensions(columns, v) },
            ].map(({ label, val, min, max, set }) => (
              <div key={label} className="flex-1">
                <span className="text-xs font-semibold text-gray-500 block mb-1">{label}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => set(Math.max(min, val - 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-dark">{val}</span>
                  <button onClick={() => set(Math.min(max, val + 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{columns * rows} slots en total</span>
            <MiniGrid columns={columns} rows={rows} color="#3157b2" />
          </div>
        </div>
      )}
      {selected && (
        <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

// ── Slot edit panel ────────────────────────────────────────────────────────────
// Products are the main focus; label/MDB are compact secondary fields at the top.
function SlotEditPanel({ slot, onEdit, onAssign, onClose }: {
  slot: GeneratedSlot;
  onEdit: (id: string, field: 'label' | 'mdb_code', value: string | number) => void;
  onAssign: (id: string, p: MockProduct | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [label,  setLabel]  = useState(slot.label);
  const [mdb,    setMdb]    = useState(String(slot.mdb_code));
  const [search, setSearch] = useState('');

  // Keep local state in sync if slot changes
  useEffect(() => { setLabel(slot.label); setMdb(String(slot.mdb_code)); }, [slot.id, slot.label, slot.mdb_code]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    // Auto-focus search on open
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const commitLabel = () => { const v = label.trim(); if (v && v !== slot.label) onEdit(slot.id, 'label', v); };
  const commitMdb   = () => { const v = parseInt(mdb, 10); if (!isNaN(v) && v !== slot.mdb_code) onEdit(slot.id, 'mdb_code', v); };

  const filtered = useMemo(
    () => search.trim() ? MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : MOCK_PRODUCTS,
    [search],
  );

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
    >
      {/* Compact meta row: label + MDB */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-medium text-gray-400 shrink-0">Etiqueta</span>
          <input
            type="text" value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => { if (e.key === 'Enter') { commitLabel(); (e.target as HTMLInputElement).blur(); } }}
            className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-dark bg-white border border-gray-200 rounded focus:outline-none focus:border-primary transition-colors text-center"
            maxLength={8}
          />
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-medium text-gray-400 shrink-0">MDB</span>
          <input
            type="number" value={mdb}
            onChange={e => setMdb(e.target.value)}
            onBlur={commitMdb}
            onKeyDown={e => { if (e.key === 'Enter') { commitMdb(); (e.target as HTMLInputElement).blur(); } }}
            className="w-14 px-1.5 py-0.5 text-xs font-mono text-dark bg-white border border-gray-200 rounded focus:outline-none focus:border-primary transition-colors text-center"
            min={0} max={999}
          />
        </div>
        <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-500 transition-colors shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs text-dark placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Product list — main focus */}
      <div className="max-h-64 overflow-y-auto">
        {!search && (
          <button
            onClick={() => onAssign(slot.id, null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors ${!slot.product ? 'bg-primary/4' : ''}`}
          >
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300 shrink-0" />
            <span className="text-gray-400 flex-1 text-left">Sin producto</span>
            {!slot.product && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          </button>
        )}
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-xs text-gray-400 text-center">Sin resultados para &ldquo;{search}&rdquo;</p>
        ) : (
          filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onAssign(slot.id, p)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors ${slot.product?.id === p.id ? 'bg-primary/4' : ''}`}
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="truncate text-dark flex-1 text-left">{p.name}</span>
              {slot.product?.id === p.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Machine grid view ─────────────────────────────────────────────────────────
function MachineGridView({ slots, columns, rows, activeSlot, setActiveSlot, onAssign, onEdit }: {
  slots: GeneratedSlot[];
  columns: string[];
  rows: number;
  activeSlot: string | null;
  setActiveSlot: (id: string | null) => void;
  onAssign: (id: string, p: MockProduct | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code', value: string | number) => void;
}) {
  const slotMap = useMemo(() => {
    const m: Record<string, GeneratedSlot> = {};
    slots.forEach(s => { m[s.id] = s; });
    return m;
  }, [slots]);

  return (
    <div className="p-4 sm:p-5 overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Column headers */}
        <div className="grid mb-1" style={{ gridTemplateColumns: `24px repeat(${columns.length}, minmax(80px, 1fr))` }}>
          <div />
          {columns.map(col => (
            <div key={col} className="text-center text-xs font-bold text-primary py-1">{col}</div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }, (_, ri) => ri + 1).map(row => (
          <div key={row} className="grid mb-1" style={{ gridTemplateColumns: `24px repeat(${columns.length}, minmax(80px, 1fr))` }}>
            <div className="flex items-center justify-center text-xs font-bold text-gray-400 pr-1">{row}</div>
            {columns.map(col => {
              const slotId = `${col}${row}`;
              const slot = slotMap[slotId];
              if (!slot) return <div key={col} />;
              const isActive = activeSlot === slotId;
              return (
                <div key={col} className="px-0.5 relative">
                  <button
                    onClick={() => setActiveSlot(isActive ? null : slotId)}
                    className={`w-full rounded-xl border-2 p-2 text-left transition-all hover:shadow-sm group ${
                      isActive ? 'border-primary shadow-md' : slot.product ? 'border-transparent hover:border-gray-200' : 'border-dashed border-gray-200 hover:border-gray-300'
                    }`}
                    style={slot.product ? { backgroundColor: slot.product.color + '18', borderColor: slot.product.color + '50' } : {}}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-dark">{slot.label}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{slot.mdb_code}</span>
                    </div>
                    {slot.product ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slot.product.color }} />
                        <span className="text-[10px] text-gray-600 truncate leading-tight">{slot.product.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-3 w-3 text-gray-300" />
                      </div>
                    )}
                  </button>
                  {isActive && (
                    <SlotEditPanel slot={slot} onEdit={onEdit} onAssign={onAssign} onClose={() => setActiveSlot(null)} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline editable cell ──────────────────────────────────────────────────────
function InlineEdit({ value, type = 'text', onCommit, className }: {
  value: string; type?: 'text' | 'number';
  onCommit: (v: string) => void; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);

  const commit = () => { setEditing(false); if (draft.trim() !== value) onCommit(draft.trim()); };

  if (editing) {
    return (
      <input
        autoFocus type={type} value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`px-2 py-0.5 rounded border border-primary text-xs font-mono focus:outline-none w-20 ${className ?? ''}`}
      />
    );
  }
  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Clic para editar"
      className={`font-mono text-xs group inline-flex items-center gap-1 hover:text-primary transition-colors ${className ?? ''}`}
    >
      {value}
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function SlotListView({ slots, onAssign, onEdit }: {
  slots: GeneratedSlot[];
  onAssign: (id: string, p: MockProduct | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code', value: string | number) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Etiqueta</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Código MDB</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Col</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fila</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Producto asignado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {slots.map(slot => (
            <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-2">
                <InlineEdit value={slot.label} onCommit={v => onEdit(slot.id, 'label', v)} className="font-bold text-dark bg-gray-100 px-2 py-0.5 rounded" />
              </td>
              <td className="px-4 py-2">
                <InlineEdit value={String(slot.mdb_code)} type="number" onCommit={v => { const n = parseInt(v, 10); if (!isNaN(n)) onEdit(slot.id, 'mdb_code', n); }} className="text-gray-500" />
              </td>
              <td className="px-4 py-2.5 text-xs font-semibold text-primary">{slot.column}</td>
              <td className="px-4 py-2.5 text-xs text-gray-500">{slot.row}</td>
              <td className="px-4 py-2.5">
                <div className="relative inline-block">
                  <button
                    onClick={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${slot.product ? 'border-transparent font-medium' : 'border-dashed border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    style={slot.product ? { backgroundColor: slot.product.color + '18', color: slot.product.color, borderColor: slot.product.color + '40' } : {}}
                  >
                    {slot.product ? (
                      <><div className="w-2 h-2 rounded-full" style={{ backgroundColor: slot.product.color }} />{slot.product.name}</>
                    ) : (
                      <><Plus className="h-3 w-3" />Asignar</>
                    )}
                  </button>
                  {activeSlot === slot.id && (
                    <SlotEditPanel slot={slot} onEdit={onEdit} onAssign={(id, p) => { onAssign(id, p); setActiveSlot(null); }} onClose={() => setActiveSlot(null)} />
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

// ── Compact view ──────────────────────────────────────────────────────────────
function SlotCompactView({ slots, columns, onAssign, onEdit }: {
  slots: GeneratedSlot[];
  columns: string[];
  onAssign: (id: string, p: MockProduct | null) => void;
  onEdit: (id: string, field: 'label' | 'mdb_code', value: string | number) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const byColumn = useMemo(() => {
    const map: Record<string, GeneratedSlot[]> = {};
    columns.forEach(c => { map[c] = []; });
    slots.forEach(s => map[s.column]?.push(s));
    return map;
  }, [slots, columns]);

  return (
    <div className="p-4 sm:p-5 flex flex-wrap gap-3">
      {columns.map(col => (
        <div key={col} className="min-w-[130px]">
          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[11px]">{col}</div>
            Col. {col}
          </div>
          <div className="flex flex-col gap-1">
            {byColumn[col]?.map(slot => (
              <div key={slot.id} className="relative">
                <button
                  onClick={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-all hover:shadow-sm ${slot.product ? 'border-transparent' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                  style={slot.product ? { backgroundColor: slot.product.color + '15', borderColor: slot.product.color + '40' } : {}}
                >
                  <span className="font-mono font-bold text-[10px] text-dark w-5 shrink-0">{slot.label}</span>
                  {slot.product ? (
                    <>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slot.product.color }} />
                      <span className="truncate text-[10px]" style={{ color: slot.product.color }}>{slot.product.name}</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-300">Sin producto</span>
                  )}
                </button>
                {activeSlot === slot.id && (
                  <SlotEditPanel slot={slot} onEdit={onEdit} onAssign={(id, p) => { onAssign(id, p); setActiveSlot(null); }} onClose={() => setActiveSlot(null)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlantillaMaquinaPage() {
  const params    = useParams();
  const machineId = params.id as string;

  const [step,             setStep]       = useState<Step>(1);
  const [selectedTemplate, setTemplate]   = useState<MachineTemplate | null>(null);
  const [isCustom,         setIsCustom]   = useState(false);
  const [customCols,       setCustomCols] = useState(4);
  const [customRows,       setCustomRows] = useState(5);
  const [viewMode,         setViewMode]   = useState<ViewMode>('machine');
  const [slots,            setSlots]      = useState<GeneratedSlot[]>([]);
  const [activeSlot,       setActiveSlot] = useState<string | null>(null);
  const [applied,          setApplied]    = useState(false);

  const effectiveCols = isCustom ? customCols : (selectedTemplate?.columns ?? 0);
  const effectiveRows = isCustom ? customRows : (selectedTemplate?.rows ?? 0);
  const columns       = useMemo(() => COL_LETTERS.slice(0, effectiveCols).split(''), [effectiveCols]);
  const assignedCount = slots.filter(s => s.product !== null).length;
  const canProceed    = selectedTemplate !== null || isCustom;

  const handleSelectTemplate = (t: MachineTemplate) => { setTemplate(t); setIsCustom(false); setSlots(generateSlots(t.columns, t.rows)); };
  const handleSelectCustom   = () => { setIsCustom(true); setTemplate(null); setSlots(generateSlots(customCols, customRows)); };
  const handleCustomDims     = (c: number, r: number) => { setCustomCols(c); setCustomRows(r); setSlots(generateSlots(c, r)); };
  const handleAssign         = (slotId: string, product: MockProduct | null) => { setSlots(prev => prev.map(s => s.id === slotId ? { ...s, product } : s)); setActiveSlot(null); };
  const handleSlotEdit       = (slotId: string, field: 'label' | 'mdb_code', value: string | number) => { setSlots(prev => prev.map(s => s.id === slotId ? { ...s, [field]: value } : s)); };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (applied) {
    return (
      <>
        <PageHeader icon={Monitor} title="Aplicar plantilla" subtitle={`Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=productos`} variant="white" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark">¡Plantilla aplicada!</h2>
              <p className="text-sm text-muted mt-1">
                Se crearon <strong>{slots.length} slots</strong> para la máquina.
                {assignedCount > 0 && ` ${assignedCount} con producto asignado.`}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumen</p>
              {[
                { label: 'Plantilla',     value: isCustom ? 'Personalizada' : selectedTemplate?.name },
                { label: 'Distribución',  value: `${effectiveCols} cols × ${effectiveRows} filas` },
                { label: 'Slots creados', value: slots.length },
                { label: 'Con producto',  value: assignedCount },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium text-dark">{value}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/maquinas/${machineId}?tab=productos`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Ver inventario
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader icon={Monitor} title="Aplicar plantilla" subtitle={`Máquina #${machineId}`} backHref={`/maquinas/${machineId}?tab=productos`} variant="white" />

      <main className="flex-1 flex flex-col overflow-auto">

        {/* Step indicator */}
        <div className="bg-white border-b border-gray-100 shrink-0">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center gap-1.5">
              {([
                { n: 1 as Step, label: 'Seleccionar plantilla' },
                { n: 2 as Step, label: 'Configurar slots' },
                { n: 3 as Step, label: 'Confirmar' },
              ]).map((s, i) => (
                <div key={s.n} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-2 ${step >= s.n ? 'text-primary' : 'text-gray-400'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      step > s.n ? 'bg-primary border-primary text-white' : step === s.n ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-400 bg-white'
                    }`}>
                      {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{s.label}</span>
                  </div>
                  {i < 2 && <ChevronRight className="h-4 w-4 text-gray-200 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="flex-1 p-4 sm:p-6">
            <div className="max-w-5xl mx-auto space-y-5">
              <div>
                <h2 className="text-lg font-bold text-dark">Elige la plantilla de tu máquina</h2>
                <p className="text-sm text-muted mt-1">Selecciona el modelo para generar automáticamente los slots con sus códigos MDB.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MACHINE_TEMPLATES.map(t => (
                  <TemplateCard key={t.id} template={t} selected={selectedTemplate?.id === t.id} onSelect={() => handleSelectTemplate(t)} />
                ))}
                <CustomTemplateCard selected={isCustom} columns={customCols} rows={customRows} onSelect={handleSelectCustom} onChangeDimensions={handleCustomDims} />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── full width, no inner container limit */}
        {step === 2 && (
          <div className="flex-1 flex flex-col p-4 sm:p-5 gap-4">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-dark">
                  {isCustom ? 'Distribución personalizada' : selectedTemplate?.name}
                  <span className="ml-2 text-xs font-normal text-muted">{effectiveCols} cols × {effectiveRows} filas · {slots.length} slots{assignedCount > 0 ? ` · ${assignedCount} con producto` : ''}</span>
                </h2>
              </div>
              <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                {([
                  { mode: 'machine' as ViewMode, icon: Grid3x3,     label: 'Máquina' },
                  { mode: 'list'    as ViewMode, icon: AlignJustify, label: 'Lista' },
                  { mode: 'compact' as ViewMode, icon: Layers,       label: 'Compacta' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${viewMode === mode ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:block">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor — takes remaining height */}
            <div className="flex-1 card min-h-0">
              {viewMode === 'machine' && (
                <MachineGridView slots={slots} columns={columns} rows={effectiveRows} activeSlot={activeSlot} setActiveSlot={setActiveSlot} onAssign={handleAssign} onEdit={handleSlotEdit} />
              )}
              {viewMode === 'list' && (
                <SlotListView slots={slots} onAssign={handleAssign} onEdit={handleSlotEdit} />
              )}
              {viewMode === 'compact' && (
                <SlotCompactView slots={slots} columns={columns} onAssign={handleAssign} onEdit={handleSlotEdit} />
              )}
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                La asignación de productos es opcional.
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
                <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="flex-1 p-4 sm:p-6">
            <div className="max-w-lg mx-auto space-y-5">
              <div>
                <h2 className="text-lg font-bold text-dark">Confirmar creación de slots</h2>
                <p className="text-sm text-muted mt-1">Revisa el resumen antes de aplicar la plantilla a la máquina.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    {(() => {
                      if (isCustom) return <Pencil className="h-5 w-5 text-primary" />;
                      const Icon = selectedTemplate ? (TEMPLATE_ICONS[selectedTemplate.id] ?? Package) : Package;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">{isCustom ? 'Distribución personalizada' : selectedTemplate?.name}</p>
                    <p className="text-xs text-muted">{isCustom ? 'Configuración manual' : selectedTemplate?.brand}</p>
                  </div>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Columnas', value: effectiveCols },
                    { label: 'Filas',    value: effectiveRows },
                    { label: 'Total slots', value: slots.length },
                    { label: 'Con producto', value: assignedCount },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted">{label}</p>
                      <p className="text-lg font-bold text-dark">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vista previa de slots</p>
                  <div className="flex flex-wrap gap-1.5">
                    {slots.slice(0, 24).map(s => (
                      <div
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
                        style={s.product
                          ? { backgroundColor: s.product.color + '18', borderColor: s.product.color + '50', color: s.product.color }
                          : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {s.label}
                      </div>
                    ))}
                    {slots.length > 24 && (
                      <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200">+{slots.length - 24} más</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
                <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Esta es una maqueta. En producción, los slots se crearían en la API y se publicarían por MQTT a la máquina.</p>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
                <button onClick={() => setApplied(true)} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                  <Cpu className="h-4 w-4" /> Crear {slots.length} slots
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
