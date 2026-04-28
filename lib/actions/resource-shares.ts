'use server';

import { authenticatedFetch } from '../utils/authenticatedFetch';
import { handleActionError } from '../utils/actionError';
import type {
  ResourceShare,
  ResourceSharesResponse,
  ResourceShareResponse,
  CreateResourceShare,
  DeleteResourceShare,
  ResourceType,
  SharePermission,
} from '@/lib/interfaces/resource-share.interface';

export async function getResourceSharesAction(params: {
  resource_type: ResourceType;
  resource_id?: number;
  scope_id?: number;
  per_page?: number;
}): Promise<ResourceSharesResponse> {
  try {
    const query = new URLSearchParams();
    query.set('resource_type', params.resource_type);
    if (params.resource_id) query.set('resource_id', String(params.resource_id));
    if (params.scope_id)    query.set('scope_id', String(params.scope_id));
    if (params.per_page)    query.set('per_page', String(params.per_page));

    const { response } = await authenticatedFetch(`/authorization/resource-shares?${query.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    const shares: ResourceShare[] = data.data ?? [];

    return { success: true, shares };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createResourceShareAction(payload: CreateResourceShare): Promise<ResourceShareResponse> {
  try {
    const { response } = await authenticatedFetch('/authorization/resource-shares', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, share: data.data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateResourceShareAction(id: number, permissions: SharePermission[]): Promise<ResourceShareResponse> {
  try {
    const { response } = await authenticatedFetch(`/authorization/resource-shares/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, share: data.data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteResourceShareAction(payload: DeleteResourceShare): Promise<{ success: boolean; error?: string }> {
  try {
    const { response } = await authenticatedFetch('/authorization/resource-shares', {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Error ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
