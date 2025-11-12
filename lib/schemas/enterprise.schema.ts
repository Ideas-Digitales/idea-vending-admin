import { z } from "zod";

// Schema para crear una nueva empresa
export const createEnterpriseSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim(),
  
  rut: z
    .string()
    .min(1, "El RUT es requerido")
    .regex(/^[0-9]+-[0-9kK]$/, "El RUT debe tener el formato correcto (ej: 12345678-9)")
    .trim(),
  
  address: z
    .string()
    .min(1, "La dirección es requerida")
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .trim(),
  
  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .regex(/^[+]?[0-9\s\-\(\)]+$/, "El teléfono debe contener solo números, espacios, guiones y paréntesis")
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .trim(),
  
  user_id: z
    .number()
    .int("El ID de usuario debe ser un número entero")
    .positive("El ID de usuario debe ser positivo")
});

// Schema para actualizar una empresa
export const updateEnterpriseSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim()
    .optional(),
  
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .trim()
    .optional(),
  
  phone: z
    .string()
    .regex(/^[+]?[0-9\s\-\(\)]+$/, "El teléfono debe contener solo números, espacios, guiones y paréntesis")
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .trim()
    .optional(),
});

// Tipos TypeScript derivados de los schemas
export type CreateEnterpriseFormData = z.infer<typeof createEnterpriseSchema>;
export type UpdateEnterpriseFormData = z.infer<typeof updateEnterpriseSchema>;
