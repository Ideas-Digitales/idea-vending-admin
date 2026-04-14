'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Grid3x3, Loader2, Save, Minus, Plus,
  ChevronDown, ChevronUp, Info, ImageIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import { notify } from '@/lib/adapters/notification.adapter';
import { createMachineTemplateAction } from '@/lib/actions/machine-templates';
import { useUser } from '@/lib/stores/authStore';
import { uploadTemplateImage } from '@/lib/utils/imageUpload';
import type { CreateMachineTemplateFormData } from '@/lib/schemas/machine-template.schema';

type TemplateSlotForm = CreateMachineTemplateFormData['slots'][number];
type LabelScheme = 'row-col' | 'col-row' | 'sequential' | 'mdb';
type SlotSpan = 1 | 2 | 3;

const LABEL_SCHEMES: { value: LabelScheme; label: string; example: string; hint: string }[] = [
  { value: 'row-col',    label: 'Letra · Número',  example: 'A1, A2…', hint: 'Usa la fila como letra y la columna como número' },
  { value: 'sequential', label: 'Consecutivo',     example: '1, 2, 3…', hint: 'Numeración continua de izquierda a derecha' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLabel(
  c: number, r: number, scheme: LabelScheme,
  colNames: string[], rowNames: string[], totalCols: number
): string {
  const col = colNames[c] ?? String(c + 1);
  const row = rowNames[r] ?? String.fromCharCode(65 + r);
  switch (scheme) {
    case 'row-col':    return `${row}${col}`;
    case 'col-row':    return `${col}${row}`;
    case 'sequential': return String(r * totalCols + c + 1);
    case 'mdb':        return String((c + 1) * 10 + (r + 1));
  }
}

function initColNames(n: number, existing: string[] = []): string[] {
  return Array.from({ length: n }, (_, i) => existing[i] ?? String(i + 1));
}

function initRowNames(n: number, existing: string[] = []): string[] {
  return Array.from({ length: n }, (_, i) => existing[i] ?? String.fromCharCode(65 + i));
}

function buildSlots(
  cols: number, rows: number,
  scheme: LabelScheme, colNames: string[], rowNames: string[],
  existingSlots?: TemplateSlotForm[]
): TemplateSlotForm[] {
  const cellW = parseFloat((100 / cols).toFixed(2));
  const cellH = parseFloat((100 / rows).toFixed(2));
  const slots: TemplateSlotForm[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const existing = existingSlots?.[c * rows + r];
      slots.push({
        label:            makeLabel(c, r, scheme, colNames, rowNames, cols),
        column:           colNames[c] ?? String(c + 1),
        row:              r + 1,
        mdb_code:         (c + 1) * 10 + (r + 1),
        x:                parseFloat((c * cellW).toFixed(2)),
        y:                parseFloat((r * cellH).toFixed(2)),
        width:            cellW,
        height:           cellH,
        default_capacity: existing?.default_capacity ?? null,
      });
    }
  }
  return slots;
}

function computeCovered(
  spans: Record<string, SlotSpan>, columns: number, rows: number
): Set<string> {
  const covered = new Set<string>();
  for (let c = 0; c < columns; c++) {
    for (let r = 0; r < rows; r++) {
      const span = spans[`${c}-${r}`] ?? 1;
      for (let s = 1; s < span; s++) {
        if (c + s < columns) covered.add(`${c + s}-${r}`);
      }
    }
  }
  return covered;
}

function cleanSpans(
  current: Record<string, SlotSpan>, cols: number, rows: number
): Record<string, SlotSpan> {
  const cleaned: Record<string, SlotSpan> = {};
  for (const [key, span] of Object.entries(current)) {
    const [c, r] = key.split('-').map(Number);
    if (c < cols && r < rows && c + span - 1 < cols) cleaned[key] = span;
  }
  return cleaned;
}

// ── Mini grid preview ─────────────────────────────────────────────────────────

function MiniGridPreview({ columns, rows }: { columns: number; rows: number }) {
  const maxShow = 8;
  const showCols = Math.min(columns, maxShow);
  const showRows = Math.min(rows, maxShow);
  return (
    <div
      className="inline-grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${showCols}, 1fr)` }}
    >
      {Array.from({ length: showRows }, (_, r) =>
        Array.from({ length: showCols }, (_, c) => (
          <div
            key={`${c}-${r}`}
            className="w-3 h-3 rounded-[2px] bg-[#3157b2]/20 border border-[#3157b2]/30"
          />
        ))
      )}
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-lg font-bold text-gray-900 tabular-nums select-none">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="text-[11px] text-gray-400">máx. {max}</span>
    </div>
  );
}

// ── Slot grid ─────────────────────────────────────────────────────────────────

function SlotGrid({
  slots, columns, rows, spans, colNames, rowNames,
  onSlotChange, onColRename, onRowRename, onSpanChange,
}: {
  slots: TemplateSlotForm[];
  columns: number;
  rows: number;
  spans: Record<string, SlotSpan>;
  colNames: string[];
  rowNames: string[];
  onSlotChange: (i: number, field: 'label' | 'mdb_code' | 'default_capacity', value: string) => void;
  onColRename: (c: number, value: string) => void;
  onRowRename: (r: number, value: string) => void;
  onSpanChange: (c: number, r: number, span: SlotSpan) => void;
}) {
  const slotAt = (c: number, r: number) => slots[c * rows + r];
  const covered = computeCovered(spans, columns, rows);

  function canSpan(c: number, r: number, targetSpan: SlotSpan): boolean {
    if (targetSpan === 1) return true;
    if (c + targetSpan - 1 >= columns) return false;
    for (let i = 1; i < targetSpan; i++) {
      if ((spans[`${c + i}-${r}`] ?? 1) > 1) return false;
      for (let p = 0; p < c; p++) {
        if (p + (spans[`${p}-${r}`] ?? 1) > c + i) return false;
      }
    }
    return true;
  }

  const headerInputCls =
    'w-full text-center text-[11px] font-bold text-gray-400 bg-transparent ' +
    'border border-transparent rounded-md px-1 py-1 focus:border-[#3157b2]/40 ' +
    'focus:bg-white focus:text-gray-700 focus:outline-none transition-all hover:bg-gray-50';

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="inline-grid gap-1.5"
        style={{
          gridTemplateColumns: `28px repeat(${columns}, minmax(64px, 1fr))`,
          gridTemplateRows: `auto repeat(${rows}, auto)`,
        }}
      >
        {/* Corner */}
        <div style={{ gridRow: 1, gridColumn: 1 }} />

        {/* Column headers */}
        {Array.from({ length: columns }, (_, c) => (
          <div key={`ch-${c}`} style={{ gridRow: 1, gridColumn: c + 2 }}>
            <input
              value={colNames[c] ?? String(c + 1)}
              onChange={(e) => onColRename(c, e.target.value)}
              className={headerInputCls}
              title="Renombrar columna"
            />
          </div>
        ))}

        {/* Row headers */}
        {Array.from({ length: rows }, (_, r) => (
          <div key={`rh-${r}`} style={{ gridRow: r + 2, gridColumn: 1 }} className="flex items-center justify-center">
            <input
              value={rowNames[r] ?? String.fromCharCode(65 + r)}
              onChange={(e) => onRowRename(r, e.target.value)}
              className={headerInputCls}
              title="Renombrar fila"
            />
          </div>
        ))}

        {/* Cells */}
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: columns }, (_, c) => {
            const key  = `${c}-${r}`;
            if (covered.has(key)) return null;

            const span = spans[key] ?? 1;
            const slot = slotAt(c, r);
            if (!slot) return null;

            const isWide = span > 1;

            return (
              <div
                key={key}
                style={{
                  gridRow:    r + 2,
                  gridColumn: isWide ? `${c + 2} / span ${span}` : c + 2,
                }}
                className={`group relative rounded-xl border-2 transition-all flex flex-col
                  items-center justify-between gap-1 py-2 px-1.5 min-h-[88px] sm:min-h-[104px]
                  ${isWide
                    ? 'border-[#3157b2]/40 bg-[#3157b2]/5 shadow-inner'
                    : 'border-gray-200/80 bg-white hover:border-[#3157b2]/40 hover:shadow-sm'
                  }`}
              >
                {/* Span controls — always visible on touch, hover on desktop */}
                <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {([1, 2, 3] as SlotSpan[]).map((s) => {
                    const available = s === span || canSpan(c, r, s);
                    if (!available) return null;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onSpanChange(c, r, s)}
                        title={s === 1 ? 'Slot simple' : `Ocupa ${s} columnas`}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all leading-none ${
                          span === s
                            ? 'bg-[#3157b2] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                        }`}
                      >
                        {s}×
                      </button>
                    );
                  })}
                </div>

                {/* Label */}
                <input
                  value={slot.label}
                  onChange={(e) => onSlotChange(c * rows + r, 'label', e.target.value)}
                  className="w-full text-center text-sm font-bold text-[#203c84] bg-transparent
                             border-none outline-none focus:bg-[#3157b2]/5 rounded-md px-1
                             transition-colors placeholder:text-gray-300"
                  title="Etiqueta del slot"
                  placeholder="—"
                />

                {/* MDB code */}
                <div className="flex items-center gap-0.5 justify-center bg-gray-50/80 rounded-md px-1.5 py-0.5">
                  <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none select-none">
                    MDB
                  </span>
                  <input
                    type="number"
                    value={slot.mdb_code}
                    onChange={(e) => onSlotChange(c * rows + r, 'mdb_code', e.target.value)}
                    className="w-9 text-center text-[11px] font-mono text-gray-400 bg-transparent
                               border-none outline-none focus:text-gray-700 transition-colors"
                    title="Código MDB"
                  />
                </div>

                {/* Default capacity */}
                <div className="flex items-center gap-0.5 justify-center bg-gray-50/80 rounded-md px-1.5 py-0.5">
                  <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none select-none">
                    Cap
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={slot.default_capacity ?? ''}
                    onChange={(e) => onSlotChange(c * rows + r, 'default_capacity', e.target.value)}
                    className="w-9 text-center text-[11px] font-mono text-gray-400 bg-transparent
                               border-none outline-none focus:text-gray-700 transition-colors"
                    title="Stock máximo por defecto"
                    placeholder="—"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateMachineTemplatePage() {
  const router = useRouter();
  const user   = useUser();

  useEffect(() => {
    if (user && user.role !== 'admin') { router.replace('/dashboard'); }
  }, [user, router]);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [imageFile, setImageFile]         = useState<File | null>(null);
  const [imagePreview, setImagePreview]   = useState<string | null>(null);

  useEffect(() => {
    return () => { if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);
  const [mobileTab, setMobileTab]         = useState<'config' | 'grid'>('config');
  const [scheme, setScheme]               = useState<LabelScheme | null>(null);
  const [colNames, setColNames]           = useState<string[]>(() => initColNames(5));
  const [rowNames, setRowNames]           = useState<string[]>(() => initRowNames(6));
  const [spans, setSpans]                 = useState<Record<string, SlotSpan>>({});
  const [showOptional, setShowOptional]   = useState(false);
  const [formData, setFormData] = useState<CreateMachineTemplateFormData>({
    name: '', brand: '', image: '', description: '',
    columns: 5, rows: 6,
    slots: buildSlots(5, 6, 'row-col', initColNames(5), initRowNames(6)),
  });

  // ── Dimension updates ───────────────────────────────────────────────────────

  function updateColumns(value: number) {
    const newColNames = initColNames(value, colNames);
    const newSpans    = cleanSpans(spans, value, formData.rows);
    setColNames(newColNames);
    setSpans(newSpans);
    setFormData((cur) => ({
      ...cur, columns: value,
      slots: buildSlots(value, cur.rows, scheme ?? 'row-col', newColNames, rowNames, cur.slots),
    }));
  }

  function updateRows(value: number) {
    const newRowNames = initRowNames(value, rowNames);
    const newSpans    = cleanSpans(spans, formData.columns, value);
    setRowNames(newRowNames);
    setSpans(newSpans);
    setFormData((cur) => ({
      ...cur, rows: value,
      slots: buildSlots(cur.columns, value, scheme ?? 'row-col', colNames, newRowNames, cur.slots),
    }));
  }

  // ── Label scheme ────────────────────────────────────────────────────────────

  function updateScheme(selected: LabelScheme) {
    if (scheme === selected) {
      setScheme(null);
      return;
    }
    setScheme(selected);
    setFormData((cur) => ({
      ...cur,
      slots: buildSlots(cur.columns, cur.rows, selected, colNames, rowNames),
    }));
  }

  // ── Header renaming ─────────────────────────────────────────────────────────

  function handleColRename(colIdx: number, value: string) {
    const newColNames = colNames.map((n, i) => (i === colIdx ? value : n));
    setColNames(newColNames);
    setFormData((cur) => ({
      ...cur,
      slots: cur.slots.map((slot, i) => {
        const c = Math.floor(i / cur.rows);
        const r = i % cur.rows;
        if (c !== colIdx) return slot;
        return {
          ...slot,
          column: value,
          label: scheme === 'row-col'
            ? makeLabel(c, r, scheme, newColNames, rowNames, cur.columns)
            : slot.label,
        };
      }),
    }));
  }

  function handleRowRename(rowIdx: number, value: string) {
    const newRowNames = rowNames.map((n, i) => (i === rowIdx ? value : n));
    setRowNames(newRowNames);
    if (scheme !== 'row-col') return;
    setFormData((cur) => ({
      ...cur,
      slots: cur.slots.map((slot, i) => {
        const c = Math.floor(i / cur.rows);
        const r = i % cur.rows;
        if (r !== rowIdx) return slot;
        return { ...slot, label: makeLabel(c, r, scheme, colNames, newRowNames, cur.columns) };
      }),
    }));
  }

  // ── Slot span ───────────────────────────────────────────────────────────────

  function handleSpanChange(c: number, r: number, span: SlotSpan) {
    setSpans((cur) => ({ ...cur, [`${c}-${r}`]: span }));
    const cellW   = parseFloat((100 / formData.columns).toFixed(2));
    const slotIdx = c * formData.rows + r;
    setFormData((cur) => ({
      ...cur,
      slots: cur.slots.map((slot, i) => {
        if (i !== slotIdx) return slot;
        return { ...slot, width: parseFloat((cellW * span).toFixed(2)) };
      }),
    }));
  }

  // ── Slot cell editing ───────────────────────────────────────────────────────

  function handleSlotChange(index: number, field: 'label' | 'mdb_code' | 'default_capacity', value: string) {
    setFormData((cur) => ({
      ...cur,
      slots: cur.slots.map((slot, i) => {
        if (i !== index) return slot;
        if (field === 'label') return { ...slot, label: value };
        if (field === 'mdb_code') return { ...slot, mdb_code: value === '' ? 0 : Number(value) };
        // default_capacity
        return { ...slot, default_capacity: value === '' ? null : Number(value) };
      }),
    }));
  }

  // ── Basic fields ────────────────────────────────────────────────────────────

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((cur) => ({ ...cur, [name]: value }));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify.error('El nombre de la plantilla es requerido');
      return;
    }

    const covered = computeCovered(spans, formData.columns, formData.rows);
    const activeSlots = formData.slots.filter((_, i) => {
      const c = Math.floor(i / formData.rows);
      const r = i % formData.rows;
      return !covered.has(`${c}-${r}`);
    });

    if (activeSlots.length === 0) {
      notify.error('Debes tener al menos un slot activo');
      return;
    }

    setIsSubmitting(true);

    const response = await createMachineTemplateAction({
      name:        formData.name.trim(),
      brand:       formData.brand?.trim()       || null,
      image:       formData.image?.trim()       || null,
      description: formData.description?.trim() || null,
      columns:     formData.columns,
      rows:        formData.rows,
      slots:       activeSlots.map((s) => ({
        label:            s.label.trim(),
        column:           s.column           ?? null,
        row:              s.row              ?? null,
        mdb_code:         s.mdb_code,
        x:                s.x               ?? null,
        y:                s.y               ?? null,
        width:            s.width           ?? null,
        height:           s.height          ?? null,
        default_capacity: s.default_capacity ?? null,
      })),
    });

    if (response.success) {
      if (imageFile && response.template?.id) {
        await uploadTemplateImage(response.template.id, imageFile).catch(() => {
          notify.warning('Plantilla creada, pero no se pudo subir la imagen.');
        });
      }
      notify.success('Plantilla creada exitosamente');
      router.push('/plantillas');
      return;
    }

    notify.error(response.error || 'No fue posible crear la plantilla');
    setIsSubmitting(false);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const coveredCount = computeCovered(spans, formData.columns, formData.rows).size;
  const activeCount  = formData.slots.length - coveredCount;
  const nameOk       = formData.name.trim().length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        icon={Grid3x3}
        title="Nueva Plantilla"
        subtitle="Define la grilla de slots para un modelo de máquina"
        backHref="/maquinas"
        variant="white"
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

          {/* ── Mobile tab bar ─────────────────────────────────────────── */}
          <div className="lg:hidden flex shrink-0 bg-white border-b border-gray-100">
            <button
              type="button"
              onClick={() => setMobileTab('config')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                mobileTab === 'config'
                  ? 'text-[#3157b2] border-[#3157b2]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              Configuración
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('grid')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                mobileTab === 'grid'
                  ? 'text-[#3157b2] border-[#3157b2]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
              Grilla
              <span className="text-xs font-normal text-gray-400">
                {formData.columns}×{formData.rows}
              </span>
            </button>
          </div>

          {/* ── Scrollable content ─────────────────────────────────────── */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 pb-24 lg:pb-6">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 items-start">

              {/* ── Left panel (config) ────────────────────────────────── */}
              <div className={`w-full lg:w-[320px] shrink-0 lg:sticky lg:top-6 flex-col gap-4 ${
                mobileTab === 'grid' ? 'hidden lg:flex' : 'flex'
              }`}>

                {/* Información básica */}
                <section className="card p-5 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Información
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">
                      Nombre del modelo
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleFieldChange}
                      className="input-field"
                      placeholder="Ej: Crane National 167"
                      required
                    />
                    {!nameOk && (
                      <p className="text-xs text-gray-400 mt-1.5">Este campo es obligatorio</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowOptional((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#3157b2] hover:text-[#203c84] transition-colors"
                  >
                    {showOptional ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showOptional ? 'Ocultar campos opcionales' : 'Agregar marca, imagen o descripción'}
                  </button>

                  {showOptional && (
                    <div className="space-y-4 pt-1 border-t border-gray-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
                        <input name="brand" value={formData.brand ?? ''} onChange={handleFieldChange}
                          className="input-field" placeholder="Ej: Crane" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Imagen</label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            {imageFile ? imageFile.name : 'Seleccionar imagen'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                                setImageFile(file);
                                setImagePreview(file ? URL.createObjectURL(file) : null);
                              }}
                            />
                          </label>
                          {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="h-10 w-10 object-cover rounded-md border border-gray-200" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                        <textarea name="description" value={formData.description ?? ''} onChange={handleFieldChange}
                          className="input-field min-h-20 resize-none text-sm"
                          placeholder="Modelo o uso esperado de esta plantilla." />
                      </div>
                    </div>
                  )}
                </section>

                {/* Dimensiones */}
                <section className="card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Dimensiones
                    </h2>
                    <MiniGridPreview columns={formData.columns} rows={formData.rows} />
                  </div>

                  <div className="flex gap-6">
                    <Stepper label="Columnas" value={formData.columns} min={1} max={20} onChange={updateColumns} />
                    <Stepper label="Filas"    value={formData.rows}    min={1} max={50} onChange={updateRows}    />
                  </div>

                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Formato de etiqueta
                      </span>
                      <span title="Aplicar un formato regenera todas las etiquetas">
                        <Info className="h-3 w-3 text-gray-300" />
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {LABEL_SCHEMES.map((s) => (
                        <button key={s.value} type="button" onClick={() => updateScheme(s.value)} title={s.hint}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                            scheme === s.value
                              ? 'bg-[#3157b2] text-white border-[#3157b2] shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#3157b2]/40 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{s.label}</span>
                          <span className={`text-xs font-mono ${scheme === s.value ? 'text-blue-200' : 'text-gray-400'}`}>
                            {s.example}
                          </span>
                        </button>
                      ))}
                    </div>
                    {scheme && (
                      <p className="text-[11px] text-gray-400">
                        Clic en el formato activo para desactivarlo y editar las etiquetas libremente.
                      </p>
                    )}
                  </div>
                </section>

                {/* Actions — desktop only (mobile uses sticky footer) */}
                <div className="hidden lg:flex flex-col gap-2">
                  <button type="submit" disabled={isSubmitting || !nameOk}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSubmitting ? 'Guardando…' : 'Guardar plantilla'}
                  </button>
                  <Link href="/maquinas"
                    className="text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2">
                    Cancelar
                  </Link>
                </div>
              </div>

              {/* ── Right panel (grid) ─────────────────────────────────── */}
              <div className={`flex-1 min-w-0 card p-4 sm:p-5 space-y-4 ${
                mobileTab === 'config' ? 'hidden lg:block' : ''
              }`}>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                      Grilla de slots
                    </h2>
                    <p className="text-xs text-gray-400">
                      Toca o haz clic en una celda para editar su etiqueta o código MDB
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#3157b2]/8 px-3 py-1.5 text-sm text-[#3157b2] font-medium">
                    <Grid3x3 className="h-3.5 w-3.5" />
                    <span>
                      {formData.columns} × {formData.rows}
                      <span className="mx-1.5 text-[#3157b2]/40">·</span>
                      <strong>{activeCount}</strong> slots
                      {coveredCount > 0 && (
                        <span className="text-xs font-normal text-[#3157b2]/60 ml-1">
                          ({coveredCount} agrupados)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <SlotGrid
                  slots={formData.slots}
                  columns={formData.columns}
                  rows={formData.rows}
                  spans={spans}
                  colNames={colNames}
                  rowNames={rowNames}
                  onSlotChange={handleSlotChange}
                  onColRename={handleColRename}
                  onRowRename={handleRowRename}
                  onSpanChange={handleSpanChange}
                />

                <div className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 text-xs text-gray-500">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                  <span>
                    Usa los botones <strong className="text-gray-700">1× 2× 3×</strong> de cada slot para
                    declarar que ocupa más de una columna de ancho. Los encabezados de columna y fila son editables.
                    El campo <strong className="text-gray-700">Cap</strong> define el stock máximo por defecto de cada slot.
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── Mobile sticky footer ───────────────────────────────────── */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 flex gap-3">
            <Link
              href="/maquinas"
              className="flex-1 inline-flex items-center justify-center py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !nameOk}
              className="flex-[2] btn-primary inline-flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? 'Guardando…' : 'Guardar plantilla'}
            </button>
          </div>

        </form>
      </main>
    </>
  );
}
