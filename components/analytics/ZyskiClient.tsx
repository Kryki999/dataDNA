"use client";

import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { RevenueHero } from "@/components/analytics/RevenueHero";
import { RevenueAnalyticsChart } from "@/components/analytics/RevenueAnalyticsChart";
import {
  RevenueDealsTable,
  type RevenueDealRow,
} from "@/components/analytics/RevenueDealsTable";
import type { RevenueDealPoint } from "@/lib/revenue-chart";

type ZyskiClientProps = {
  revenue: { total: number };
  growth: { percentChange: number; thisMonth: number; lastMonth: number };
  chartDeals: RevenueDealPoint[];
  deals: RevenueDealRow[];
};

export function ZyskiClient({
  revenue,
  growth,
  chartDeals,
  deals,
}: ZyskiClientProps) {
  return (
    <DashboardPage wide className="space-y-10">
      <RevenueHero
        total={revenue.total}
        percentChange={growth.percentChange}
        thisMonth={growth.thisMonth}
      />
      <RevenueAnalyticsChart deals={chartDeals} />
      <RevenueDealsTable deals={deals} />
    </DashboardPage>
  );
}
