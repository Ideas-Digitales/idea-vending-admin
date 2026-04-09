'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutTemplate, Save, Loader2, ImageIcon, ChevronDown, ChevronUp, Grid3x3,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-custom';
import { notify } from '@/lib/adapters/notification.adapter';
import { getMachineTemplateAction, updateMachineTemplateAction } from '@/lib/actions/machine-templates';
import { uploadTemplateImage } from '@/lib/utils/imageUpload';
import type { MachineTemplate, MachineTemplateSlot } from '@/lib/interfaces/machine-template.interface';

// ── Mini grid preview ─────────────────────────────────────────────────────────

function MiniGridFull({ slots, columns, rows }: { slots: MachineTemplateSlot[]; columns: number; rows: number }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: `${(rows / columns) * 100}%` }}>
      <div className="absolute inset-0">
        {slots.map((slot) => {
          const x      = slot.x      ?? 0;
          const y      = slot.y      ?? 0;
          const width  = slot.width  ?? parseFloat((100 / columns).toFixed(2));
          const height = slot.height ?? parseFloat((100 / rows).toFixed(2));
          return (
            <div
              key={slot.id}
              className="absolute bg-[#3157b2]/10 border border-[#3157b2]/20 rounded-sm flex items-center justify-center"
              style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }}
            >
              <span className="text-[8px] text-[#3157b2]/60 font-mono truncate px-0.5">{slot.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditarPlantillaPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params.id as string;

  const [template, setTemplate]         = useState<MachineTemplate | null>(null);
  const [loading, setLoading]           = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', brand: '', description: '' });

  useEffect(() => {
    getMachineTemplateAction(id).then((res) => {
      if (res.success && res.template) {
        const t = res.template;
        setTemplate(t);
        setForm({ name: t.name, brand: t.brand ?? '', description: t.description ?? '' });
        setImagePreview(t.image ?? null);
        if (t.brand || t.description || t.image) setShowOptional(true);
      } else {
        notify.error(res.error ?? 'No se pudo cargar la plantilla');
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    return () => { if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((cur) => ({ ...cur, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { notify.error('El nombre es requerido'); return; }

    setIsSubmitting(true);

    const res = await updateMachineTemplateAction(id, {
      name:        form.name.trim(),
      brand:       form.brand.trim()       || null,
      description: form.description.trim() || null,
      image:       template?.image ?? null,
      columns:     template?.columns ?? 1,
      rows:        template?.rows    ?? 1,
    });

    if (!res.success) {
      notify.error(res.error ?? 'No se pudo actualizar la plantilla');
      setIsSubmitting(false);
      return;
    }

    if (imageFile && res.template?.id) {
      await uploadTemplateImage(res.template.id, imageFile).catch(() => {
        notify.warning('Plantilla actualizada, pero no se pudo subir la imagen.');
      });
    }

    notify.success('Plantilla actualizada');
    router.push('/plantillas');
  };

  if (loading) {
    return (
      <>
        <PageHeader icon={LayoutTemplate} title="Editar Plantilla" backHref="/plantillas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
        </div>
      </>
    );
  }

  if (!template) return null;

  const slots = template.slots ?? [];

  return (
    <>
      <PageHeader
        icon={LayoutTemplate}
        title="Editar Plantilla"
        subtitle={template.name}
        backHref="/plantillas"
        variant="white"
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-3xl mx-auto flex flex-col lg:flex-row gap-5 items-start">

          {/* ── Form panel ──────────────────────────────────────────────── */}
          <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <section className="card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Información</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: Crane National 167"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowOptional((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#3157b2] hover:text-[#203c84] transition-colors"
                >
                  {showOptional ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showOptional ? 'Ocultar campos opcionales' : 'Marca, imagen o descripción'}
                </button>

                {showOptional && (
                  <div className="space-y-4 pt-1 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
                      <input name="brand" value={form.brand} onChange={handleChange}
                        className="input-field" placeholder="Ej: Crane" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Imagen</label>
                      {/* Avatar preview */}
                      <div className="mb-2 w-24 aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        {imageFile ? imageFile.name : 'Seleccionar imagen'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                            setImageFile(file);
                            setImagePreview(file ? URL.createObjectURL(file) : null);
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                      <textarea name="description" value={form.description} onChange={handleChange}
                        className="input-field min-h-20 resize-none text-sm"
                        placeholder="Modelo o uso esperado de esta plantilla." />
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !form.name.trim()}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <Link href="/plantillas" className="text-center text-sm text-gray-500 hover:text-gray-700 py-2">
                  Cancelar
                </Link>
              </div>
            </form>
          </div>

          {/* ── Grid preview panel ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Grilla de slots
              </h2>
              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg font-mono">
                {template.columns} × {template.rows} · {slots.length} slots
              </span>
            </div>

            {slots.length > 0 ? (
              <MiniGridFull slots={slots} columns={template.columns} rows={template.rows} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <Grid3x3 className="h-10 w-10 mb-2" />
                <p className="text-sm text-gray-400">Sin slots configurados</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
              Para modificar el layout de slots, crea una nueva plantilla y aplícala a las máquinas.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
