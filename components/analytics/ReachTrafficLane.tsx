"use client";

import { ReachChannelSparkline } from "@/components/analytics/ReachChannelSparkline";
import type { ReachChannelConfig, ReachLaneConfig } from "@/lib/reach-channels";
import type { ReachChannelLaneData } from "@/lib/types/reach";
import { EYEBROW, SURFACE_WELL } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type ReachTrafficLaneProps = {
  channel: ReachChannelConfig;
  laneConfig: ReachLaneConfig;
  laneData?: ReachChannelLaneData;
  connected: boolean;
};

export function ReachTrafficLane({
  channel,
  laneConfig,
  laneData,
  connected,
}: ReachTrafficLaneProps) {
  const laneColor =
    laneConfig.trafficType === "paid"
      ? channel.color
      : (channel.organicColor ?? channel.color);

  const primary = laneData?.metrics.primary;
  const primaryValue = primary?.today ?? 0;

  const stats = [
    { label: "Dziś", value: primary?.today ?? 0 },
    { label: "Tydzień", value: primary?.week ?? 0 },
    { label: "Łącznie", value: primary?.allTime ?? 0 },
  ];

  return (
    <section
      aria-labelledby={`lane-${channel.id}-${laneConfig.trafficType}`}
      className="flex min-w-0 flex-1 flex-col space-y-4"
    >
      <div>
        <p
          id={`lane-${channel.id}-${laneConfig.trafficType}`}
          className={EYEBROW}
        >
          {laneConfig.trafficType === "paid" ? "Płatne" : "Organiczne"}
        </p>
        <p
          className="mt-2 font-mono text-2xl font-semibold tabular-nums"
          style={{ color: laneColor }}
        >
          {primaryValue.toLocaleString("pl-PL")}
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            {laneConfig.primaryLabel}
          </span>
        </p>
        {laneConfig.secondaryMetrics.map((metric) => {
          const secondary = laneData?.metrics.secondary?.[metric];
          const label = laneConfig.secondaryLabels[metric];
          if (!label || !secondary) return null;
          return (
            <p
              key={metric}
              className="mt-1 text-sm text-muted-foreground"
            >
              <span className="font-mono tabular-nums text-foreground">
                {secondary.today.toLocaleString("pl-PL")}
              </span>{" "}
              {label} dziś
            </p>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className={cn(SURFACE_WELL, "px-2 py-2")}>
            <p className={EYEBROW}>{stat.label}</p>
            <p
              className="mt-1 font-mono text-sm font-semibold tabular-nums"
              style={{ color: laneColor }}
            >
              {stat.value.toLocaleString("pl-PL")}
            </p>
          </div>
        ))}
      </div>

      <ReachChannelSparkline
        data={laneData?.sparkline ?? []}
        color={laneColor}
        height={80}
        showBars={false}
      />

      {!connected && channel.inputMode === "api" && (
        <p className="text-sm text-muted-foreground">
          Brak danych — połącz źródło w sekcji poniżej.
        </p>
      )}

      {channel.id === "x" &&
        laneConfig.trafficType === "paid" &&
        !connected && (
          <div className={cn(SURFACE_WELL, "px-3 py-2.5 text-sm text-muted-foreground")}>
            Wymaga X Premium API. Dostępne wkrótce.
          </div>
        )}
    </section>
  );
}
