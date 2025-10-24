import { z } from 'zod';

// Schema para crear usuario
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z
    .string()
    .email('Ingrese un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  rut: z
    .string()
    .min(8, 'El RUT debe tener al menos 8 caracteres')
    .max(12, 'El RUT no puede exceder 12 caracteres')
    .regex(/^[0-9]+[-|‐]{1}[0-9kK]{1}$/, 'Formato de RUT inválido (ej: 12345678-9)'),
  
  role: z.enum(['admin', 'customer', 'technician']),
  
  status: z.enum(['active', 'inactive']),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(255, 'La contraseña no puede exceder 255 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmPassword: z
    .string()
    .min(1, 'Confirme la contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Tipo inferido del schema
export type CreateUserFormData = z.infer<typeof createUserSchema>;

// Schema para editar usuario (sin contraseñas obligatorias)
export const editUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z
    .string()
    .email('Ingrese un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  rut: z
    .string()
    .min(8, 'El RUT debe tener al menos 8 caracteres')
    .max(12, 'El RUT no puede exceder 12 caracteres')
    .regex(/^[0-9]+[-|‐]{1}[0-9kK]{1}$/, 'Formato de RUT inválido (ej: 12345678-9)'),
  
  role: z.enum(['admin', 'customer', 'technician']),
  
  status: z.enum(['active', 'inactive'])
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
