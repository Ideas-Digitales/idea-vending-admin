'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getMachinesAction } from '@/lib/actions/machines';
import { getSlotsAction, updateSlotAction } from '@/lib/actions/slots';
import { getProductsAction } from '@/lib/actions/products';
import { getEnterprisesAction } from '@/lib/actions/enterprise';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';
import { useMqttSlot } from '@/lib/hooks/useMqttSlot';
import { SlotAdapter } from '@/lib/adapters/slot.adapter';
import type { Machine } from '@/lib/interfaces/machine.interface';
import type { Slot } from '@/lib/interfaces/slot.interface';
import type { Producto } from '@/lib/interfaces/product.interface';
import { PageHeader } from '@/components/ui-custom';
import {
  PackageSearch, Loader2, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Filter, Download, Copy, LayoutList, LayoutGrid, ChevronDown,
  Minus, Plus, Check, X, Search, Package,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type StockLevel = 'critical' | 'low' | 'incomplete';

interface SlotRow {
  slot:        Slot;
  machine:     Machine;
  level:       StockLevel;
  needed:      number;
  neededKnown: boolean;
  pct:         number;
  productName: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stockLevel(slot: Slot): StockLevel | 'full' {
  const stock = slot.current_stock ?? 0;
  const cap   = slot.capacity ?? 0;
  if (cap === 0 || stock === 0 || slot.current_stock === null) return 'critical';
  if (SlotAdapter.isFull(slot)) return 'full';
  const pct = stock / cap;
  if (pct < 0.1) return 'critical';
  if (pct < 0.3) return 'low';
  return 'incomplete';
}

const LEVEL_ORDER: Record<string, number> = { critical: 0, low: 1, incomplete: 2 };

const LEVEL_BADGE: Record<StockLevel, string> = {
  critical:   'bg-red-50 text-red-700 border-red-200',
  low:        'bg-amber-50 text-amber-700 border-amber-200',
  incomplete: 'bg-blue-50 text-blue-700 border-blue-200',
};
const LEVEL_BAR: Record<StockLevel, string> = {
  critical:   'bg-red-500',
  low:        'bg-amber-400',
  incomplete: 'bg-blue-400',
};
const LEVEL_LABEL: Record<StockLevel, string> = { critical: 'Crítico', low: 'Stock bajo', incomplete: 'Incompleto' };

// ── Componente inline para actualizar stock de una fila ───────────────────────
function StockEditor({
  row, onSaved, onCancel,
}: {
  row: SlotRow;
  onSaved: (slotId: number, newStock: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue]     = useState(row.slot.current_stock ?? 0);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const { publishSlotOperation } = useMqttSlot();
  const max = row.slot.capacity ?? undefined;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updateSlotAction(row.machine.id, row.slot.id, { current_stock: value });
    if (result.success && result.slot) {
      try {
        await publishSlotOperation({
          action: 'update', machineId: row.machine.id, slotId: row.slot.id,
          slotData: { ...result.slot, machine_id: row.machine.id },
        });
      } catch { /* MQTT no crítico */ }
      onSaved(row.slot.id, value);
    } else {
      setError(result.error ?? 'Error al guardar');
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setValue(v => Math.max(0, v - 1))}
        disabled={saving || value <= 0}
        className="p-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      ><Minus className="h-3 w-3" /></button>

      <input
        type="number" value={value}
        onChange={e => setValue(Math.max(0, Math.min(max ?? 9999, Number(e.target.value))))}
        min={0} max={max}
        disabled={saving}
        className="w-14 text-center text-sm font-semibold border border-gray-300 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />

      <button
        onClick={() => setValue(max ?? value)}
        disabled={saving || !max || value === max}
        title="Llenar"
        className="p-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      ><Plus className="h-3 w-3" /></button>

      {error && <span className="text-xs text-red-600 ml-1">{error}</span>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        title="Guardar"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>

      <button
        onClick={onCancel}
        disabled={saving}
        className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        title="Cancelar"
      ><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ReposicionPage() {
  const [rows, setRows]           = useState<SlotRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadProgress, setProgress] = useState({ done: 0, total: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch]         = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'low' | 'incomplete'>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterEnterprise, setFilterEnterprise] = useState<number | 'all'>('all');
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [viewMode, setViewMode]     = useState<'table' | 'card'>('table');

  // Edición inline
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [savedIds, setSavedIds]     = useState<Set<number>>(new Set());
  const [copied, setCopied]         = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const load = useCallback(async (enterpriseId?: number) => {
    setLoading(true);
    setLoadError(null);
    setRows([]);
    setSavedIds(new Set());

    const machRes = await getMachinesAction({
      limit: 200,
      ...(enterpriseId ? { enterprise_id: enterpriseId } : {}),
    });
    if (!machRes.success || !machRes.machines) {
      setLoadError(machRes.error ?? 'Error al cargar máquinas');
      setLoading(false);
      return;
    }

    const machines = machRes.machines;
    setProgress({ done: 0, total: machines.length });

    // Cargar productos por enterprise_id único
    const enterpriseIds = [...new Set(machines.map(m => m.enterprise_id).filter(Boolean))];
    const productMap = new Map<number, string>(); // product_id → name
    await Promise.all(
      enterpriseIds.map(eid =>
        getProductsAction({ page: 1, limit: 200, enterpriseId: eid })
          .then(res => {
            if (res.success && res.products) {
              res.products.forEach(p => productMap.set(Number(p.id), p.name));
            }
          })
          .catch(() => {})
      )
    );

    // Cargar slots de todas las máquinas en paralelo
    const collected: SlotRow[] = [];
    await Promise.all(
      machines.map(async machine => {
        try {
          const res = await getSlotsAction(machine.id);
          if (res.success && res.slots) {
            res.slots.forEach(slot => {
              const level = stockLevel(slot);
              if (level === 'full') return;
              const pct    = SlotAdapter.getStockPercentage(slot) ?? 0;
              const needed = slot.capacity !== null
                ? slot.capacity - (slot.current_stock ?? 0)
                : null; // unknown capacity
              collected.push({
                slot,
                machine,
                level,
                needed:      needed ?? 0,
                neededKnown: needed !== null,
                pct,
                productName: slot.product?.name ?? (slot.product_id ? (productMap.get(slot.product_id) ?? null) : null),
              });
            });
          }
        } catch { /* ignorar error individual */ }
        setProgress(p => ({ ...p, done: p.done + 1 }));
      })
    );

    // Ordenar: vacíos primero, luego por nombre de máquina
    collected.sort((a, b) =>
      LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
      a.machine.name.localeCompare(b.machine.name)
    );

    setRows(collected);
    setLoading(false);
  }, []);

  // Cargar empresas una sola vez
  useEffect(() => {
    getEnterprisesAction({ limit: 200 }).then(res => {
      if (res.success && res.enterprises) setEnterprises(res.enterprises);
    }).catch(() => {});
  }, []);

  // Recargar máquinas cuando cambia la empresa seleccionada
  useEffect(() => {
    setFilterMachine('all');
    load(filterEnterprise === 'all' ? undefined : filterEnterprise);
  }, [filterEnterprise]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const machineOptions = useMemo(() =>
    [...new Map(rows.map(r => [r.machine.id, r.machine.name])).entries()],
    [rows]
  );

  const filtered = useMemo(() => rows.filter(r => {
    if (filterLevel !== 'all' && r.level !== filterLevel) return false;
    if (filterMachine !== 'all' && String(r.machine.id) !== filterMachine) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.slot.label?.toLowerCase().includes(q) ||
        r.machine.name.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q) ||
        String(r.slot.mdb_code).includes(q)
      );
    }
    return true;
  }), [rows, filterLevel, filterMachine, search]);

  const criticalCount   = useMemo(() => filtered.filter(r => r.level === 'critical').length,   [filtered]);
  const lowCount        = useMemo(() => filtered.filter(r => r.level === 'low').length,        [filtered]);
  const incompleteCount = useMemo(() => filtered.filter(r => r.level === 'incomplete').length, [filtered]);
  const totalUnits      = useMemo(() => filtered.reduce((s, r) => s + r.needed, 0),            [filtered]);

  // Agrupado por máquina, slots ordenados por urgencia dentro de cada grupo
  const groupedByMachine = useMemo(() => {
    const map = new Map<number, { machine: Machine; rows: SlotRow[] }>();
    for (const r of filtered) {
      if (!map.has(r.machine.id)) map.set(r.machine.id, { machine: r.machine, rows: [] });
      map.get(r.machine.id)!.rows.push(r);
    }
    // Ordenar slots dentro de cada máquina por urgencia
    for (const group of map.values()) {
      group.rows.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
    }
    // Ordenar máquinas alfabéticamente
    return [...map.values()].sort((a, b) => a.machine.name.localeCompare(b.machine.name));
  }, [filtered]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const handleSaved = useCallback((slotId: number, newStock: number) => {
    setRows(prev => prev
      .map(r => r.slot.id === slotId
        ? { ...r, slot: { ...r.slot, current_stock: newStock }, pct: r.slot.capacity ? Math.round(newStock / r.slot.capacity * 100) : 0, needed: (r.slot.capacity ?? 0) - newStock }
        : r
      )
      .filter(r => stockLevel(r.slot) !== 'full')
    );
    setSavedIds(prev => new Set(prev).add(slotId));
    setEditingSlotId(null);
    setTimeout(() => setSavedIds(prev => { const n = new Set(prev); n.delete(slotId); return n; }), 2500);
  }, []);

  const handleDownload = useCallback(() => {
    const now  = new Date();
    const date = now.toLocaleDateString('es-CL').replace(/\//g, '-');
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const colHeader = ['Estado', 'Slot', 'MDB', 'Producto', 'Faltante', 'Stock actual', 'Capacidad']
      .map(q).join(';');

    const sections: string[] = [
      [q('Idea Vending — Plataforma Vending')].join(';'),
      [q('Hoja de reposición')].join(';'),
      [q(`Generada el ${now.toLocaleDateString('es-CL', { dateStyle: 'long' })} a las ${now.toLocaleTimeString('es-CL', { timeStyle: 'short' })}`)].join(';'),
      [q(`${filtered.length} slots · ${criticalCount} críticos · ${lowCount} con stock bajo · ${incompleteCount} incompletos`)].join(';'),
      '',
    ];

    for (const { machine, rows: groupRows } of groupedByMachine) {
      const machineLabel = machine.location
        ? `${machine.name} — ${machine.location}`
        : machine.name;
      const groupNeeded = groupRows.reduce((s, r) => s + r.needed, 0);
      sections.push([q(`▸ ${machineLabel}`), q(`${groupRows.length} slots`), q(`${groupNeeded} uds. a reponer`)].join(';'));
      sections.push(colHeader);
      for (const r of groupRows) {
        sections.push([
          LEVEL_LABEL[r.level],
          r.slot.label,
          r.slot.mdb_code,
          r.productName ?? '',
          r.neededKnown ? r.needed : '',
          r.slot.current_stock ?? '',
          r.slot.capacity ?? '',
        ].map(q).join(';'));
      }
      sections.push('');
    }

    const blob = new Blob(['\uFEFF' + sections.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `reposicion-${date}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [groupedByMachine, filtered.length, criticalCount, lowCount, incompleteCount]);

  const handleCopy = useCallback(async () => {
    const now = new Date();
    const lines: string[] = [
      'Idea Vending — Plataforma Vending',
      `Hoja de reposición · ${now.toLocaleDateString('es-CL', { dateStyle: 'long' })} ${now.toLocaleTimeString('es-CL', { timeStyle: 'short' })}`,
      `${filtered.length} slots · ${criticalCount} críticos · ${lowCount} stock bajo · ${incompleteCount} incompletos`,
    ];

    for (const { machine, rows: groupRows } of groupedByMachine) {
      const machineLabel = machine.location
        ? `${machine.name} — ${machine.location}`
        : machine.name;
      const groupNeeded = groupRows.reduce((s, r) => s + r.needed, 0);
      lines.push('');
      lines.push(`▸ ${machineLabel}  (${groupRows.length} slots · ${groupNeeded} uds. a reponer)`);
      lines.push(['Estado', 'Slot', 'Producto', 'Faltante', 'Stock actual'].join('\t'));
      for (const r of groupRows) {
        lines.push([
          LEVEL_LABEL[r.level],
          r.slot.label,
          r.productName ?? '—',
          r.neededKnown ? `${r.needed} uds.` : '—',
          `${r.slot.current_stock ?? '?'}/${r.slot.capacity ?? '?'}`,
        ].join('\t'));
      }
    }

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [groupedByMachine, filtered.length, criticalCount, lowCount, incompleteCount]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        icon={PackageSearch}
        title="Vista de reposición"
        subtitle="Todos los slots que necesitan atención"
        variant="white"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(filterEnterprise === 'all' ? undefined : filterEnterprise)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={handleCopy}
              disabled={loading || filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {copied
                ? <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="hidden sm:inline text-emerald-600">Copiado</span></>
                : <><Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copiar</span></>
              }
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto print:p-0">

        {/* ── Cargando ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-dark">Cargando inventario...</p>
              {loadProgress.total > 0 && (
                <>
                  <p className="text-xs text-muted mt-1">
                    {loadProgress.done} de {loadProgress.total} máquinas
                  </p>
                  <div className="w-48 bg-gray-200 rounded-full h-1.5 mt-2 mx-auto">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(loadProgress.done / loadProgress.total * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {!loading && loadError && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error al cargar</p>
              <p className="text-xs text-red-600 mt-0.5">{loadError}</p>
              <button onClick={() => load()} className="mt-2 text-xs text-red-700 font-medium underline">Reintentar</button>
            </div>
          </div>
        )}

        {/* ── Contenido ────────────────────────────────────────────────────── */}
        {!loading && !loadError && (
          <div className="space-y-4">

            {/* Resumen strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
              {[
                { label: 'Críticos',        value: criticalCount,   color: 'text-red-600',   bg: 'bg-red-50 border-red-100',     sub: 'vacíos o <10%' },
                { label: 'Stock bajo',      value: lowCount,        color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', sub: '10–30%' },
                { label: 'Incompletos',     value: incompleteCount, color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100',   sub: '30–99%' },
                { label: 'Unidades faltantes', value: totalUnits,   color: 'text-primary',   bg: 'bg-white border-gray-100',     sub: 'en total' },
              ].map(({ label, value, color, bg, sub }) => (
                <div key={label} className={`rounded-xl border p-3 sm:p-4 ${bg}`}>
                  <p className="text-xs text-muted font-medium mb-0.5 leading-tight">{label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Filters + view toggle */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {/* Search */}
              <div className="relative flex-1 min-w-0 sm:min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar slot, máquina, producto…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                />
              </div>

              {/* Enterprise filter */}
              {enterprises.length > 0 && (
                <div className="relative">
                  <select
                    value={filterEnterprise}
                    onChange={e => setFilterEnterprise(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    <option value="all">Todas las empresas</option>
                    {enterprises.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Level filter */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={filterLevel}
                  onChange={e => setFilterLevel(e.target.value as typeof filterLevel)}
                  className="pl-8 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="critical">Solo críticos</option>
                  <option value="low">Solo stock bajo</option>
                  <option value="incomplete">Solo incompletos</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Machine filter */}
              {machineOptions.length > 1 && (
                <div className="relative">
                  <select
                    value={filterMachine}
                    onChange={e => setFilterMachine(e.target.value)}
                    className="pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    <option value="all">Todas las máquinas</option>
                    {machineOptions.map(([id, name]) => (
                      <option key={id} value={String(id)}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              )}

              <div className="ml-auto flex items-center rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  title="Tabla"
                ><LayoutList className="h-3.5 w-3.5" /></button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  title="Tarjetas"
                ><LayoutGrid className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="card p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-base font-semibold text-dark mb-1">
                  {rows.length === 0 ? 'Sin datos de inventario' : 'Todo en orden'}
                </h3>
                <p className="text-sm text-muted">
                  {rows.length === 0
                    ? 'No hay máquinas con slots configurados.'
                    : search || filterLevel !== 'all' || filterMachine !== 'all'
                      ? 'Ningún slot coincide con los filtros aplicados.'
                      : 'Todos los slots están al máximo de capacidad.'
                  }
                </p>
              </div>
            )}

            {/* ── Vista tabla ─────────────────────────────────────────────── */}
            {filtered.length > 0 && viewMode === 'table' && (
              <div className="space-y-3">
                {groupedByMachine.map(({ machine, rows: groupRows }) => {
                  const groupNeeded = groupRows.reduce((s, r) => s + r.needed, 0);
                  return (
                    <div key={machine.id} className="card overflow-hidden">
                      {/* Encabezado de máquina */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-dark truncate">{machine.name}</span>
                          {machine.location && (
                            <span className="text-xs text-muted truncate hidden sm:block">· {machine.location}</span>
                          )}
                          <span className="ml-1 text-xs font-medium text-muted bg-gray-100 rounded-full px-2 py-0.5 shrink-0">
                            {groupRows.length} slot{groupRows.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {groupNeeded > 0 && (
                          <span className="text-xs font-semibold text-primary shrink-0">
                            {groupNeeded} uds. a reponer
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                      <table className="w-full table-fixed text-sm">
                        <colgroup>
                          <col className="w-[44px] sm:w-[100px]" />
                          <col className="w-[130px]" />
                          <col className="hidden md:table-column md:w-[200px]" />
                          <col className="w-[90px]" />
                          <col className="w-[120px]" />
                        </colgroup>
                        <thead className="border-b border-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted uppercase tracking-wide"><span className="hidden sm:inline">Estado</span></th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted uppercase tracking-wide">Slot</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted uppercase tracking-wide hidden md:table-cell">Producto</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted uppercase tracking-wide">Faltante</th>
                            <th className="px-3 py-2 text-xs font-medium text-muted uppercase tracking-wide text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {groupRows.map(row => {
                            const isEditing = editingSlotId === row.slot.id;
                            const wasSaved  = savedIds.has(row.slot.id);
                            return (
                              <tr
                                key={row.slot.id}
                                className={`transition-colors ${
                                  wasSaved              ? 'bg-emerald-50/60' :
                                  row.level === 'critical'  ? 'bg-red-50/20 hover:bg-red-50/40' :
                                  row.level === 'low'       ? 'bg-amber-50/10 hover:bg-amber-50/30' :
                                  'hover:bg-gray-50/60'
                                }`}
                              >
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border ${LEVEL_BADGE[row.level]}`}>
                                    {row.level === 'critical' ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    <span className="hidden sm:inline">{LEVEL_LABEL[row.level]}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <p className="text-sm font-semibold text-dark truncate">{row.slot.label}</p>
                                  <p className="text-xs font-mono text-muted truncate">MDB {row.slot.mdb_code}</p>
                                </td>
                                <td className="px-3 py-2 hidden md:table-cell">
                                  {row.productName
                                    ? <p className="text-sm text-dark truncate">{row.productName}</p>
                                    : <span className="text-xs text-muted italic">Sin asignar</span>
                                  }
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {row.neededKnown ? (
                                    <div className="inline-flex flex-col items-end gap-0.5">
                                      <div>
                                        <span className={`text-sm font-bold ${row.needed > 0 ? LEVEL_BADGE[row.level].split(' ')[1] : 'text-emerald-600'}`}>{row.needed}</span>
                                        <span className="text-xs text-muted ml-0.5">uds.</span>
                                      </div>
                                      <span className="text-[10px] text-muted">{row.slot.current_stock ?? 0}/{row.slot.capacity}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {wasSaved ? (
                                    <span className="inline-flex items-center justify-end gap-1 text-xs text-emerald-600 font-medium">
                                      <CheckCircle className="h-3.5 w-3.5" /> Guardado
                                    </span>
                                  ) : isEditing ? (
                                    <StockEditor row={row} onSaved={handleSaved} onCancel={() => setEditingSlotId(null)} />
                                  ) : (
                                    <button
                                      onClick={() => setEditingSlotId(row.slot.id)}
                                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                      Reponer
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  );
                })}

                {/* Totales globales */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-semibold text-dark">
                  <span>{filtered.length} slots · {criticalCount} críticos · {lowCount} con stock bajo · {incompleteCount} incompletos</span>
                  <span className="text-primary">{totalUnits} uds. totales a reponer</span>
                </div>
              </div>
            )}

            {/* ── Vista tarjetas ───────────────────────────────────────────── */}
            {filtered.length > 0 && viewMode === 'card' && (
              <div className="space-y-5">
                {groupedByMachine.map(({ machine, rows: groupRows }) => (
                  <div key={machine.id}>
                    {/* Encabezado de máquina */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <h3 className="text-sm font-semibold text-dark">{machine.name}</h3>
                      {machine.location && <span className="text-xs text-muted hidden sm:block">· {machine.location}</span>}
                      <span className="text-xs font-medium text-muted bg-gray-100 rounded-full px-2 py-0.5">
                        {groupRows.length} slot{groupRows.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {groupRows.map(row => {
                        const isEditing = editingSlotId === row.slot.id;
                        const wasSaved  = savedIds.has(row.slot.id);
                        return (
                          <div
                            key={row.slot.id}
                            className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-md ${
                              wasSaved              ? 'border-emerald-200 ring-1 ring-emerald-100' :
                              row.level === 'critical'  ? 'border-red-200 ring-1 ring-red-100' :
                              row.level === 'low'       ? 'border-amber-200 ring-1 ring-amber-50' :
                              'border-blue-200 ring-1 ring-blue-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-dark">{row.slot.label}</h4>
                                <p className="text-xs font-mono text-muted">MDB {row.slot.mdb_code}</p>
                              </div>
                              {wasSaved ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium shrink-0">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${LEVEL_BADGE[row.level]}`}>
                                  {LEVEL_LABEL[row.level]}
                                </span>
                              )}
                            </div>

                            {row.productName && (
                              <div className="flex items-center gap-1.5 mb-3">
                                <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <p className="text-xs text-dark truncate">{row.productName}</p>
                              </div>
                            )}

                            {row.slot.capacity !== null && (
                              <div className="mb-3">
                                <div className="flex justify-between text-xs text-muted mb-1">
                                  <span>Faltante</span>
                                  <span className="font-semibold text-dark">{row.slot.current_stock ?? 0}/{row.slot.capacity}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${LEVEL_BAR[row.level]}`} style={{ width: `${row.pct}%` }} />
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-muted mb-3">
                              {row.neededKnown
                                ? <>Reponer <span className="text-base font-bold text-dark">{row.needed}</span> unidades</>
                                : 'Capacidad no configurada'
                              }
                            </p>

                            {isEditing ? (
                              <StockEditor row={row} onSaved={handleSaved} onCancel={() => setEditingSlotId(null)} />
                            ) : (
                              <button
                                onClick={() => setEditingSlotId(row.slot.id)}
                                className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                  wasSaved
                                    ? 'bg-emerald-50 text-emerald-700 cursor-default'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                                disabled={wasSaved}
                              >
                                {wasSaved
                                  ? <><CheckCircle className="h-3.5 w-3.5" /> Guardado</>
                                  : <><RefreshCw className="h-3.5 w-3.5" /> Reponer</>
                                }
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

    </>
  );
}
