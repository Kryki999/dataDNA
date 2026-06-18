"use client";

import { cn } from "@/lib/utils";
import { ActivityHeatmap } from "@/components/wall/ActivityHeatmap";
import { LeadList } from "@/components/calls/LeadList";
import { ReachCounters } from "@/components/analytics/ReachCounters";
import { QuickReachForm } from "@/components/analytics/QuickReachForm";
import { RevenueGoalBar } from "@/components/analytics/RevenueGoalBar";
import { DnaStatsCards } from "@/components/dashboard/dna-stats-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { leads } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;

type ReachSummary = {
  today: { coldCalls: number; xImpressions: number; metaClicks: number };
  week: { coldCalls: number; xImpressions: number; metaClicks: number };
};

type DashboardViewsProps = {
  heatmap: {
    days: Record<string, number>;
    streaks: { current: number; longest: number };
  };
  leads: Lead[];
  reach: ReachSummary;
  revenue: { total: number; goal: number; percent: number };
};

export function DashboardViews({
  heatmap,
  leads,
  reach,
  revenue,
}: DashboardViewsProps) {
  const { section, registerOpenNewLead } = useDashboard();

  const showStats = section === "overview" || section === "revenue";
  const showWall = section === "overview" || section === "wall";
  const showRevenue = section === "overview" || section === "revenue";
  const showReach = section === "reach";
  const showCalls = section === "overview" || section === "calls";

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {showStats ? (
          <DnaStatsCards
            streak={heatmap.streaks.current}
            longestStreak={heatmap.streaks.longest}
            revenueTotal={revenue.total}
            revenueGoal={revenue.goal}
            revenuePercent={revenue.percent}
            callsToday={reach.today.coldCalls}
            callsWeek={reach.week.coldCalls}
          />
        ) : null}

        {showWall ? (
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>The Wall</CardTitle>
                <CardDescription>
                  Heatmapa aktywności — outreach day by day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap
                  days={heatmap.days}
                  currentStreak={heatmap.streaks.current}
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
            <Card>
              <CardHeader>
                <CardTitle>Zasięgi</CardTitle>
                <CardDescription>
                  Ręczne logowanie metryk dziennych
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ReachCounters summary={reach} />
                <QuickReachForm />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {showCalls ? (
          <div className={cn("px-4 lg:px-6", section === "overview" && "hidden xl:block")}>
            <LeadList
              leads={leads}
              embedded
              onRegisterOpenNew={registerOpenNewLead}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
