import { cn } from "@/lib/utils";

export const PAGE_SHELL =
  "mx-auto w-full max-w-3xl space-y-10 px-6 py-8";

/** @deprecated Use EYEBROW */
export const SECTION_LABEL =
  "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

export const EYEBROW =
  "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

export const PAGE_TITLE = "text-xl font-semibold tracking-tight text-foreground";

export const DATA_HERO =
  "font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground";

export const STAT_LABEL = "text-xs text-muted-foreground";

export const STAT_VALUE = "text-2xl font-semibold tabular-nums";

const ELEV_BORDER = "border border-[var(--dna-elev-border)]";
const ELEV_SHADOW = "shadow-[var(--dna-elev-shadow)]";

/** Boczne menu. */
export const SURFACE_SIDEBAR = "bg-dna-chrome";
/** Górny pasek z tytułem zakładki. */
export const SURFACE_HEADER = "bg-dna-chrome-top";
/** Tło treści zakładki (najciemniejsze). */
export const SURFACE_CANVAS = "bg-dna-canvas";
/** Koryto na canvasie — kolumny Kanban, siatka plannera. */
export const SURFACE_COLUMN = "bg-dna-trough";
export const SURFACE_INSET = cn(
  "rounded-xl border border-dna-border/35 bg-dna-trough",
);
/** Kieszeń wewnątrz karty — ciemniejsza od surface. */
export const SURFACE_WELL =
  "rounded-lg border border-dna-border/25 bg-dna-inset";

/** Karty i panele danych — wyraźnie jaśniejsze od canvasu. */
export const SURFACE_CARD = cn(
  "rounded-xl bg-dna-surface",
  ELEV_BORDER,
  ELEV_SHADOW,
);

/** Karta zagnieżdżona w SURFACE_CARD (np. deal w kolumnie Kanban). */
export const SURFACE_CARD_NESTED = cn(
  "rounded-xl bg-dna-raised",
  ELEV_BORDER,
  "shadow-[0_2px_12px_rgba(0,0,0,0.3)]",
);

export const SURFACE_OVERLAY = "bg-dna-overlay backdrop-blur-sm";

/** Wykresy, tabele — pełna nieprzezroczysta powierzchnia. */
export const FLAT_CONTAINER = cn(
  "rounded-xl bg-dna-surface",
  ELEV_BORDER,
  ELEV_SHADOW,
);

/** Media DNA Blue — lewy akcent na kartach i metrykach. */
export const SIGNAL_EDGE =
  "border-l-2 border-dna-signal shadow-[var(--dna-signal-glow)]";

export const SIGNAL_EDGE_HOVER =
  "hover:border-l-2 hover:border-dna-signal hover:shadow-[var(--dna-signal-glow)]";

export const FILTER_PILL_ACTIVE =
  "border-dna-border bg-dna-inset text-foreground";

export const FILTER_PILL_INACTIVE =
  "border-transparent text-muted-foreground hover:border-dna-border/40 hover:bg-dna-trough hover:text-foreground";

export const INPUT_SURFACE =
  "border-dna-border/40 bg-dna-inset text-foreground placeholder:text-muted-foreground";

/** Scroll w modalach / kartach — natywny, styl DataDNA (patrz .dna-scrollbar w globals.css). */
export const DNA_SCROLLBAR = "dna-scrollbar";

/** Pole liczbowe bez strzałek góra/dół (wpisujesz wartość ręcznie). */
export const INPUT_PLAIN_NUMERIC = cn(
  INPUT_SURFACE,
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
);
