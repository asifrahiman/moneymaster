/**
 * Category colours are stored as a slot number ("1".."8") rather than a hex
 * value so each slot can have a light and a dark variant (see globals.css).
 * The order is a colour-blind-validated categorical order — assign in order,
 * never generate new hues.
 */
export const SERIES_SLOTS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
export type SeriesSlot = (typeof SERIES_SLOTS)[number];

export const SLOT_NAMES: Record<SeriesSlot, string> = {
  "1": "Blue",
  "2": "Orange",
  "3": "Aqua",
  "4": "Yellow",
  "5": "Pink",
  "6": "Green",
  "7": "Violet",
  "8": "Red",
};

export function slotVar(slot: string | null | undefined): string {
  return SERIES_SLOTS.includes(slot as SeriesSlot) ? `var(--series-${slot})` : "var(--series-other)";
}

export function isSlot(v: unknown): v is SeriesSlot {
  return typeof v === "string" && (SERIES_SLOTS as readonly string[]).includes(v);
}

/** The least-used slot, so a new category gets a colour its siblings don't have yet. */
export function nextSlot(used: string[]): SeriesSlot {
  const counts = new Map<SeriesSlot, number>(SERIES_SLOTS.map((s) => [s, 0]));
  for (const u of used) if (isSlot(u)) counts.set(u, counts.get(u)! + 1);
  let best: SeriesSlot = "1";
  for (const s of SERIES_SLOTS) if (counts.get(s)! < counts.get(best)!) best = s;
  return best;
}
