import Link from 'next/link';
import { Mail, Globe, MessageSquare, ArrowLeft } from 'lucide-react';

export default function ContactoSoportePage() {
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
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-black">Contacto y Soporte</h1>
          </div>
          <p className="text-gray-600">Estamos aquí para ayudarte con la gestión de tus máquinas vending.</p>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-black mb-6">Información de Contacto</h2>
          
          <div className="space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Correo Electrónico</h3>
                <a 
                  href="mailto:soporte@ideasdigitales.cl" 
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  soporte@ideasdigitales.cl
                </a>
                <p className="text-sm text-gray-500 mt-1">Respuesta en 24-48 horas hábiles</p>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Sitio Web</h3>
                <a 
                  href="https://ideasdigitales.cl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 hover:underline"
                >
                  ideasdigitales.cl
                </a>
                <p className="text-sm text-gray-500 mt-1">Visita nuestro sitio web para más información</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-black mb-6">Preguntas Frecuentes</h2>
          
          <div className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer font-semibold text-black py-3 border-b border-gray-200 hover:text-primary transition-colors">
                ¿Cómo accedo al sistema?
              </summary>
              <p className="text-gray-700 py-3">
                Ingresa con tu correo electrónico y contraseña en la página de inicio de sesión. 
                Si no tienes credenciales, contacta al administrador de tu empresa.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold text-black py-3 border-b border-gray-200 hover:text-primary transition-colors">
                ¿Qué puedo hacer en el sistema?
              </summary>
              <p className="text-gray-700 py-3">
                Puedes gestionar máquinas vending, ver su estado y ubicación, administrar usuarios, 
                y consultar productos disponibles según los permisos de tu cuenta.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold text-black py-3 border-b border-gray-200 hover:text-primary transition-colors">
                ¿Cómo veo el estado de las máquinas?
              </summary>
              <p className="text-gray-700 py-3">
                En el dashboard principal puedes ver un resumen de todas las máquinas. 
                Para más detalles, accede a la sección "Máquinas" donde encontrarás información 
                completa de cada una.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold text-black py-3 border-b border-gray-200 hover:text-primary transition-colors">
                ¿Necesito ayuda técnica?
              </summary>
              <p className="text-gray-700 py-3">
                Escríbenos a soporte@ideasdigitales.cl con tu consulta y te responderemos 
                en un plazo de 24-48 horas hábiles.
              </p>
            </details>
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
