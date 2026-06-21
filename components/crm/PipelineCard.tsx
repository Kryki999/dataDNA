"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getTagColorClass } from "@/lib/crm/tags";
import type { Lead, LeadWithMeta } from "@/lib/crm/pipeline";
import { QuickReminderButton } from "./QuickReminderButton";

export type CurrentUser = {
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type PipelineCardProps = {
  lead: LeadWithMeta;
  onOpen: (lead: Lead) => void;
  onUpdated?: (lead: Lead) => void;
  currentUser?: CurrentUser;
};

function formatFollowUp(date: Date): string {
  if (isToday(date)) return "Dziś";
  if (isTomorrow(date)) return "Jutro";
  return formatDistanceToNow(date, { addSuffix: true, locale: pl });
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function PipelineCard({
  lead,
  onOpen,
  onUpdated,
  currentUser,
}: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { lead, stage: lead.pipelineStage },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const displayName = lead.company || lead.name;
  const notePreview = lead.lastNoteBody?.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-border/60 bg-zinc-950/80 p-3 shadow-[0_2px_12px_rgba(0,0,0,0.35)] transition-all hover:border-primary/30 hover:shadow-[0_4px_24px_rgba(0,85,255,0.08)]",
        isDragging && "opacity-40 ring-2 ring-primary/50",
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="mt-1 size-4 shrink-0 cursor-grab rounded opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Przeciągnij kartę"
        >
          <span className="block h-full w-full rounded-sm bg-muted-foreground/40" />
        </button>

        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                    getTagColorClass(tag),
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
            {lead.nextFollowUpAt ? (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatFollowUp(lead.nextFollowUpAt)}
              </span>
            ) : null}
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-foreground">
            {displayName}
          </p>

          {notePreview ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
              {notePreview}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-muted-foreground/50">
              Brak notatek
            </p>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {lead.projectValuePln ? (
            <span className="font-mono text-xs font-medium text-primary tabular-nums">
              {lead.projectValuePln.toLocaleString("pl-PL")} PLN
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Avatar className="size-6">
            <AvatarImage
              src={currentUser?.avatarUrl ?? undefined}
              alt={currentUser?.displayName ?? ""}
            />
            <AvatarFallback className="text-[9px]">
              {getInitials(currentUser?.displayName, currentUser?.email)}
            </AvatarFallback>
          </Avatar>
          {onUpdated ? (
            <QuickReminderButton lead={lead} onUpdated={onUpdated} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PipelineCardOverlay({ lead }: { lead: LeadWithMeta }) {
  return (
    <div className="w-[min(100vw-2rem,280px)] rotate-1 scale-[1.02] shadow-2xl">
      <PipelineCard lead={lead} onOpen={() => {}} />
    </div>
  );
}
