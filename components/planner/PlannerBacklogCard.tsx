"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import { leadLabel } from "@/components/planner/planner-utils";
import { SURFACE_CARD_NESTED } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

const STICKY_ROTATIONS = ["-rotate-1", "rotate-1", "rotate-[0.5deg]", "-rotate-[0.5deg]"] as const;

type PlannerBacklogCardProps = {
  event: PlannerEventWithMeta;
  onSchedule?: () => void;
  onClick?: () => void;
  isMobile?: boolean;
  variant?: "default" | "sticky";
  stickyIndex?: number;
};

export function PlannerBacklogCard({
  event,
  onSchedule,
  onClick,
  isMobile,
  variant = "default",
  stickyIndex = 0,
}: PlannerBacklogCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: { type: "backlog", event },
    });

  const isSticky = variant === "sticky";
  const rotation = STICKY_ROTATIONS[stickyIndex % STICKY_ROTATIONS.length];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(0deg)`
          : undefined,
      }}
      className={cn(
        "cursor-grab touch-none active:cursor-grabbing",
        isSticky
          ? cn(
              "relative w-[192px] shrink-0 overflow-visible rounded-lg p-3 pt-3 transition-shadow",
              SURFACE_CARD_NESTED,
              "hover:brightness-105",
              rotation,
              isDragging && "z-50 opacity-60 shadow-xl",
            )
          : cn(
              SURFACE_CARD_NESTED,
              "rounded-lg p-3",
              isDragging && "opacity-40",
            ),
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      {isSticky ? (
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-2.5 rounded-b-sm bg-primary/30"
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <PlannerIconBadge icon={event.icon} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {event.title}
            </p>
            {event.description ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {event.description}
              </p>
            ) : null}
            {leadLabel(event) ? (
              <p className="mt-1.5 truncate text-[10px] font-medium text-primary/90">
                {leadLabel(event)}
              </p>
            ) : null}
          </div>
        </div>
        {isMobile && onSchedule ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="shrink-0 rounded border border-dna-signal/40 px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
          >
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}
