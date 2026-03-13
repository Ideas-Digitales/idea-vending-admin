import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Period } from '@/lib/utils/metricsHelpers';

interface MetricsFilterState {
  selectedEnterpriseId: number | null;
  period: Period;
  setEnterpriseId: (id: number | null) => void;
  setPeriod: (period: Period) => void;
}

export const useMetricsFilterStore = create<MetricsFilterState>()(
  persist(
    (set) => ({
      selectedEnterpriseId: null,
      period: 'month',
      setEnterpriseId: (id) => set({ selectedEnterpriseId: id }),
      setPeriod: (period) => set({ period }),
    }),
    {
      name: 'metrics-filter',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
