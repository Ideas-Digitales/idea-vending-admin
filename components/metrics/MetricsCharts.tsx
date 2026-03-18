'use client';

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { clp, clpShort } from '@/lib/utils/metricsHelpers';

// ── Tooltip ───────────────────────────────────────────────────
export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-muted font-medium mb-0.5">{label}</p>
      <p className="font-bold text-dark text-sm">{clp(payload[0].value)}</p>
    </div>
  );
}

// ── Area chart ────────────────────────────────────────────────
export function SalesAreaChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3157b2" stopOpacity={0.25} />
            <stop offset="90%" stopColor="#3157b2" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3157b2', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3157b2"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#3157b2', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Dual area chart (exitosos + fallidos) ─────────────────────
export function SalesDualAreaChart({
  data,
}: {
  data: { label: string; tooltipLabel?: string; exitosos: number; fallidos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="gradExitosos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3157b2" stopOpacity={0.22} />
            <stop offset="90%" stopColor="#3157b2" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradFallidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#ef4444" stopOpacity={0.18} />
            <stop offset="90%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={52} />
        <Tooltip
          cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '4 4' }}
          content={({ active, payload, label: lbl }) => {
            if (!active || !payload?.length) return null;
            const displayLabel = (payload[0]?.payload as { tooltipLabel?: string })?.tooltipLabel ?? lbl;
            return (
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs space-y-1">
                <p className="text-muted font-medium mb-1">{displayLabel}</p>
                {payload.map((p) => (
                  <div key={p.dataKey as string} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-muted">{p.dataKey === 'exitosos' ? 'Exitosos' : 'Fallidos'}:</span>
                    <span className="font-bold text-dark">{clp(p.value as number)}</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="exitosos" stroke="#3157b2" strokeWidth={2.5} fill="url(#gradExitosos)" dot={false} activeDot={{ r: 5, fill: '#3157b2', stroke: 'white', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="fallidos" stroke="#ef4444" strokeWidth={2}   fill="url(#gradFallidos)" dot={false} activeDot={{ r: 4, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Bar chart ─────────────────────────────────────────────────
export function SalesBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 4 }} barCategoryGap="30%">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#4c6fd0" />
            <stop offset="100%" stopColor="#3157b2" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={clpShort} width={52} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(49,87,178,0.06)', radius: 6 }} />
        {max > 0 && <ReferenceLine y={max} stroke="#3157b2" strokeDasharray="4 4" strokeOpacity={0.3} />}
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGrad)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Mini sparkline ────────────────────────────────────────────
export function MiniChart({
  data,
  id,
  compact = false,
}: {
  data: { label: string; value: number }[];
  id: string;
  compact?: boolean;
}) {
  const height  = compact ? 28 : 56;
  const hasData = data.some(d => d.value > 0);
  if (!hasData) {
    return <div style={{ height }} className="flex items-center justify-center text-xs text-gray-300">—</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`mg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3157b2" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#3157b2" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3157b2"
          strokeWidth={1.5}
          fill={`url(#mg-${id})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Skeleton KPI ──────────────────────────────────────────────
export function KpiSkeleton() {
  return <div className="h-7 w-28 bg-gray-100 rounded-lg animate-pulse" />;
}
