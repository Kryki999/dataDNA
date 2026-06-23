"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
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

  const blockStyle: React.CSSProperties | undefined =
    dueAt && endsAt && !compact
      ? {
          top: getEventTopPx(dueAt),
          height: getEventHeightPx(dueAt, endsAt),
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.03)",
        }
      : undefined;

  if (isSelected) {
    return (
      <div
        className="absolute inset-x-1 invisible"
        style={blockStyle}
        aria-hidden
      />
    );
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-1">
        <PlannerIconBadge icon={event.icon} />
        {dueAt && (
          <span className="text-[10px] tabular-nums text-zinc-400">
            {formatEventTime(dueAt)}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-1 truncate text-xs font-semibold text-zinc-100",
          completed && "line-through text-zinc-500",
        )}
      >
        {event.title}
      </p>
      {event.description ? (
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-500">
          {event.description}
        </p>
      ) : null}
      {leadLabel(event) ? (
        <p className="mt-1 truncate text-[10px] text-sky-400/80">
          {leadLabel(event)}
        </p>
      ) : null}
      {!completed && dueAt && endsAt && !compact && (
        <div
          className="absolute inset-x-0 bottom-0 h-1 cursor-ns-resize bg-transparent hover:bg-sky-500/30"
          onPointerDown={resize.onPointerDown}
        />
      )}
    </>
  );

  if (useLayout && !isDragging && !compact) {
    return (
      <motion.div
        layoutId={`planner-event-${event.id}`}
        ref={setNodeRef}
        style={blockStyle}
        className={cn(
          "group absolute inset-x-1 z-10 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/80 p-2 shadow-sm",
          "cursor-grab active:cursor-grabbing",
          completed && "opacity-50",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
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
      className={cn(
        "group absolute inset-x-1 z-10 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/80 p-2 shadow-sm",
        "cursor-grab active:cursor-grabbing",
        completed && "opacity-50",
        isDragging && "opacity-40",
        compact && "relative inset-auto h-auto",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      {...listeners}
      {...attributes}
    >
      {content}
    </div>
  );
}
