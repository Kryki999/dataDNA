"use client";

import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { RevenueGoalBar } from "@/components/analytics/RevenueGoalBar";
import { RevenueBreakdown } from "@/components/analytics/RevenueBreakdown";

type ZyskiClientProps = {
  revenue: { total: number; goal: number; percent: number };
  deals: Array<{
    dealId: string;
    amountPln: number;
    description: string | null;
    closedAt: Date;
    leadId: string | null;
    leadName: string | null;
    company: string | null;
    pipelineStage: string | null;
  }>;
};

export function ZyskiClient({ revenue, deals }: ZyskiClientProps) {
  return (
    <DashboardPage>
      <RevenueGoalBar
        total={revenue.total}
        goal={revenue.goal}
        percent={revenue.percent}
      />
      <RevenueBreakdown deals={deals} />
    </DashboardPage>
  );
}
