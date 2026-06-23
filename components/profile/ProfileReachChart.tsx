"use client";

import { Area, AreaChart, XAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  MINIMAL_AXIS_TICK,
  MINIMAL_CHART_COLORS,
  MINIMAL_CHART_MARGIN,
} from "@/components/charts/minimal-chart-theme";
import { FLAT_CONTAINER, SECTION_LABEL, STAT_VALUE } from "@/lib/ui-patterns";

const chartConfig = {
  reach: {
    label: "Zasięg",
    color: MINIMAL_CHART_COLORS.stroke,
  },
} satisfies ChartConfig;

type ProfileReachChartProps = {
  data: Array<{ date: string; reach: number }>;
  totalReach: number;
};

export function ProfileReachChart({ data, totalReach }: ProfileReachChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d MMM", { locale: pl }),
  }));

  const ticks =
    chartData.length > 1
      ? [chartData[0]?.label, chartData[chartData.length - 1]?.label].filter(
          Boolean,
        )
      : chartData[0]?.label
        ? [chartData[0].label]
        : [];

  return (
    <section className="space-y-3">
      <p className={SECTION_LABEL}>Zasięgi</p>
      <p className={STAT_VALUE}>
        {totalReach >= 1_000_000
          ? `${(totalReach / 1_000_000).toFixed(1)}M`
          : totalReach >= 1_000
            ? `${(totalReach / 1_000).toFixed(1)}K`
            : totalReach.toLocaleString("pl-PL")}{" "}
        <span className="text-base font-normal text-muted-foreground">
          zasięgów
        </span>
      </p>
      <div className={`p-4 ${FLAT_CONTAINER}`}>
        <ChartContainer config={chartConfig} className="h-40 w-full">
          <AreaChart data={chartData} margin={MINIMAL_CHART_MARGIN}>
            <defs>
              <linearGradient id="profileReachFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={MINIMAL_CHART_COLORS.gradientStart}
                  stopOpacity={0.3}
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
              dataKey="reach"
              stroke={MINIMAL_CHART_COLORS.stroke}
              strokeWidth={2}
              fill="url(#profileReachFill)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </section>
  );
}
