import type { leads } from "@/lib/db/schema";

export type Lead = typeof leads.$inferSelect;

export type LeadWithMeta = Lead & {
  lastNoteBody: string | null;
};

export type PipelineStageId =
  | "new"
  | "contact_made"
  | "demo_sent"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSourceId = "cold_call" | "x" | "meta" | "other";

export const PIPELINE_COLUMNS = [
  {
    id: "new" as const,
    label: "Nowy",
    color: "border-blue-500/30",
    accent: "bg-blue-500",
  },
  {
    id: "contact_made" as const,
    label: "Kontakt Nawiązany",
    color: "border-sky-500/30",
    accent: "bg-sky-500",
  },
  {
    id: "demo_sent" as const,
    label: "Wysłane Demo",
    color: "border-amber-500/30",
    accent: "bg-amber-500",
  },
  {
    id: "negotiation" as const,
    label: "Negocjacje",
    color: "border-violet-500/30",
    accent: "bg-violet-500",
  },
] as const;

export const ACTIVE_PIPELINE_STAGES = PIPELINE_COLUMNS.map((c) => c.id);

export const ARCHIVE_STAGES: PipelineStageId[] = ["won", "lost"];

export const PIPELINE_STAGE_LABELS: Record<PipelineStageId, string> = {
  new: "Nowy",
  contact_made: "Kontakt Nawiązany",
  demo_sent: "Wysłane Demo",
  negotiation: "Negocjacje",
  won: "Wygrany",
  lost: "Przegrany",
};

export const LEAD_SOURCE_LABELS: Record<LeadSourceId, string> = {
  cold_call: "Cold Call",
  x: "X",
  meta: "Meta Ads",
  other: "Inne",
};

export function isActiveLead(lead: Pick<Lead, "pipelineStage">) {
  return ACTIVE_PIPELINE_STAGES.includes(
    lead.pipelineStage as (typeof ACTIVE_PIPELINE_STAGES)[number],
  );
}

export function isArchivedLead(lead: Pick<Lead, "pipelineStage">) {
  return ARCHIVE_STAGES.includes(lead.pipelineStage as PipelineStageId);
}
