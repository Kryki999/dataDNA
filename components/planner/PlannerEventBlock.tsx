"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { EntityCard } from "@/components/cards/EntityCard";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import {
  formatEventTime,
  getEventEnd,
  getEventHeightPx,
  getEventTopPx,
  plannerTaskColor,
  plannerTaskSubtitle,
} from "@/components/planner/planner-utils";
import { useEventResize } from "@/components/planner/hooks/useEventResize";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

type PlannerEventBlockProps = {
  event: PlannerEventWithMeta;
  onClick: () => void;
  onResize: (endsAt: Date) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  layoutId?: boolean;
  compact?: boolean;
  interactive?: boolean;
};

function PlannerEventBlockVisual({
  event,
  dueAt,
  endsAt,
  completed,
  isSelected,
  layoutId,
  compact,
  className,
}: {
  event: PlannerEventWithMeta;
  dueAt: Date | null;
  endsAt: Date | null;
  completed: boolean;
  isSelected?: boolean;
  layoutId?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <EntityCard
      variant="task"
      layoutId={
        layoutId && !isSelected ? `planner-event-${event.id}` : undefined
      }
      title={event.title}
      cardColor={plannerTaskColor(event)}
      subtitle={plannerTaskSubtitle(event)}
      meta={dueAt ? formatEventTime(dueAt) : null}
      leading={<PlannerIconBadge icon={event.icon} className="size-4" />}
      selected={isSelected}
      completed={completed}
      className={className}
    />
  );
}

function PlannerEventBlockDraggable({
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
      ? Math.max(getEventHeightPx(dueAt, endsAt), 64)
      : 64;

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

  function handleCardClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (resize.shouldBlockClick()) return;
    onClick();
  }

  const inner = (
    <>
      <PlannerEventBlockVisual
        event={event}
        dueAt={dueAt}
        endsAt={endsAt}
        completed={completed}
        isSelected={isSelected}
        layoutId={useLayout && !isDragging}
        compact={compact}
        className={cn(
          "h-full",
          isDragging && "opacity-40",
          compact && "relative h-auto",
        )}
      />
      {!completed && dueAt && endsAt && !compact && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 h-2 cursor-ns-resize bg-transparent hover:bg-primary/25"
          onPointerDown={resize.onPointerDown}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {!completed && !compact ? (
        <GripVertical className="pointer-events-none absolute bottom-2 right-2 size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
      ) : null}
    </>
  );

  return (
    <div
      ref={setNodeRef}
      style={blockStyle}
      className={cn(
        "group absolute inset-x-1.5 z-10 cursor-grab active:cursor-grabbing",
        compact && "relative inset-auto",
      )}
      onClick={handleCardClick}
      {...listeners}
      {...attributes}
    >
      {useLayout && !isDragging && !compact && !isSelected ? (
        <motion.div layoutId={`planner-wrap-${event.id}`} className="h-full">
          {inner}
        </motion.div>
      ) : (
        inner
      )}
    </div>
  );
}

export function PlannerEventBlock({
  interactive = true,
  onClick,
  ...props
}: PlannerEventBlockProps) {
  const dueAt = props.event.dueAt ? new Date(props.event.dueAt) : null;
  const endsAt = dueAt ? getEventEnd(props.event)! : null;
  const completed = props.event.status === "completed";

  const heightPx =
    dueAt && endsAt && !props.compact
      ? Math.max(getEventHeightPx(dueAt, endsAt), 64)
      : 64;

  const blockStyle: React.CSSProperties | undefined =
    dueAt && endsAt && !props.compact
      ? {
          top: getEventTopPx(dueAt),
          height: heightPx,
        }
      : undefined;

  if (!interactive) {
    return (
      <div
        style={blockStyle}
        className={cn(
          "absolute inset-x-1.5 z-10",
          props.compact && "relative inset-auto",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <PlannerEventBlockVisual
          event={props.event}
          dueAt={dueAt}
          endsAt={endsAt}
          completed={completed}
          isSelected={props.isSelected}
          layoutId={props.layoutId}
          compact={props.compact}
          className={cn("h-full", props.compact && "relative h-auto")}
        />
      </div>
    );
  }

  return <PlannerEventBlockDraggable onClick={onClick} {...props} />;
}
