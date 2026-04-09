'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { Producto } from '@/lib/interfaces/product.interface';
import SlotSpanSelector from '@/components/slots/SlotSpanSelector';
import { deriveSlotSpan, slotSpanToWidth } from '@/lib/utils/slotSpan';

type InspectorSlot = {
  id: string | number;
  label: string;
  mdb_code: number;
  product_id: number | null;
  product?: { id: number | string; name: string } | null;
  capacity: number | null;
  current_stock?: number | null;
  width?: number | null;
};

interface SlotInspectorPanelProps {
  slot: InspectorSlot;
  products: Producto[];
  totalColumns: number;
  onEditField: (field: 'label' | 'mdb_code' | 'capacity' | 'width', value: string | number | null) => void;
  onAssign: (product: Producto | null) => void;
  onClose: () => void;
  actions?: ReactNode;
}

function getProductColor(productId: number | string): string {
  const palette = ['#3157b2', '#d97706', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5'];
  const n = typeof productId === 'number' ? productId : Number(String(productId).replace(/\D/g, '')) || 0;
  return palette[Math.abs(n) % palette.length];
}

export default function SlotInspectorPanel({
  slot,
  products,
  totalColumns,
  onEditField,
  onAssign,
  onClose,
  actions,
}: SlotInspectorPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(slot.label);
  const [mdb, setMdb] = useState(String(slot.mdb_code));
  const [capacity, setCapacity] = useState(slot.capacity != null ? String(slot.capacity) : '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLabel(slot.label);
    setMdb(String(slot.mdb_code));
    setCapacity(slot.capacity != null ? String(slot.capacity) : '');
  }, [slot.id, slot.label, slot.mdb_code, slot.capacity]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const commitLabel = () => {
    const value = label.trim();
    if (value && value !== slot.label) onEditField('label', value);
  };

  const commitMdb = () => {
    const value = parseInt(mdb, 10);
    if (!Number.isNaN(value) && value !== slot.mdb_code) onEditField('mdb_code', value);
  };

  const commitCapacity = () => {
    if (capacity === '') {
      if (slot.capacity !== null) onEditField('capacity', null);
      return;
    }

    const value = parseInt(capacity, 10);
    if (!Number.isNaN(value) && value >= 0 && value !== slot.capacity) onEditField('capacity', value);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, search]);

  const currentSpan = deriveSlotSpan(slot.width, totalColumns);
  const inputCls = 'w-12 px-1.5 py-0.5 text-xs font-mono text-dark bg-white border border-gray-200 rounded focus:outline-none focus:border-primary text-center';

  return (
    <div ref={ref} className="absolute z-50 top-full left-0 mt-2 w-[min(20rem,calc(100vw-1rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="px-3.5 py-3 border-b border-gray-100 bg-gray-50/70">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-gray-400">Etiqueta</span>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={commitLabel}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitLabel(); (e.target as HTMLInputElement).blur(); } }}
                  className={`${inputCls} w-16 font-bold`}
                  maxLength={12}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-gray-400">MDB</span>
                <input
                  type="number"
                  value={mdb}
                  onChange={(e) => setMdb(e.target.value)}
                  onBlur={commitMdb}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitMdb(); (e.target as HTMLInputElement).blur(); } }}
                  className={inputCls}
                  min={0}
                  max={999}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-1.5">
                <span className="text-[10px] font-medium text-gray-400">Cap. máx.</span>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  onBlur={commitCapacity}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitCapacity(); (e.target as HTMLInputElement).blur(); } }}
                  className={`${inputCls} w-12 border-0 bg-transparent p-0`}
                  min={0}
                  placeholder="—"
                />
              </div>
              {totalColumns > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-1.5">
                  <span className="text-[10px] font-medium text-gray-400">Tamaño</span>
                  <SlotSpanSelector
                    value={currentSpan}
                    totalColumns={totalColumns}
                    compact
                    onChange={(span) => onEditField('width', slotSpanToWidth(span, totalColumns))}
                  />
                </div>
              )}
              {slot.current_stock != null && (
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5">
                  <span className="text-[10px] font-medium text-gray-400">Stock</span>
                  <span className="text-xs font-mono font-semibold text-primary">{slot.current_stock}/{slot.capacity ?? '—'}</span>
                </div>
              )}
            </div>

            {actions && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {actions}
              </div>
            )}
          </div>

          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary/70 text-sm text-dark placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <button
          onClick={() => onAssign(null)}
          className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-sm hover:bg-gray-50 transition-colors ${!slot.product_id ? 'bg-primary/4' : ''}`}
        >
          <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300 shrink-0" />
          <span className="text-gray-400 flex-1 text-left">Sin producto</span>
          {!slot.product_id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </button>

        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-sm text-gray-400 text-center">Sin resultados para &ldquo;{search}&rdquo;</p>
        ) : (
          filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => onAssign(product)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-sm hover:bg-gray-50 transition-colors ${slot.product?.id === product.id || slot.product_id === Number(product.id) ? 'bg-primary/4' : ''}`}
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: getProductColor(product.id) }} />
              <span className="truncate text-dark flex-1 text-left">{product.name}</span>
              {(slot.product?.id === product.id || slot.product_id === Number(product.id)) && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
