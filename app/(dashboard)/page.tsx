import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { getHeatmapData } from "@/lib/actions/activities";
import { getLeads } from "@/lib/actions/leads";
import { getReachSummary, getReachTimeSeries } from "@/lib/actions/reach";
import { getRevenueProgress } from "@/lib/actions/deals";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [heatmap, leads, reach, reachSeries, revenue] = await Promise.all([
    getHeatmapData(),
    getLeads(),
    getReachSummary(),
    getReachTimeSeries(),
    getRevenueProgress(),
  ]);

  const email = session.user.email;
  const name = email.split("@")[0] ?? "CEO";

  return (
    <DashboardShell
      user={{ name, email }}
      heatmap={heatmap}
      leads={leads}
      reach={reach}
      reachSeries={reachSeries}
      revenue={revenue}
    />
  );
}
