import { create } from 'zustand';

interface MachineFiltersState {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  setDebouncedSearchTerm: (term: string) => void;
  clearFilters: () => void;
}

export const useMachineFilters = create<MachineFiltersState>((set) => ({
  searchTerm: '',
  statusFilter: '',
  typeFilter: '',
  debouncedSearchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setDebouncedSearchTerm: (term) => set({ debouncedSearchTerm: term }),
  clearFilters: () => set({ 
    searchTerm: '', 
    statusFilter: '', 
    typeFilter: '',
    debouncedSearchTerm: '' 
  }),
}));
