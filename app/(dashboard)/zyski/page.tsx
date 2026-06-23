import {
  getRevenueTimeSeries,
  getRevenueGrowth,
  getTotalRevenue,
} from "@/lib/actions/deals";
import { getWonClientsForRevenue } from "@/lib/actions/pipeline-deals";
import { ZyskiClient } from "@/components/analytics/ZyskiClient";

export default async function ZyskiPage() {
  const [revenue, growth, chartDeals, clients] = await Promise.all([
    getTotalRevenue(),
    getRevenueGrowth(),
    getRevenueTimeSeries(),
    getWonClientsForRevenue(),
  ]);

  return (
    <ZyskiClient
      revenue={revenue}
      growth={growth}
      chartDeals={chartDeals}
      clients={clients}
    />
  );
}
