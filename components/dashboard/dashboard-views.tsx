"use client";

import { useEffect, useState } from "react";
import { ActivityHeatmap } from "@/components/wall/ActivityHeatmap";
import { ClientArchive } from "@/components/crm/ClientArchive";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { ReachCounters } from "@/components/analytics/ReachCounters";
import { QuickReachForm } from "@/components/analytics/QuickReachForm";
import { RevenueGoalBar } from "@/components/analytics/RevenueGoalBar";
import { ReachAnalyticsChart } from "@/components/analytics/ReachAnalyticsChart";
import { LogCallButton } from "@/components/analytics/LogCallButton";
import { DnaStatsCards } from "@/components/dashboard/dna-stats-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { Lead } from "@/lib/crm/pipeline";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";

type DashboardViewsProps = {
  heatmap: {
    days: Record<string, number>;
    streaks: { current: number; longest: number };
  };
  crm: { active: Lead[]; archived: Lead[] };
  reach: ReachSummary;
  reachSeries: ReachDay[];
  revenue: { total: number; goal: number; percent: number };
};

export function DashboardViews({
  heatmap,
  crm,
  reach: initialReach,
  reachSeries,
  revenue,
}: DashboardViewsProps) {
  const { section, registerOpenNewLead } = useDashboard();
  const [reach, setReach] = useState(initialReach);
  const [streak, setStreak] = useState(heatmap.streaks.current);

  useEffect(() => {
    setReach(initialReach);
  }, [initialReach]);

  useEffect(() => {
    setStreak(heatmap.streaks.current);
  }, [heatmap.streaks.current]);

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

  const showStats = section === "overview" || section === "revenue";
  const showChart =
    section === "overview" || section === "reach" || section === "crm";
  const showWall = section === "overview" || section === "wall";
  const showRevenue = section === "overview" || section === "revenue";
  const showReach = section === "reach";
  const showCrm = section === "crm";
  const showArchive = section === "archive";
  const showLogCall =
    section === "overview" || section === "crm" || section === "reach";

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {showStats ? (
          <DnaStatsCards
            streak={streak}
            longestStreak={heatmap.streaks.longest}
            revenueTotal={revenue.total}
            revenueGoal={revenue.goal}
            revenuePercent={revenue.percent}
            callsToday={reach.today.coldCalls}
            callsWeek={reach.week.coldCalls}
            allTimeReach={reach.allTime.total}
          />
        ) : null}

        {showLogCall ? (
          <div className="px-4 lg:px-6">
            <LogCallButton
              callsToday={reach.today.coldCalls}
              streak={streak}
              onOptimisticLog={handleOptimisticCallLog}
            />
          </div>
        ) : null}

        {showChart ? (
          <div className="px-4 lg:px-6">
            <ReachAnalyticsChart
              series={reachSeries}
              allTimeTotal={reach.allTime.total}
            />
          </div>
        ) : null}

        {showCrm ? (
          <div className="px-4 lg:px-6">
            <PipelineBoard
              leads={crm.active}
              onRegisterOpenNew={registerOpenNewLead}
            />
          </div>
        ) : null}

        {showArchive ? (
          <div className="px-4 lg:px-6">
            <ClientArchive leads={crm.archived} />
          </div>
        ) : null}

        {showWall ? (
          <div className="px-4 lg:px-6">
            <Card className="border-border/80 bg-card/80">
              <CardHeader>
                <CardTitle>The Wall</CardTitle>
                <CardDescription>
                  Heatmapa aktywności — outreach day by day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap
                  days={heatmap.days}
                  currentStreak={streak}
                  longestStreak={heatmap.streaks.longest}
                  compact={section === "overview"}
                  embedded
                />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {showRevenue ? (
          <div className="px-4 lg:px-6">
            <RevenueGoalBar
              total={revenue.total}
              goal={revenue.goal}
              percent={revenue.percent}
            />
          </div>
        ) : null}

        {showReach ? (
          <div className="px-4 lg:px-6">
            <Card className="border-border/80 bg-card/80">
              <CardHeader>
                <CardTitle>Zasięgi</CardTitle>
                <CardDescription>
                  All-time + ręczne logowanie X / Meta na koniec dnia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ReachCounters summary={reach} />
                <QuickReachForm />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
