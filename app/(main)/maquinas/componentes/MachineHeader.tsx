'use client';

import { Monitor, Plus } from 'lucide-react';

export default function MachineHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark">Gestión de Máquinas</h1>
              <p className="text-muted">Monitoreo y administración de máquinas expendedoras</p>
            </div>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Máquina</span>
          </button>
        </div>
      </div>
    </header>
  );
}
