"use client";

import { Area, ComposedChart, Line } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type SparklineSeries = {
  date: string;
  paid: number;
  organic: number;
};

type ReachDualSparklineProps = {
  paidData: { date: string; value: number }[];
  organicData: { date: string; value: number }[];
  paidColor: string;
  organicColor: string;
  className?: string;
  height?: number;
};

export function ReachDualSparkline({
  paidData,
  organicData,
  paidColor,
  organicColor,
  className,
  height = 64,
}: ReachDualSparklineProps) {
  const mounted = useMounted();

  const data: SparklineSeries[] = paidData.map((point, index) => ({
    date: point.date,
    paid: point.value,
    organic: organicData[index]?.value ?? 0,
  }));

  const chartConfig = {
    paid: { label: "Płatne", color: paidColor },
    organic: { label: "Organiczne", color: organicColor },
  } satisfies ChartConfig;

  const isEmpty = data.every((p) => p.paid === 0 && p.organic === 0);

  if (!mounted || isEmpty) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        <div
          className="h-px w-full opacity-20"
          style={{ backgroundColor: paidColor }}
        />
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("w-full", className)}
      style={{ height }}
    >
      <ComposedChart
        data={data}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        accessibilityLayer={false}
      >
        <Line
          type="monotone"
          dataKey="paid"
          stroke={paidColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="organic"
          stroke={organicColor}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="paid"
          fill={paidColor}
          fillOpacity={0.08}
          stroke="none"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
