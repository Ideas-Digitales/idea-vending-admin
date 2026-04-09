'use client';

import { getAvailableSlotSpans, type SlotSpan } from '@/lib/utils/slotSpan';

interface SlotSpanSelectorProps {
  value: SlotSpan;
  onChange: (span: SlotSpan) => void;
  totalColumns: number;
  disabled?: boolean;
  compact?: boolean;
}

export default function SlotSpanSelector({
  value,
  onChange,
  totalColumns,
  disabled = false,
  compact = false,
}: SlotSpanSelectorProps) {
  const options = getAvailableSlotSpans(totalColumns);

  return (
    <div className={compact ? 'flex items-center gap-1.5' : 'grid grid-cols-3 gap-2'}>
      {options.map((span) => {
        const active = value === span;
        return (
          <button
            key={span}
            type="button"
            onClick={() => onChange(span)}
            disabled={disabled}
            title={span === 1 ? 'Slot simple' : span === 2 ? 'Slot doble' : 'Slot triple'}
            className={
              compact
                ? `min-w-9 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'border-gray-200 bg-white text-muted hover:border-primary/30 hover:text-dark'
                  }`
                : `rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'border-gray-200 bg-white text-muted hover:border-primary/30 hover:text-dark'
                  }`
            }
          >
            {`x${span}`}
          </button>
        );
      })}
    </div>
  );
}
