import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Producto, ProductsFilters, PaginationLinks, PaginationMeta } from "../interfaces/product.interface";
import { getProductsAction, getProductAction } from "../actions/products";

interface ProductState {
  // Data state
  products: Producto[];
  selectedProduct: Producto | null;
  currentFilters: ProductsFilters;
  
  // Pagination state
  pagination: {
    links: PaginationLinks;
    meta: PaginationMeta;
  } | null;
  
  // Global stats cache
  globalStats: {
    totalActive: number;
    totalLowStock: number;
    totalOutOfStock: number;
    lastUpdated: number;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingProduct: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  
  // Error states
  error: string | null;
  productError: string | null;
  deleteError: string | null;
  updateError: string | null;
  
  // Actions
  fetchProducts: (filters?: ProductsFilters) => Promise<void>;
  fetchProduct: (productId: string | number) => Promise<void>;
  refreshProducts: () => Promise<void>;
  deleteProduct: (productId: string | number) => Promise<boolean>;
  updateProduct: (productId: string | number, productData: any) => Promise<boolean>;
  setFilters: (filters: ProductsFilters) => void;
  initializeProducts: (products: Producto[], pagination?: any) => void;
  clearError: () => void;
  clearProductError: () => void;
  clearDeleteError: () => void;
  clearUpdateError: () => void;
  clearSelectedProduct: () => void;
  
  // Computed getters
  getTotalProducts: () => number;
  getFilteredProductsCount: () => number;
  getTotalActiveProducts: () => Promise<number>;
  getTotalLowStockProducts: () => Promise<number>;
  getTotalOutOfStockProducts: () => Promise<number>;
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
  // Initial state
  products: [],
  selectedProduct: null,
  currentFilters: {},
  pagination: null,
  globalStats: null,
  isLoading: false,
  isLoadingProduct: false,
  isRefreshing: false,
  isDeleting: false,
  isUpdating: false,
  error: null,
  productError: null,
  deleteError: null,
  updateError: null,

  // Actions
  fetchProducts: async (filters?: ProductsFilters) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await getProductsAction(filters);
      
      if (response.success && response.products) {
        set({
          products: response.products,
          pagination: response.pagination || null,
          currentFilters: filters || {},
          isLoading: false,
          error: null,
        });
      } else {
        set({
          error: response.error || 'Error al cargar productos',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error inesperado',
        isLoading: false,
      });
    }
  },

  fetchProduct: async (productId: string | number) => {
    set({ isLoadingProduct: true, productError: null });
    
    try {
      const response = await getProductAction(productId);
      
      if (response.success && response.product) {
        set({
          selectedProduct: response.product,
          isLoadingProduct: false,
          productError: null,
        });
      } else {
        set({
          productError: response.error || 'Error al cargar producto',
          isLoadingProduct: false,
        });
      }
    } catch (error) {
      set({
        productError: error instanceof Error ? error.message : 'Error inesperado',
        isLoadingProduct: false,
      });
    }
  },

  refreshProducts: async () => {
    const { currentFilters } = get();
    set({ isRefreshing: true });
    
    try {
      const response = await getProductsAction(currentFilters);
      
      if (response.success && response.products) {
        set({
          products: response.products,
          pagination: response.pagination || null,
          isRefreshing: false,
          error: null,
        });
      } else {
        set({
          error: response.error || 'Error al actualizar productos',
          isRefreshing: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error inesperado',
        isRefreshing: false,
      });
    }
  },

  setFilters: (filters: ProductsFilters) => {
    set({ currentFilters: filters });
  },

  initializeProducts: (products: Producto[], pagination?: any) => {
    set({
      products,
      pagination: pagination || null,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearProductError: () => {
    set({ productError: null });
  },

  clearSelectedProduct: () => {
    set({ selectedProduct: null, productError: null });
  },

  deleteProduct: async (productId: string | number) => {
    const { products } = get();
    
    // Optimistic update: remove product from local state immediately
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) {
      set({ deleteError: 'Producto no encontrado' });
      return false;
    }

    const optimisticProducts = products.filter(p => p.id !== productId);
    
    set({ 
      products: optimisticProducts, 
      isDeleting: true, 
      deleteError: null 
    });

    try {
      // TODO: Implement deleteProductAction when available
      // For now, simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success: keep the optimistic update and update pagination
      const { pagination } = get();
      const updatedPagination = pagination ? {
        ...pagination,
        meta: {
          ...pagination.meta,
          total: pagination.meta.total - 1
        }
      } : null;

      set({ 
        isDeleting: false,
        deleteError: null,
        pagination: updatedPagination
      });
      return true;
    } catch (error) {
      // Error: revert the optimistic update
      set({ 
        products: products, // Restore original products
        isDeleting: false,
        deleteError: error instanceof Error ? error.message : 'Error inesperado' 
      });
      return false;
    }
  },

  clearDeleteError: () => {
    set({ deleteError: null });
  },

  updateProduct: async (productId: string | number, productData: any) => {
    const { products } = get();
    
    // Optimistic update: find and update product in local state immediately
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      set({ updateError: 'Producto no encontrado' });
      return false;
    }

    const originalProduct = products[productIndex];
    const optimisticProducts = [...products];
    // Update the product with new data (merge with existing data)
    optimisticProducts[productIndex] = { ...originalProduct, ...productData };
    
    set({ 
      products: optimisticProducts, 
      isUpdating: true, 
      updateError: null 
    });

    try {
      // TODO: Implement updateProductAction when available
      // For now, simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success: keep the optimistic update
      set({ 
        isUpdating: false,
        updateError: null 
      });
      return true;
    } catch (error) {
      // Error: revert the optimistic update
      set({ 
        products: products, // Restore original products
        isUpdating: false,
        updateError: error instanceof Error ? error.message : 'Error inesperado' 
      });
      return false;
    }
  },

  clearUpdateError: () => {
    set({ updateError: null });
  },

  // Computed getters
  getTotalProducts: () => {
    const { pagination } = get();
    return pagination?.meta?.total || 0;
  },

  getFilteredProductsCount: () => {
    const { products } = get();
    return products.length;
  },

  hasNextPage: () => {
    const { pagination } = get();
    return !!pagination?.links?.next;
  },

  hasPrevPage: () => {
    const { pagination } = get();
    return !!pagination?.links?.prev;
  },

  // Global stats functions
  getTotalActiveProducts: async () => {
    const { globalStats } = get();
    
    // Si tenemos stats en cache y son recientes (menos de 5 minutos), usarlas
    if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
      return globalStats.totalActive;
    }

    // Si no, calcular desde todos los productos del servidor
    try {
      const response = await getProductsAction({ is_active: true });
      if (response.success && response.pagination?.meta) {
        const totalActive = response.pagination.meta.total;
        
        // Actualizar cache
        set(state => ({
          globalStats: {
            ...state.globalStats,
            totalActive,
            lastUpdated: Date.now(),
          } as typeof state.globalStats
        }));
        
        return totalActive;
      }
    } catch (error) {
      console.error('Error getting total active products:', error);
    }
    
    return 0;
  },

  getTotalLowStockProducts: async () => {
    const { globalStats } = get();
    
    if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
      return globalStats.totalLowStock;
    }

    try {
      // For now, calculate from current products since we don't have a stock filter in API
      const { products } = get();
      const totalLowStock = products.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0).length;
      
      set(state => ({
        globalStats: {
          ...state.globalStats,
          totalLowStock,
          lastUpdated: Date.now(),
        } as typeof state.globalStats
      }));
      
      return totalLowStock;
    } catch (error) {
      console.error('Error getting total low stock products:', error);
    }
    
    return 0;
  },

  getTotalOutOfStockProducts: async () => {
    const { globalStats } = get();
    
    if (globalStats && Date.now() - globalStats.lastUpdated < 5 * 60 * 1000) {
      return globalStats.totalOutOfStock;
    }

    try {
      // For now, calculate from current products since we don't have a stock filter in API
      const { products } = get();
      const totalOutOfStock = products.filter(p => (p.stock || 0) === 0).length;
      
      set(state => ({
        globalStats: {
          ...state.globalStats,
          totalOutOfStock,
          lastUpdated: Date.now(),
        } as typeof state.globalStats
      }));
      
      return totalOutOfStock;
    } catch (error) {
      console.error('Error getting total out of stock products:', error);
    }
    
    return 0;
  },
}),
    {
      name: 'product-store',
      partialize: (state) => ({
        products: state.products,
        pagination: state.pagination,
        currentFilters: state.currentFilters,
        globalStats: state.globalStats,
      }),
    }
  )
);
