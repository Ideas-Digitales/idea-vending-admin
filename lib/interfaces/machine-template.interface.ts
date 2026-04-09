export interface MachineTemplateSlot {
  id: number;
  label: string;
  column: string | null;
  row: number | null;
  mdb_code: number;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  default_capacity: number | null;
}

export interface MachineTemplate {
  id: number;
  name: string;
  brand: string | null;
  image: string | null;
  description: string | null;
  columns: number;
  rows: number;
  slot_count?: number;
  slots?: MachineTemplateSlot[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateMachineTemplateSlot {
  label: string;
  column?: string | null;
  row?: number | null;
  mdb_code: number;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  default_capacity?: number | null;
}

export interface CreateMachineTemplate {
  name: string;
  brand?: string | null;
  image?: string | null;
  description?: string | null;
  columns: number;
  rows: number;
  slots: CreateMachineTemplateSlot[];
}

export interface MachineTemplatesResponse {
  success: boolean;
  templates?: MachineTemplate[];
  error?: string;
}

export interface MachineTemplateResponse {
  success: boolean;
  template?: MachineTemplate;
  error?: string;
}

export interface ApplyMachineTemplateSlot {
  label: string;
  column?: string | null;
  row?: number | null;
  mdb_code: number;
  product_id?: number | null;
  capacity?: number | null;
  current_stock?: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface ApplyMachineTemplatePayload {
  template_id: number;
  replace_existing_slots?: boolean;
  slots?: ApplyMachineTemplateSlot[];
}

export interface ApplyMachineTemplateResult {
  success: boolean;
  data?: {
    machine_id: number;
    template_id: number;
    slots_created: number;
    products_assigned: number;
  };
  error?: string;
}
