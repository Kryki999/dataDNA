"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReachSummary = {
  today: { coldCalls: number; xImpressions: number; metaClicks: number };
  week: { coldCalls: number; xImpressions: number; metaClicks: number };
};

type ReachCountersProps = {
  summary: ReachSummary;
};

export function ReachCounters({ summary }: ReachCountersProps) {
  const items = [
    {
      label: "Telefony dziś",
      today: summary.today.coldCalls,
      week: summary.week.coldCalls,
    },
    {
      label: "X dziś",
      today: summary.today.xImpressions,
      week: summary.week.xImpressions,
    },
    {
      label: "Meta dziś",
      today: summary.today.metaClicks,
      week: summary.week.metaClicks,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{item.today}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tydzień: {item.week}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
