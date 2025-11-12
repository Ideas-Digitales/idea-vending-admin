import { z } from 'zod';

// Schema para crear usuario
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z
    .string()
    .email('Ingrese un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  rut: z
    .string()
    .min(8, 'El RUT debe tener al menos 8 caracteres')
    .max(15, 'El RUT no puede exceder 15 caracteres')
    .regex(/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}[-|‐]{1}[0-9kK]{1}$/, 'Formato de RUT inválido (ej: 12.345.678-9 o 12345678-9)'),
  
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

// Schema para editar usuario (contraseñas completamente opcionales)
export const editUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z
    .string()
    .email('Ingrese un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  rut: z
    .string()
    .min(8, 'El RUT debe tener al menos 8 caracteres')
    .max(15, 'El RUT no puede exceder 15 caracteres')
    .regex(/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}[-|‐]{1}[0-9kK]{1}$/, 'Formato de RUT inválido (ej: 12.345.678-9 o 12345678-9)'),
  
  role: z.enum(['admin', 'customer', 'technician']),
  
  status: z.enum(['active', 'inactive']),

  // Contraseñas completamente opcionales para edición
  password: z.string().default(''),
  confirmPassword: z.string().default('')
}).refine((data) => {
  // Solo validar contraseñas si se proporciona una
  if (data.password && data.password.trim().length > 0) {
    return data.password.length >= 8;
  }
  return true;
}, {
  message: 'La contraseña debe tener al menos 8 caracteres',
  path: ['password']
}).refine((data) => {
  // Validar complejidad solo si hay contraseña
  if (data.password && data.password.trim().length > 0) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password);
  }
  return true;
}, {
  message: 'La contraseña debe contener al menos una minúscula, una mayúscula y un número',
  path: ['password']
}).refine((data) => {
  // Validar coincidencia solo si hay contraseña
  if (data.password && data.password.trim().length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
