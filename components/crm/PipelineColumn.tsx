"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { ClientTypeahead } from "@/components/crm/ClientTypeahead";
import type { PipelineDealWithMeta } from "@/lib/actions/pipeline-deals";
import type { PipelineDealStatus } from "@/lib/crm/pipeline-deals";
import { PIPELINE_DEAL_COLUMNS } from "@/lib/crm/pipeline-deals";
import type { CurrentUser } from "@/lib/crm/current-user";
import { PipelineCard, PipelineCardStatic } from "./PipelineCard";
import { SURFACE_CARD } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PipelineColumnProps = {
  id: PipelineDealStatus;
  label: string;
  accentColor: string;
  deals: PipelineDealWithMeta[];
  currentUser?: CurrentUser;
  onOpenDeal: (deal: PipelineDealWithMeta) => void;
  onDealCreated: () => void;
  selectedDealId?: string | null;
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
  deals,
  currentUser,
  onOpenDeal,
  onDealCreated,
  selectedDealId,
  columnRef,
  isOver = false,
  interactive = false,
}: PipelineColumnViewProps) {
  const [adding, setAdding] = useState(false);
  const Card = interactive ? PipelineCard : PipelineCardStatic;
  const isActiveColumn = PIPELINE_DEAL_COLUMNS.some((c) => c.id === id);

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
          {deals.length}
        </span>
      </div>

      {isActiveColumn ? (
        adding ? (
          <div className="mx-3 mb-2 shrink-0">
            <ClientTypeahead
              autoFocus
              defaultStatus={id}
              onCreated={() => {
                setAdding(false);
                onDealCreated();
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mx-3 flex h-9 shrink-0 items-center justify-center rounded-lg border border-dna-border/30 bg-dna-inset text-muted-foreground transition-colors hover:bg-dna-inset/80 hover:text-foreground"
            aria-label={`Dodaj — ${label}`}
          >
            <Plus className="size-4" />
          </button>
        )
      ) : null}

      <div className="mx-2 mb-2 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-lg bg-dna-inset/40 p-2 pt-1">
        {deals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-dna-border/25 bg-dna-inset/50 p-4 text-center text-xs text-muted-foreground">
            Upuść kartę tutaj
          </div>
        ) : (
          deals.map((deal) => (
            <Card
              key={deal.id}
              deal={deal}
              currentUser={currentUser}
              onOpen={onOpenDeal}
              selectedDealId={selectedDealId}
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
