'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutTemplate, Plus, Edit, Loader2, Grid3x3, ImageIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import { notify } from '@/lib/adapters/notification.adapter';
import { getMachineTemplatesAction } from '@/lib/actions/machine-templates';
import type { MachineTemplate, MachineTemplateSlot } from '@/lib/interfaces/machine-template.interface';
import { useUser } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';

// ── Mini grid preview ─────────────────────────────────────────────────────────

function MiniGrid({ slots, columns, rows }: { slots: MachineTemplateSlot[]; columns: number; rows: number }) {
  if (!slots.length) return (
    <div className="w-full h-full flex items-center justify-center text-gray-300">
      <Grid3x3 className="h-5 w-5" />
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {slots.map((slot) => {
        const x      = slot.x      ?? 0;
        const y      = slot.y      ?? 0;
        const width  = slot.width  ?? parseFloat((100 / columns).toFixed(2));
        const height = slot.height ?? parseFloat((100 / rows).toFixed(2));
        return (
          <div
            key={slot.id}
            className="absolute bg-[#3157b2]/15 border border-[#3157b2]/25 rounded-[2px]"
            style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: MachineTemplate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image + grid row */}
      <div className="flex gap-0 h-36">
        {/* Avatar image */}
        <div className="w-24 flex-shrink-0 bg-gray-50 border-r border-gray-100">
          {template.image ? (
            <img
              src={template.image}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon className="h-7 w-7" />
            </div>
          )}
        </div>
        {/* Mini grid */}
        <div className="flex-1 p-2 relative">
          <MiniGrid
            slots={template.slots ?? []}
            columns={template.columns}
            rows={template.rows}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 border-t border-gray-100 flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-800 truncate">{template.name}</p>
        {template.brand && (
          <p className="text-xs text-gray-400 truncate">{template.brand}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-auto">
          {template.columns} col · {template.rows} fil · {template.slots?.length ?? 0} slots
        </p>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3">
        <Link
          href={`/plantillas/${template.id}/editar`}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold rounded-lg bg-primary/8 text-primary hover:bg-primary/15 transition-colors"
        >
          <Edit className="h-3.5 w-3.5" />
          Editar plantilla
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlantillasPage() {
  const user   = useUser();
  const router = useRouter();
  const [templates, setTemplates] = useState<MachineTemplate[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.replace('/dashboard'); return; }
    getMachineTemplatesAction()
      .then((res) => {
        if (res.success) setTemplates(res.templates ?? []);
        else notify.error(res.error ?? 'Error al cargar plantillas');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        icon={LayoutTemplate}
        title="Plantillas"
        subtitle="Configura modelos de grilla reutilizables para tus máquinas"
        variant="white"
        actions={
          <Link href="/maquinas/plantillas/crear" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </Link>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <LayoutTemplate className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium text-gray-600">No hay plantillas</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Crea la primera plantilla para reutilizarla en tus máquinas</p>
            <Link href="/maquinas/plantillas/crear" className="btn-primary text-sm">
              Crear plantilla
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
