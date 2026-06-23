"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SURFACE_CARD_NESTED, SIGNAL_EDGE_HOVER } from "@/lib/ui-patterns";
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
  selectedLeadId?: string | null;
};

type PipelineCardViewProps = PipelineCardProps & {
  cardRef?: (element: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  useLayout?: boolean;
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

function PipelineCardView({
  lead,
  onOpen,
  onUpdated,
  currentUser,
  cardRef,
  style,
  isDragging = false,
  dragListeners,
  dragAttributes,
  useLayout = false,
  selectedLeadId,
}: PipelineCardViewProps) {
  const displayName = lead.company || lead.name;
  const notePreview = lead.lastNoteBody?.trim();
  const isSelected = selectedLeadId === lead.id;
  const dragEnabled = Boolean(dragListeners && dragAttributes);

  if (isSelected) {
    return (
      <div
        ref={cardRef}
        style={style}
        className="invisible rounded-xl p-3"
        aria-hidden
      />
    );
  }

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {lead.tags.slice(0, 2).map((tag) => (
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
        <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
          {notePreview}
        </p>
      ) : (
        <p className="mt-1 text-xs italic text-muted-foreground">Brak notatek</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dna-border/30 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {lead.projectValuePln ? (
            <span className="font-mono text-xs font-medium text-primary/90 tabular-nums">
              {lead.projectValuePln.toLocaleString("pl-PL")} PLN
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
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

      {dragEnabled ? (
        <GripVertical className="absolute bottom-2 right-2 size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
      ) : null}
    </>
  );

  const cardClass = cn(
    "group relative rounded-xl p-3 transition-all",
    SURFACE_CARD_NESTED,
    SIGNAL_EDGE_HOVER,
    dragEnabled && "cursor-grab active:cursor-grabbing",
    isDragging && "opacity-40 ring-2 ring-primary/50",
  );

  const handleClick = () => onOpen(lead);

  if (useLayout && !isDragging) {
    return (
      <motion.div
        layoutId={`deal-${lead.id}`}
        ref={cardRef}
        style={style}
        className={cardClass}
        onClick={handleClick}
        {...dragListeners}
        {...dragAttributes}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div
      ref={cardRef}
      style={style}
      className={cardClass}
      onClick={handleClick}
      {...dragListeners}
      {...dragAttributes}
    >
      {cardContent}
    </div>
  );
}

export function PipelineCardStatic(props: PipelineCardProps) {
  return <PipelineCardView {...props} />;
}

export function PipelineCard({
  lead,
  onOpen,
  onUpdated,
  currentUser,
  selectedLeadId,
}: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { lead, stage: lead.pipelineStage },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <PipelineCardView
      lead={lead}
      onOpen={onOpen}
      onUpdated={onUpdated}
      currentUser={currentUser}
      selectedLeadId={selectedLeadId}
      cardRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragListeners={listeners}
      dragAttributes={attributes}
      useLayout
    />
  );
}

export function PipelineCardOverlay({ lead }: { lead: LeadWithMeta }) {
  return (
    <div className="w-[min(100vw-2rem,280px)] rotate-1 scale-[1.02] shadow-2xl">
      <PipelineCardStatic lead={lead} onOpen={() => {}} />
    </div>
  );
}
