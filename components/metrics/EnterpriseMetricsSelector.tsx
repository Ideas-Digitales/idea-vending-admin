'use client';

import { Building2, Check } from 'lucide-react';
import { useUser } from '@/lib/stores/authStore';
import { useMetricsFilterStore } from '@/lib/stores/metricsFilterStore';
import EnterpriseSearchInput from '@/components/EnterpriseSearchInput';
import type { Enterprise } from '@/lib/interfaces/enterprise.interface';

/**
 * Selector de empresa para paneles de métricas.
 *
 * - Admin: chip trigger con dropdown de búsqueda. null = todas las empresas.
 * - Customer multi-empresa: pills horizontales (Todas + una por empresa).
 * - Customer una empresa: badge estático, sin interacción.
 */
export default function EnterpriseMetricsSelector() {
  const user        = useUser();
  const { selectedEnterpriseId, selectedEnterpriseName, setEnterprise } = useMetricsFilterStore();

  const userEnterprises = user?.enterprises ?? [];
  const isAdmin         = user?.role === 'admin';
  const hasSelection    = selectedEnterpriseId !== null;

  // Auto-asignar la única empresa del customer al montar
  if (!isAdmin && userEnterprises.length === 1 && selectedEnterpriseId === null) {
    setEnterprise(userEnterprises[0].id, userEnterprises[0].name);
  }

  // ── Customer una empresa — badge estático ──────────────────────
  if (!isAdmin && userEnterprises.length <= 1) {
    const name = userEnterprises[0]?.name;
    if (!name) return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 text-sm font-semibold text-primary">
        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{name}</span>
      </div>
    );
  }

  // ── Customer multi-empresa — pills ─────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setEnterprise(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            !hasSelection
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>

        {userEnterprises.map((e) => {
          const active = selectedEnterpriseId === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setEnterprise(e.id, e.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {active && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="max-w-[120px] truncate">{e.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Admin — buscador directo ────────────────────────────────────
  return (
    <div className="w-56">
      <EnterpriseSearchInput
        selectedEnterpriseId={selectedEnterpriseId}
        onEnterpriseSelect={(enterprise: Enterprise | null) => {
          setEnterprise(enterprise?.id ?? null, enterprise?.name ?? null);
        }}
        placeholder="Todas las empresas"
        compact
      />
    </div>
  );
}
