import type { AggregateDataPoint } from '@/lib/actions/payments';

export type Period = 'day' | 'month' | 'year';
export type ChartMetric = 'amount' | 'count';

// ── Formateo de moneda ────────────────────────────────────────
export function clp(n: number | null | undefined) {
  return `$${(n ?? 0).toLocaleString('es-CL')}`;
}

export function clpShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ── Date helpers ──────────────────────────────────────────────
function toIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`;
}

export function getPeriodRange(period: Period) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === 'day') {
    const start     = new Date(Date.UTC(y, m, d - 6, 0, 0, 0));
    const end       = new Date(Date.UTC(y, m, d, 23, 59, 59));
    const prevStart = new Date(Date.UTC(y, m, d - 13, 0, 0, 0));
    const prevEnd   = new Date(Date.UTC(y, m, d - 7, 23, 59, 59));
    return { start: toIso(start), end: toIso(end), prevStart: toIso(prevStart), prevEnd: toIso(prevEnd) };
  }

  if (period === 'month') {
    const start     = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    const end       = new Date(Date.UTC(y, m, d, 23, 59, 59));
    const prevStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const prevEnd   = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    return { start: toIso(start), end: toIso(end), prevStart: toIso(prevStart), prevEnd: toIso(prevEnd) };
  }

  // year
  const start     = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
  const end       = new Date(Date.UTC(y, m, d, 23, 59, 59));
  const prevStart = new Date(Date.UTC(y - 1, 0, 1, 0, 0, 0));
  const prevEnd   = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59));
  return { start: toIso(start), end: toIso(end), prevStart: toIso(prevStart), prevEnd: toIso(prevEnd) };
}

export function getGroupBy(period: Period): 'day' | 'month' {
  return period === 'year' ? 'month' : 'day';
}

// ── Formateo de labels del gráfico ────────────────────────────
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_SHORT   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export function formatGroupDate(dateStr: string, groupBy: 'day' | 'month', period: Period): string {
  if (groupBy === 'month') {
    const parts = dateStr.split('-');
    return MONTH_SHORT[parseInt(parts[1]) - 1] ?? dateStr;
  }
  const parts    = dateStr.split('-');
  const dayNum   = parseInt(parts[2]);
  const monthNum = parseInt(parts[1]);
  const year     = parts[0];
  if (period === 'month') return `${dayNum}/${monthNum}/${year}`;
  const dt = new Date(`${dateStr}T12:00:00Z`);
  return `${DAY_SHORT[dt.getUTCDay()]} ${dayNum}`;
}

export function formatGroupDateFull(dateStr: string, groupBy: 'day' | 'month', period: Period): string {
  if (groupBy === 'month') {
    const parts = dateStr.split('-');
    return MONTH_SHORT[parseInt(parts[1]) - 1] ?? dateStr;
  }
  const parts    = dateStr.split('-');
  const year     = parts[0];
  const dayNum   = parseInt(parts[2]);
  const monthNum = parseInt(parts[1]);
  if (period === 'month') return `${dayNum}/${monthNum}/${year}`;
  const dt = new Date(`${dateStr}T12:00:00Z`);
  return `${DAY_SHORT[dt.getUTCDay()]} ${dayNum}/${monthNum}/${year}`;
}

export function mapDualAxisData(
  points: AggregateDataPoint[] | undefined,
  groupBy: 'day' | 'month',
  period: Period,
): { label: string; tooltipLabel: string; amount: number; count: number }[] {
  return (points ?? []).map(pt => ({
    label:        formatGroupDate(pt.date, groupBy, period),
    tooltipLabel: formatGroupDateFull(pt.date, groupBy, period),
    amount:       pt.total_amount,
    count:        pt.total_count,
  }));
}

export function mapGroupedData(
  points: AggregateDataPoint[] | undefined,
  groupBy: 'day' | 'month',
  period: Period,
  metric: ChartMetric = 'amount',
): { label: string; tooltipLabel: string; value: number }[] {
  return (points ?? []).map(pt => ({
    label:        formatGroupDate(pt.date, groupBy, period),
    tooltipLabel: formatGroupDateFull(pt.date, groupBy, period),
    value:        metric === 'count' ? pt.total_count : pt.total_amount,
  }));
}

export function mapDualGroupedData(
  ok:     AggregateDataPoint[] | undefined,
  failed: AggregateDataPoint[] | undefined,
  groupBy: 'day' | 'month',
  period: Period,
): { label: string; tooltipLabel: string; exitosos: number; fallidos: number }[] {
  const failedMap = new Map((failed ?? []).map(pt => [pt.date, pt.total_count]));
  return (ok ?? []).map(pt => ({
    label:        formatGroupDate(pt.date, groupBy, period),
    tooltipLabel: formatGroupDateFull(pt.date, groupBy, period),
    exitosos:     pt.total_count,
    fallidos:     failedMap.get(pt.date) ?? 0,
  }));
}

// ── Insights ──────────────────────────────────────────────────
const INSIGHT_LABELS: Record<Period, [string, string, string]> = {
  day:   ['Mejor día',  'Día más bajo',  'Promedio/día'],
  month: ['Mejor día',  'Día más bajo',  'Promedio/día'],
  year:  ['Mejor mes',  'Mes más bajo',  'Promedio/mes'],
};

export function computeInsights(period: Period, data: { label: string; value: number }[], metric: ChartMetric = 'amount') {
  const [l0, l1, l2] = INSIGHT_LABELS[period];
  if (!data.length) return [
    { label: l0, value: '—', sub: '—' },
    { label: l1, value: '—', sub: '—' },
    { label: l2, value: '—', sub: '—' },
  ];
  const max      = data.reduce((a, b) => b.value > a.value ? b : a);
  const min      = data.reduce((a, b) => b.value < a.value ? b : a);
  const avg      = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  const subLabel = period === 'year' ? `${data.length} meses` : `${data.length} días`;
  const fmt      = (v: number) => metric === 'count' ? v.toLocaleString('es-CL') : clp(v);
  return [
    { label: l0, value: max.label, sub: fmt(max.value) },
    { label: l1, value: min.label, sub: fmt(min.value) },
    { label: l2, value: fmt(avg),  sub: subLabel        },
  ];
}

// ── Ranking sanitization ──────────────────────────────────────
type RankItem = { id: number; payments_quantity: number; payments_amount: number };

export function sanitizeRanking<T extends RankItem>(top: T[] = [], low: T[] = []) {
  const sanitizedTop = top.filter(item => item.payments_quantity > 0 && item.payments_amount > 0);
  const topIds       = new Set(sanitizedTop.map(item => item.id));
  const sanitizedLow = low.filter(item => !topIds.has(item.id) && item.payments_quantity > 0);
  return { top: sanitizedTop, low: sanitizedLow };
}

// ── Labels de período ─────────────────────────────────────────
export const PERIOD_LABELS: Record<Period, string> = {
  day:   '7 días',
  month: 'Este mes',
  year:  'Este año',
};
