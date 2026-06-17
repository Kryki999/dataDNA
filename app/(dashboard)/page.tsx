import { ActivityHeatmap } from "@/components/wall/ActivityHeatmap";
import { LeadList } from "@/components/calls/LeadList";
import { ReachCounters } from "@/components/analytics/ReachCounters";
import { QuickReachForm } from "@/components/analytics/QuickReachForm";
import { BossFightBar } from "@/components/analytics/BossFightBar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getHeatmapData } from "@/lib/actions/activities";
import { getLeads } from "@/lib/actions/leads";
import { getReachSummary } from "@/lib/actions/reach";
import { getRevenueProgress } from "@/lib/actions/deals";

export default async function DashboardPage() {
  const [heatmap, leads, reach, revenue] = await Promise.all([
    getHeatmapData(),
    getLeads(),
    getReachSummary(),
    getRevenueProgress(),
  ]);

  return (
    <>
      <DashboardHeader currentStreak={heatmap.streaks.current} />

      <BossFightBar
        total={revenue.total}
        goal={revenue.goal}
        percent={revenue.percent}
      />

      <ActivityHeatmap
        days={heatmap.days}
        currentStreak={heatmap.streaks.current}
        longestStreak={heatmap.streaks.longest}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Zasięgi</h2>
          <p className="text-sm text-muted-foreground">
            Ręczne logowanie metryk — MVP przed integracjami API.
          </p>
        </div>
        <ReachCounters summary={reach} />
        <QuickReachForm />
      </section>

      <LeadList leads={leads} />
    </>
  );
}
