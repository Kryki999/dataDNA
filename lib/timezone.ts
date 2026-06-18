import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  addDays,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";

export const WARSAW_TZ = "Europe/Warsaw";

export function toWarsawDateKey(date: Date): string {
  return formatInTimeZone(date, WARSAW_TZ, "yyyy-MM-dd");
}

export function warsawStartOfDay(dateKey: string): Date {
  return fromZonedTime(`${dateKey}T00:00:00`, WARSAW_TZ);
}

export function warsawEndOfDay(dateKey: string): Date {
  return fromZonedTime(`${dateKey}T23:59:59.999`, WARSAW_TZ);
}

export function formatWarsawDate(dateKey: string): string {
  return formatInTimeZone(parseISO(dateKey), WARSAW_TZ, "dd.MM.yyyy");
}

export function getTodayDateKey(): string {
  return toWarsawDateKey(new Date());
}

export function getWeekDateKeys(reference = new Date()): string[] {
  const todayKey = toWarsawDateKey(reference);
  const weekStart = startOfWeek(parseISO(todayKey), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) =>
    toWarsawDateKey(addDays(weekStart, index)),
  );
}

export function getHeatmapDateKeys(weeks = 52): string[] {
  const todayKey = getTodayDateKey();
  const today = parseISO(todayKey);
  const endWeekStart = startOfWeek(today, { weekStartsOn: 0 });
  const start = subWeeks(endWeekStart, weeks - 1);
  const keys: string[] = [];
  let cursor = start;

  while (cursor <= today) {
    keys.push(toWarsawDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return keys;
}

export function getDateKeysBetween(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = parseISO(startKey);
  const end = parseISO(endKey);

  while (cursor <= end) {
    keys.push(toWarsawDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return keys;
}

export function getPreviousDateKey(dateKey: string): string {
  return toWarsawDateKey(subDays(parseISO(dateKey), 1));
}

export function getDateKeyDaysAgo(daysAgo: number, reference = new Date()): string {
  return toWarsawDateKey(subDays(reference, daysAgo));
}
