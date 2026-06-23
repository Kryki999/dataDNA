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
  REACH_CHANNEL_LABELS,
  REACH_TIME_RANGE_LABELS,
  type ReachChannel,
  type ReachTimeRange,
} from "@/lib/reach-chart";
import {
  DATA_HERO,
  EYEBROW,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  FLAT_CONTAINER,
  SIGNAL_EDGE,
} from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

const CHANNEL_CHART_COLORS: Record<ReachChannel, string> = {
  total: "#0055FF",
  coldCalls: "#0055FF",
  xImpressions: "#38bdf8",
  metaClicks: "#a78bfa",
};

const CHANNEL_GLOW: Record<ReachChannel, string> = {
  total: "rgba(0, 85, 255, 0.15)",
  coldCalls: "rgba(0, 85, 255, 0.15)",
  xImpressions: "rgba(56, 189, 248, 0.15)",
  metaClicks: "rgba(167, 139, 250, 0.15)",
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

  const strokeColor = CHANNEL_CHART_COLORS[channel];
  const gradientId = `reach-main-${channel}`;

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

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className={cn("rounded-xl pl-4", SIGNAL_EDGE)}>
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
        {(Object.keys(REACH_CHANNEL_LABELS) as ReachChannel[]).map((key) => (
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

      {chartData.length === 0 ? (
        <div
          className={cn(
            FLAT_CONTAINER,
            "flex h-[260px] items-center justify-center text-sm text-muted-foreground",
          )}
        >
          Brak danych — zaloguj pierwszą akcję.
        </div>
      ) : (
        <div
          className={cn(FLAT_CONTAINER, "p-4")}
          style={{ boxShadow: `inset 0 0 40px ${CHANNEL_GLOW[channel]}` }}
        >
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                  <ChartTooltipContent
                    className="border-dna-border/40 bg-dna-surface text-foreground"
                  />
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
