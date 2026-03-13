'use client';

import { Building2 } from 'lucide-react';
import { useUser } from '@/lib/stores/authStore';
import { useMetricsFilterStore } from '@/lib/stores/metricsFilterStore';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

/**
 * Selector de empresa para paneles de métricas.
 *
 * - Admin: combobox completo (busca vía API). null = todas las empresas.
 * - Customer multi-empresa: <select> con sus empresas del token.
 * - Customer una empresa: oculto, se auto-asigna al montar.
 */
export default function EnterpriseMetricsSelector() {
  const user       = useUser();
  const { selectedEnterpriseId, setEnterpriseId } = useMetricsFilterStore();

  const userEnterprises = user?.enterprises ?? [];
  const isAdmin         = user?.role === 'admin';

  // Auto-asignar la única empresa del customer al montar
  // (solo si aún no hay selección)
  if (!isAdmin && userEnterprises.length === 1 && selectedEnterpriseId === null) {
    setEnterpriseId(userEnterprises[0].id);
  }

  // Customer con una sola empresa → no renderizar nada
  if (!isAdmin && userEnterprises.length <= 1) {
    const name = userEnterprises[0]?.name;
    if (!name) return null;
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <Building2 className="h-3.5 w-3.5" />
        <span className="font-medium">{name}</span>
      </div>
    );
  }

  // Admin → combobox completo con opción "Todas las empresas"
  if (isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted shrink-0" />
        <div className="w-56">
          <EnterpriseSearchInput
            selectedEnterpriseId={selectedEnterpriseId}
            onEnterpriseSelect={(enterprise: Enterprise | null) =>
              setEnterpriseId(enterprise?.id ?? null)
            }
            placeholder="Todas las empresas"
            compact
          />
        </div>
      </div>
    );
  }

  // Customer multi-empresa → <select>
  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted shrink-0" />
      <select
        value={selectedEnterpriseId ?? ''}
        onChange={e => setEnterpriseId(Number(e.target.value))}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
      >
        {userEnterprises.map(e => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
    </div>
  );
}
