import {
  getDealsTimeSeries,
  getRevenueGrowth,
  getRevenueProgress,
} from "@/lib/actions/deals";
import { getWonDealsWithLeads } from "@/lib/actions/leads";
import { ZyskiClient } from "@/components/analytics/ZyskiClient";

export default async function ZyskiPage() {
  const [revenue, growth, chartDeals, deals] = await Promise.all([
    getRevenueProgress(),
    getRevenueGrowth(),
    getDealsTimeSeries(),
    getWonDealsWithLeads(),
  ]);

  return (
    <ZyskiClient
      revenue={revenue}
      growth={growth}
      chartDeals={chartDeals}
      deals={deals.map((deal) => ({
        ...deal,
        tags: deal.tags ?? null,
      }))}
    />
  );
}
