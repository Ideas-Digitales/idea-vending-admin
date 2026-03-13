"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CreateUserForm from "@/components/forms/CreateUserForm";
import type { EditUserFormData } from "@/lib/schemas/user.schema";
import { updateUserAction } from "@/lib/actions/users";
import { attachUsersToEnterpriseAction, detachUsersFromEnterpriseAction } from "@/lib/actions/enterprise";
import { useUserStore } from '@/lib/stores/userStore';
import { useUser as useAuthUser } from '@/lib/stores/authStore';
import { User, Building2, Mail, UserPlus, X, Loader2 } from "lucide-react";
import { notify } from '@/lib/adapters/notification.adapter';
import { PageHeader, ConfirmActionDialog } from '@/components/ui-custom';
import Link from 'next/link';
import EnterpriseSearchInput from "@/components/EnterpriseSearchInput";
import type { Enterprise } from "@/lib/interfaces/enterprise.interface";

export default function EditarUsuarioPage() {
  const params = useParams();
  const userId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  // Gestión de empresas asociadas
  const [showAddEnterprise, setShowAddEnterprise] = useState(false);
  const [enterpriseToAdd, setEnterpriseToAdd] = useState<Enterprise | null>(null);
  const [attachingEnterprise, setAttachingEnterprise] = useState(false);
  const [enterpriseToRemove, setEnterpriseToRemove] = useState<{ id: number; name: string } | null>(null);
  const [detachingEnterprise, setDetachingEnterprise] = useState(false);

  const authUser = useAuthUser();
  const canManage = authUser?.role === 'admin';

  const {
    selectedUser: user,
    isLoadingUser,
    userError,
    fetchUser,
    refreshUsers,
    clearSelectedUser,
    clearUserError
  } = useUserStore();

  useEffect(() => {
    if (userId) {
      clearSelectedUser();
      clearUserError();
      fetchUser(userId);
    }
  }, [userId, fetchUser, clearSelectedUser, clearUserError]);

  useEffect(() => {
    return () => {
      clearSelectedUser();
      clearUserError();
    };
  }, [clearSelectedUser, clearUserError]);

  useEffect(() => {
    if (!isLoadingUser && !user && !userError) {
      const timer = setTimeout(() => setShowNotFound(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNotFound(false);
    }
  }, [isLoadingUser, user, userError]);

  const handleSubmit = async (data: EditUserFormData) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await updateUserAction(userId, data);
      if (result.success) {
        notify.success('Usuario actualizado exitosamente');
        await fetchUser(userId);
        await refreshUsers();
      } else {
        notify.error(`Error al actualizar usuario: ${result.error}`);
      }
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      notify.error('Error al actualizar usuario. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachEnterprise = async () => {
    if (!enterpriseToAdd) return;
    setAttachingEnterprise(true);
    try {
      const result = await attachUsersToEnterpriseAction(enterpriseToAdd.id, [Number(userId)]);
      if (result.success) {
        notify.success(`${enterpriseToAdd.name} asociada al usuario`);
        setEnterpriseToAdd(null);
        setShowAddEnterprise(false);
        await fetchUser(userId);
      } else {
        notify.error(result.error || 'Error al asociar empresa');
      }
    } catch {
      notify.error('Error inesperado al asociar empresa');
    } finally {
      setAttachingEnterprise(false);
    }
  };

  const handleDetachEnterprise = async () => {
    if (!enterpriseToRemove) return;
    setDetachingEnterprise(true);
    try {
      const result = await detachUsersFromEnterpriseAction(enterpriseToRemove.id, [Number(userId)]);
      if (result.success) {
        notify.success(`${enterpriseToRemove.name} desasociada del usuario`);
        setEnterpriseToRemove(null);
        await fetchUser(userId);
      } else {
        notify.error(result.error || 'Error al desasociar empresa');
      }
    } catch {
      notify.error('Error inesperado al desasociar empresa');
    } finally {
      setDetachingEnterprise(false);
    }
  };

  if (isLoadingUser) {
    return (
      <>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando datos del usuario...</p>
          </div>
        </div>
      </>
    );
  }

  if (userError) {
    return (
      <>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar usuario</h3>
            <p className="text-muted mb-4">{userError}</p>
            <Link href="/usuarios" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </>
    );
  }

  if (showNotFound || !user) {
    return (
      <>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Usuario no encontrado</h3>
            <p className="text-muted mb-4">El usuario solicitado no existe o no tienes permisos para editarlo.</p>
            <Link href="/usuarios" className="btn-primary">Volver a la lista</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={User}
        title="Editar Usuario"
        subtitle={user.name}
        backHref="/usuarios"
        variant="white"
      />

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <CreateUserForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode="edit"
            initialData={user}
            title={`Editar Usuario: ${user.name}`}
            canEditAllFields={authUser?.role === 'admin'}
          />

          {/* Empresas Asociadas */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Empresas Asociadas
                {user.enterprises && user.enterprises.length > 0 && (
                  <span className="text-sm font-normal text-muted">
                    ({user.enterprises.length})
                  </span>
                )}
              </h3>
              {canManage && (
                <button
                  onClick={() => { setShowAddEnterprise((v) => !v); setEnterpriseToAdd(null); }}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Agregar</span>
                </button>
              )}
            </div>

            {/* Panel de búsqueda para agregar empresa */}
            {showAddEnterprise && canManage && (
              <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-3">
                <p className="text-sm font-medium text-blue-900">Buscar empresa para agregar</p>
                <EnterpriseSearchInput
                  onEnterpriseSelect={setEnterpriseToAdd}
                  placeholder="Buscar por nombre o RUT..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddEnterprise(false); setEnterpriseToAdd(null); }}
                    className="btn-secondary text-sm py-1.5"
                    disabled={attachingEnterprise}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAttachEnterprise}
                    disabled={!enterpriseToAdd || attachingEnterprise}
                    className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
                  >
                    {attachingEnterprise ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {user.enterprises && user.enterprises.length > 0 ? (
              <div className="space-y-2">
                {user.enterprises.map((enterprise) => (
                  <div key={enterprise.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                      <p className="text-sm font-medium text-dark truncate">{enterprise.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-muted bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        ID: {enterprise.id}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => setEnterpriseToRemove(enterprise)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Desasociar empresa"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Este usuario no tiene empresas asociadas.</p>
            )}
          </div>
        </div>
      </main>

      <ConfirmActionDialog
        isOpen={!!enterpriseToRemove}
        onOpenChange={(open) => { if (!open) setEnterpriseToRemove(null); }}
        title="Desasociar empresa"
        description={`¿Deseas quitar a "${enterpriseToRemove?.name}" de las empresas de ${user.name}?`}
        confirmText="Desasociar"
        onConfirm={handleDetachEnterprise}
        isLoading={detachingEnterprise}
        variant="danger"
      />
    </>
  );
}
