import { create } from 'zustand';

interface MachineFiltersState {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  isEnabledFilter: '' | 'enabled' | 'disabled';
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  setIsEnabledFilter: (value: '' | 'enabled' | 'disabled') => void;
  setDebouncedSearchTerm: (term: string) => void;
  clearFilters: () => void;
}

export const useMachineFilters = create<MachineFiltersState>((set) => ({
  searchTerm: '',
  statusFilter: '',
  typeFilter: '',
  isEnabledFilter: '',
  debouncedSearchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setIsEnabledFilter: (value) => set({ isEnabledFilter: value }),
  setDebouncedSearchTerm: (term) => set({ debouncedSearchTerm: term }),
  clearFilters: () => set({ 
    searchTerm: '', 
    statusFilter: '', 
    typeFilter: '',
    isEnabledFilter: '', 
    debouncedSearchTerm: '' 
  }),
}));
