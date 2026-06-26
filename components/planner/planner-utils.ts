import type { CollisionDetection } from "@dnd-kit/core";
import { pointerWithin } from "@dnd-kit/core";
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  isSameDay,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import type { PlannerIcon } from "@/lib/planner/types";
import {
  DEFAULT_EVENT_DURATION_MS,
  GRID_END_HOUR,
  GRID_START_HOUR,
  HOUR_HEIGHT_PX,
  SLOT_MINUTES,
} from "@/lib/planner/types";
import { PLANNER_ICON_COLORS } from "@/lib/planner/colors";

export function getWeekDays(anchor: Date): Date[] {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDayHeader(date: Date) {
  return {
    short: format(date, "EEE", { locale: pl }).toUpperCase().slice(0, 3),
    day: format(date, "dd"),
  };
}

export function formatWeekRange(days: Date[]) {
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return format(first, "LLL yyyy", { locale: pl });
  }
  return `${format(first, "LLL", { locale: pl })} – ${format(last, "LLL yyyy", { locale: pl })}`;
}

export function formatEventTime(date: Date) {
  return format(date, "HH:mm");
}

export function slotId(day: Date, hour: number, minute: number) {
  return `slot-${format(day, "yyyy-MM-dd")}-${hour}-${minute}`;
}

export function parseSlotId(id: string): { day: Date; hour: number; minute: number } | null {
  const match = /^slot-(\d{4}-\d{2}-\d{2})-(\d+)-(\d+)$/.exec(id);
  if (!match) return null;
  const [, dateStr, hourStr, minuteStr] = match;
  const [y, m, d] = dateStr!.split("-").map(Number);
  return {
    day: new Date(y!, m! - 1, d),
    hour: Number(hourStr),
    minute: Number(minuteStr),
  };
}

export function slotToDate(day: Date, hour: number, minute: number) {
  return setMinutes(setHours(new Date(day), hour), minute);
}

export function getEventEnd(event: PlannerEventWithMeta) {
  if (event.endsAt) return new Date(event.endsAt);
  if (event.dueAt) return new Date(new Date(event.dueAt).getTime() + DEFAULT_EVENT_DURATION_MS);
  return null;
}

export function getEventTopPx(dueAt: Date) {
  const hours = dueAt.getHours() + dueAt.getMinutes() / 60;
  return (hours - GRID_START_HOUR) * HOUR_HEIGHT_PX;
}

export function getEventHeightPx(dueAt: Date, endsAt: Date) {
  const minutes = Math.max(
    SLOT_MINUTES,
    differenceInMinutes(endsAt, dueAt),
  );
  return (minutes / 60) * HOUR_HEIGHT_PX;
}

export function snapMinutes(minutes: number) {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

export function eventsForDay(
  events: PlannerEventWithMeta[],
  day: Date,
  hideCompleted: boolean,
) {
  return events.filter((event) => {
    if (!event.dueAt) return false;
    if (hideCompleted && event.status === "completed") return false;
    return isSameDay(new Date(event.dueAt), day);
  });
}

export function generateDaySlots(day: Date) {
  const slots: { id: string; date: Date; hour: number; minute: number }[] = [];
  for (let hour = GRID_START_HOUR; hour < GRID_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      slots.push({
        id: slotId(day, hour, minute),
        date: slotToDate(day, hour, minute),
        hour,
        minute,
      });
    }
  }
  return slots;
}

export function clientLabel(event: PlannerEventWithMeta) {
  return event.clientCompany ?? event.clientName ?? null;
}

export function plannerTaskColor(event: PlannerEventWithMeta) {
  if (event.clientCardColor) return event.clientCardColor;
  return PLANNER_ICON_COLORS[event.icon] ?? "slate";
}

export function plannerTaskSubtitle(event: PlannerEventWithMeta) {
  return clientLabel(event);
}

/** @deprecated Use clientLabel */
export function leadLabel(event: PlannerEventWithMeta) {
  return clientLabel(event);
}

export function addDefaultDuration(start: Date) {
  return addMinutes(start, SLOT_MINUTES * 2);
}

export const BACKLOG_DROP_ID = "planner-backlog-drop";
export const GRID_HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => GRID_START_HOUR + i,
);

/** Drop tylko gdy kursor jest nad strefą — bez „przyciągania” do odległych slotów kalendarza. */
export const plannerCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length === 0) {
    return [];
  }

  const backlog = pointerCollisions.find(
    (collision) => collision.id === BACKLOG_DROP_ID,
  );
  if (backlog) {
    return [backlog];
  }

  const slots = pointerCollisions.filter((collision) =>
    String(collision.id).startsWith("slot-"),
  );
  if (slots.length > 0) {
    return slots;
  }

  return pointerCollisions;
};
