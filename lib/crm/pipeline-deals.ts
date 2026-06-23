import type { pipelineDeals } from "@/lib/db/schema";

export type PipelineDeal = typeof pipelineDeals.$inferSelect;

export type PipelineDealStatus =
  | "new"
  | "contact_made"
  | "demo_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export const PIPELINE_DEAL_COLUMNS = [
  { id: "new" as const, label: "Nowy", accent: "bg-blue-500/70" },
  {
    id: "contact_made" as const,
    label: "Kontakt Nawiązany",
    accent: "bg-sky-500/70",
  },
  { id: "demo_sent" as const, label: "Wysłane Demo", accent: "bg-amber-500/70" },
  {
    id: "negotiation" as const,
    label: "Negocjacje",
    accent: "bg-violet-500/70",
  },
] as const;

export const ACTIVE_PIPELINE_DEAL_STATUSES = PIPELINE_DEAL_COLUMNS.map(
  (column) => column.id,
);

export const CLOSED_PIPELINE_DEAL_STATUSES: PipelineDealStatus[] = [
  "closed_won",
  "closed_lost",
];

export const PIPELINE_DEAL_STATUS_LABELS: Record<PipelineDealStatus, string> = {
  new: "Nowy",
  contact_made: "Kontakt Nawiązany",
  demo_sent: "Wysłane Demo",
  negotiation: "Negocjacje",
  closed_won: "Zrealizowano",
  closed_lost: "Koniec współpracy",
};

export function isActivePipelineDeal(
  deal: Pick<PipelineDeal, "status">,
): boolean {
  return ACTIVE_PIPELINE_DEAL_STATUSES.includes(
    deal.status as (typeof ACTIVE_PIPELINE_DEAL_STATUSES)[number],
  );
}
