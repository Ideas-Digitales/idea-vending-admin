'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Package } from 'lucide-react';
import { aggregatePaymentsAction, productRankingAction } from '@/lib/actions/payments';
import type { RankedProduct } from '@/lib/actions/payments';
import {
  clpShort, getPeriodRange, getGroupBy, mapGroupedData, sanitizeRanking,
  type Period,
} from '@/lib/utils/metricsHelpers';
import { MiniChart } from '@/components/metrics/MetricsCharts';

interface MachineProductsPanelProps {
  machineId: number;
  enterpriseId?: number;
  period: Period;
}

type ProductStat = RankedProduct & { sparkline: { label: string; value: number }[] };

export default function MachineProductsPanel({ machineId, enterpriseId, period }: MachineProductsPanelProps) {
  const [rankingTop, setRankingTop]               = useState<RankedProduct[]>([]);
  const [rankingLow, setRankingLow]               = useState<RankedProduct[]>([]);
  const [loadingRanking, setLoadingRanking]       = useState(true);
  const [productStats, setProductStats]           = useState<ProductStat[]>([]);
  const [loadingSparklines, setLoadingSparklines] = useState(false);

  useEffect(() => {
    setLoadingRanking(true);
    const { start, end } = getPeriodRange(period);
    const base = {
      machine_id: machineId,
      ...(enterpriseId != null ? { enterprise_id: enterpriseId } : {}),
    };
    productRankingAction({ ...base, start_date: start, end_date: end, limit: 5 })
      .then(res => {
        if (res.success) {
          const { top, low } = sanitizeRanking(res.top_performers ?? [], res.low_performers ?? []);
          setRankingTop(top);
          setRankingLow(low);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false));
  }, [period, machineId, enterpriseId]);

  useEffect(() => {
    if (!rankingTop.length) { setProductStats([]); return; }
    setLoadingSparklines(true);
    const { start, end } = getPeriodRange(period);
    const groupBy = getGroupBy(period);
    const base = {
      machine_id: machineId,
      ...(enterpriseId != null ? { enterprise_id: enterpriseId } : {}),
    };
    Promise.all(
      rankingTop.map(p =>
        aggregatePaymentsAction({ ...base, product_id: p.id, start_date: start, end_date: end, group_by: groupBy, successful: true })
      )
    )
      .then(results => {
        setProductStats(rankingTop.map((p, i) => ({
          ...p,
          sparkline: mapGroupedData(results[i]?.data, groupBy, period),
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingSparklines(false));
  }, [rankingTop, period, machineId, enterpriseId]);

  const grandTotal   = productStats.reduce((s, p) => s + p.payments_amount, 0);
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="space-y-4">
      {/* Lista compacta con sparklines */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-dark">Productos más vendidos</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
          {loadingRanking ? (
            skeletonRows.map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 animate-pulse">
                <div className="w-4 h-3 bg-gray-100 rounded shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-32 bg-gray-100 rounded" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded" />
                </div>
                <div className="w-20 h-7 bg-gray-100 rounded shrink-0" />
                <div className="w-16 h-3.5 bg-gray-100 rounded shrink-0" />
              </div>
            ))
          ) : rankingTop.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted">Sin ventas registradas para este período</p>
            </div>
          ) : (
            (loadingSparklines ? rankingTop : productStats).map((p, i) => {
              const sparkline = 'sparkline' in p ? (p as ProductStat).sparkline : [];
              const pct       = grandTotal > 0 ? Math.round((p.payments_amount / grandTotal) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <span className="text-xs font-bold text-gray-400 w-4 text-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/productos/${p.id}`} className="text-sm font-medium text-dark truncate hover:text-primary block leading-tight">
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted">{p.payments_quantity.toLocaleString('es-CL')} ventas</p>
                  </div>
                  <div className="w-20 shrink-0">
                    {loadingSparklines
                      ? <div className="h-7 bg-gray-100 rounded animate-pulse" />
                      : <MiniChart data={sparkline} id={`mprod-${p.id}`} compact />
                    }
                  </div>
                  <div className="text-right shrink-0 min-w-[68px]">
                    <p className="text-sm font-bold text-dark">{clpShort(p.payments_amount)}</p>
                    <p className="text-xs text-muted">{pct}%</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top / Bottom — solo visible si hay productos menos vendidos */}
      {!loadingRanking && rankingLow.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([
          { label: 'Más vendidos',   icon: <Star    className="h-3.5 w-3.5 text-emerald-500" />, items: rankingTop, badge: 'bg-emerald-500', row: 'hover:bg-emerald-50/60' },
          { label: 'Menos vendidos', icon: <Package className="h-3.5 w-3.5 text-orange-400" />, items: rankingLow, badge: 'bg-orange-400',   row: 'hover:bg-orange-50/60' },
        ] as const).map(({ label, icon, items, badge, row }) => (
          <div key={label} className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {icon}
              <span className="text-sm font-semibold text-dark">{label}</span>
            </div>
            {loadingRanking ? (
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                    <div className="w-5 h-5 bg-gray-100 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 w-28 bg-gray-100 rounded" />
                      <div className="h-2.5 w-16 bg-gray-100 rounded" />
                    </div>
                    <div className="w-14 h-3.5 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">Sin datos</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((p, i) => (
                  <Link key={p.id} href={`/productos/${p.id}`} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${row}`}>
                    <span className={`w-5 h-5 rounded-full ${badge} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{p.name}</p>
                      <p className="text-xs text-muted">{p.payments_quantity.toLocaleString('es-CL')} ventas</p>
                    </div>
                    <p className="text-sm font-bold text-dark shrink-0">{clpShort(p.payments_amount)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>}
    </div>
  );
}
