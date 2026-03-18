import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Period } from '@/lib/utils/metricsHelpers';

interface MetricsFilterState {
  selectedEnterpriseId: number | null;
  selectedEnterpriseName: string | null;
  period: Period;
  setEnterprise: (id: number | null, name?: string | null) => void;
  setPeriod: (period: Period) => void;
}

export const useMetricsFilterStore = create<MetricsFilterState>()(
  persist(
    (set) => ({
      selectedEnterpriseId: null,
      selectedEnterpriseName: null,
      period: 'month',
      setEnterprise: (id, name = null) => set({ selectedEnterpriseId: id, selectedEnterpriseName: id ? (name ?? null) : null }),
      setPeriod: (period) => set({ period }),
    }),
    {
      name: 'metrics-filter',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedEnterpriseId: state.selectedEnterpriseId,
        selectedEnterpriseName: state.selectedEnterpriseName,
        period: state.period,
      }),
    }
  )
);
