import type {
  Producto,
  ProductApiData,
  ApiProductsResponse,
} from "@/lib/interfaces/product.interface";

// Adaptador para convertir datos de API a formato de aplicación
export class ProductAdapter {
  static apiToApp(apiProduct: ProductApiData): Producto {
    console.log(
      "ProductAdapter.apiToApp recibió:",
      JSON.stringify(apiProduct, null, 2)
    );

    if (!apiProduct || typeof apiProduct !== "object") {
      console.error("Datos de producto inválidos:", apiProduct);
      throw new Error("Datos de producto inválidos");
    }

    // Verificar si hay un ID válido en cualquiera de los campos posibles
    const productId = apiProduct.id || apiProduct.product_id;
    if (!productId) {
      console.error(
        "Faltan campos requeridos en producto. Campos disponibles:",
        Object.keys(apiProduct)
      );
      console.error("Datos completos del producto:", apiProduct);
      throw new Error(
        `Faltan campos requeridos en los datos del producto. ID no encontrado en: ${Object.keys(
          apiProduct
        ).join(", ")}`
      );
    }

    return {
      id: productId,
      name: apiProduct.name || apiProduct.product_name || "Producto Sin Nombre",
      created_at:
        apiProduct.created_at ||
        apiProduct.createdAt ||
        new Date().toISOString(),
      updated_at:
        apiProduct.updated_at ||
        apiProduct.updatedAt ||
        new Date().toISOString(),
      enterprise_id: apiProduct.enterprise_id || apiProduct.enterpriseId || 1,
      // Campos adicionales (MOCK por ahora hasta que estén en la API)
      description: apiProduct.description || "Descripción no disponible",
      price: apiProduct.price || this.generateMockPrice(),
      category: apiProduct.category || this.getRandomCategory(),
      stock: apiProduct.stock || Math.floor(Math.random() * 100),
      image: apiProduct.image || "/placeholder-product.jpg",
      barcode: apiProduct.barcode || this.generateMockBarcode(),
      is_active: apiProduct.is_active ?? apiProduct.active ?? true,
    };
  }

  static apiProductsToApp(apiResponse: ApiProductsResponse): Producto[] {
    const productsArray = apiResponse.data || apiResponse.products || [];

    console.log('🔍 ProductAdapter.apiProductsToApp - Productos recibidos:', productsArray.length);
    console.log('🔍 Productos raw:', productsArray);

    if (!Array.isArray(productsArray)) {
      console.warn(
        "Los datos de productos no están en formato de array:",
        apiResponse
      );
      return [];
    }

    const mappedProducts = productsArray.map((product) => this.apiToApp(product));
    console.log('✅ ProductAdapter.apiProductsToApp - Productos mapeados:', mappedProducts.length);
    
    return mappedProducts;
  }

  // Funciones auxiliares para datos MOCK
  private static generateMockPrice(): number {
    return Math.floor(Math.random() * 5000) + 500;
  }

  private static getRandomCategory(): string {
    const categories = [
      "Bebidas",
      "Snacks",
      "Dulces",
      "Saludable",
      "Lácteos",
      "Panadería",
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private static generateMockBarcode(): string {
    return (
      Math.floor(Math.random() * 9000000000000) + 1000000000000
    ).toString();
  }
}
