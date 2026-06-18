"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ReachDay } from "@/lib/types/reach";
import {
  buildReachChartData,
  REACH_CHANNEL_LABELS,
  REACH_TIME_RANGE_LABELS,
  type ReachChannel,
  type ReachTimeRange,
} from "@/lib/reach-chart";

const chartConfig = {
  value: {
    label: "Skumulowane",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const CHANNEL_COLORS: Record<ReachChannel, string> = {
  total: "var(--chart-4)",
  coldCalls: "var(--chart-1)",
  xImpressions: "var(--chart-2)",
  metaClicks: "var(--chart-3)",
};

type ReachAnalyticsChartProps = {
  series: ReachDay[];
  allTimeTotal: number;
};

export function ReachAnalyticsChart({
  series,
  allTimeTotal,
}: ReachAnalyticsChartProps) {
  const [range, setRange] = useState<ReachTimeRange>("7");
  const [channel, setChannel] = useState<ReachChannel>("total");

  const chartData = useMemo(
    () => buildReachChartData(series, range, channel),
    [series, range, channel],
  );

  const strokeColor = CHANNEL_COLORS[channel];

  return (
    <Card className="border-border/80 bg-card/80 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.04)]">
      <CardHeader className="gap-4 space-y-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Analityka zasięgów</CardTitle>
            <CardDescription>
              Skumulowany wykres historyczny · all-time:{" "}
              <span className="font-mono font-medium text-primary tabular-nums">
                {allTimeTotal.toLocaleString("pl-PL")}
              </span>
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ToggleGroup
            value={[range]}
            onValueChange={(values) => {
              const next = values[0] as ReachTimeRange | undefined;
              if (next) setRange(next);
            }}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {(Object.keys(REACH_TIME_RANGE_LABELS) as ReachTimeRange[]).map(
              (key) => (
                <ToggleGroupItem key={key} value={key}>
                  {REACH_TIME_RANGE_LABELS[key]}
                </ToggleGroupItem>
              ),
            )}
          </ToggleGroup>

          <ToggleGroup
            value={[channel]}
            onValueChange={(values) => {
              const next = values[0] as ReachChannel | undefined;
              if (next) setChannel(next);
            }}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {(Object.keys(REACH_CHANNEL_LABELS) as ReachChannel[]).map((key) => (
              <ToggleGroupItem key={key} value={key}>
                {REACH_CHANNEL_LABELS[key]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Brak danych — zaloguj pierwszą akcję.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(value) =>
                  typeof value === "number"
                    ? value.toLocaleString("pl-PL")
                    : String(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as
                        | { date?: string; daily?: number }
                        | undefined;
                      return point?.date ?? "";
                    }}
                    formatter={(value, _name, item) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Skumulowane</span>
                        <span className="font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString("pl-PL")}
                        </span>
                        {typeof item.payload?.daily === "number" ? (
                          <span className="text-muted-foreground">
                            +{item.payload.daily.toLocaleString("pl-PL")} dziś
                          </span>
                        ) : null}
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#reachFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
