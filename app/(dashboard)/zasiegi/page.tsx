import { getReachSummary, getReachTimeSeries } from "@/lib/actions/reach";
import { getCurrentStreak } from "@/lib/actions/activities";
import { getIntegrationStatuses } from "@/lib/actions/integrations";
import { ZasiegiClient } from "@/components/analytics/ZasiegiClient";

export default async function ZasiegiPage() {
  const [reach, reachSeries, streak, integrations] = await Promise.all([
    getReachSummary(),
    getReachTimeSeries(),
    getCurrentStreak(),
    getIntegrationStatuses(),
  ]);

  return (
    <ZasiegiClient
      reach={reach}
      reachSeries={reachSeries}
      streak={streak}
      integrations={integrations}
    />
  );
}
