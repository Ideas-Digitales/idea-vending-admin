'use client';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortParam } from '@/lib/interfaces/payment.interface';

interface SortableHeaderProps {
  label: string;
  field: string;
  sort: SortParam[];
  onSort: (sort: SortParam[]) => void;
  className?: string;
}

export default function SortableHeader({ label, field, sort, onSort, className }: SortableHeaderProps) {
  const current = sort.find((s) => s.field === field);

  const handleClick = () => {
    if (!current) {
      onSort([...sort, { field, direction: 'asc' }]);
    } else if (current.direction === 'asc') {
      onSort(sort.map((s) => (s.field === field ? { ...s, direction: 'desc' } : s)));
    } else {
      onSort(sort.filter((s) => s.field !== field));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1 hover:text-gray-900 transition-colors whitespace-nowrap ${className ?? ''}`}
    >
      {label}
      {!current && <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />}
      {current?.direction === 'asc' && <ChevronUp className="h-3.5 w-3.5 text-primary" />}
      {current?.direction === 'desc' && <ChevronDown className="h-3.5 w-3.5 text-primary" />}
    </button>
  );
}
