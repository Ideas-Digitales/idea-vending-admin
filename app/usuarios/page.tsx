import { Users, Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, AlertCircle, Loader2 } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Sidebar from '@/components/Sidebar';
import { getUsersAction, type Usuario } from '@/lib/actions/users';
import UsuariosInfiniteClient from './UsuariosInfiniteClient';

async function UsuariosContent() {
  // Obtener primera página de usuarios para inicializar
  const usersResponse = await getUsersAction({ page: 1 });

  if (!usersResponse.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Usuarios</h1>
                  <p className="text-muted">Administra usuarios, roles y permisos del sistema</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="card p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar usuarios</h3>
              <p className="text-muted mb-4">{usersResponse.error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
              >
                Reintentar
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const usuarios = usersResponse.users || [];

  return (
    <UsuariosInfiniteClient 
      initialUsers={usuarios} 
      initialPagination={usersResponse.pagination}
    />
  );
}

export default function UsuariosPage() {
  return (
    <PageWrapper requiredPermissions={['manage_users']}>
      <UsuariosContent />
    </PageWrapper>
  );
}
