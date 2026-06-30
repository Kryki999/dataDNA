"use client";

import { useState } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { ReachAnalyticsChart } from "@/components/analytics/ReachAnalyticsChart";
import { ReachChannelGrid } from "@/components/analytics/ReachChannelGrid";
import type { IntegrationView } from "@/lib/actions/integrations";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";

type ZasiegiClientProps = {
  reach: ReachSummary;
  reachSeries: ReachDay[];
  streak: number;
  integrations: IntegrationView[];
};

export function ZasiegiClient({
  reach: initialReach,
  reachSeries,
  streak,
  integrations,
}: ZasiegiClientProps) {
  const [reach, setReach] = useState(initialReach);

  function handleOptimisticCallLog() {
    setReach((current) => ({
      ...current,
      today: {
        ...current.today,
        coldCalls: current.today.coldCalls + 1,
        total: current.today.total + 1,
      },
      week: {
        ...current.week,
        coldCalls: current.week.coldCalls + 1,
        total: current.week.total + 1,
      },
      allTime: {
        ...current.allTime,
        coldCalls: current.allTime.coldCalls + 1,
        total: current.allTime.total + 1,
      },
      channels: current.channels.map((ch) =>
        ch.id === "cold_calls"
          ? {
              ...ch,
              heroToday: ch.heroToday + 1,
              organicToday: ch.organicToday + 1,
              lanes: ch.lanes.map((lane) => ({
                ...lane,
                metrics: {
                  ...lane.metrics,
                  primary: {
                    today: lane.metrics.primary.today + 1,
                    week: lane.metrics.primary.week + 1,
                    allTime: lane.metrics.primary.allTime + 1,
                  },
                },
              })),
            }
          : ch,
      ),
    }));
  }

  return (
    <DashboardPage wide className="space-y-12">
      <ReachAnalyticsChart
        series={reachSeries}
        allTimeTotal={reach.allTime.total}
      />
      <ReachChannelGrid
        summary={reach}
        series={reachSeries}
        streak={streak}
        integrations={integrations}
        onOptimisticCallLog={handleOptimisticCallLog}
      />
    </DashboardPage>
  );
}
