"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type Event,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { SECTION_LABEL } from "@/lib/ui-patterns";
import {
  createManualEvent,
  rescheduleCalendarEvent,
} from "@/lib/actions/calendar";
import type { calendarEvents } from "@/lib/db/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar.css";

type DbEvent = typeof calendarEvents.$inferSelect;

type CalendarEventItem = Event & {
  id: string;
  resource: DbEvent;
};

const DnDCalendar = withDragAndDrop<CalendarEventItem>(Calendar);

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { pl },
});

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

function toCalendarEvent(event: DbEvent): CalendarEventItem {
  const start = new Date(event.dueAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + DEFAULT_DURATION_MS);

  return {
    id: event.id,
    title: event.title,
    start,
    end,
    resource: event,
  };
}

type CalendarViewProps = {
  events: DbEvent[];
};

export function CalendarView({ events: initialEvents }: CalendarViewProps) {
  const [events, setEvents] = useState(initialEvents);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("day");
  const [, startTransition] = useTransition();

  const calendarEvents = useMemo(
    () =>
      events
        .filter((event) => event.status === "pending")
        .map(toCalendarEvent),
    [events],
  );

  const handleNavigate = useCallback((nextDate: Date) => {
    setDate(nextDate);
  }, []);

  const handleViewChange = useCallback((nextView: View) => {
    setView(nextView);
  }, []);

  const persistReschedule = useCallback(
    (eventId: string, start: Date, end: Date) => {
      startTransition(async () => {
        try {
          await rescheduleCalendarEvent(eventId, start, end);
          toast.success("Termin zaktualizowany");
        } catch {
          toast.error("Nie udało się zaktualizować terminu");
          setEvents(initialEvents);
        }
      });
    },
    [initialEvents, startTransition],
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEventItem>) => {
      const nextStart = start instanceof Date ? start : new Date(start);
      const nextEnd = end instanceof Date ? end : new Date(end);

      setEvents((current) =>
        current.map((item) =>
          item.id === event.id
            ? { ...item, dueAt: nextStart, endsAt: nextEnd }
            : item,
        ),
      );

      persistReschedule(String(event.id), nextStart, nextEnd);
    },
    [persistReschedule],
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEventItem>) => {
      const nextStart = start instanceof Date ? start : new Date(start);
      const nextEnd = end instanceof Date ? end : new Date(end);

      setEvents((current) =>
        current.map((item) =>
          item.id === event.id
            ? { ...item, dueAt: nextStart, endsAt: nextEnd }
            : item,
        ),
      );

      persistReschedule(String(event.id), nextStart, nextEnd);
    },
    [persistReschedule],
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: SlotInfo) => {
      const slotStart = start instanceof Date ? start : new Date(start);
      const slotEnd =
        end instanceof Date
          ? end
          : new Date(slotStart.getTime() + DEFAULT_DURATION_MS);

      const title = window.prompt("Tytuł wydarzenia:");
      if (!title?.trim()) return;

      startTransition(async () => {
        try {
          const created = await createManualEvent({
            title: title.trim(),
            dueAt: slotStart,
            endsAt: slotEnd,
          });
          setEvents((current) => [...current, created]);
          toast.success("Wydarzenie dodane");
        } catch {
          toast.error("Nie udało się dodać wydarzenia");
        }
      });
    },
    [startTransition],
  );

  return (
    <DashboardPage wide>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className={SECTION_LABEL}>Kalendarz</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              handleNavigate(
                new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
              )
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium capitalize">
            {format(date, view === "day" ? "d MMMM yyyy" : "LLLL yyyy", {
              locale: pl,
            })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              handleNavigate(
                new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
              )
            }
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(new Date())}>
            Dziś
          </Button>
        </div>
      </div>

      <div className="calendar-dark h-[calc(100vh-12rem)] min-h-[560px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50 p-2">
        <DnDCalendar
          localizer={localizer}
          events={calendarEvents}
          date={date}
          view={view}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          views={["day", "week"]}
          defaultView="day"
          step={30}
          timeslots={2}
          selectable
          resizable
          draggableAccessor={() => true}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectSlot={handleSelectSlot}
          scrollToTime={new Date(1970, 0, 1, 8, 0, 0)}
          min={new Date(1970, 0, 1, 7, 0, 0)}
          max={new Date(1970, 0, 1, 21, 0, 0)}
          culture="pl"
          messages={{
            today: "Dziś",
            previous: "Wstecz",
            next: "Dalej",
            month: "Miesiąc",
            week: "Tydzień",
            day: "Dzień",
            agenda: "Agenda",
            date: "Data",
            time: "Czas",
            event: "Wydarzenie",
            noEventsInRange: "Brak wydarzeń w tym okresie.",
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Przeciągnij wydarzenie na slot czasowy lub rozciągnij jego krawędzie.
        Kliknij pusty slot, aby dodać nowe wydarzenie.
      </p>
    </DashboardPage>
  );
}
