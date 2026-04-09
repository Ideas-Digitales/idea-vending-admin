export type SlotSpan = 1 | 2 | 3;

export function deriveSlotSpan(width: number | null | undefined, totalColumns?: number): SlotSpan {
  if (!width || !totalColumns || totalColumns <= 0) return 1;
  const cellWidth = 100 / totalColumns;
  const span = Math.round(width / cellWidth);
  return Math.max(1, Math.min(3, span)) as SlotSpan;
}

export function slotSpanToWidth(span: SlotSpan, totalColumns?: number): number | null {
  if (!totalColumns || totalColumns <= 0) return null;
  return parseFloat(((100 / totalColumns) * span).toFixed(2));
}

export function getAvailableSlotSpans(totalColumns?: number): SlotSpan[] {
  if (!totalColumns || totalColumns <= 0) return [1];
  return ([1, 2, 3] as SlotSpan[]).filter((span) => span <= totalColumns);
}
