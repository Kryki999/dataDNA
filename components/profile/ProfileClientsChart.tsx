"use client";

import { Bar, BarChart, XAxis } from "recharts";
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
  clients: {
    label: "Klienci",
    color: MINIMAL_CHART_COLORS.bar,
  },
} satisfies ChartConfig;

type ProfileClientsChartProps = {
  data: Array<{ date: string; count: number }>;
  totalClients: number;
};

export function ProfileClientsChart({
  data,
  totalClients,
}: ProfileClientsChartProps) {
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
      <p className={SECTION_LABEL}>Klienci</p>
      <p className={STAT_VALUE}>
        {totalClients}{" "}
        <span className="text-base font-normal text-muted-foreground">
          klientów
        </span>
      </p>
      <div className={`p-4 ${FLAT_CONTAINER}`}>
        <ChartContainer config={chartConfig} className="h-40 w-full">
          <BarChart data={chartData} margin={MINIMAL_CHART_MARGIN}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={MINIMAL_AXIS_TICK}
              ticks={ticks}
              interval="preserveStartEnd"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill={MINIMAL_CHART_COLORS.bar}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{chartData[0]?.label ?? ""}</span>
          <span>Dziś</span>
        </div>
      </div>
    </section>
  );
}
