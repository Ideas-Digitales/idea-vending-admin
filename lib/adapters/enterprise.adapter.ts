import type {
  Enterprise,
  EnterpriseApiData,
  EnterpriseOwner,
  EnterpriseUser,
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
      owner: this.mapEnterpriseOwner(apiEnterprise.owner),
      users: this.mapEnterpriseUsers(apiEnterprise.users),
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
  static formToApi(formData: Record<string, unknown>): Record<string, unknown> {
    return {
      name: formData.name,
      rut: formData.rut,
      address: formData.address,
      phone: formData.phone,
      user_id: formData.user_id,
    };
  }

  private static mapEnterpriseUsers(
    apiUsers?: EnterpriseApiData['users']
  ): EnterpriseUser[] | undefined {
    if (!Array.isArray(apiUsers) || apiUsers.length === 0) {
      return undefined;
    }

    const mappedUsers: Array<EnterpriseUser | null> = apiUsers.map((user) => {
        const parsedId = typeof user.id === 'string' ? Number(user.id) : user.id;
        if (!parsedId || !user.name) {
          return null;
        }

        return {
          id: parsedId,
          name: user.name,
          ...(user.email ? { email: user.email } : {}),
        };
      });

    const normalizedUsers = mappedUsers.filter(
      (user): user is EnterpriseUser => user !== null
    );

    return normalizedUsers.length > 0 ? normalizedUsers : undefined;
  }

  private static mapEnterpriseOwner(
    apiOwner?: EnterpriseApiData['owner']
  ): EnterpriseOwner | undefined {
    if (!apiOwner) {
      return undefined;
    }

    const parsedId = typeof apiOwner.id === 'string' ? Number(apiOwner.id) : apiOwner.id;
    if (!parsedId || !apiOwner.name) {
      return undefined;
    }

    return {
      id: parsedId,
      name: apiOwner.name,
      ...(apiOwner.email ? { email: apiOwner.email } : {}),
    };
  }
}
