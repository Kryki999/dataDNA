import { getRevenueProgress } from "@/lib/actions/deals";
import { getWonDealsWithLeads } from "@/lib/actions/leads";
import { ZyskiClient } from "@/components/analytics/ZyskiClient";

export default async function ZyskiPage() {
  const [revenue, deals] = await Promise.all([
    getRevenueProgress(),
    getWonDealsWithLeads(),
  ]);

  return <ZyskiClient revenue={revenue} deals={deals} />;
}
