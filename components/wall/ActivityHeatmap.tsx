"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatWarsawDate } from "@/lib/timezone";
import { getIntensityLevel } from "@/lib/constants";

const INTENSITY_CLASSES = [
  "bg-muted",
  "bg-primary/15",
  "bg-primary/30",
  "bg-primary/50",
  "bg-primary/70",
  "bg-primary",
];

type ActivityHeatmapProps = {
  days: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
  embedded?: boolean;
};

export function ActivityHeatmap({
  days,
  currentStreak,
  longestStreak,
  compact = false,
  embedded = false,
}: ActivityHeatmapProps) {
  const keys = Object.keys(days).sort();
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  for (const key of keys) {
    const dayOfWeek = new Date(`${key}T12:00:00`).getDay();
    if (currentWeek.length === 0 && dayOfWeek !== 0) {
      for (let i = 0; i < dayOfWeek; i += 1) {
        currentWeek.push("");
      }
    }
    currentWeek.push(key);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const visibleWeeks = compact ? weeks.slice(-20) : weeks;

  return (
    <section className="space-y-4">
      {!embedded ? (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">The Wall</h2>
            <p className="text-sm text-muted-foreground">Nie przerwij streaka.</p>
          </div>
          <div className="flex shrink-0 gap-6">
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                {currentStreak}
              </p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                {longestStreak}
              </p>
              <p className="text-xs text-muted-foreground">Rekord</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-6">
          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Rekord</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-muted/30 p-4 [-webkit-overflow-scrolling:touch]">
        <p className="mb-2 text-xs text-muted-foreground md:hidden">
          Przesuń w bok →
        </p>
        <div className="flex min-w-max gap-1">
          {visibleWeeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((dateKey, dayIndex) => {
                if (!dateKey) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="size-3 rounded-sm bg-transparent"
                    />
                  );
                }
                const count = days[dateKey] ?? 0;
                const level = getIntensityLevel(count);
                return (
                  <Tooltip key={dateKey}>
                    <TooltipTrigger
                      className={cn(
                        "block size-3 rounded-sm transition-transform active:scale-125",
                        INTENSITY_CLASSES[level],
                      )}
                    >
                      <span className="sr-only">{formatWarsawDate(dateKey)}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-medium">{formatWarsawDate(dateKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? "akcja" : "akcji"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
