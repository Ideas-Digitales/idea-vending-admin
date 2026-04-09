'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Loader2, Info } from "lucide-react";
import { createMachineAction } from "@/lib/actions/machines";
import { notify } from '@/lib/adapters/notification.adapter';
import { type CreateMachineFormData } from "@/lib/schemas/machine.schema";
import { PageHeader } from '@/components/ui-custom';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import { uploadMachineImage } from '@/lib/utils/imageUpload';

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-blue-600/80">
      <Info className="h-3.5 w-3.5 mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export default function NuevaMaquinaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'MDB' as CreateMachineFormData['type'],
    manage_stock: true,
    enterprise_id: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      notify.error('El nombre es requerido');
      return;
    }
    if (!formData.location.trim()) {
      notify.error('La ubicación es requerida');
      return;
    }
    if (!formData.enterprise_id || formData.enterprise_id <= 0) {
      notify.error('Debe seleccionar una empresa');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMachineAction({
        ...formData,
        client_id: null,
      });

      if (result.success) {
        if (result.machine && imageFile) {
          await uploadMachineImage(result.machine.id, imageFile);
        }
        notify.success('Máquina creada exitosamente');
        router.push('/maquinas');
      } else {
        notify.error(result.error || 'Error al crear máquina');
      }
    } catch (err) {
      console.error('Error al crear máquina:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'enterprise_id' ? Number(value) : value
    }));
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <>
      <PageHeader
        icon={Monitor}
        title="Nueva Máquina"
        subtitle="Registra una nueva máquina expendedora"
        backHref="/maquinas"
        variant="white"
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 max-w-2xl w-full">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Nombre <span className="text-red-500">*</span></label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
                placeholder="Ej: VM-Edificio Central Piso 2"
                required
              />
              <FieldHint>
                Usa un nombre que identifique la máquina de forma única. Incluye una referencia al lugar y un número o código si hay varias. Ej: <strong>«Snacks Casino Norte»</strong> o <strong>«VM-Torre B P3»</strong>. Evita nombres genéricos como «Máquina 1».
              </FieldHint>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Imagen referencial</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                  setImagePreview(file ? URL.createObjectURL(file) : null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
              />
              <FieldHint>
                Sube una foto o referencia visual de la máquina para reconocerla más rápido.
              </FieldHint>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Vista previa de máquina"
                  className="mt-3 h-36 w-full rounded-xl border border-gray-200 object-cover"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Ubicación <span className="text-red-500">*</span></label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black"
                rows={3}
                placeholder="Ej: Edificio Central, Piso 2, frente a los ascensores"
                required
              />
              <FieldHint>
                Sé lo más específico posible: edificio, piso, sala o punto de referencia visible. Esta información aparece en la vista de reposición y en las etiquetas QR. Ej: <strong>«Av. Providencia 1234, Casino Piso 1, junto a cajas»</strong>.
              </FieldHint>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Tipo <span className="text-red-500">*</span></label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-black select-custom"
                required
              >
                <option value="PULSES">PULSES</option>
                <option value="MDB">MDB</option>
                <option value="MDB-DEX">MDB-DEX</option>
              </select>
              <FieldHint>
                <strong>MDB</strong>: protocolo estándar para la mayoría de máquinas modernas. <strong>MDB-DEX</strong>: MDB con auditoría DEX para reportes detallados de ventas. <strong>PULSES</strong>: máquinas antiguas con señales de pulso. Consulta el manual de tu equipo si no estás seguro.
              </FieldHint>
            </div>

            <div>
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3">
                <input
                  type="checkbox"
                  checked={formData.manage_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, manage_stock: e.target.checked }))}
                  disabled={isSubmitting}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-black">Controlar stock de esta máquina</span>
                  <span className="block mt-1 text-xs text-gray-500">
                    Si lo desactivas, los slots heredarán “sin control de stock” salvo configuración puntual por slot.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Empresa <span className="text-red-500">*</span></label>
              <EnterpriseSearchInput
                selectedEnterpriseId={formData.enterprise_id || null}
                onEnterpriseSelect={(enterprise) =>
                  setFormData((prev) => ({ ...prev, enterprise_id: enterprise?.id ?? 0 }))
                }
                disabled={isSubmitting}
                placeholder="Buscar empresa por nombre o RUT..."
              />
              <FieldHint>
                La empresa propietaria de esta máquina. Define qué productos y usuarios tendrán acceso a gestionarla.
              </FieldHint>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/maquinas')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  'Crear Máquina'
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
