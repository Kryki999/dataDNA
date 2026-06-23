"use client";

import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { HOUR_HEIGHT_PX } from "@/lib/planner/types";
import { PlannerDayColumn } from "@/components/planner/PlannerDayColumn";
import { GRID_HOURS } from "@/components/planner/planner-utils";
import { FLAT_CONTAINER } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

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
    <div className={cn(FLAT_CONTAINER, "overflow-hidden p-0")}>
      {/* Scroll strony, nie osobnego pudełka — naturalny flow z tablicą pod spodem */}
      <div className="flex min-h-[420px]">
        <div className="sticky top-(--header-height) z-30 w-14 shrink-0 self-start border-r border-dna-border/40 bg-dna-inset">
          <div className="h-14 border-b border-dna-border/40" />
          {GRID_HOURS.map((hour) => (
            <div
              key={hour}
              className="flex items-start justify-end pr-2 pt-1.5 text-[11px] font-medium tabular-nums text-muted-foreground"
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
    </div>
  );
}
