'use client';

type ImageResource = 'machines' | 'products' | 'machine-templates';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 1200; // px — lado más largo
const QUALITY       = 0.82; // calidad WebP (0–1)
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB — igual que backend

// ── Validación ────────────────────────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Formato no permitido. Usa JPG, PNG o WebP.`;
  }
  if (file.size > MAX_BYTES) {
    return `La imagen supera los 5 MB.`;
  }
  return null;
}

// ── Optimización (Canvas API) ─────────────────────────────────────────────────

export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Redimensionar si supera MAX_DIMENSION en cualquier lado
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width  = MAX_DIMENSION;
        } else {
          width  = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No se pudo procesar la imagen.')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('No se pudo comprimir la imagen.')); return; }
          const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
          console.log(`[ImageOptimizer] ${file.name} | original: ${kb(file.size)} → optimizado: ${kb(blob.size)} (${Math.round((1 - blob.size / file.size) * 100)}% menos)`);
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        },
        'image/webp',
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen.'));
    };

    img.src = objectUrl;
  });
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadEntityImage(
  resource: ImageResource,
  id: number | string,
  file: File,
): Promise<void> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const optimized = await optimizeImage(file);

  const formData = new FormData();
  formData.append('image', optimized);

  const response = await fetch(`/api/images/${resource}/${id}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'No se pudo subir la imagen.');
  }
}

export const uploadMachineImage  = (id: number | string, file: File) => uploadEntityImage('machines', id, file);
export const uploadProductImage  = (id: number | string, file: File) => uploadEntityImage('products', id, file);
export const uploadTemplateImage = (id: number | string, file: File) => uploadEntityImage('machine-templates', id, file);
