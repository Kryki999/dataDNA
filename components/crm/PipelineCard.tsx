"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LEAD_SOURCE_LABELS,
  type Lead,
} from "@/lib/crm/pipeline";

type PipelineCardProps = {
  lead: Lead;
  onOpen: (lead: Lead) => void;
};

export function PipelineCard({ lead, onOpen }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { lead, stage: lead.pipelineStage },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-border/80 bg-card/90 p-3 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-[0_0_20px_rgba(0,85,255,0.12)]",
        isDragging && "opacity-50 ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Przeciągnij kartę"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium">{lead.company || lead.name}</p>
          {lead.company ? (
            <p className="truncate text-xs text-muted-foreground">{lead.name}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {LEAD_SOURCE_LABELS[lead.source]}
            </Badge>
            {lead.projectValuePln ? (
              <span className="font-mono text-xs text-primary tabular-nums">
                {lead.projectValuePln.toLocaleString("pl-PL")} PLN
              </span>
            ) : null}
          </div>
          {(lead.phone || lead.email) && (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {[lead.phone, lead.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </button>
        <Building2 className="size-4 shrink-0 text-muted-foreground/60" />
      </div>
    </div>
  );
}
