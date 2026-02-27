'use client';

import { Info } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  text: string;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ text, className, side = 'top' }: HelpTooltipProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center text-gray-400 hover:text-primary transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            className
          )}
          aria-label="Ayuda"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-[280px] rounded-xl bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-lg ring-1 ring-gray-200/80 leading-relaxed animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {text}
          <PopoverPrimitive.Arrow className="fill-white drop-shadow-sm" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
