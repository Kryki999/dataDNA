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
import { EYEBROW } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PlannerDayColumnProps = {
  day: Date;
  events: PlannerEventWithMeta[];
  hideCompleted: boolean;
  selectedId: string | null;
  draggingId: string | null;
  onSelect: (id: string) => void;
  onResize: (id: string, endsAt: Date) => void;
  interactive?: boolean;
};

export function PlannerDayColumn({
  day,
  events,
  hideCompleted,
  selectedId,
  draggingId,
  onSelect,
  onResize,
  interactive = true,
}: PlannerDayColumnProps) {
  const header = formatDayHeader(day);
  const today = isToday(day);
  const dayEvents = eventsForDay(events, day, hideCompleted);
  const slots = generateDaySlots(day);

  return (
    <div
      className={cn(
        "relative min-w-[152px] flex-1 border-r border-dna-border/30 last:border-r-0",
        today ? "bg-primary/[0.07]" : "bg-dna-inset/20",
      )}
    >
      <div
        className={cn(
          "sticky top-(--header-height) z-20 flex h-14 flex-col items-center justify-center border-b border-dna-border/40 px-2",
          today ? "bg-primary/10" : "bg-dna-surface/80 backdrop-blur-sm",
        )}
      >
        <p className={cn(EYEBROW, "text-[10px]")}>{header.short}</p>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums leading-none",
            today ? "text-primary" : "text-foreground",
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
            className="absolute inset-x-0 border-b border-dna-border/15"
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
            interactive={interactive}
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
            interactive={interactive}
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
