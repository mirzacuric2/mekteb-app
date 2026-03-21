export const NIVO_COLOR_BY_LEVEL = {
  1: "#22c55e",
  2: "#0ea5e9",
  3: "#f59e0b",
  4: "#ef4444",
  5: "#8b5cf6",
} as const;

export type NivoLevel = keyof typeof NIVO_COLOR_BY_LEVEL;

export const DEFAULT_EVENT_COLOR = "#64748b";

export function getNivoColor(level?: number | null) {
  if (!level) return undefined;
  if (level < 1 || level > 5) return undefined;
  return NIVO_COLOR_BY_LEVEL[level as NivoLevel];
}

export function resolveEventColor(nivo?: number | null) {
  return getNivoColor(nivo) || DEFAULT_EVENT_COLOR;
}
