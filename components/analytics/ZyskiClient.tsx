"use client";

import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { RevenueHero } from "@/components/analytics/RevenueHero";
import { RevenueAnalyticsChart } from "@/components/analytics/RevenueAnalyticsChart";
import {
  RevenueClientGrid,
  type RevenueClientRow,
} from "@/components/analytics/RevenueClientGrid";
import type { RevenueDealPoint } from "@/lib/revenue-chart";

type ZyskiClientProps = {
  revenue: { total: number };
  growth: { percentChange: number; thisMonth: number; lastMonth: number };
  chartDeals: RevenueDealPoint[];
  clients: RevenueClientRow[];
};

export function ZyskiClient({
  revenue,
  growth,
  chartDeals,
  clients,
}: ZyskiClientProps) {
  return (
    <DashboardPage wide className="space-y-10">
      <RevenueHero
        total={revenue.total}
        percentChange={growth.percentChange}
        thisMonth={growth.thisMonth}
      />
      <RevenueAnalyticsChart deals={chartDeals} />
      <RevenueClientGrid clients={clients} />
    </DashboardPage>
  );
}
