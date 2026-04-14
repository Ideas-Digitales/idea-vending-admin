'use client';

type ImageResource = 'machines' | 'products' | 'machine-templates';

export async function uploadEntityImage(
  resource: ImageResource,
  id: number | string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`/api/images/${resource}/${id}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'No se pudo subir la imagen.');
  }
}

export const uploadMachineImage   = (id: number | string, file: File) => uploadEntityImage('machines', id, file);
export const uploadProductImage   = (id: number | string, file: File) => uploadEntityImage('products', id, file);
export const uploadTemplateImage  = (id: number | string, file: File) => uploadEntityImage('machine-templates', id, file);
