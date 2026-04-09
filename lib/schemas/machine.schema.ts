import { z } from 'zod';

const statusEnum = z.enum(['online', 'offline']);

// Schema para crear máquina
export const createMachineSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  location: z.string()
    .min(1, 'La ubicación es requerida')
    .min(5, 'La ubicación debe tener al menos 5 caracteres')
    .max(255, 'La ubicación no puede exceder 255 caracteres'),

  image: z.string()
    .url('La imagen debe ser una URL válida')
    .max(2048, 'La URL de la imagen no puede exceder 2048 caracteres')
    .optional()
    .nullable(),

  type: z.string()
    .min(1, 'El tipo de máquina es requerido'),

  manage_stock: z.boolean(),

  enterprise_id: z.number()
    .int('El ID de empresa debe ser un número entero')
    .positive('El ID de empresa debe ser positivo'),

  client_id: z.number()
    .int('El ID de cliente debe ser un número entero')
    .positive('El ID de cliente debe ser positivo')
    .optional()
    .nullable(),
});

// Schema para actualizar máquina
export const updateMachineSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),

  location: z.string()
    .min(5, 'La ubicación debe tener al menos 5 caracteres')
    .max(255, 'La ubicación no puede exceder 255 caracteres')
    .optional(),

  image: z.string()
    .url('La imagen debe ser una URL válida')
    .max(2048, 'La URL de la imagen no puede exceder 2048 caracteres')
    .optional()
    .nullable(),

  type: z.string()
    .min(1, 'El tipo de máquina es requerido')
    .optional(),

  manage_stock: z.boolean().optional(),

  status: statusEnum.optional(),

  client_id: z.number()
    .int('El ID de cliente debe ser un número entero')
    .positive('El ID de cliente debe ser positivo')
    .optional()
    .nullable(),

  enterprise_id: z.number()
    .int('El ID de empresa debe ser un número entero')
    .positive('El ID de empresa debe ser positivo')
    .optional(),
});

// Types derivados de los schemas
export type CreateMachineFormData = z.infer<typeof createMachineSchema>;
export type UpdateMachineFormData = z.infer<typeof updateMachineSchema>;

// Schema para filtros de búsqueda
export const machineFiltersSchema = z.object({
  search: z.string().optional(),
  status: statusEnum.optional(),
  type: z.string().optional(),
  enterprise_id: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type MachineFiltersFormData = z.infer<typeof machineFiltersSchema>;
