'use client';

export async function uploadEntityImage(
  entity: 'maquinas' | 'productos' | 'plantillas',
  id: number | string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`/${entity}/${id}/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `No se pudo subir la imagen.`);
  }
}

export const uploadMachineImage = (id: number | string, file: File) =>
  uploadEntityImage('maquinas', id, file);

export const uploadProductImage = (id: number | string, file: File) =>
  uploadEntityImage('productos', id, file);

export const uploadTemplateImage = async (id: number | string, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`/maquinas/plantillas/${id}/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `No se pudo subir la imagen.`);
  }
};
