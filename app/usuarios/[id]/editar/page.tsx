"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CreateUserForm from "@/components/forms/CreateUserForm";
import type { EditUserFormData } from "@/lib/schemas/user.schema";
import { updateUserAction } from "@/lib/actions/users";
import { useUserStore } from '@/lib/stores/userStore';
import { useUser as useAuthUser } from '@/lib/stores/authStore';
import { User } from "lucide-react";
import { notify } from '@/lib/adapters/notification.adapter';
import { AppShell, PageHeader } from '@/components/ui-custom';
import Link from 'next/link';

export default function EditarUsuarioPage() {
  const params = useParams();
  const userId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const authUser = useAuthUser();

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
      const timer = setTimeout(() => {
        setShowNotFound(true);
      }, 1000);

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

  if (isLoadingUser) {
    return (
      <AppShell>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando datos del usuario...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (userError) {
    return (
      <AppShell>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar usuario</h3>
            <p className="text-muted mb-4">{userError}</p>
            <Link href="/usuarios" className="btn-primary">
              Volver a la lista
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (showNotFound) {
    return (
      <AppShell>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Usuario no encontrado</h3>
            <p className="text-muted mb-4">El usuario solicitado no existe o no tienes permisos para editarlo.</p>
            <Link href="/usuarios" className="btn-primary">
              Volver a la lista
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader icon={User} title="Editar Usuario" backHref="/usuarios" variant="white" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando datos del usuario...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        icon={User}
        title="Editar Usuario"
        subtitle={user.name}
        backHref="/usuarios"
        variant="white"
      />

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <CreateUserForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode="edit"
            initialData={user}
            title={`Editar Usuario: ${user.name}`}
            canEditAllFields={authUser?.role === 'admin'}
          />
        </div>
      </main>
    </AppShell>
  );
}
