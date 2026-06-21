"use client";

import { useState } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { ReachAnalyticsChart } from "@/components/analytics/ReachAnalyticsChart";
import { ReachChannelGrid } from "@/components/analytics/ReachChannelGrid";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";

type ZasiegiClientProps = {
  reach: ReachSummary;
  reachSeries: ReachDay[];
  streak: number;
};

export function ZasiegiClient({
  reach: initialReach,
  reachSeries,
  streak,
}: ZasiegiClientProps) {
  const [reach, setReach] = useState(initialReach);

  function handleOptimisticCallLog() {
    setReach((current) => ({
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
        onOptimisticCallLog={handleOptimisticCallLog}
      />
    </DashboardPage>
  );
}
