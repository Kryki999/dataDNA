"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DashboardProvider } from "@/components/dashboard/dashboard-provider";
import { DashboardViews } from "@/components/dashboard/dashboard-views";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { leads } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;

type ReachSummary = {
  today: { coldCalls: number; xImpressions: number; metaClicks: number };
  week: { coldCalls: number; xImpressions: number; metaClicks: number };
};

type DashboardShellProps = {
  user: { name: string; email: string };
  heatmap: {
    days: Record<string, number>;
    streaks: { current: number; longest: number };
  };
  leads: Lead[];
  reach: ReachSummary;
  revenue: { total: number; goal: number; percent: number };
};

export function DashboardShell({
  user,
  heatmap,
  leads,
  reach,
  revenue,
}: DashboardShellProps) {
  return (
    <DashboardProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader />
          <DashboardViews
            heatmap={heatmap}
            leads={leads}
            reach={reach}
            revenue={revenue}
          />
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
