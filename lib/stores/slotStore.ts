import { create } from 'zustand';
import { Slot, CreateSlot, UpdateSlot } from '../interfaces/slot.interface';
import { 
  getSlotsAction, 
  createSlotAction, 
  updateSlotAction, 
  deleteSlotAction 
} from '../actions/slots';

interface SlotState {
  // Estado
  slots: Slot[];
  selectedSlot: Slot | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  currentMachineId: number | null;

  // Acciones
  fetchSlots: (machineId: number) => Promise<void>;
  createSlot: (machineId: number, slotData: CreateSlot) => Promise<Slot | null>;
  updateSlot: (machineId: number, slotId: number, slotData: UpdateSlot) => Promise<Slot | null>;
  deleteSlot: (machineId: number, slotId: number) => Promise<boolean>;
  setSelectedSlot: (slot: Slot | null) => void;
  clearErrors: () => void;
  clearSlots: () => void;
}

export const useSlotStore = create<SlotState>((set, get) => ({
  // Estado inicial
  slots: [],
  selectedSlot: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  currentMachineId: null,

  // Obtener todos los slots de una máquina
  fetchSlots: async (machineId: number) => {
    set({ isLoading: true, error: null, currentMachineId: machineId });
    try {
      const result = await getSlotsAction(machineId);
      
      if (result.success && result.slots) {
        set({ 
          slots: result.slots,
          isLoading: false,
          error: null,
        });
      } else {
        set({ 
          slots: [],
          isLoading: false,
          error: result.error || 'Error al cargar slots',
        });
      }
    } catch (error) {
      console.error('Error al obtener slots:', error);
      set({ 
        slots: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  },

  // Crear un nuevo slot
  createSlot: async (machineId: number, slotData: CreateSlot) => {
    set({ isCreating: true, createError: null });
    try {
      const result = await createSlotAction(machineId, slotData);
      
      if (result.success && result.slot) {
        const currentSlots = get().slots;
        set({ 
          slots: [...currentSlots, result.slot],
          isCreating: false,
          createError: null,
        });
        return result.slot;
      } else {
        set({ 
          isCreating: false,
          createError: result.error || 'Error al crear slot',
        });
        return null;
      }
    } catch (error) {
      console.error('Error al crear slot:', error);
      set({ 
        isCreating: false,
        createError: error instanceof Error ? error.message : 'Error desconocido',
      });
      return null;
    }
  },

  // Actualizar un slot existente
  updateSlot: async (machineId: number, slotId: number, slotData: UpdateSlot) => {
    set({ isUpdating: true, updateError: null });
    const currentSlots = get().slots;
    
    // Actualización optimista
    const updatedSlots = currentSlots.map(slot => 
      slot.id === slotId 
        ? { ...slot, ...slotData }
        : slot
    );
    set({ slots: updatedSlots });

    try {
      const result = await updateSlotAction(machineId, slotId, slotData);
      
      if (result.success && result.slot) {
        // Actualizar con datos reales del servidor
        const finalSlots = currentSlots.map(slot => 
          slot.id === slotId ? result.slot! : slot
        );
        set({ 
          slots: finalSlots,
          isUpdating: false,
          updateError: null,
        });

        // Actualizar selectedSlot si es el mismo
        const selectedSlot = get().selectedSlot;
        if (selectedSlot && selectedSlot.id === slotId) {
          set({ selectedSlot: result.slot });
        }

        return result.slot;
      } else {
        // Revertir actualización optimista
        set({ 
          slots: currentSlots,
          isUpdating: false,
          updateError: result.error || 'Error al actualizar slot',
        });
        return null;
      }
    } catch (error) {
      console.error('Error al actualizar slot:', error);
      // Revertir actualización optimista
      set({ 
        slots: currentSlots,
        isUpdating: false,
        updateError: error instanceof Error ? error.message : 'Error desconocido',
      });
      return null;
    }
  },

  // Eliminar un slot
  deleteSlot: async (machineId: number, slotId: number) => {
    set({ isDeleting: true, deleteError: null });
    const currentSlots = get().slots;
    
    // Actualización optimista
    const filteredSlots = currentSlots.filter(slot => slot.id !== slotId);
    set({ slots: filteredSlots });

    try {
      const result = await deleteSlotAction(machineId, slotId);
      
      if (result.success) {
        set({ 
          isDeleting: false,
          deleteError: null,
        });

        // Limpiar selectedSlot si es el eliminado
        const selectedSlot = get().selectedSlot;
        if (selectedSlot && selectedSlot.id === slotId) {
          set({ selectedSlot: null });
        }

        return true;
      } else {
        // Revertir actualización optimista
        set({ 
          slots: currentSlots,
          isDeleting: false,
          deleteError: result.error || 'Error al eliminar slot',
        });
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar slot:', error);
      // Revertir actualización optimista
      set({ 
        slots: currentSlots,
        isDeleting: false,
        deleteError: error instanceof Error ? error.message : 'Error desconocido',
      });
      return false;
    }
  },

  // Establecer slot seleccionado
  setSelectedSlot: (slot: Slot | null) => {
    set({ selectedSlot: slot });
  },

  // Limpiar errores
  clearErrors: () => {
    set({ 
      error: null,
      createError: null,
      updateError: null,
      deleteError: null,
    });
  },

  // Limpiar slots
  clearSlots: () => {
    set({ 
      slots: [],
      selectedSlot: null,
      currentMachineId: null,
      error: null,
      createError: null,
      updateError: null,
      deleteError: null,
    });
  },
}));
