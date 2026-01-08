import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Producto, ProductsFilters, Pagination, PaginationLinks, PaginationMeta } from "../interfaces/product.interface";
import { getProductsAction, getProductAction, deleteProductAction, updateProductAction } from "../actions/products";

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
  updateProduct: (productId: string | number, productData: { name: string }) => Promise<boolean>;
  setFilters: (filters: ProductsFilters) => void;
  initializeProducts: (products: Producto[], pagination?: Pagination) => void;
  clearError: () => void;
  clearProductError: () => void;
  clearDeleteError: () => void;
  clearUpdateError: () => void;
  clearSelectedProduct: () => void;
  clearCache: () => void;
  
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
    console.log('Store: fetchProduct llamado con ID:', productId);
    set({ isLoadingProduct: true, productError: null });
    
    try {
      console.log('Store: Llamando getProductAction con ID:', productId);
      const response = await getProductAction(productId);
      console.log('Store: Respuesta de getProductAction:', response);
      
      if (response.success && response.product) {
        console.log('Store: Producto cargado exitosamente:', response.product);
        set({
          selectedProduct: response.product,
          isLoadingProduct: false,
          productError: null,
        });
      } else {
        console.log('Store: Error al cargar producto:', response.error);
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

  initializeProducts: (products: Producto[], pagination?: Pagination) => {
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
      // Call the actual delete API
      const result = await deleteProductAction(productId);
      
      if (result.success) {
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
      } else {
        // API returned error: revert the optimistic update
        set({ 
          products: products, // Restore original products
          isDeleting: false,
          deleteError: result.error || 'Error al eliminar producto'
        });
        return false;
      }
    } catch (error) {
      // Network/unexpected error: revert the optimistic update
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

  updateProduct: async (productId: string | number, productData: { name: string }) => {
    console.log('Store: updateProduct llamado con ID:', productId);
    console.log('Store: updateProduct datos:', productData);
    
    const { products, currentFilters } = get();
    
    // Store original products for potential revert
    const originalProducts = [...products];
    const productIndex = products.findIndex(p => p.id === productId);
    
    // Set updating state
    set({ 
      isUpdating: true, 
      updateError: null 
    });

    // Optimistic update: find and update product in local state if it exists
    if (productIndex !== -1) {
      console.log('Store: Producto encontrado en lista local, aplicando actualización optimista');
      const originalProduct = products[productIndex];
      const optimisticProducts = [...products];
      // Update the product with new data (merge with existing data)
      optimisticProducts[productIndex] = { ...originalProduct, ...productData };
      
      set({ 
        products: optimisticProducts
      });
    } else {
      console.log('Store: Producto no está en lista local, continuando con actualización en servidor');
    }

    try {
      // Call the actual update API
      console.log('Store: Llamando updateProductAction con ID:', productId, 'y datos:', productData);
      const result = await updateProductAction(productId, productData);
      console.log('Store: Respuesta de updateProductAction:', result);
      
      if (result.success && result.product) {
        // Success: refresh the entire product list to ensure consistency
        console.log('Store: Actualización exitosa, refrescando lista completa');
        
        try {
          // Refresh the product list to get the latest data
          const refreshResponse = await getProductsAction(currentFilters);
          
          if (refreshResponse.success && refreshResponse.products) {
            set({ 
              products: refreshResponse.products,
              pagination: refreshResponse.pagination || null,
              selectedProduct: result.product,
              isUpdating: false,
              updateError: null 
            });
          } else {
            // If refresh fails, at least update the selected product
            set({ 
              selectedProduct: result.product,
              isUpdating: false,
              updateError: null 
            });
          }
        } catch (refreshError) {
          console.error('Store: Error al refrescar lista después de actualización:', refreshError);
          // If refresh fails, at least update the selected product
          set({ 
            selectedProduct: result.product,
            isUpdating: false,
            updateError: null 
          });
        }
        
        return true;
      } else {
        // API returned error: revert the optimistic update
        console.log('Store: Error en actualización, revirtiendo cambios optimistas');
        set({ 
          products: originalProducts, // Restore original products
          isUpdating: false,
          updateError: result.error || 'Error al actualizar producto'
        });
        return false;
      }
    } catch (error) {
      // Network/unexpected error: revert the optimistic update
      console.log('Store: Error de red, revirtiendo cambios optimistas');
      set({ 
        products: originalProducts, // Restore original products
        isUpdating: false,
        updateError: error instanceof Error ? error.message : 'Error inesperado' 
      });
      return false;
    }
  },

  clearUpdateError: () => {
    set({ updateError: null });
  },

  // Clear cache to force fresh data
  clearCache: () => {
    set({ 
      globalStats: null,
      products: [],
      pagination: null,
      selectedProduct: null
    });
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
      const response = await getProductsAction({});
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
        // No persistir productos para evitar datos obsoletos del caché
        // products: state.products,
        // pagination: state.pagination,
        currentFilters: state.currentFilters,
        // globalStats: state.globalStats,
      }),
    }
  )
);
