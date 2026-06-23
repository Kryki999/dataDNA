"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { SURFACE_CARD } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";
import type { Lead, LeadWithMeta, PipelineStageId } from "@/lib/crm/pipeline";
import type { CurrentUser } from "@/components/crm/PipelineCard";
import { PipelineCard, PipelineCardStatic } from "./PipelineCard";

type PipelineColumnProps = {
  id: PipelineStageId;
  label: string;
  accentColor: string;
  leads: LeadWithMeta[];
  currentUser?: CurrentUser;
  onOpenLead: (lead: Lead) => void;
  onLeadUpdated: (lead: Lead) => void;
  onAddLead: (stage: PipelineStageId) => void;
  selectedLeadId?: string | null;
};

type PipelineColumnViewProps = PipelineColumnProps & {
  columnRef?: (element: HTMLElement | null) => void;
  isOver?: boolean;
  interactive?: boolean;
};

function PipelineColumnView({
  id,
  label,
  accentColor,
  leads,
  currentUser,
  onOpenLead,
  onLeadUpdated,
  onAddLead,
  selectedLeadId,
  columnRef,
  isOver = false,
  interactive = false,
}: PipelineColumnViewProps) {
  const Card = interactive ? PipelineCard : PipelineCardStatic;

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex min-h-[min(70vh,520px)] flex-col",
        SURFACE_CARD,
        isOver && "bg-primary/5 ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <span
          className={cn("size-2.5 shrink-0 rounded-sm", accentColor)}
          aria-hidden
        />
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {label}
        </h3>
        <span className="rounded-md bg-dna-inset px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
          {leads.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onAddLead(id)}
        className="mx-3 flex h-9 shrink-0 items-center justify-center rounded-lg border border-dna-border/30 bg-dna-inset text-muted-foreground transition-colors hover:bg-dna-inset/80 hover:text-foreground"
        aria-label={`Dodaj klienta — ${label}`}
      >
        <Plus className="size-4" />
      </button>

      <div className="mx-2 mb-2 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-lg bg-dna-inset/40 p-2 pt-1">
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-dna-border/25 bg-dna-inset/50 p-4 text-center text-xs text-muted-foreground">
            Upuść klienta tutaj
          </div>
        ) : (
          leads.map((lead) => (
            <Card
              key={lead.id}
              lead={lead}
              currentUser={currentUser}
              onOpen={onOpenLead}
              onUpdated={onLeadUpdated}
              selectedLeadId={selectedLeadId}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function PipelineColumnStatic(props: PipelineColumnProps) {
  return <PipelineColumnView {...props} interactive={false} />;
}

export function PipelineColumn(props: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id });

  return (
    <PipelineColumnView
      {...props}
      columnRef={setNodeRef}
      isOver={isOver}
      interactive
    />
  );
}
