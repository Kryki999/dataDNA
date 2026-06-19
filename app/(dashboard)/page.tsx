import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { getHeatmapData } from "@/lib/actions/activities";
import { getCrmLeads } from "@/lib/actions/leads";
import { getReachSummary, getReachTimeSeries } from "@/lib/actions/reach";
import { getRevenueProgress } from "@/lib/actions/deals";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [heatmap, crm, reach, reachSeries, revenue] = await Promise.all([
    getHeatmapData(),
    getCrmLeads(),
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
      crm={crm}
      reach={reach}
      reachSeries={reachSeries}
      revenue={revenue}
    />
  );
}
