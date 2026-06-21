"use client";

import { Area, Bar, ComposedChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type SparklinePoint = {
  date: string;
  value: number;
};

type ReachChannelSparklineProps = {
  data: SparklinePoint[];
  color: string;
  className?: string;
  height?: number;
  showBars?: boolean;
};

export function ReachChannelSparkline({
  data,
  color,
  className,
  height = 64,
  showBars = true,
}: ReachChannelSparklineProps) {
  const mounted = useMounted();
  const chartConfig = {
    value: { label: "Wartość", color },
  } satisfies ChartConfig;

  const gradientId = `spark-${color.replace("#", "")}`;

  if (!mounted || data.every((point) => point.value === 0)) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        <div
          className="h-px w-full opacity-20"
          style={{ backgroundColor: color }}
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
      <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {showBars && (
          <Bar
            dataKey="value"
            fill={color}
            opacity={0.25}
            radius={0}
            barSize={6}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
