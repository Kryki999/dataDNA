"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { HOUR_HEIGHT_PX } from "@/lib/planner/types";
import { PlannerBacklogCard } from "@/components/planner/PlannerBacklogCard";
import { PlannerEventBlock } from "@/components/planner/PlannerEventBlock";
import {
  eventsForDay,
  GRID_HOURS,
} from "@/components/planner/planner-utils";
import { useSwipeDays } from "@/components/planner/hooks/useSwipeDays";
import { cn } from "@/lib/utils";

type PlannerDayAgendaProps = {
  day: Date;
  events: PlannerEventWithMeta[];
  backlog: PlannerEventWithMeta[];
  hideCompleted: boolean;
  selectedId: string | null;
  draggingId: string | null;
  onSelect: (id: string) => void;
  onResize: (id: string, endsAt: Date) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onScheduleBacklog: (eventId: string) => void;
};

export function PlannerDayAgenda({
  day,
  events,
  backlog,
  hideCompleted,
  selectedId,
  draggingId,
  onSelect,
  onResize,
  onPrevDay,
  onNextDay,
  onScheduleBacklog,
}: PlannerDayAgendaProps) {
  const swipe = useSwipeDays({ onPrev: onPrevDay, onNext: onNextDay });
  const dayEvents = eventsForDay(events, day, hideCompleted);

  return (
    <div className="space-y-4" {...swipe}>
      <div className="text-center">
        <p className="text-sm font-medium capitalize text-zinc-200">
          {format(day, "EEEE, d MMMM", { locale: pl })}
        </p>
        <p className="text-xs text-zinc-500">Przesuń w lewo/prawo, aby zmienić dzień</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/50">
        <div className="relative" style={{ height: GRID_HOURS.length * HOUR_HEIGHT_PX }}>
          <div className="absolute left-0 top-0 w-10">
            {GRID_HOURS.map((hour) => (
              <div
                key={hour}
                className="pr-1 text-right text-[10px] tabular-nums text-zinc-600"
                style={{ height: HOUR_HEIGHT_PX, lineHeight: `${HOUR_HEIGHT_PX}px` }}
              >
                {String(hour).padStart(2, "0")}
              </div>
            ))}
          </div>
          <div className="relative ml-10 border-l border-zinc-800/40">
            {GRID_HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-zinc-800/20"
                style={{ height: HOUR_HEIGHT_PX }}
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
      </div>

      {backlog.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Backlog</p>
          {backlog.map((event) => (
            <PlannerBacklogCard
              key={event.id}
              event={event}
              isMobile
              onSchedule={() => onScheduleBacklog(event.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
