import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { getHeatmapData } from "@/lib/actions/activities";
import { getLeads } from "@/lib/actions/leads";
import { getReachSummary } from "@/lib/actions/reach";
import { getRevenueProgress } from "@/lib/actions/deals";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [heatmap, leads, reach, revenue] = await Promise.all([
    getHeatmapData(),
    getLeads(),
    getReachSummary(),
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
      revenue={revenue}
    />
  );
}
