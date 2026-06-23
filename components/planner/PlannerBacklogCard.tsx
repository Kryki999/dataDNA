"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import { leadLabel } from "@/components/planner/planner-utils";
import { cn } from "@/lib/utils";

type PlannerBacklogCardProps = {
  event: PlannerEventWithMeta;
  onSchedule?: () => void;
  onClick?: () => void;
  isMobile?: boolean;
};

export function PlannerBacklogCard({
  event,
  onSchedule,
  onClick,
  isMobile,
}: PlannerBacklogCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: { type: "backlog", event },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      className={cn(
        "rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-sm",
        isDragging && "opacity-40",
        onClick && "cursor-pointer hover:border-zinc-700",
      )}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <PlannerIconBadge icon={event.icon} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {event.title}
            </p>
            {event.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                {event.description}
              </p>
            ) : null}
            {leadLabel(event) ? (
              <p className="mt-1 truncate text-[10px] text-sky-400/80">
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
            className="shrink-0 rounded border border-sky-500/40 px-2 py-0.5 text-xs text-sky-400 hover:bg-sky-500/10"
          >
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}
