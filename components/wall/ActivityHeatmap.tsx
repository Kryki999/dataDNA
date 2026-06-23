"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatWarsawDate } from "@/lib/timezone";
import { getIntensityLevel } from "@/lib/constants";
import { SECTION_LABEL } from "@/lib/ui-patterns";

const INTENSITY_CLASSES = [
  "bg-dna-inset",
  "bg-primary/25",
  "bg-primary/45",
  "bg-primary/65",
  "bg-[#1E69FF]",
  "bg-[#3B7CFF]",
];

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

  type MonthSpan = { key: string; label: string; start: number; end: number };
  const monthSpans: MonthSpan[] = [];

  visibleWeeks.forEach((week, weekIndex) => {
    const firstDate = week.find(Boolean);
    if (!firstDate) return;

    const date = new Date(`${firstDate}T12:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = format(date, "LLL", { locale: pl });
    const last = monthSpans[monthSpans.length - 1];

    if (last?.key === key) {
      last.end = weekIndex;
      return;
    }

    monthSpans.push({ key, label, start: weekIndex, end: weekIndex });
  });

  return (
    <section className="space-y-3">
      {variant === "profile" && (
        <p className={SECTION_LABEL}>Aktywność</p>
      )}

      <div className="w-full overflow-hidden">
        <div className="flex w-full gap-1">
          <div className="flex shrink-0 flex-col justify-around pt-5 text-[10px] leading-none text-muted-foreground">
            <span className="opacity-0">n</span>
            <span>pn</span>
            <span className="opacity-0">w</span>
            <span>śr</span>
            <span className="opacity-0">c</span>
            <span>pt</span>
            <span className="opacity-0">s</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative mb-1 h-4 w-full">
              {monthSpans.map((span) => (
                <span
                  key={`${span.key}-${span.start}`}
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground"
                  style={{
                    left: `${((span.start + span.end + 1) / 2 / visibleWeeks.length) * 100}%`,
                  }}
                >
                  {span.label}
                </span>
              ))}
            </div>
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${visibleWeeks.length}, minmax(0, 1fr))`,
              }}
            >
              {visibleWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-[2px]">
                  {week.map((dateKey, dayIndex) => {
                    if (!dateKey) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="aspect-square w-full rounded-full bg-transparent"
                        />
                      );
                    }
                    const count = days[dateKey] ?? 0;
                    const level = getIntensityLevel(count);
                    return (
                      <Tooltip key={dateKey}>
                        <TooltipTrigger
                          className={cn(
                            "block aspect-square w-full rounded-full transition-transform hover:scale-125",
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
    </section>
  );
}
