import { z } from 'zod';

// Schema para crear producto - solo nombre y empresa
export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  enterprise_id: z.number()
    .min(1, 'Debe seleccionar una empresa'),
});

// Schema para actualizar producto - solo nombre
export const updateProductSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

// Tipos TypeScript derivados de los schemas
export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
