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
  slate: {
    border: "border-zinc-500/60",
    bg: "from-zinc-500/50 via-zinc-800/40 to-zinc-950/50",
    swatch: "bg-zinc-400",
  },
  blue: {
    border: "border-blue-500/60",
    bg: "from-blue-500/55 via-blue-950/30 to-zinc-950/50",
    swatch: "bg-blue-500",
  },
  violet: {
    border: "border-violet-500/60",
    bg: "from-violet-500/55 via-violet-950/30 to-zinc-950/50",
    swatch: "bg-violet-500",
  },
  amber: {
    border: "border-amber-500/60",
    bg: "from-amber-500/55 via-amber-950/25 to-zinc-950/50",
    swatch: "bg-amber-500",
  },
  emerald: {
    border: "border-emerald-500/60",
    bg: "from-emerald-500/55 via-emerald-950/30 to-zinc-950/50",
    swatch: "bg-emerald-500",
  },
  rose: {
    border: "border-rose-500/60",
    bg: "from-rose-500/55 via-rose-950/30 to-zinc-950/50",
    swatch: "bg-rose-500",
  },
  cyan: {
    border: "border-cyan-500/60",
    bg: "from-cyan-500/55 via-cyan-950/30 to-zinc-950/50",
    swatch: "bg-cyan-500",
  },
  orange: {
    border: "border-orange-500/60",
    bg: "from-orange-500/55 via-orange-950/25 to-zinc-950/50",
    swatch: "bg-orange-500",
  },
} as const;

export type CardColorKey = keyof typeof CARD_COLORS;

export function getCardColorClasses(color: string | null | undefined) {
  const key = (color ?? "slate") as CardColorKey;
  return CARD_COLORS[key] ?? CARD_COLORS.slate;
}
