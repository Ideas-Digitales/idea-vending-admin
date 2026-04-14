'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getProductAction, updateProductAction } from '@/lib/actions/products';
import { useMqttProduct } from '@/lib/hooks/useMqttProduct';
import { notify } from '@/lib/adapters/notification.adapter';
import type { Producto } from '@/lib/interfaces/product.interface';
import { uploadProductImage } from '@/lib/utils/imageUpload';
import { ImageInput } from '@/components/ui-custom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | string | null;
  onSaved: () => void;
}

export function EditProductoModal({ open, onOpenChange, productId, onSaved }: Props) {
  const { publishProductOperation, isPublishing } = useMqttProduct();
  const [product, setProduct] = useState<Producto | null>(null);
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !productId) return;
    setLoading(true);
    setProduct(null);
    setName('');
    setImageFile(null);
    setCurrentImageUrl(null);
    getProductAction(productId)
      .then(res => {
        if (res.success && res.product) {
          setProduct(res.product);
          setName(res.product.name);
          setCurrentImageUrl(res.product.image ?? null);
        } else {
          notify.error('No se pudo cargar el producto');
          onOpenChange(false);
        }
      })
      .finally(() => setLoading(false));
  }, [open, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !name.trim()) return;
    setSaving(true);
    try {
      const result = await updateProductAction(productId, {
        name: name.trim(),
      });
      if (!result.success) {
        notify.error(`Error al actualizar: ${result.error}`);
        return;
      }
      if (imageFile) {
        await uploadProductImage(productId, imageFile);
      }
      if (product) {
        try {
          await publishProductOperation('update', {
            id: typeof productId === 'string' ? parseInt(productId) : productId,
            enterprise_id: product.enterprise_id,
            name: name.trim(),
          });
        } catch {
          // MQTT falla silenciosamente; la actualización ya se guardó
        }
      }
      notify.success('Producto actualizado exitosamente');
      onSaved();
      onOpenChange(false);
    } catch {
      notify.error('Error al actualizar producto');
    } finally {
      setSaving(false);
    }
  };

  const busy = saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Editar Producto
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <ImageInput
              label="Imagen referencial"
              previewAlt="Vista previa de producto"
              currentImageUrl={currentImageUrl}
              disabled={busy}
              onChange={setImageFile}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Ej: Coca Cola 350ml"
                required
                autoFocus
                disabled={busy}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isPublishing ? 'Sincronizando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
