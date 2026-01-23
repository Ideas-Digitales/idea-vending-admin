'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, editUserSchema, CreateUserFormData, EditUserFormData } from '@/lib/schemas/user.schema';
import { User, Mail, Lock, Eye, EyeOff, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User as UserType } from '@/lib/interfaces';

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData | EditUserFormData) => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  initialData?: UserType;
  title?: string;
  canEditAllFields?: boolean;
}

export default function CreateUserForm({ 
  onSubmit, 
  isLoading = false, 
  mode = 'create',
  initialData,
  title,
  canEditAllFields = true,
}: CreateUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roleLabelMap: Record<'admin' | 'customer' | 'technician', string> = {
    admin: 'Administrador',
    customer: 'Cliente',
    technician: 'Técnico',
  };

  const userRoleDisplayMap: Record<string, string> = {
    admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Visualizador',
    customer: 'Cliente',
    technician: 'Técnico',
  };

  const statusLabelMap: Record<'active' | 'inactive', string> = {
    active: 'Activo',
    inactive: 'Inactivo',
  };

  // Mapear roles de la interfaz User a los roles del schema
  const mapUserRoleToSchemaRole = (userRole: string): 'admin' | 'customer' | 'technician' => {
    const normalizedRole = (userRole || '').toLowerCase();

    if (normalizedRole.includes('admin')) {
      return 'admin';
    }

    if (
      normalizedRole.includes('customer') ||
      normalizedRole.includes('custumer') ||
      normalizedRole.includes('client') ||
      normalizedRole.includes('cliente')
    ) {
      return 'customer';
    }

    if (normalizedRole.includes('operator') || normalizedRole.includes('manager')) {
      return 'customer';
    }

    if (normalizedRole.includes('technician') || normalizedRole.includes('tech') || normalizedRole.includes('support')) {
      return 'technician';
    }

    if (normalizedRole.includes('viewer') || normalizedRole.includes('view') || normalizedRole.includes('read')) {
      return 'technician';
    }

    return 'admin';
  };

  const resolveInitialRole = (user?: UserType): 'admin' | 'customer' | 'technician' => {
    if (!user) return 'admin';

    if (user.role && user.role !== 'No role') {
      return mapUserRoleToSchemaRole(user.role);
    }

    const roleFromCollection = user.roles?.find((entry) => typeof entry?.name === 'string' && entry.name.trim().length > 0);

    if (roleFromCollection) {
      return mapUserRoleToSchemaRole(roleFromCollection.name);
    }

    return 'admin';
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    trigger,
    watch,
  } = useForm({
    resolver: zodResolver(mode === 'edit' ? editUserSchema : createUserSchema),
    mode: mode === 'edit' ? 'onBlur' : 'onChange',
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      rut: initialData?.rut || '',
      role: initialData ? resolveInitialRole(initialData) : 'admin',
      status: (initialData?.status === 'active' || initialData?.status === 'inactive') ? initialData.status : 'inactive', // Cambiar default a 'inactive' para modo crear
      password: '',
      confirmPassword: ''
    }
  });

  // Actualizar formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        name: initialData.name,
        email: initialData.email,
        rut: initialData.rut,
        role: resolveInitialRole(initialData),
        status: (initialData.status === 'active' || initialData.status === 'inactive') ? initialData.status : 'inactive',
        password: '',
        confirmPassword: ''
      });
      
      // Trigger validation after reset in edit mode
      if (mode === 'edit') {
        setTimeout(() => trigger(), 100);
      }
    }
  }, [initialData, mode, reset, trigger]);

  const handleFormSubmit = (data: CreateUserFormData | EditUserFormData) => {
    onSubmit(data);
  };

  const isLimitedEdit = mode === 'edit' && !canEditAllFields;
  const roleValue = watch('role') as 'admin' | 'customer' | 'technician' | undefined;
  const statusValue = watch('status') as 'active' | 'inactive' | undefined;
  const lockedInputClasses = isLimitedEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-gray-200 focus:border-gray-200' : '';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-black">
            {title || (mode === 'edit' ? 'Editar Usuario' : 'Crear Nuevo Usuario')}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
              Nombre Completo *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className={`w-full px-3 py-2 border rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ingrese el nombre completo"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {!isLimitedEdit && (
            <>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } ${lockedInputClasses}`}
                    placeholder="usuario@ejemplo.com"
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              {/* RUT */}
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-black mb-2">
                  RUT *
                </label>
                <input
                  {...register('rut')}
                  type="text"
                  id="rut"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.rut ? 'border-red-300' : 'border-gray-300'
                  } ${lockedInputClasses}`}
                  placeholder="12345678-9"
                  disabled={isLoading}
                />
                {errors.rut && (
                  <p className="mt-1 text-sm text-red-600">{errors.rut.message}</p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-black mb-2">
                  Rol *
                </label>
                <select
                  {...register('role')}
                  id="role"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.role ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="admin">Administrador</option>
                  <option value="customer">Cliente</option>
                  <option value="technician">Técnico</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-black mb-2">
                  Estado *
                </label>
                <select
                  {...register('status')}
                  id="status"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.status ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contraseñas */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-black mb-4">
            {mode === 'edit' ? 'Cambiar Contraseña (Opcional)' : 'Credenciales de Acceso'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                {mode === 'edit' ? 'Nueva Contraseña' : 'Contraseña *'}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`w-full px-3 py-2 pl-10 pr-10 border rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'edit' ? 'Dejar vacío para mantener actual' : 'Ingrese la contraseña'}
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                {mode === 'edit' ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`w-full px-3 py-2 pl-10 pr-10 border rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'edit' ? 'Confirme la nueva contraseña' : 'Confirme la contraseña'}
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 pt-6 border-t">
        
          <button
            type="submit"
            disabled={mode === 'create' ? (!isValid || isLoading) : (Object.keys(errors).length > 0 || isLoading)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                {mode === 'edit' ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 inline" />
                {mode === 'edit' ? 'Actualizar Usuario' : 'Crear Usuario'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Información de ayuda */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {mode === 'edit' ? 'Cambio de contraseña (opcional):' : 'Requisitos de contraseña:'}
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {mode === 'edit' && (
            <li>• Deja los campos de contraseña vacíos si no deseas cambiarla</li>
          )}
          <li>• Mínimo 8 caracteres</li>
          <li>• Al menos una letra minúscula</li>
          <li>• Al menos una letra mayúscula</li>
          <li>• Al menos un número</li>
        </ul>
      </div>
    </div>
  );
}
