"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatWarsawDate } from "@/lib/timezone";
import { getIntensityLevel } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import { SECTION_LABEL } from "@/lib/ui-patterns";

const INTENSITY_CLASSES = [
  "bg-zinc-800/60",
  "bg-primary/25",
  "bg-primary/45",
  "bg-primary/65",
  "bg-[#1E69FF]",
  "bg-[#3B7CFF]",
];

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type ActivityHeatmapProps = {
  days: Record<string, number>;
  variant?: "default" | "profile";
  compact?: boolean;
};

export function ActivityHeatmap({
  days,
  variant = "profile",
  compact = false,
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

  const monthMarkers: Array<{ index: number; label: string }> = [];
  let lastMonth = -1;
  visibleWeeks.forEach((week, weekIndex) => {
    const firstDate = week.find((d) => d);
    if (firstDate) {
      const month = new Date(`${firstDate}T12:00:00`).getMonth();
      if (month !== lastMonth) {
        monthMarkers.push({ index: weekIndex, label: MONTH_LABELS[month]! });
        lastMonth = month;
      }
    }
  });

  return (
    <section className="space-y-3">
      {variant === "profile" && (
        <p className={SECTION_LABEL}>Aktywność</p>
      )}

      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-max gap-[3px]">
          <div className="flex flex-col justify-around pr-1 pt-5 text-[10px] text-muted-foreground">
            <span>M</span>
            <span className="opacity-0">T</span>
            <span>W</span>
            <span className="opacity-0">T</span>
            <span>F</span>
            <span className="opacity-0">S</span>
            <span className="opacity-0">S</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex h-4 gap-[3px]">
              {visibleWeeks.map((_, weekIndex) => {
                const marker = monthMarkers.find((m) => m.index === weekIndex);
                return (
                  <div
                    key={`month-${weekIndex}`}
                    className="flex w-[11px] items-start justify-center text-[10px] text-muted-foreground"
                  >
                    {marker?.label ?? ""}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[3px]">
              {visibleWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((dateKey, dayIndex) => {
                    if (!dateKey) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="size-2.5 rounded-full bg-transparent"
                        />
                      );
                    }
                    const count = days[dateKey] ?? 0;
                    const level = getIntensityLevel(count);
                    return (
                      <Tooltip key={dateKey}>
                        <TooltipTrigger
                          className={cn(
                            "block size-2.5 rounded-full transition-transform hover:scale-125",
                            INTENSITY_CLASSES[level],
                          )}
                        >
                          <span className="sr-only">
                            {formatWarsawDate(dateKey)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="font-medium">
                            {formatWarsawDate(dateKey)}
                          </p>
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
        </div>
      </div>
      {variant === "default" && (
        <p className="text-xs text-muted-foreground">
          Akcent: {BRAND.primary}
        </p>
      )}
    </section>
  );
}
