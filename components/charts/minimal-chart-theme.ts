import { BRAND } from "@/lib/brand";

export const MINIMAL_CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };

export const MINIMAL_AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
};

export const MINIMAL_CHART_COLORS = {
  stroke: BRAND.primary,
  fill: `${BRAND.primary}26`,
  bar: `${BRAND.primary}B3`,
  gradientStart: BRAND.primary,
  gradientEnd: BRAND.primary,
};
