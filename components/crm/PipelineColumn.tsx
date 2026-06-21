"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Lead, LeadWithMeta, PipelineStageId } from "@/lib/crm/pipeline";
import type { CurrentUser } from "@/components/crm/PipelineCard";
import { PipelineCard } from "./PipelineCard";

type PipelineColumnProps = {
  id: PipelineStageId;
  label: string;
  colorClass: string;
  accentColor: string;
  leads: LeadWithMeta[];
  currentUser?: CurrentUser;
  onOpenLead: (lead: Lead) => void;
  onLeadUpdated: (lead: Lead) => void;
};

export function PipelineColumn({
  id,
  label,
  colorClass,
  accentColor,
  leads,
  currentUser,
  onOpenLead,
  onLeadUpdated,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[min(70vh,520px)] flex-col rounded-xl border bg-zinc-950/40",
        colorClass,
        isOver &&
          "border-primary/60 bg-primary/5 shadow-[inset_0_0_0_1px_rgba(0,85,255,0.25)]",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-3">
        <span
          className={cn("size-2.5 shrink-0 rounded-sm", accentColor)}
          aria-hidden
        />
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{label}</h3>
        <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
            Upuść klienta tutaj
          </div>
        ) : (
          leads.map((lead) => (
            <PipelineCard
              key={lead.id}
              lead={lead}
              currentUser={currentUser}
              onOpen={onOpenLead}
              onUpdated={onLeadUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}
