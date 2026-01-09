import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/login" 
            className="inline-flex items-center text-primary hover:text-primary-dark transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio de sesión
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-black">Política de Privacidad</h1>
          </div>
          <p className="text-gray-600">Última actualización: Enero 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">1. Información General</h2>
              <p className="text-gray-700 leading-relaxed">
                Esta plataforma es un sistema de administración para la gestión de máquinas vending. 
                El acceso está restringido a usuarios autorizados con credenciales válidas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">2. Datos que Manejamos</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                El sistema almacena únicamente la información necesaria para su funcionamiento:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Credenciales de acceso:</strong> Email y contraseña encriptada para autenticación</li>
                <li><strong>Información de usuario:</strong> Nombre, RUT y rol asignado</li>
                <li><strong>Datos de máquinas:</strong> Ubicación, estado, tipo y configuración</li>
                <li><strong>Productos:</strong> Nombre y datos básicos de productos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">3. Uso de la Información</h2>
              <p className="text-gray-700 leading-relaxed">
                Los datos se utilizan exclusivamente para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Autenticar usuarios y gestionar accesos</li>
                <li>Mostrar información de máquinas y productos</li>
                <li>Permitir la administración del sistema según permisos asignados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">4. Seguridad</h2>
              <p className="text-gray-700 leading-relaxed">
                El sistema implementa medidas básicas de seguridad:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Contraseñas encriptadas</li>
                <li>Autenticación mediante tokens</li>
                <li>Control de acceso basado en roles</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">5. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos cookies únicamente para mantener su sesión activa mientras usa el sistema.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">6. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Para consultas sobre privacidad o el manejo de datos, contacte a:
              </p>
              <ul className="list-none pl-0 text-gray-700 space-y-2 mt-3">
                <li>
                  <strong>Email:</strong>{' '}
                  <a 
                    href="mailto:soporte@ideasdigitales.cl" 
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    soporte@ideasdigitales.cl
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
