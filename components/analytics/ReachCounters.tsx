"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReachSummary } from "@/lib/types/reach";

type ReachCountersProps = {
  summary: ReachSummary;
};

export function ReachCounters({ summary }: ReachCountersProps) {
  const items = [
    {
      label: "Telefony dziś",
      today: summary.today.coldCalls,
      period: summary.week.coldCalls,
      periodLabel: "Tydzień",
      accent: "text-primary",
    },
    {
      label: "X dziś",
      today: summary.today.xImpressions,
      period: summary.week.xImpressions,
      periodLabel: "Tydzień",
      accent: "text-[oklch(0.72_0.16_220)]",
    },
    {
      label: "Meta dziś",
      today: summary.today.metaClicks,
      period: summary.week.metaClicks,
      periodLabel: "Tydzień",
      accent: "text-[oklch(0.68_0.18_290)]",
    },
    {
      label: "All-time łącznie",
      today: summary.allTime.total,
      period: summary.allTime.coldCalls,
      periodLabel: "Calls all-time",
      accent: "text-primary",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="border-border/80 bg-card/60 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.04)]"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-semibold tabular-nums ${item.accent}`}>
              {item.today.toLocaleString("pl-PL")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.periodLabel}: {item.period.toLocaleString("pl-PL")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
