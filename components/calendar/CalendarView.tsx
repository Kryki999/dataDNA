"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { FLAT_CONTAINER, SECTION_LABEL } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";
import type { calendarEvents } from "@/lib/db/schema";

type CalendarEvent = typeof calendarEvents.$inferSelect;

type CalendarViewProps = {
  events: CalendarEvent[];
  upcoming: CalendarEvent[];
};

export function CalendarView({ events, upcoming }: CalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });
  }, [month]);

  const eventsForDay = (day: Date) =>
    events.filter(
      (e) =>
        e.status === "pending" && isSameDay(new Date(e.dueAt), day),
    );

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <DashboardPage>
      <div className="flex items-center justify-between">
        <p className={SECTION_LABEL}>Kalendarz</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">
            {format(month, "LLLL yyyy", { locale: pl })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-7 gap-1 p-3 ${FLAT_CONTAINER}`}>
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: (days[0]?.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const count = eventsForDay(day).length;
          const selected = selectedDay && isSameDay(day, selectedDay);
          const today = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                "flex min-h-10 flex-col items-center justify-center rounded-md border border-transparent text-sm transition-colors",
                !isSameMonth(day, month) && "text-muted-foreground/50",
                selected && "border-primary bg-primary/20",
                today && !selected && "border-zinc-700",
                count > 0 && !selected && "bg-zinc-900",
              )}
            >
              {format(day, "d")}
              {count > 0 ? (
                <span className="size-1 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedDay ? (
        <section className="space-y-2">
          <p className={SECTION_LABEL}>
            {format(selectedDay, "d MMMM yyyy", { locale: pl })}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak wydarzeń.</p>
          ) : (
            <ul className={`divide-y divide-zinc-800 ${FLAT_CONTAINER}`}>
              {selectedEvents.map((event) => (
                <li key={event.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.dueAt), "HH:mm")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="space-y-2">
        <p className={SECTION_LABEL}>Nadchodzące</p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ustaw follow-up w karcie klienta w CRM.
          </p>
        ) : (
          <ul className={`divide-y divide-zinc-800 ${FLAT_CONTAINER}`}>
            {upcoming.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span>{event.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.dueAt), "d MMM, HH:mm", {
                    locale: pl,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardPage>
  );
}
