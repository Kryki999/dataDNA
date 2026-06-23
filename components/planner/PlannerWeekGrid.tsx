"use client";

import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { HOUR_HEIGHT_PX } from "@/lib/planner/types";
import { PlannerDayColumn } from "@/components/planner/PlannerDayColumn";
import { GRID_HOURS } from "@/components/planner/planner-utils";

type PlannerWeekGridProps = {
  weekDays: Date[];
  events: PlannerEventWithMeta[];
  hideCompleted: boolean;
  selectedId: string | null;
  draggingId: string | null;
  onSelect: (id: string) => void;
  onResize: (id: string, endsAt: Date) => void;
};

export function PlannerWeekGrid({
  weekDays,
  events,
  hideCompleted,
  selectedId,
  draggingId,
  onSelect,
  onResize,
}: PlannerWeekGridProps) {
  return (
    <div className="flex min-h-0 flex-1 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/50">
      <div className="sticky left-0 z-30 w-12 shrink-0 border-r border-zinc-800/40 bg-zinc-950/95">
        <div className="h-[52px] border-b border-zinc-800" />
        {GRID_HOURS.map((hour) => (
          <div
            key={hour}
            className="flex items-start justify-end pr-2 pt-1 text-[10px] tabular-nums text-zinc-600"
            style={{ height: HOUR_HEIGHT_PX }}
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1">
        {weekDays.map((day) => (
          <PlannerDayColumn
            key={day.toISOString()}
            day={day}
            events={events}
            hideCompleted={hideCompleted}
            selectedId={selectedId}
            draggingId={draggingId}
            onSelect={onSelect}
            onResize={onResize}
          />
        ))}
      </div>
    </div>
  );
}
