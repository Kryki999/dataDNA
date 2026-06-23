/**
 * DataDNA design tokens — canonical elevation scale (dark mode).
 */
export const DNA_ELEVATION = {
  canvas: "dna-canvas",
  trough: "dna-trough",
  inset: "dna-inset",
  surface: "dna-surface",
  raised: "dna-raised",
  chrome: "dna-chrome",
  chromeTop: "dna-chrome-top",
} as const;

export const DNA_SIGNAL = "#0055FF";

/** Dark-mode-safe card accent palette */
export const CARD_COLORS = {
  slate: { border: "border-zinc-500/40", bg: "from-zinc-600/30 to-zinc-800/20" },
  blue: { border: "border-blue-500/40", bg: "from-blue-600/25 to-zinc-800/20" },
  violet: { border: "border-violet-500/40", bg: "from-violet-600/25 to-zinc-800/20" },
  amber: { border: "border-amber-500/40", bg: "from-amber-600/25 to-zinc-800/20" },
  emerald: { border: "border-emerald-500/40", bg: "from-emerald-600/25 to-zinc-800/20" },
  rose: { border: "border-rose-500/40", bg: "from-rose-600/25 to-zinc-800/20" },
  cyan: { border: "border-cyan-500/40", bg: "from-cyan-600/25 to-zinc-800/20" },
  orange: { border: "border-orange-500/40", bg: "from-orange-600/25 to-zinc-800/20" },
} as const;

export type CardColorKey = keyof typeof CARD_COLORS;

export function getCardColorClasses(color: string | null | undefined) {
  const key = (color ?? "slate") as CardColorKey;
  return CARD_COLORS[key] ?? CARD_COLORS.slate;
}
