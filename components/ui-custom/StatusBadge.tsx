'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
  error: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
};

export default function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-semibold px-2 py-0.5 rounded-full border',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </Badge>
  );
}
