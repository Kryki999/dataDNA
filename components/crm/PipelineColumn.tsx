"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Lead, PipelineStageId } from "@/lib/crm/pipeline";
import { PipelineCard } from "./PipelineCard";

type PipelineColumnProps = {
  id: PipelineStageId;
  label: string;
  colorClass: string;
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
};

export function PipelineColumn({
  id,
  label,
  colorClass,
  leads,
  onOpenLead,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-xl border bg-card/40",
        colorClass,
        isOver && "border-primary/60 bg-primary/5 shadow-[inset_0_0_0_1px_rgba(0,85,255,0.25)]",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-3">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            Upuść klienta tutaj
          </div>
        ) : (
          leads.map((lead) => (
            <PipelineCard key={lead.id} lead={lead} onOpen={onOpenLead} />
          ))
        )}
      </div>
    </div>
  );
}
