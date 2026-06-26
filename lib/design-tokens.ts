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
    strip: "bg-zinc-400",
    swatch: "bg-zinc-400",
    accentBorder: "border-l-zinc-400",
  },
  blue: {
    border: "border-blue-500/60",
    bg: "from-blue-500/55 via-blue-950/30 to-zinc-950/50",
    strip: "bg-blue-400",
    swatch: "bg-blue-500",
    accentBorder: "border-l-blue-500",
  },
  violet: {
    border: "border-violet-500/60",
    bg: "from-violet-500/55 via-violet-950/30 to-zinc-950/50",
    strip: "bg-violet-400",
    swatch: "bg-violet-500",
    accentBorder: "border-l-violet-500",
  },
  amber: {
    border: "border-amber-500/60",
    bg: "from-amber-500/55 via-amber-950/25 to-zinc-950/50",
    strip: "bg-amber-400",
    swatch: "bg-amber-500",
    accentBorder: "border-l-amber-500",
  },
  emerald: {
    border: "border-emerald-500/60",
    bg: "from-emerald-500/55 via-emerald-950/30 to-zinc-950/50",
    strip: "bg-emerald-400",
    swatch: "bg-emerald-500",
    accentBorder: "border-l-emerald-500",
  },
  rose: {
    border: "border-rose-500/60",
    bg: "from-rose-500/55 via-rose-950/30 to-zinc-950/50",
    strip: "bg-rose-400",
    swatch: "bg-rose-500",
    accentBorder: "border-l-rose-500",
  },
  cyan: {
    border: "border-cyan-500/60",
    bg: "from-cyan-500/55 via-cyan-950/30 to-zinc-950/50",
    strip: "bg-cyan-400",
    swatch: "bg-cyan-500",
    accentBorder: "border-l-cyan-500",
  },
  orange: {
    border: "border-orange-500/60",
    bg: "from-orange-500/55 via-orange-950/25 to-zinc-950/50",
    strip: "bg-orange-400",
    swatch: "bg-orange-500",
    accentBorder: "border-l-orange-500",
  },
} as const;

export type CardColorKey = keyof typeof CARD_COLORS;

export function getCardColorClasses(color: string | null | undefined) {
  const key = (color ?? "slate") as CardColorKey;
  return CARD_COLORS[key] ?? CARD_COLORS.slate;
}
