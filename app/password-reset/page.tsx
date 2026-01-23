'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, X, AlertCircle } from 'lucide-react';
import ClientOnly from '@/components/ClientOnly';

export default function PasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  // Obtener token de la ruta y email de los query params
  const token = params?.token as string;
  const email = searchParams.get('email');
  
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Validar parámetros iniciales
  useEffect(() => {
    if (!token || !email) {
      setError('Enlace de recuperación inválido. Falta token o email.');
    }
  }, [token, email]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !email) {
      setError('Datos incompletos para restablecer contraseña');
      return;
    }
    
    if (formData.password !== formData.password_confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('API URL no configurada');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    
    try {
      const response = await fetch(`${apiUrl}/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          token,
          password: formData.password,
          password_confirmation: formData.password_confirmation
        })
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || data?.error || 'Error al restablecer contraseña'
        );
      }
      
      const data = await response.json();
      setMessage(data?.message || 'Contraseña actualizada correctamente');
      
      // Limpiar formulario
      setFormData({
        password: '',
        password_confirmation: ''
      });
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Limpiar errores al escribir
    if (error) setError(null);
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(135deg, #3157b2 0%, #203c84 50%, #16265f 100%)' }}
    >
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dark">Restablecer Contraseña</h2>
            <p className="text-sm text-gray-600 mt-2">
              Ingresa una nueva contraseña para tu cuenta
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-semibold">Error</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-emerald-700 font-semibold">Éxito</p>
                <p className="text-xs text-emerald-600 mt-1">{message}</p>
              </div>
            </div>
          )}
          
          <ClientOnly>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark mb-3">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="input-field pl-12"
                    placeholder="Ingresa tu nueva contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              {/* Confirm Password Field */}
              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-semibold text-dark mb-3">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    required
                    className="input-field pl-12"
                    placeholder="Confirma tu nueva contraseña"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.password || !formData.password_confirmation}
                  className="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    'Restablecer Contraseña'
                  )}
                </button>
              </div>
            </form>
          </ClientOnly>
          
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
