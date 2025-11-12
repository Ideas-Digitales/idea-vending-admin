import type {
  Enterprise,
  EnterpriseApiData,
} from "../interfaces/enterprise.interface";

export class EnterpriseAdapter {
  /**
   * Convierte datos de empresa del API al formato de la aplicación
   */
  static apiToApp(apiEnterprise: EnterpriseApiData): Enterprise {
    if (!apiEnterprise || typeof apiEnterprise !== "object") {
      throw new Error("Datos de empresa inválidos");
    }

    if (!apiEnterprise.id || !apiEnterprise.name) {
      throw new Error("Faltan campos requeridos en los datos de la empresa");
    }

    return {
      id: apiEnterprise.id,
      name: apiEnterprise.name,
      rut: apiEnterprise.rut || '',
      address: apiEnterprise.address || '',
      phone: apiEnterprise.phone || '',
      user_id: apiEnterprise.user_id,
      created_at: apiEnterprise.created_at,
      updated_at: apiEnterprise.updated_at,
    };
  }

  /**
   * Convierte array de empresas del API al formato de la aplicación
   */
  static apiEnterprisesToApp(apiEnterprises: EnterpriseApiData[]): Enterprise[] {
    if (!Array.isArray(apiEnterprises)) {
      return [];
    }

    return apiEnterprises.map((enterprise) => this.apiToApp(enterprise));
  }

  /**
   * Convierte datos de formulario al formato para enviar al API
   */
  static formToApi(formData: any): any {
    return {
      name: formData.name,
      rut: formData.rut,
      address: formData.address,
      phone: formData.phone,
      user_id: formData.user_id,
    };
  }
}
