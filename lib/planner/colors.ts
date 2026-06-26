import type { CardColorKey } from "@/lib/design-tokens";
import type { PlannerIcon } from "@/lib/planner/types";

/** Fallback accent when task has no linked client */
export const PLANNER_ICON_COLORS: Record<PlannerIcon, CardColorKey> = {
  task: "slate",
  phone: "cyan",
  follow_up: "amber",
  design: "violet",
  meeting: "blue",
};
