import type {
  Producto,
  ProductApiData,
  ApiProductsResponse,
} from "@/lib/interfaces/product.interface";

// Adaptador para convertir datos de API a formato de aplicación
export class ProductAdapter {
  static apiToApp(apiProduct: ProductApiData): Producto {
    if (!apiProduct || typeof apiProduct !== "object") {
      throw new Error("Datos de producto inválidos");
    }

    const productId = apiProduct.id || apiProduct.product_id;
    if (!productId) {
      throw new Error(
        `ID de producto no encontrado en campos: ${Object.keys(apiProduct).join(", ")}`
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
      image: apiProduct.image || undefined,
      barcode: apiProduct.barcode || this.generateMockBarcode(),
      is_active: apiProduct.is_active ?? apiProduct.active ?? true,
    };
  }

  static apiProductsToApp(apiResponse: ApiProductsResponse): Producto[] {
    const productsArray = apiResponse.data || apiResponse.products || [];

    if (!Array.isArray(productsArray)) {
      return [];
    }

    return productsArray.map((product) => this.apiToApp(product));
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
