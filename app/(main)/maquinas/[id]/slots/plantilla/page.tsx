'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Sparkles, Settings2,
  Grid3x3, AlignJustify, Layers, Plus, Package, Star, Minus, X,
  CheckCircle2, Cpu, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import { Monitor } from 'lucide-react';
import {
  MACHINE_TEMPLATES, MOCK_PRODUCTS,
  type MachineTemplate, type MockProduct,
} from '@/lib/data/machineTemplates';

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
      slots.push({
        id: `${col}${r}`,
        label: `${col}${r}`,
        column: col,
        row: r,
        mdb_code: (c + 1) * 10 + r,
        product: null,
      });
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
    <div
      className="inline-grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-[2px]"
          style={{ width: 10, height: 10, backgroundColor: color, opacity: 0.25 }}
        />
      ))}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template, selected, onSelect,
}: {
  template: MachineTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
        selected
          ? 'border-primary bg-primary/4 shadow-md shadow-primary/10'
          : 'border-gray-100 bg-white hover:border-primary/30'
      }`}
    >
      {template.popular && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          Popular
        </span>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">{template.emoji}</div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-dark leading-tight">{template.name}</p>
          <p className="text-xs text-muted mt-0.5">{template.brand}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">{template.description}</p>

      <div className="flex items-end justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{template.columns} cols × {template.rows} filas</span>
            <span className="text-xs font-bold text-dark">{template.columns * template.rows} slots</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLOR[template.category]}`}>
              {template.category}
            </span>
            {template.tags.map(t => (
              <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-100 bg-gray-50 text-gray-500">
                {t}
              </span>
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
function CustomTemplateCard({
  selected, columns, rows, onSelect, onChangeDimensions,
}: {
  selected: boolean;
  columns: number;
  rows: number;
  onSelect: () => void;
  onChangeDimensions: (c: number, r: number) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md cursor-pointer ${
        selected
          ? 'border-primary bg-primary/4 shadow-md shadow-primary/10'
          : 'border-dashed border-gray-200 bg-gray-50/50 hover:border-primary/30 hover:bg-white'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">✏️</div>
        <div>
          <p className="text-sm font-bold text-dark">Distribución personalizada</p>
          <p className="text-xs text-muted mt-0.5">Define tus propias columnas y filas</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Si tu máquina no está en la lista o tiene una distribución especial, configura la cantidad exacta de columnas y filas.
      </p>

      {selected && (
        <div
          className="space-y-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Columnas</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChangeDimensions(Math.max(1, columns - 1), rows)}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-dark">{columns}</span>
                <button
                  onClick={() => onChangeDimensions(Math.min(10, columns + 1), rows)}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Filas</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChangeDimensions(columns, Math.max(1, rows - 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-dark">{rows}</span>
                <button
                  onClick={() => onChangeDimensions(columns, Math.min(10, rows + 1))}
                  className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
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

// ── Product picker ────────────────────────────────────────────────────────────
function ProductPicker({
  current,
  onSelect,
  onClose,
}: {
  current: MockProduct | null;
  onSelect: (p: MockProduct | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-gray-50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Asignar producto</p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${!current ? 'bg-gray-50' : ''}`}
        >
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300" />
          <span className="text-gray-400">Sin producto</span>
          {!current && <Check className="h-3 w-3 text-primary ml-auto" />}
        </button>
        {MOCK_PRODUCTS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${current?.id === p.id ? 'bg-gray-50' : ''}`}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="truncate text-dark">{p.name}</span>
            {current?.id === p.id && <Check className="h-3 w-3 text-primary ml-auto shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Machine grid view ─────────────────────────────────────────────────────────
function MachineGridView({
  slots, columns, rows, activeSlot, setActiveSlot, onAssign,
}: {
  slots: GeneratedSlot[];
  columns: string[];
  rows: number;
  activeSlot: string | null;
  setActiveSlot: (id: string | null) => void;
  onAssign: (id: string, p: MockProduct | null) => void;
}) {
  const slotMap = useMemo(() => {
    const m: Record<string, GeneratedSlot> = {};
    slots.forEach(s => { m[s.id] = s; });
    return m;
  }, [slots]);

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      {/* Machine frame */}
      <div className="inline-block min-w-full">
        {/* Column headers */}
        <div
          className="grid mb-1"
          style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(72px, 1fr))` }}
        >
          <div />
          {columns.map(col => (
            <div key={col} className="text-center text-xs font-bold text-primary py-1">{col}</div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, ri) => ri + 1).map(row => (
          <div
            key={row}
            className="grid mb-1"
            style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(72px, 1fr))` }}
          >
            {/* Row label */}
            <div className="flex items-center justify-center text-xs font-bold text-gray-400 pr-1">{row}</div>

            {/* Slots */}
            {columns.map(col => {
              const slotId = `${col}${row}`;
              const slot = slotMap[slotId];
              if (!slot) return <div key={col} />;
              const isActive = activeSlot === slotId;

              return (
                <div key={col} className="px-0.5 relative">
                  <button
                    onClick={() => setActiveSlot(isActive ? null : slotId)}
                    className={`w-full rounded-lg border-2 p-1.5 text-left transition-all hover:shadow-sm group ${
                      isActive
                        ? 'border-primary shadow-md'
                        : slot.product
                          ? 'border-transparent hover:border-gray-200'
                          : 'border-dashed border-gray-200 hover:border-gray-300'
                    }`}
                    style={
                      slot.product
                        ? { backgroundColor: slot.product.color + '18', borderColor: slot.product.color + '50' }
                        : {}
                    }
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
                    <ProductPicker
                      current={slot.product}
                      onSelect={(p) => onAssign(slotId, p)}
                      onClose={() => setActiveSlot(null)}
                    />
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

// ── List view ─────────────────────────────────────────────────────────────────
function SlotListView({
  slots, onAssign,
}: {
  slots: GeneratedSlot[];
  onAssign: (id: string, p: MockProduct | null) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Etiqueta</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Código MDB</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Columna</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fila</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Producto asignado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {slots.map(slot => (
            <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-2.5">
                <span className="font-mono font-bold text-dark text-xs bg-gray-100 px-2 py-0.5 rounded">{slot.label}</span>
              </td>
              <td className="px-4 py-2.5">
                <span className="font-mono text-xs text-gray-500">{slot.mdb_code}</span>
              </td>
              <td className="px-4 py-2.5 text-xs font-semibold text-primary">{slot.column}</td>
              <td className="px-4 py-2.5 text-xs text-gray-500">{slot.row}</td>
              <td className="px-4 py-2.5">
                <div className="relative inline-block">
                  <button
                    onClick={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                      slot.product
                        ? 'border-transparent font-medium'
                        : 'border-dashed border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                    style={slot.product ? { backgroundColor: slot.product.color + '18', color: slot.product.color, borderColor: slot.product.color + '40' } : {}}
                  >
                    {slot.product ? (
                      <>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: slot.product.color }} />
                        {slot.product.name}
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Asignar
                      </>
                    )}
                  </button>
                  {activeSlot === slot.id && (
                    <ProductPicker
                      current={slot.product}
                      onSelect={(p) => { onAssign(slot.id, p); setActiveSlot(null); }}
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

// ── Compact view ──────────────────────────────────────────────────────────────
function SlotCompactView({
  slots, columns, onAssign,
}: {
  slots: GeneratedSlot[];
  columns: string[];
  onAssign: (id: string, p: MockProduct | null) => void;
}) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const byColumn = useMemo(() => {
    const map: Record<string, GeneratedSlot[]> = {};
    columns.forEach(c => { map[c] = []; });
    slots.forEach(s => map[s.column]?.push(s));
    return map;
  }, [slots, columns]);

  return (
    <div className="p-4 sm:p-6 flex flex-wrap gap-4">
      {columns.map(col => (
        <div key={col} className="min-w-[120px]">
          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[11px]">{col}</div>
            Columna {col}
          </div>
          <div className="flex flex-col gap-1">
            {byColumn[col]?.map(slot => (
              <div key={slot.id} className="relative">
                <button
                  onClick={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-all hover:shadow-sm ${
                    slot.product
                      ? 'border-transparent'
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
                  style={slot.product ? {
                    backgroundColor: slot.product.color + '15',
                    borderColor: slot.product.color + '40',
                  } : {}}
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
                  <ProductPicker
                    current={slot.product}
                    onSelect={(p) => { onAssign(slot.id, p); setActiveSlot(null); }}
                    onClose={() => setActiveSlot(null)}
                  />
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
  const params       = useParams();
  const machineId    = params.id as string;

  const [step, setStep]                   = useState<Step>(1);
  const [selectedTemplate, setTemplate]   = useState<MachineTemplate | null>(null);
  const [isCustom, setIsCustom]           = useState(false);
  const [customCols, setCustomCols]       = useState(4);
  const [customRows, setCustomRows]       = useState(5);
  const [viewMode, setViewMode]           = useState<ViewMode>('machine');
  const [slots, setSlots]                 = useState<GeneratedSlot[]>([]);
  const [activeSlot, setActiveSlot]       = useState<string | null>(null);
  const [applied, setApplied]             = useState(false);

  const effectiveCols = isCustom ? customCols : (selectedTemplate?.columns ?? 0);
  const effectiveRows = isCustom ? customRows : (selectedTemplate?.rows ?? 0);
  const columns       = useMemo(() => COL_LETTERS.slice(0, effectiveCols).split(''), [effectiveCols]);
  const assignedCount = slots.filter(s => s.product !== null).length;
  const canProceed    = selectedTemplate !== null || isCustom;

  const handleSelectTemplate = (t: MachineTemplate) => {
    setTemplate(t);
    setIsCustom(false);
    setSlots(generateSlots(t.columns, t.rows));
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    setTemplate(null);
    setSlots(generateSlots(customCols, customRows));
  };

  const handleCustomDims = (c: number, r: number) => {
    setCustomCols(c);
    setCustomRows(r);
    setSlots(generateSlots(c, r));
  };

  const handleAssign = (slotId: string, product: MockProduct | null) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, product } : s));
    setActiveSlot(null);
  };

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
              <div className="flex justify-between text-sm">
                <span className="text-muted">Plantilla</span>
                <span className="font-medium text-dark">{isCustom ? 'Personalizada' : selectedTemplate?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Distribución</span>
                <span className="font-medium text-dark">{effectiveCols} cols × {effectiveRows} filas</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Slots creados</span>
                <span className="font-medium text-dark">{slots.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Con producto</span>
                <span className="font-medium text-emerald-600">{assignedCount}</span>
              </div>
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
      <PageHeader
        icon={Monitor}
        title="Aplicar plantilla"
        subtitle={`Máquina #${machineId}`}
        backHref={`/maquinas/${machineId}?tab=productos`}
        variant="white"
      />

      <main className="flex-1 overflow-auto">

        {/* Step indicator */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-1.5">
              {[
                { n: 1 as Step, label: 'Seleccionar plantilla' },
                { n: 2 as Step, label: 'Configurar slots' },
                { n: 3 as Step, label: 'Confirmar' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-2 ${step >= s.n ? 'text-primary' : 'text-gray-400'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      step > s.n  ? 'bg-primary border-primary text-white' :
                      step === s.n ? 'border-primary text-primary bg-primary/5' :
                      'border-gray-200 text-gray-400 bg-white'
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

        <div className="p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-dark">Elige la plantilla de tu máquina</h2>
                  <p className="text-sm text-muted mt-1">
                    Selecciona el modelo de tu máquina para generar automáticamente los slots con sus códigos MDB.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MACHINE_TEMPLATES.map(t => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      selected={selectedTemplate?.id === t.id}
                      onSelect={() => handleSelectTemplate(t)}
                    />
                  ))}
                  <CustomTemplateCard
                    selected={isCustom}
                    columns={customCols}
                    rows={customRows}
                    onSelect={handleSelectCustom}
                    onChangeDimensions={handleCustomDims}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceed}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-dark">
                      {isCustom ? 'Distribución personalizada' : selectedTemplate?.name}
                    </h2>
                    <p className="text-sm text-muted">
                      {effectiveCols} columnas × {effectiveRows} filas
                      {' · '}<span className="font-semibold text-dark">{slots.length} slots</span>
                      {assignedCount > 0 && ` · ${assignedCount} con producto`}
                    </p>
                  </div>

                  {/* View mode tabs */}
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    {([
                      { mode: 'machine' as ViewMode, icon: Grid3x3,      label: 'Máquina' },
                      { mode: 'list'    as ViewMode, icon: AlignJustify,  label: 'Lista' },
                      { mode: 'compact' as ViewMode, icon: Layers,        label: 'Compacta' },
                    ]).map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                          viewMode === mode
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:block">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor card */}
                <div className="card overflow-hidden">
                  {viewMode === 'machine' && (
                    <MachineGridView
                      slots={slots}
                      columns={columns}
                      rows={effectiveRows}
                      activeSlot={activeSlot}
                      setActiveSlot={setActiveSlot}
                      onAssign={handleAssign}
                    />
                  )}
                  {viewMode === 'list' && (
                    <SlotListView slots={slots} onAssign={handleAssign} />
                  )}
                  {viewMode === 'compact' && (
                    <SlotCompactView slots={slots} columns={columns} onAssign={handleAssign} />
                  )}
                </div>

                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  La asignación de productos es opcional. Puedes configurarlo después desde el inventario de la máquina.
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="max-w-lg mx-auto space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-dark">Confirmar creación de slots</h2>
                  <p className="text-sm text-muted mt-1">
                    Revisa el resumen antes de aplicar la plantilla a la máquina.
                  </p>
                </div>

                {/* Summary card */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                  <div className="px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-xl">
                      {isCustom ? '✏️' : selectedTemplate?.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark">
                        {isCustom ? 'Distribución personalizada' : selectedTemplate?.name}
                      </p>
                      <p className="text-xs text-muted">
                        {isCustom ? 'Configuración manual' : selectedTemplate?.brand}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-2 gap-4">
                    {[
                      { label: 'Columnas', value: effectiveCols },
                      { label: 'Filas', value: effectiveRows },
                      { label: 'Total de slots', value: slots.length },
                      { label: 'Con producto', value: assignedCount },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-muted">{label}</p>
                        <p className="text-lg font-bold text-dark">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Slot preview chips */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vista previa de slots</p>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.slice(0, 20).map(s => (
                        <div
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
                          style={
                            s.product
                              ? { backgroundColor: s.product.color + '18', borderColor: s.product.color + '50', color: s.product.color }
                              : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                          }
                        >
                          {s.label}
                        </div>
                      ))}
                      {slots.length > 20 && (
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200">
                          +{slots.length - 20} más
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Esta es una maqueta. En producción, los slots se crearían en la API y se publicarían por MQTT a la máquina.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => setApplied(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Cpu className="h-4 w-4" />
                    Crear {slots.length} slots
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
