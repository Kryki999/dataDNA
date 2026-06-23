"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import {
  formatEventTime,
  getEventEnd,
  getEventHeightPx,
  getEventTopPx,
  leadLabel,
} from "@/components/planner/planner-utils";
import { useEventResize } from "@/components/planner/hooks/useEventResize";
import { SURFACE_CARD_NESTED } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PlannerEventBlockProps = {
  event: PlannerEventWithMeta;
  onClick: () => void;
  onResize: (endsAt: Date) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  layoutId?: boolean;
  compact?: boolean;
};

export function PlannerEventBlock({
  event,
  onClick,
  onResize,
  isDragging,
  isSelected,
  layoutId: useLayout,
  compact,
}: PlannerEventBlockProps) {
  const dueAt = event.dueAt ? new Date(event.dueAt) : null;
  const endsAt = dueAt ? getEventEnd(event)! : null;
  const completed = event.status === "completed";

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { type: "scheduled", event },
    disabled: completed,
  });

  const resize = useEventResize({
    dueAt: dueAt ?? new Date(),
    endsAt: endsAt ?? new Date(),
    onResize,
  });

  const heightPx =
    dueAt && endsAt && !compact
      ? Math.max(getEventHeightPx(dueAt, endsAt), 52)
      : 52;
  const isShort = heightPx < 72;

  const blockStyle: React.CSSProperties | undefined =
    dueAt && endsAt && !compact
      ? {
          top: getEventTopPx(dueAt),
          height: heightPx,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }
      : undefined;

  if (isSelected) {
    return (
      <div
        className="absolute inset-x-1.5 invisible"
        style={blockStyle}
        aria-hidden
      />
    );
  }

  const content = (
    <>
      <div className="flex items-center gap-2">
        <PlannerIconBadge icon={event.icon} />
        {dueAt ? (
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {formatEventTime(dueAt)}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground",
          isShort && "mt-0.5 line-clamp-1",
          completed && "line-through text-muted-foreground",
        )}
      >
        {event.title}
      </p>
      {!isShort && event.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {event.description}
        </p>
      ) : null}
      {!isShort && leadLabel(event) ? (
        <p className="mt-1 truncate text-[10px] font-medium text-primary/90">
          {leadLabel(event)}
        </p>
      ) : null}
      {!completed && dueAt && endsAt && !compact && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 h-2 cursor-ns-resize bg-transparent hover:bg-primary/25"
          onPointerDown={resize.onPointerDown}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {!completed && !compact ? (
        <GripVertical className="absolute bottom-1.5 right-1.5 size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
      ) : null}
    </>
  );

  const cardClass = cn(
    SURFACE_CARD_NESTED,
    "group absolute inset-x-1.5 z-10 overflow-hidden p-2.5",
    "cursor-grab active:cursor-grabbing",
    completed && "opacity-55",
    isDragging && "opacity-40",
    compact && "relative inset-auto h-auto",
  );

  function handleCardClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (resize.shouldBlockClick()) return;
    onClick();
  }

  if (useLayout && !isDragging && !compact) {
    return (
      <motion.div
        layoutId={`planner-event-${event.id}`}
        ref={setNodeRef}
        style={blockStyle}
        className={cardClass}
        onClick={handleCardClick}
        {...listeners}
        {...attributes}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={blockStyle}
      className={cardClass}
      onClick={handleCardClick}
      {...listeners}
      {...attributes}
    >
      {content}
    </div>
  );
}
