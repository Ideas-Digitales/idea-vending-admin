'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, MapPin, Phone, Edit, Trash2, Users, Mail, User, UserPlus, X, Loader2 } from 'lucide-react';
import { ConfirmActionDialog, PageHeader } from '@/components/ui-custom';
import { useEnterpriseStore } from '@/lib/stores/enterpriseStore';
import { deleteEnterpriseAction, attachUsersToEnterpriseAction, detachUsersFromEnterpriseAction } from '@/lib/actions/enterprise';
import { notify } from '@/lib/adapters/notification.adapter';
import { useUser } from '@/lib/stores/authStore';
import Link from 'next/link';
import UserSearchInput from '@/components/UserSearchInput';
import type { User as UserType } from '@/lib/interfaces/user.interface';

export default function EnterpriseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const enterpriseId = params.id as string;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userToAdd, setUserToAdd] = useState<UserType | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ id: number; name: string } | null>(null);
  const [removingUser, setRemovingUser] = useState(false);

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

  const handleAddUser = async () => {
    if (!userToAdd) return;
    setAddingUser(true);
    try {
      const result = await attachUsersToEnterpriseAction(enterpriseId, [userToAdd.id]);
      if (result.success) {
        notify.success(`${userToAdd.name} agregado a la empresa`);
        setUserToAdd(null);
        setShowAddUser(false);
        fetchEnterprise(enterpriseId);
      } else {
        notify.error(result.error || 'Error al agregar usuario');
      }
    } catch {
      notify.error('Error inesperado al agregar usuario');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;
    setRemovingUser(true);
    try {
      const result = await detachUsersFromEnterpriseAction(enterpriseId, [userToRemove.id]);
      if (result.success) {
        notify.success(`${userToRemove.name} desasociado de la empresa`);
        setUserToRemove(null);
        fetchEnterprise(enterpriseId);
      } else {
        notify.error(result.error || 'Error al desasociar usuario');
      }
    } catch {
      notify.error('Error inesperado al desasociar usuario');
    } finally {
      setRemovingUser(false);
    }
  };

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
      <>
        <PageHeader icon={Building2} title="Detalles de la Empresa" backHref="/empresas" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando detalles de la empresa...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
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
      </>
    );
  }

  if (!enterprise) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Usuarios Asociados
                {enterprise.users && enterprise.users.length > 0 && (
                  <span className="text-sm font-normal text-muted">
                    ({enterprise.users.length})
                  </span>
                )}
              </h3>
              {canManageEnterprises && (
                <button
                  onClick={() => { setShowAddUser((v) => !v); setUserToAdd(null); }}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Agregar</span>
                </button>
              )}
            </div>

            {/* Panel de búsqueda para agregar usuario */}
            {showAddUser && canManageEnterprises && (
              <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-3">
                <p className="text-sm font-medium text-blue-900">Buscar usuario para agregar</p>
                <UserSearchInput
                  onUserSelect={setUserToAdd}
                  placeholder="Buscar por nombre o email..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddUser(false); setUserToAdd(null); }}
                    className="btn-secondary text-sm py-1.5"
                    disabled={addingUser}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddUser}
                    disabled={!userToAdd || addingUser}
                    className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
                  >
                    {addingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {enterprise.users && enterprise.users.length > 0 ? (
              <div className="space-y-2">
                {enterprise.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-muted bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        ID: {user.id}
                      </span>
                      {canManageEnterprises && (
                        <button
                          onClick={() => setUserToRemove({ id: user.id, name: user.name })}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Desasociar usuario"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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

      <ConfirmActionDialog
        isOpen={!!userToRemove}
        onOpenChange={(open) => { if (!open) setUserToRemove(null); }}
        title="Desasociar usuario"
        description={`¿Deseas quitar a "${userToRemove?.name}" de los miembros de ${enterprise.name}?`}
        confirmText="Desasociar"
        onConfirm={handleRemoveUser}
        isLoading={removingUser}
        variant="danger"
      />
    </>
  );
}
