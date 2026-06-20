"use client";

import { useState } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { ReachAnalyticsChart } from "@/components/analytics/ReachAnalyticsChart";
import { ReachCounters } from "@/components/analytics/ReachCounters";
import { QuickReachForm } from "@/components/analytics/QuickReachForm";
import { LogCallButton } from "@/components/analytics/LogCallButton";
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
    <DashboardPage>
      <ReachCounters summary={reach} />
      <div className="flex flex-wrap items-center gap-3">
        <LogCallButton
          callsToday={reach.today.coldCalls}
          streak={streak}
          onOptimisticLog={handleOptimisticCallLog}
        />
      </div>
      <ReachAnalyticsChart
        series={reachSeries}
        allTimeTotal={reach.allTime.total}
      />
      <QuickReachForm />
    </DashboardPage>
  );
}
