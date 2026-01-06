import { z } from 'zod';

/**
 * Schema para crear un slot
 */
export const createSlotSchema = z.object({
  mdb_code: z.number()
    .int('El código MDB debe ser un número entero')
    .positive('El código MDB debe ser positivo'),
  
  label: z.string()
    .min(1, 'La etiqueta debe tener al menos 1 carácter')
    .max(50, 'La etiqueta no puede exceder 50 caracteres')
    .optional(),
  
  product_id: z.number()
    .int('El ID del producto debe ser un número entero')
    .positive('El ID del producto debe ser positivo')
    .nullable()
    .optional(),
  
  capacity: z.number()
    .int('La capacidad debe ser un número entero')
    .nonnegative('La capacidad no puede ser negativa')
    .nullable()
    .optional(),
  
  current_stock: z.number()
    .int('El stock actual debe ser un número entero')
    .nonnegative('El stock actual no puede ser negativo')
    .nullable()
    .optional(),
});

/**
 * Schema para actualizar un slot
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export const updateSlotSchema = z.object({
  mdb_code: z.number()
    .int('El código MDB debe ser un número entero')
    .positive('El código MDB debe ser positivo')
    .optional(),
  
  label: z.string()
    .min(1, 'La etiqueta debe tener al menos 1 carácter')
    .max(50, 'La etiqueta no puede exceder 50 caracteres')
    .optional(),
  
  product_id: z.number()
    .int('El ID del producto debe ser un número entero')
    .positive('El ID del producto debe ser positivo')
    .nullable()
    .optional(),
  
  capacity: z.number()
    .int('La capacidad debe ser un número entero')
    .nonnegative('La capacidad no puede ser negativa')
    .nullable()
    .optional(),
  
  current_stock: z.number()
    .int('El stock actual debe ser un número entero')
    .nonnegative('El stock actual no puede ser negativo')
    .nullable()
    .optional(),
});

// Tipos TypeScript derivados de los schemas
export type CreateSlotFormData = z.infer<typeof createSlotSchema>;
export type UpdateSlotFormData = z.infer<typeof updateSlotSchema>;
