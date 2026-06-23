"use client";

import { isToday } from "date-fns";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { HOUR_HEIGHT_PX, SLOT_MINUTES } from "@/lib/planner/types";
import { PlannerEventBlock } from "@/components/planner/PlannerEventBlock";
import { PlannerTimeSlot } from "@/components/planner/PlannerTimeSlot";
import {
  eventsForDay,
  formatDayHeader,
  generateDaySlots,
  GRID_HOURS,
} from "@/components/planner/planner-utils";
import { cn } from "@/lib/utils";

type PlannerDayColumnProps = {
  day: Date;
  events: PlannerEventWithMeta[];
  hideCompleted: boolean;
  selectedId: string | null;
  draggingId: string | null;
  onSelect: (id: string) => void;
  onResize: (id: string, endsAt: Date) => void;
};

export function PlannerDayColumn({
  day,
  events,
  hideCompleted,
  selectedId,
  draggingId,
  onSelect,
  onResize,
}: PlannerDayColumnProps) {
  const header = formatDayHeader(day);
  const today = isToday(day);
  const dayEvents = eventsForDay(events, day, hideCompleted);
  const slots = generateDaySlots(day);

  return (
    <div
      className={cn(
        "relative min-w-0 flex-1 border-r border-zinc-800/40 last:border-r-0",
        today && "bg-sky-500/5",
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 px-2 py-2 text-center backdrop-blur-sm",
          today && "border-sky-500/20",
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {header.short}
        </p>
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            today ? "text-sky-400" : "text-zinc-200",
          )}
        >
          {header.day}
        </p>
      </div>

      <div
        className="relative"
        style={{ height: GRID_HOURS.length * HOUR_HEIGHT_PX }}
      >
        {GRID_HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-b border-zinc-800/20"
            style={{
              top: (hour - GRID_HOURS[0]!) * HOUR_HEIGHT_PX,
              height: HOUR_HEIGHT_PX,
            }}
          />
        ))}

        {slots.map((slot) => (
          <PlannerTimeSlot
            key={slot.id}
            id={slot.id}
            className="h-[32px]"
            style={{
              top:
                (slot.hour - GRID_HOURS[0]!) * HOUR_HEIGHT_PX +
                (slot.minute / 60) * HOUR_HEIGHT_PX,
              height: (SLOT_MINUTES / 60) * HOUR_HEIGHT_PX,
            }}
          />
        ))}

        {dayEvents.map((event) => (
          <PlannerEventBlock
            key={event.id}
            event={event}
            layoutId
            isSelected={selectedId === event.id}
            isDragging={draggingId === event.id}
            onClick={() => onSelect(event.id)}
            onResize={(endsAt) => onResize(event.id, endsAt)}
          />
        ))}
      </div>
    </div>
  );
}
