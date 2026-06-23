import {
  getPreviousDateKey,
  getTodayDateKey,
} from "@/lib/timezone";

export const OUTREACH_ACTIVITY_TYPES = [
  "cold_call",
  "x_impression",
  "meta_click",
] as const;

export type OutreachActivityType = (typeof OUTREACH_ACTIVITY_TYPES)[number];

export const PREDEFINED_LEAD_TAGS = [
  "Detailing",
  "Next.js",
  "React",
  "E-commerce",
  "Wysłane Demo",
  "Umówiony Call",
  "Decydent",
  "Brak Budżetu",
  "Follow-up",
  "Odrzucił",
] as const;

export const TEMPERATURE_ORDER = { hot: 0, warm: 1, cold: 2 } as const;

export function getIntensityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  if (count <= 9) return 4;
  return 5;
}

export function computeStreaks(activeDateKeys: Set<string>) {
  const sorted = [...activeDateKeys].sort();
  if (sorted.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const key of sorted) {
    if (!previous) {
      run = 1;
    } else {
      const prevDate = new Date(`${previous}T12:00:00Z`);
      const currDate = new Date(`${key}T12:00:00Z`);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / 86_400_000,
      );
      run = diffDays === 1 ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    previous = key;
  }

  const today = getTodayDateKey();
  const yesterday = getPreviousDateKey(today);
  let cursor: string | null = null;

  if (activeDateKeys.has(today)) {
    cursor = today;
  } else if (activeDateKeys.has(yesterday)) {
    cursor = yesterday;
  }

  let current = 0;
  while (cursor && activeDateKeys.has(cursor)) {
    current += 1;
    cursor = getPreviousDateKey(cursor);
  }

  return { current, longest };
}
