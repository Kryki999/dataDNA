"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ReachDay } from "@/lib/types/reach";
import {
  buildReachChartData,
  CHANNEL_CHART_COLORS,
  REACH_CHANNEL_LABELS,
  REACH_TIME_RANGE_LABELS,
  REACH_TRAFFIC_LABELS,
  type ReachChartChannel,
  type ReachTimeRange,
  type ReachTrafficFilter,
} from "@/lib/reach-chart";
import {
  DATA_HERO,
  EYEBROW,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  FLAT_CONTAINER,
} from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

const CHANNEL_GLOW: Record<ReachChartChannel, string> = {
  total: "rgba(0, 85, 255, 0.15)",
  cold_calls: "rgba(0, 85, 255, 0.15)",
  x: "rgba(56, 189, 248, 0.15)",
  facebook: "rgba(24, 119, 242, 0.15)",
  instagram: "rgba(225, 48, 108, 0.15)",
  website: "rgba(52, 211, 153, 0.15)",
  metaClicks: "rgba(167, 139, 250, 0.15)",
};

const CHART_CHANNELS: ReachChartChannel[] = [
  "total",
  "cold_calls",
  "x",
  "facebook",
  "instagram",
  "website",
];

const TRAFFIC_CHANNELS = new Set<ReachChartChannel>([
  "facebook",
  "instagram",
  "website",
]);

type ReachAnalyticsChartProps = {
  series: ReachDay[];
  allTimeTotal: number;
};

export function ReachAnalyticsChart({
  series,
  allTimeTotal,
}: ReachAnalyticsChartProps) {
  const [range, setRange] = useState<ReachTimeRange>("7");
  const [channel, setChannel] = useState<ReachChartChannel>("total");
  const [traffic, setTraffic] = useState<ReachTrafficFilter>("all");

  const chartData = useMemo(
    () => buildReachChartData(series, range, channel, traffic),
    [series, range, channel, traffic],
  );

  const strokeColor = CHANNEL_CHART_COLORS[channel];
  const gradientId = `reach-main-${channel}-${traffic}`;

  const chartConfig = {
    value: {
      label: REACH_CHANNEL_LABELS[channel],
      color: strokeColor,
    },
  } satisfies ChartConfig;

  const ticks =
    chartData.length > 1
      ? [chartData[0]?.label, chartData[chartData.length - 1]?.label].filter(
          Boolean,
        )
      : chartData[0]?.label
        ? [chartData[0].label]
        : [];

  const showTrafficToggle = TRAFFIC_CHANNELS.has(channel);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={EYEBROW}>Zasięgi</p>
          <p className={cn(DATA_HERO, "mt-1")}>
            {allTimeTotal.toLocaleString("pl-PL")}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              łącznie
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(REACH_TIME_RANGE_LABELS) as ReachTimeRange[]).map(
          (key) => (
            <Button
              key={key}
              size="sm"
              variant="ghost"
              onClick={() => setRange(key)}
              className={cn(
                "h-7 border px-2.5 text-xs font-medium",
                range === key ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE,
              )}
            >
              {REACH_TIME_RANGE_LABELS[key]}
            </Button>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CHART_CHANNELS.map((key) => (
          <Button
            key={key}
            size="sm"
            variant="ghost"
            onClick={() => setChannel(key)}
            className={cn(
              "h-7 border px-2.5 text-xs font-medium",
              channel === key ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE,
            )}
            style={
              channel === key
                ? {
                    borderColor: `${CHANNEL_CHART_COLORS[key]}55`,
                    color: CHANNEL_CHART_COLORS[key],
                  }
                : undefined
            }
          >
            {REACH_CHANNEL_LABELS[key]}
          </Button>
        ))}
      </div>

      {showTrafficToggle && (
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(REACH_TRAFFIC_LABELS) as ReachTrafficFilter[]).map(
            (key) => (
              <Button
                key={key}
                size="sm"
                variant="ghost"
                onClick={() => setTraffic(key)}
                className={cn(
                  "h-7 border px-2.5 text-xs font-medium",
                  traffic === key ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE,
                )}
              >
                {REACH_TRAFFIC_LABELS[key]}
              </Button>
            ),
          )}
        </div>
      )}

      {chartData.length === 0 ? (
        <div
          className={cn(
            FLAT_CONTAINER,
            "flex h-[260px] items-center justify-center text-sm text-muted-foreground",
          )}
        >
          Brak danych — zaloguj pierwszą akcję lub połącz API.
        </div>
      ) : (
        <div
          className={cn(FLAT_CONTAINER, "p-4")}
          style={{ boxShadow: `inset 0 0 40px ${CHANNEL_GLOW[channel]}` }}
        >
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              accessibilityLayer={false}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                ticks={ticks}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent className="border-dna-border/40 bg-dna-surface text-foreground" />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{chartData[0]?.label}</span>
            <span>Dziś</span>
          </div>
        </div>
      )}
    </section>
  );
}
