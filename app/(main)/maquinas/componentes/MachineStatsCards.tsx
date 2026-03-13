'use client';

import { Monitor, Wifi, WifiOff } from 'lucide-react';

interface MachineStatsCardsProps {
  stats: {
    total: number;
    online: number;
    offline: number;
  };
  totalCount: number;
}

export default function MachineStatsCards({ stats, totalCount }: MachineStatsCardsProps) {
  return (
    <div className="p-6 pb-0">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted mb-2">Total Máquinas</p>
              <p className="text-2xl font-bold text-dark">{stats.total}</p>
              {totalCount > 0 && stats.total !== totalCount && (
                <p className="text-xs text-muted mt-1">de {totalCount} total</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-4">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted mb-2">En línea</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 flex-shrink-0 ml-4">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted mb-1">Fuera de línea</p>
              <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50">
              <WifiOff className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
