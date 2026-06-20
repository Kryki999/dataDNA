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
import { SECTION_LABEL, STAT_VALUE, FLAT_CONTAINER } from "@/lib/ui-patterns";
import {
  MINIMAL_AXIS_TICK,
  MINIMAL_CHART_COLORS,
  MINIMAL_CHART_MARGIN,
} from "@/components/charts/minimal-chart-theme";

const chartConfig = {
  value: {
    label: "Skumulowane",
    color: MINIMAL_CHART_COLORS.stroke,
  },
} satisfies ChartConfig;

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

  const ticks =
    chartData.length > 1
      ? [chartData[0]?.label, chartData[chartData.length - 1]?.label].filter(
          Boolean,
        )
      : chartData[0]?.label
        ? [chartData[0].label]
        : [];

  return (
    <section className="space-y-4">
      <p className={SECTION_LABEL}>Zasięgi</p>
      <p className={STAT_VALUE}>
        {allTimeTotal.toLocaleString("pl-PL")}{" "}
        <span className="text-base font-normal text-muted-foreground">
          all-time
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(REACH_TIME_RANGE_LABELS) as ReachTimeRange[]).map(
          (key) => (
            <Button
              key={key}
              size="sm"
              variant={range === key ? "default" : "ghost"}
              onClick={() => setRange(key)}
            >
              {REACH_TIME_RANGE_LABELS[key]}
            </Button>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(REACH_CHANNEL_LABELS) as ReachChannel[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={channel === key ? "outline" : "ghost"}
            onClick={() => setChannel(key)}
          >
            {REACH_CHANNEL_LABELS[key]}
          </Button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div
          className={`flex h-[240px] items-center justify-center text-sm text-muted-foreground ${FLAT_CONTAINER}`}
        >
          Brak danych — zaloguj pierwszą akcję.
        </div>
      ) : (
        <div className={`p-4 ${FLAT_CONTAINER}`}>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <AreaChart data={chartData} margin={MINIMAL_CHART_MARGIN}>
              <defs>
                <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={MINIMAL_CHART_COLORS.gradientStart}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor={MINIMAL_CHART_COLORS.gradientEnd}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={MINIMAL_AXIS_TICK}
                ticks={ticks}
                interval="preserveStartEnd"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={MINIMAL_CHART_COLORS.stroke}
                strokeWidth={2}
                fill="url(#reachFill)"
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
