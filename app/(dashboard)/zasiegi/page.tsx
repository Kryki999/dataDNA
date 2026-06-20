import { getReachSummary, getReachTimeSeries } from "@/lib/actions/reach";
import { getCurrentStreak } from "@/lib/actions/activities";
import { ZasiegiClient } from "@/components/analytics/ZasiegiClient";

export default async function ZasiegiPage() {
  const [reach, reachSeries, streak] = await Promise.all([
    getReachSummary(),
    getReachTimeSeries(),
    getCurrentStreak(),
  ]);

  return (
    <ZasiegiClient reach={reach} reachSeries={reachSeries} streak={streak} />
  );
}
