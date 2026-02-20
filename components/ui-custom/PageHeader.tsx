'use client';

import Link from 'next/link';
import { ChevronLeft, Menu, type LucideIcon } from 'lucide-react';
import { useAppShell } from '@/lib/contexts/AppShellContext';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  variant?: 'gradient' | 'white';
  children?: React.ReactNode;
}

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  backHref,
  variant = 'gradient',
  children,
}: PageHeaderProps) {
  const isGradient = variant === 'gradient';
  const { openSidebar } = useAppShell();

  return (
    <header
      className={
        isGradient
          ? 'page-header-gradient sticky top-0 z-40'
          : 'bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'
      }
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          {/* Left: hamburger + back + icon + title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Hamburger — mobile only */}
            <button
              onClick={openSidebar}
              className={`md:hidden shrink-0 p-2 rounded-lg transition-colors ${
                isGradient
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            {backHref && (
              <Link
                href={backHref}
                className={`shrink-0 p-2 rounded-lg transition-colors ${
                  isGradient
                    ? 'hover:bg-white/20 text-white'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}

            {/* Icon — hidden on mobile */}
            {Icon && (
              <div
                className={`hidden sm:flex shrink-0 h-10 w-10 rounded-lg items-center justify-center ${
                  isGradient ? 'bg-white/15' : 'bg-primary'
                }`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}

            <div className="min-w-0">
              <h1
                className={`text-xl sm:text-2xl font-bold truncate ${
                  isGradient ? 'text-white' : 'text-dark'
                }`}
              >
                {title}
              </h1>
              {/* Subtitle — hidden on mobile */}
              {subtitle && (
                <p
                  className={`hidden sm:block text-sm ${
                    isGradient ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: actions */}
          {(actions || children) && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
