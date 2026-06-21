"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BRAND } from "@/lib/brand";
import {
  buildRevenueChartData,
  REVENUE_TIME_RANGE_LABELS,
  type RevenueDealPoint,
  type RevenueTimeRange,
} from "@/lib/revenue-chart";
import { cn } from "@/lib/utils";

type RevenueAnalyticsChartProps = {
  deals: RevenueDealPoint[];
};

const STROKE_COLOR = BRAND.primary;
const GLOW = "rgba(0, 85, 255, 0.12)";

export function RevenueAnalyticsChart({ deals }: RevenueAnalyticsChartProps) {
  const [range, setRange] = useState<RevenueTimeRange>("7");

  const chartData = useMemo(
    () => buildRevenueChartData(deals, range),
    [deals, range],
  );

  const chartConfig = {
    value: {
      label: "Przychód",
      color: STROKE_COLOR,
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Revenue Trends
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(REVENUE_TIME_RANGE_LABELS) as RevenueTimeRange[]).map(
            (key) => (
              <Button
                key={key}
                size="sm"
                variant="ghost"
                onClick={() => setRange(key)}
                className={cn(
                  "h-7 border px-2.5 text-[10px] font-semibold tracking-wider",
                  range === key
                    ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                    : "border-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-300",
                )}
              >
                {REVENUE_TIME_RANGE_LABELS[key]}
              </Button>
            ),
          )}
        </div>
      </div>

      {chartData.length === 0 || deals.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center border border-zinc-800 bg-zinc-950/50 text-sm text-zinc-500">
          Brak danych — zamknij pierwszy deal w CRM.
        </div>
      ) : (
        <div
          className="border border-zinc-800 bg-zinc-950/50 p-4"
          style={{ boxShadow: `inset 0 0 40px ${GLOW}` }}
        >
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 10 }}
                ticks={ticks}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="border-zinc-800 bg-zinc-900 text-zinc-100"
                    formatter={(value, _name, item) => (
                      <span className="font-mono tabular-nums">
                        {Number(value).toLocaleString("pl-PL")} PLN
                        {item.payload?.daily > 0 ? (
                          <span className="ml-2 text-zinc-500">
                            (+{item.payload.daily.toLocaleString("pl-PL")})
                          </span>
                        ) : null}
                      </span>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={STROKE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: STROKE_COLOR, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
          <div className="mt-3 flex items-center justify-end gap-4 text-[10px] uppercase tracking-wider text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: STROKE_COLOR }}
              />
              Przychód skumulowany
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
