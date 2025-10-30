import { Monitor, AlertCircle } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Sidebar from '@/components/Sidebar';
import { getMachinesAction } from './serveractions/machines';
import MachineInfiniteClient from './componentes/MachineInfiniteClient';

async function MaquinasContent({ searchParams }: { searchParams?: { page?: string } }) {
  // Obtener primera página de máquinas para inicializar
  const currentPage = Number(searchParams?.page || 1);
  const machinesResponse = await getMachinesAction({ page: currentPage });

  if (!machinesResponse.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-dark">Gestión de Máquinas</h1>
                  <p className="text-muted">Monitoreo y administración de máquinas expendedoras</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="card p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark mb-2">Error al cargar máquinas</h3>
              <p className="text-muted mb-4">{machinesResponse.error}</p>
              <a href="/maquinas" className="btn-primary inline-block">Reintentar</a>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const maquinas = machinesResponse.machines || [];

  return (
    <MachineInfiniteClient initialMachines={maquinas} initialPagination={machinesResponse.pagination} />
  );
}

export default function MaquinasPage({ searchParams }: { searchParams?: { page?: string } }) {
  return (
    <PageWrapper requiredPermissions={['read', 'manage_machines']}>
      {/* @ts-expect-error Async Server Component */}
      <MaquinasContent searchParams={searchParams} />
    </PageWrapper>
  );
}

