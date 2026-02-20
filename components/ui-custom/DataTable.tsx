'use client';

import { type LucideIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  title?: React.ReactNode;
  titleRight?: React.ReactNode;
  count?: number;
  keyExtractor?: (row: T, index: number) => string | number;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyIcon: EmptyIcon,
  emptyTitle = 'No hay datos',
  emptyMessage = 'No se encontraron resultados.',
  emptyAction,
  title,
  titleRight,
  count,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="card overflow-hidden">
      {(title || titleRight) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          {title && (
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-dark">{title}</div>
              {count !== undefined && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {count}
                </span>
              )}
            </div>
          )}
          {titleRight && <div className="flex items-center space-x-4 text-xs">{titleRight}</div>}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center">
          {EmptyIcon && <EmptyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
          <h3 className="text-lg font-semibold text-dark mb-2">{emptyTitle}</h3>
          <p className="text-muted">{emptyMessage}</p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={col.headerClassName ?? 'px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider'}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={keyExtractor ? keyExtractor(row, index) : index}
                  className="hover:bg-muted/50"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`px-6 py-4 ${col.className ?? ''}`.trim()}>
                      {col.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
