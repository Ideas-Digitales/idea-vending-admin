'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Calendar, MapPin, Phone, User, Edit, Trash2, FileText } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { deleteEnterpriseAction } from '@/lib/actions/enterprise';
import { notify } from '@/lib/adapters/notification.adapter';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

export default function EnterpriseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const enterpriseId = params.id as string;
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Store state
  const {
    selectedEnterprise: enterprise,
    isLoadingEnterprise: isLoading,
    enterpriseError: error,
    fetchEnterprise,
    clearEnterpriseError,
    clearSelectedEnterprise
  } = useEnterpriseStore();

  useEffect(() => {
    if (!enterpriseId) return;
    
    // Limpiar empresa anterior y errores
    clearSelectedEnterprise();
    clearEnterpriseError();
    
    // Cargar empresa usando el store
    fetchEnterprise(enterpriseId);
  }, [enterpriseId, fetchEnterprise, clearSelectedEnterprise, clearEnterpriseError]);

  // Limpiar empresa al desmontar el componente
  useEffect(() => {
    return () => {
      clearSelectedEnterprise();
      clearEnterpriseError();
    };
  }, [clearSelectedEnterprise, clearEnterpriseError]);

  const handleBack = () => {
    // Limpiar completamente el store antes de navegar
    clearSelectedEnterprise();
    clearEnterpriseError();
    
    // Forzar recarga completa de la página de empresas
    window.location.href = '/empresas';
  };

  const handleDelete = () => {
    if (!enterprise) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!enterprise) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteEnterpriseAction(enterpriseId);
      
      if (result.success) {
        notify.success('Empresa eliminada exitosamente');
        // Redirigir a la lista de empresas
        router.push('/empresas');
      } else {
        notify.error(`Error al eliminar empresa: ${result.error}`);
      }
    } catch (error) {
      notify.error('Error inesperado al eliminar empresa. Por favor, intenta nuevamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setIsDeleting(false);
  };

  if (isLoading || (!enterprise && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles de la empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Building2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar empresa</h3>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Building2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Empresa no encontrada</h3>
            <p className="text-muted mb-4">La empresa solicitada no existe o no tienes permisos para verla.</p>
            <button onClick={handleBack} className="btn-primary">
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Detalles de la Empresa</h1>
                  <p className="text-muted">Información completa y gestión de la empresa</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.location.href = `/empresas/${enterpriseId}/editar`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button 
                  onClick={handleDelete}
                  className="btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Card */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{enterprise.name}</h2>
                    <p className="text-muted flex items-center mt-1">
                      <FileText className="h-4 w-4 mr-2" />
                      RUT: {enterprise.rut}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
                        <Building2 className="h-3 w-3 mr-1" />
                        Empresa Activa
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                        ID: {enterprise.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Company Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  Información de la Empresa
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                    <p className="text-dark">{enterprise.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <p className="text-dark flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {enterprise.rut}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID de la Empresa</label>
                    <p className="text-dark">{enterprise.id}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-primary" />
                  Información de Contacto
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <p className="text-dark flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {enterprise.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <p className="text-dark flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{enterprise.address}</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>




          </div>
        </main>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Empresa"
        message="¿Estás seguro de que deseas eliminar esta empresa? Todos los datos asociados se perderán permanentemente."
        itemName={enterprise?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
