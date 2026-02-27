'use client';

import { useCallback } from 'react';
import { BookOpen } from 'lucide-react';

export interface TourStep {
  element: string;
  popover: {
    title?: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
}

// Keep the alias for backward-compat with pages that import Step
export type Step = TourStep;

interface TourRunnerProps {
  steps: TourStep[];
  buttonLabel?: string;
  variant?: 'default' | 'icon';
  /** 'dark' = gradient header (white text), 'light' = white header (gray text). Default: 'dark'. */
  theme?: 'dark' | 'light';
}

export function TourRunner({ steps, buttonLabel = 'Guía', variant = 'default', theme = 'dark' }: TourRunnerProps) {
  const startTour = useCallback(async () => {
    // driver.js must be imported at runtime (client-only, ESM)
    const { driver } = await import('driver.js');

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'iv-tour-popover',
      overlayOpacity: 0.45,
      smoothScroll: true,
      steps: steps.map(s => ({
        element: s.element,
        popover: {
          title: s.popover.title,
          description: s.popover.description,
          side: s.popover.side ?? 'bottom',
          align: s.popover.align ?? 'start',
        },
      })),
    });

    driverObj.drive();
  }, [steps]);

  return (
    <button
      onClick={startTour}
      title="Ver guía interactiva"
      className={`inline-flex items-center gap-1.5 text-sm transition-colors px-2 py-1.5 rounded-md ${
        theme === 'dark'
          ? 'text-white/70 hover:text-white hover:bg-white/15'
          : 'text-gray-500 hover:text-primary hover:bg-gray-100'
      }`}
    >
      <BookOpen className="h-4 w-4 shrink-0" />
      {variant === 'default' && (
        <span className="hidden sm:inline text-xs font-medium">{buttonLabel}</span>
      )}
    </button>
  );
}
