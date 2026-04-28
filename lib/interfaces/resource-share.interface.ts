export type ResourceType =
  | 'App\\Models\\VendingMachine'
  | 'App\\Models\\Product';

export type SharedWithType = 'user' | 'enterprise';

export type SharePermission = 'read' | 'update' | 'delete';

export interface ResourceShareSharedWith {
  type: SharedWithType;
  id: number;
  name: string | null;
}

export interface ResourceShare {
  id: number;
  resource_type: ResourceType;
  resource_id: number | null;
  scope_id: number | null;
  shared_with: ResourceShareSharedWith;
  permissions: SharePermission[];
  created_at: string;
}

export interface ResourceSharesResponse {
  success: boolean;
  shares?: ResourceShare[];
  error?: string;
}

export interface ResourceShareResponse {
  success: boolean;
  share?: ResourceShare;
  error?: string;
}

export interface CreateResourceShare {
  resource_type: ResourceType;
  resource_id?: number;
  scope_id?: number;
  shared_with: {
    type: SharedWithType;
    id: number;
  };
  permissions: SharePermission[];
}

export interface DeleteResourceShare {
  resource_type: ResourceType;
  resource_id?: number;
  scope_id?: number;
  shared_with: {
    type: SharedWithType;
    id: number;
  };
}
