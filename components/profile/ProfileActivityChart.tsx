"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  MINIMAL_AXIS_TICK,
  MINIMAL_CHART_COLORS,
  MINIMAL_CHART_MARGIN,
} from "@/components/charts/minimal-chart-theme";
import { SECTION_LABEL, STAT_VALUE } from "@/lib/ui-patterns";

type ProfileActivityChartProps = {
  data: Array<{ date: string; count: number }>;
  activityCount: number;
};

export function ProfileActivityChart({
  data,
  activityCount,
}: ProfileActivityChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d MMM", { locale: pl }),
  }));

  const firstLabel = chartData[0]?.label ?? "";
  const ticks = chartData.length > 1 ? [0, chartData.length - 1] : [0];

  return (
    <section className="space-y-3">
      <p className={SECTION_LABEL}>Aktywność</p>
      <p className={STAT_VALUE}>{activityCount} działań</p>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={MINIMAL_CHART_MARGIN}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={MINIMAL_AXIS_TICK}
              ticks={ticks.map((i) => chartData[i]?.label).filter(Boolean)}
              interval="preserveStartEnd"
            />
            <Bar
              dataKey="count"
              fill={MINIMAL_CHART_COLORS.bar}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{firstLabel}</span>
        <span>Dziś</span>
      </div>
    </section>
  );
}
