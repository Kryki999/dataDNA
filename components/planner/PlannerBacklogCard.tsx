"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { EntityCard } from "@/components/cards/EntityCard";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import {
  formatEventTime,
  plannerTaskColor,
  plannerTaskSubtitle,
} from "@/components/planner/planner-utils";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

const STICKY_ROTATIONS = [
  "-rotate-1",
  "rotate-1",
  "rotate-[0.5deg]",
  "-rotate-[0.5deg]",
] as const;

type PlannerBacklogCardProps = {
  event: PlannerEventWithMeta;
  onSchedule?: () => void;
  onClick?: () => void;
  isMobile?: boolean;
  variant?: "default" | "sticky";
  stickyIndex?: number;
  layoutId?: boolean;
  selected?: boolean;
  interactive?: boolean;
};

function PlannerBacklogCardVisual({
  event,
  variant = "default",
  stickyIndex = 0,
  layoutId,
  isDragging,
  selected,
  onClick,
  isMobile,
  onSchedule,
}: PlannerBacklogCardProps & { isDragging?: boolean }) {
  const isSticky = variant === "sticky";
  const completed = event.status === "completed";
  const meta = event.dueAt ? formatEventTime(new Date(event.dueAt)) : null;
  const rotation = STICKY_ROTATIONS[stickyIndex % STICKY_ROTATIONS.length];

  const card = (
    <EntityCard
      variant="task"
      layoutId={
        layoutId && !isDragging ? `planner-event-${event.id}` : undefined
      }
      title={event.title}
      cardColor={plannerTaskColor(event)}
      subtitle={plannerTaskSubtitle(event)}
      meta={meta}
      leading={<PlannerIconBadge icon={event.icon} className="size-4" />}
      selected={selected}
      completed={completed}
      onClick={onClick}
      className={cn(
        isSticky && "w-[200px] shrink-0",
        isDragging && "opacity-60 shadow-xl",
      )}
    >
      {isMobile && onSchedule ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
          className="absolute right-2 top-2 rounded border border-dna-signal/40 px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
        >
          +
        </button>
      ) : null}
    </EntityCard>
  );

  return (
    <div className={cn(isSticky && rotation, isSticky && "relative")}>
      {isSticky ? (
        <div
          className="pointer-events-none absolute inset-x-8 -top-1 z-10 h-2 rounded-b-sm bg-primary/25"
          aria-hidden
        />
      ) : null}
      {card}
    </div>
  );
}

function PlannerBacklogCardDraggable(props: PlannerBacklogCardProps) {
  const { event, onClick, layoutId, selected, variant, stickyIndex } = props;
  const isSticky = variant === "sticky";

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: { type: "backlog", event },
    });

  const wrapped = (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      className={cn(
        "cursor-grab touch-none active:cursor-grabbing",
        isSticky && "shrink-0",
      )}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <PlannerBacklogCardVisual {...props} isDragging={isDragging} />
    </div>
  );

  if (layoutId && !isDragging && !selected) {
    return (
      <motion.div layoutId={`planner-wrap-${event.id}`}>{wrapped}</motion.div>
    );
  }

  return wrapped;
}

export function PlannerBacklogCard({
  interactive = true,
  ...props
}: PlannerBacklogCardProps) {
  if (!interactive) {
    return <PlannerBacklogCardVisual {...props} />;
  }

  return <PlannerBacklogCardDraggable {...props} />;
}
