'use client';

import type { Period } from '@/lib/utils/metricsHelpers';
import { PERIOD_LABELS } from '@/lib/utils/metricsHelpers';

interface PeriodSelectorProps {
  period: Period;
  onChange: (period: Period) => void;
  variant?: 'light' | 'dark';
}

export default function PeriodSelector({ period, onChange, variant = 'dark' }: PeriodSelectorProps) {
  const isDark = variant === 'dark';

  return (
    <div
      data-tour="period-selector"
      className={`flex items-center gap-1 rounded-lg p-1 w-full sm:w-auto ${isDark ? 'bg-white/15' : 'bg-gray-100'}`}
    >
      {(['day', 'month', 'year'] as Period[]).map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            period === p
              ? isDark
                ? 'bg-white text-primary shadow-sm'
                : 'bg-white text-primary shadow-sm'
              : isDark
                ? 'text-white/80 hover:bg-white/15 hover:text-white'
                : 'text-gray-500 hover:bg-white hover:text-gray-700'
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
