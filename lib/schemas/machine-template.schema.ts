import { z } from 'zod';

export const machineTemplateSlotSchema = z.object({
  label: z.string().min(1, 'La etiqueta es requerida').max(255, 'La etiqueta no puede exceder 255 caracteres'),
  column: z.string().max(20, 'La columna no puede exceder 20 caracteres').nullable().optional(),
  row: z.number().int('La fila debe ser un número entero').min(1, 'La fila debe ser mayor a 0').nullable().optional(),
  mdb_code: z.number().int('El código MDB debe ser un número entero'),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  width: z.number().min(0, 'El ancho no puede ser negativo').nullable().optional(),
  height: z.number().min(0, 'El alto no puede ser negativo').nullable().optional(),
  default_capacity: z.number().int().min(1).nullable().optional(),
});

export const createMachineTemplateSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  brand: z.string().max(255, 'La marca no puede exceder 255 caracteres').nullable().optional(),
  image: z.string().max(2048, 'La imagen no puede exceder 2048 caracteres').nullable().optional(),
  description: z.string().nullable().optional(),
  columns: z.number().int('Las columnas deben ser un número entero').min(1, 'Debe haber al menos una columna').max(20, 'Máximo 20 columnas'),
  rows: z.number().int('Las filas deben ser un número entero').min(1, 'Debe haber al menos una fila').max(50, 'Máximo 50 filas'),
  slots: z.array(machineTemplateSlotSchema).min(1, 'Debe definir al menos un slot'),
});

export type CreateMachineTemplateFormData = z.infer<typeof createMachineTemplateSchema>;
