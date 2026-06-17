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
  "bg-zinc-800/80",
  "bg-emerald-900/80",
  "bg-emerald-700/90",
  "bg-emerald-500",
  "bg-emerald-400",
  "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
];

type ActivityHeatmapProps = {
  days: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
};

export function ActivityHeatmap({
  days,
  currentStreak,
  longestStreak,
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">The Wall</h2>
          <p className="text-sm text-muted-foreground">
            Ciągłość outreachu — nie przerwij streaka.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {currentStreak}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Streak
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums">{longestStreak}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Rekord
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((dateKey, dayIndex) => {
                if (!dateKey) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="h-3 w-3 rounded-sm bg-transparent"
                    />
                  );
                }
                const count = days[dateKey] ?? 0;
                const level = getIntensityLevel(count);
                return (
                  <Tooltip key={dateKey}>
                    <TooltipTrigger
                      className={cn(
                        "block h-3 w-3 rounded-sm transition-transform hover:scale-125",
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
