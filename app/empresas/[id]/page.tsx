'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, MapPin, Phone, Edit, Trash2, Users, Mail, User } from 'lucide-react';
import { ConfirmActionDialog, AppShell, PageHeader } from '@/components/ui-custom';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { deleteEnterpriseAction } from '@/lib/actions/enterprise';
import { notify } from '@/lib/adapters/notification.adapter';
import { useUser } from '@/lib/stores/authStore';
import Link from 'next/link';

export default function EnterpriseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const enterpriseId = params.id as string;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const authUser = useUser();
  const canManageEnterprises = authUser?.role === 'admin';

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

    clearSelectedEnterprise();
    clearEnterpriseError();
    fetchEnterprise(enterpriseId);
  }, [enterpriseId, fetchEnterprise, clearSelectedEnterprise, clearEnterpriseError]);

  useEffect(() => {
    return () => {
      clearSelectedEnterprise();
      clearEnterpriseError();
    };
  }, [clearSelectedEnterprise, clearEnterpriseError]);

  const confirmDelete = async () => {
    if (!enterprise) return;

    setIsDeleting(true);

    try {
      const result = await deleteEnterpriseAction(enterpriseId);

      if (result.success) {
        notify.success('Empresa eliminada exitosamente');
        router.push('/empresas');
      } else {
        notify.error(`Error al eliminar empresa: ${result.error}`);
      }
    } catch {
      notify.error('Error al eliminar empresa. Por favor, intenta nuevamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading || (!enterprise && !error)) {
    return (
      <AppShell>
        <PageHeader icon={Building2} title="Detalles de la Empresa" backHref="/empresas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles de la empresa...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader icon={Building2} title="Detalles de la Empresa" backHref="/empresas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Building2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar empresa</h3>
            <p className="text-muted mb-4">{error}</p>
            <Link href="/empresas" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!enterprise) {
    return (
      <AppShell>
        <PageHeader icon={Building2} title="Detalles de la Empresa" backHref="/empresas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Building2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Empresa no encontrada</h3>
            <p className="text-muted mb-4">La empresa solicitada no existe o no tienes permisos para verla.</p>
            <Link href="/empresas" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon={Building2}
        title="Detalles de la Empresa"
        subtitle={enterprise.name}
        backHref="/empresas"
        variant="white"
        actions={
          canManageEnterprises ? (
            <>
              <Link
                href={`/empresas/${enterpriseId}/editar`}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn-danger flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </>
          ) : undefined
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nombre</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-dark font-medium">{enterprise.name}</p>
                  <span className="text-xs font-mono text-muted bg-gray-100 px-1.5 py-0.5 rounded shrink-0">ID: {enterprise.id}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">RUT</p>
                <p className="text-dark">{enterprise.rut}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Teléfono</p>
                <p className="text-dark flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  {enterprise.phone}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Dirección</p>
                <p className="text-dark flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  {enterprise.address}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Owner
            </h3>
            {enterprise.owner ? (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{enterprise.owner.name}</p>
                  {enterprise.owner.email && (
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{enterprise.owner.email}</span>
                    </p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-muted bg-white border border-gray-200 px-1.5 py-0.5 rounded shrink-0">
                  ID: {enterprise.owner.id}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted">Esta empresa no tiene owner asignado.</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Usuarios Asociados
            </h3>
            {enterprise.users && enterprise.users.length > 0 ? (
              <div className="space-y-3">
                {enterprise.users.map((user) => (
                  <div key={user.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-muted bg-white border border-gray-200 px-1.5 py-0.5 rounded shrink-0">
                      ID: {user.id}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No hay usuarios asociados a esta empresa.</p>
            )}
          </div>
        </div>
      </main>

      <ConfirmActionDialog
        isOpen={showDeleteModal}
        onOpenChange={(open) => { if (!open) setShowDeleteModal(false); }}
        title="Eliminar Empresa"
        description={`¿Estás seguro de que deseas eliminar "${enterprise.name}"? Todos los datos asociados se perderán permanentemente.`}
        confirmText="Eliminar"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        variant="danger"
      />
    </AppShell>
  );
}
