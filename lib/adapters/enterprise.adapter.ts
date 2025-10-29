import type {
  Enterprise,
  EnterpriseApiData,
  ApiEnterprisesResponse,
} from "../interfaces/enterprise.interface";

export class EnterpriseAdapter {
  static apiToApp(apiEnterprise: EnterpriseApiData): Enterprise {
    console.log(
      "EnterpriseAdapter.apiToApp recibió:",
      JSON.stringify(apiEnterprise, null, 2)
    );

    if (!apiEnterprise || typeof apiEnterprise !== "object") {
      console.error("Datos de empresa inválidos:", apiEnterprise);
      throw new Error("Datos de empresa inválidos");
    }

    const id = apiEnterprise.id || apiEnterprise.enterprise_id;

    const name = apiEnterprise.name || apiEnterprise.enterprise_name;

    const user_id = apiEnterprise.user_id || apiEnterprise.userId;

    const created_at = apiEnterprise.created_at || apiEnterprise.createdAt;
    const updated_at = apiEnterprise.updated_at || apiEnterprise.updatedAt;

    if (!id || !name) {
      console.error(
        "Faltan campos requeridos en empresa. Campos disponibles:",
        Object.keys(apiEnterprise)
      );
      throw new Error(
        "Faltan campos requeridos en los datos de la empresa (id, name)"
      );
    }

    const enterprise: Enterprise = {
      id: id,
      name: name,
      rut: apiEnterprise.rut || "Sin RUT",
      address: apiEnterprise.address || "Sin dirección",
      phone: apiEnterprise.phone || "Sin teléfono",
    };

    // Agregar relaciones si están presentes
    if (apiEnterprise.owner) {
      enterprise.owner = apiEnterprise.owner;
    }

    if (apiEnterprise.users) {
      enterprise.users = apiEnterprise.users;
    }

    if (apiEnterprise.machines) {
      enterprise.machines = apiEnterprise.machines;
    }

    return enterprise;
  }

  static apiEnterprisesToApp(apiResponse: ApiEnterprisesResponse): Enterprise[] {
    console.log(
      "EnterpriseAdapter.apiEnterprisesToApp recibió:",
      JSON.stringify(apiResponse, null, 2)
    );

    const enterprisesArray = apiResponse.enterprises || apiResponse.data || [];

    if (!Array.isArray(enterprisesArray)) {
      console.warn(
        "Los datos de empresas no están en formato de array:",
        apiResponse
      );
      return [];
    }

    return enterprisesArray.map((enterprise) => this.apiToApp(enterprise));
  }
}
