import type {
  MachineTemplate,
  MachineTemplateSlot,
} from '@/lib/interfaces/machine-template.interface';

export class MachineTemplateAdapter {
  static apiToApp(raw: Record<string, unknown>): MachineTemplate {
    return {
      id: Number(raw.id),
      name: String(raw.name ?? ''),
      brand: typeof raw.brand === 'string' ? raw.brand : null,
      image: typeof raw.image === 'string' ? raw.image : null,
      description: typeof raw.description === 'string' ? raw.description : null,
      columns: Number(raw.columns ?? 0),
      rows: Number(raw.rows ?? 0),
      slot_count: typeof raw.slot_count === 'number' ? raw.slot_count : undefined,
      slots: Array.isArray(raw.slots) ? raw.slots.map(MachineTemplateAdapter.apiSlotToApp) : undefined,
      created_at: typeof raw.created_at === 'string' ? raw.created_at : undefined,
      updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : undefined,
    };
  }

  private static apiSlotToApp(slot: unknown): MachineTemplateSlot {
    const data = slot as Record<string, unknown>;
    return {
      id: Number(data.id ?? 0),
      label: String(data.label ?? ''),
      column: typeof data.column === 'string' ? data.column : null,
      row: typeof data.row === 'number' ? data.row : null,
      mdb_code: Number(data.mdb_code ?? 0),
      x: typeof data.x === 'number' ? data.x : null,
      y: typeof data.y === 'number' ? data.y : null,
      width: typeof data.width === 'number' ? data.width : null,
      height: typeof data.height === 'number' ? data.height : null,
      default_capacity: typeof data.default_capacity === 'number' ? data.default_capacity : null,
    };
  }
}
