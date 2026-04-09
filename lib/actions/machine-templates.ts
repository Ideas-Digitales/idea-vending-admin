'use server';

import {
  ApplyMachineTemplatePayload,
  ApplyMachineTemplateResult,
  CreateMachineTemplate,
  MachineTemplate,
  MachineTemplateResponse,
  MachineTemplatesResponse,
} from '@/lib/interfaces/machine-template.interface';
import type { CreateMachineTemplateFormData } from '@/lib/schemas/machine-template.schema';
import { createMachineTemplateSchema } from '@/lib/schemas/machine-template.schema';
import { authenticatedFetch } from '@/lib/utils/authenticatedFetch';
import { handleActionError } from '@/lib/utils/actionError';
import { MachineTemplateAdapter } from '@/lib/adapters/machine-template.adapter';

export async function getMachineTemplatesAction(): Promise<MachineTemplatesResponse> {
  try {
    const { response } = await authenticatedFetch('/machine-templates?include=slots&limit=100', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const templates = Array.isArray(data.data)
      ? data.data.map((template: Record<string, unknown>) => MachineTemplateAdapter.apiToApp(template))
      : [];

    return { success: true, templates };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createMachineTemplateAction(
  payload: CreateMachineTemplate
): Promise<MachineTemplateResponse> {
  try {
    const validationResult = createMachineTemplateSchema.safeParse(payload);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((issue) => issue.message).join(', '),
      };
    }

    const { response } = await authenticatedFetch('/machine-templates', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const templateData = data.data || data;

    return {
      success: true,
      template: MachineTemplateAdapter.apiToApp(templateData),
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getMachineTemplateAction(id: string | number): Promise<MachineTemplateResponse> {
  try {
    const { response } = await authenticatedFetch(`/machine-templates/${id}?include=slots`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, template: MachineTemplateAdapter.apiToApp(data.data || data) };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateMachineTemplateAction(
  id: string | number,
  payload: Omit<CreateMachineTemplateFormData, 'slots'>
): Promise<MachineTemplateResponse> {
  try {
    const { response } = await authenticatedFetch(`/machine-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, template: MachineTemplateAdapter.apiToApp(data.data || data) };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function applyMachineTemplateAction(
  machineId: string | number,
  payload: ApplyMachineTemplatePayload
): Promise<ApplyMachineTemplateResult> {
  try {
    const { response } = await authenticatedFetch(`/machines/${machineId}/apply-template`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
