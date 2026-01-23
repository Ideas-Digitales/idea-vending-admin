'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuthStore, useIsAuthenticated, useAuthLoading, useAuthError } from '@/lib/stores/authStore';
import ClientOnly from '@/components/ClientOnly';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { login, clearError } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      setShowSuccess(true);
      setTimeout(() => {
        router.replace('/dashboard'); // usar replace para evitar volver al login
      }, 1500);
    }
  }, [isAuthenticated, router]);

  // Limpiar error al desmontar componente
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Auto-limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚨 HANDLE SUBMIT EJECUTADO');
    console.log('🚨 Form data:', formData);
    console.log('🚨 isAuthenticated:', isAuthenticated);
    console.log('🚨 isLoading:', isLoading);
    console.trace('🚨 Stack trace handleSubmit:');
    
    e.preventDefault();
    e.stopPropagation();
    
    // MÚLTIPLES VALIDACIONES PARA EVITAR AUTO-SUBMIT
    if (isAuthenticated) {
      console.log('🚨 Ya autenticado, cancelando submit');
      return;
    }
    
    if (isLoading) {
      console.log('🚨 Ya cargando, cancelando submit');
      return;
    }
    
    if (!formData.email || !formData.password) {
      console.log('🚨 Datos incompletos, cancelando submit');
      return;
    }
    
    if (formData.email.trim() === '' || formData.password.trim() === '') {
      console.log('🚨 Datos vacíos, cancelando submit');
      return;
    }
    
    if (!formData.email.includes('@')) {
      console.log('🚨 Email inválido, cancelando submit');
      return;
    }

    try {
      console.log('✅ Enviando formulario de login VÁLIDO...');
      await login(formData);
      // La redirección ocurrirá automáticamente via useEffect
    } catch (err) {
      console.error('Error en login:', err);
      // El error se maneja en el store
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      clearError();
    }
  };

  // Mostrar mensaje de éxito si está autenticado
  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(135deg, #3157b2 0%, #203c84 50%, #16265f 100%)' }}
      >
        <div className="max-w-md w-full text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-dark mb-4">
              ¡Acceso Autorizado!
            </h2>
            <p className="text-muted mb-6">
              Redirigiendo al panel de control...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(135deg, #3157b2 0%, #203c84 50%, #16265f 100%)' }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primera fila de cubos */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-2xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute -top-2 left-20 w-16 h-16 bg-white/8 rounded-xl animate-pulse-glow" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-5 left-40 w-12 h-12 bg-white/6 rounded-lg animate-float-reverse" style={{ animationDelay: '0.6s' }}></div>
        <div className="absolute -top-6 right-32 w-20 h-20 bg-white/12 rounded-2xl animate-float" style={{ animationDelay: '0.9s' }}></div>
        <div className="absolute top-8 right-10 w-14 h-14 bg-white/8 rounded-xl animate-pulse-glow" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute -top-3 right-60 w-18 h-18 bg-white/10 rounded-lg animate-float-reverse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Segunda fila de cubos */}
        <div className="absolute top-1/4 -left-6 w-22 h-22 bg-white/9 rounded-2xl animate-pulse-glow" style={{ animationDelay: '1.8s' }}></div>
        <div className="absolute top-1/4 left-16 w-10 h-10 bg-white/5 rounded-lg animate-float" style={{ animationDelay: '2.1s' }}></div>
        <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-white/8 rounded-xl animate-float-reverse" style={{ animationDelay: '2.4s' }}></div>
        <div className="absolute top-1/4 right-20 w-12 h-12 bg-white/6 rounded-lg animate-pulse-glow" style={{ animationDelay: '2.7s' }}></div>
        <div className="absolute top-1/3 right-5 w-26 h-26 bg-white/11 rounded-2xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/4 right-1/2 w-14 h-14 bg-white/7 rounded-xl animate-float-reverse" style={{ animationDelay: '3.3s' }}></div>
        
        {/* Tercera fila de cubos */}
        <div className="absolute top-1/2 -left-8 w-18 h-18 bg-white/10 rounded-xl animate-float" style={{ animationDelay: '3.6s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/6 rounded-lg animate-pulse-glow" style={{ animationDelay: '3.9s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white/12 rounded-2xl animate-float-reverse" style={{ animationDelay: '4.2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/8 rounded-xl animate-float" style={{ animationDelay: '4.5s' }}></div>
        <div className="absolute top-1/2 right-8 w-14 h-14 bg-white/7 rounded-lg animate-pulse-glow" style={{ animationDelay: '4.8s' }}></div>
        
        {/* Cuarta fila de cubos */}
        <div className="absolute bottom-1/4 -left-4 w-16 h-16 bg-white/8 rounded-xl animate-float-reverse" style={{ animationDelay: '5.1s' }}></div>
        <div className="absolute bottom-1/4 left-10 w-24 h-24 bg-white/10 rounded-2xl animate-pulse-glow" style={{ animationDelay: '5.4s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-white/6 rounded-lg animate-float" style={{ animationDelay: '5.7s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-18 h-18 bg-white/9 rounded-xl animate-float-reverse" style={{ animationDelay: '6s' }}></div>
        <div className="absolute bottom-1/4 right-12 w-22 h-22 bg-white/11 rounded-2xl animate-pulse-glow" style={{ animationDelay: '6.3s' }}></div>
        
        {/* Quinta fila de cubos */}
        <div className="absolute bottom-10 -left-6 w-20 h-20 bg-white/12 rounded-2xl animate-float" style={{ animationDelay: '6.6s' }}></div>
        <div className="absolute bottom-8 left-20 w-14 h-14 bg-white/7 rounded-lg animate-pulse-glow" style={{ animationDelay: '6.9s' }}></div>
        <div className="absolute bottom-12 left-1/2 w-16 h-16 bg-white/8 rounded-xl animate-float-reverse" style={{ animationDelay: '7.2s' }}></div>
        <div className="absolute bottom-6 right-16 w-10 h-10 bg-white/5 rounded-lg animate-float" style={{ animationDelay: '7.5s' }}></div>
        <div className="absolute bottom-10 right-1/4 w-26 h-26 bg-white/13 rounded-2xl animate-pulse-glow" style={{ animationDelay: '7.8s' }}></div>
        <div className="absolute -bottom-4 right-4 w-18 h-18 bg-white/9 rounded-xl animate-float-reverse" style={{ animationDelay: '8.1s' }}></div>
        
        {/* Cubos adicionales dispersos */}
        <div className="absolute top-16 left-1/5 w-8 h-8 bg-white/4 rounded-lg animate-float" style={{ animationDelay: '8.4s' }}></div>
        <div className="absolute top-2/3 left-1/6 w-28 h-28 bg-white/14 rounded-2xl animate-pulse-glow" style={{ animationDelay: '8.7s' }}></div>
        <div className="absolute top-3/4 right-1/5 w-12 h-12 bg-white/6 rounded-xl animate-float-reverse" style={{ animationDelay: '9s' }}></div>
        <div className="absolute bottom-1/3 left-1/5 w-24 h-24 bg-white/10 rounded-2xl animate-float" style={{ animationDelay: '9.3s' }}></div>
        <div className="absolute top-1/6 right-1/6 w-14 h-14 bg-white/7 rounded-lg animate-pulse-glow" style={{ animationDelay: '9.6s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center px-2">
          <img
            src="/logo_ideavending.png"
            alt="Ideas Digitales"
            width={800}
            height={400}
            className="mx-auto w-full max-w-[520px] h-auto object-contain drop-shadow-2xl mb-8"
          />
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-semibold">Error de autenticación</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <ClientOnly fallback={
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          }>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-dark mb-3">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="input-field pl-12"
                    placeholder="tu-email@ejemplo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark mb-3">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pl-12 pr-12"
                    placeholder="Ingresa tu contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordar sesión
                  </label>
                </div>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    className="font-medium text-primary hover:text-primary-dark"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.password}
                  className="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Autenticando...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>
            </form>
          </ClientOnly>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link 
              href="/politica-privacidad" 
              className="text-white/90 hover:text-white transition-colors underline"
            >
              Política de Privacidad
            </Link>
            <span className="text-white/60">•</span>
            <Link 
              href="/contacto-soporte" 
              className="text-white/90 hover:text-white transition-colors underline"
            >
              Contacto y Soporte
            </Link>
          </div>
          <p className="text-white/70 text-xs">
            2026 Ideas Vending. Todos los derechos reservados.
          </p>
        </div>

      </div>

      {isResetModalOpen && (
        <ForgotPasswordModal onClose={() => setIsResetModalOpen(false)} />
      )}
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail('');
    setMessage(null);
    setError(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      setMessage(null);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('API URL no configurada. Contacta al administrador.');
      setMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || data?.error || 'No se pudo enviar el enlace de recuperación.'
        );
      }

      const data = await response.json().catch(() => ({}));
      setMessage(data?.message ?? 'Si el correo existe, enviamos un enlace de recuperación.');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recuperar contraseña</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              id="reset-email"
              type="email"
              className="input-field"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
