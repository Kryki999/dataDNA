import type { clients } from "@/lib/db/schema";

export type Client = typeof clients.$inferSelect;

export const CLIENT_CARD_COLORS = [
  "slate",
  "blue",
  "violet",
  "amber",
  "emerald",
  "rose",
  "cyan",
  "orange",
] as const;

export type ClientCardColor = (typeof CLIENT_CARD_COLORS)[number];

export function isValidCardColor(
  value: string | null | undefined,
): value is ClientCardColor {
  if (!value) return false;
  return CLIENT_CARD_COLORS.includes(value as ClientCardColor);
}
