"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DashboardProvider } from "@/components/dashboard/dashboard-provider";
import { DashboardViews } from "@/components/dashboard/dashboard-views";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Lead } from "@/lib/crm/pipeline";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";

type DashboardShellProps = {
  user: { name: string; email: string };
  heatmap: {
    days: Record<string, number>;
    streaks: { current: number; longest: number };
  };
  crm: { active: Lead[]; archived: Lead[] };
  reach: ReachSummary;
  reachSeries: ReachDay[];
  revenue: { total: number; goal: number; percent: number };
};

export function DashboardShell({
  user,
  heatmap,
  crm,
  reach,
  reachSeries,
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
            crm={crm}
            reach={reach}
            reachSeries={reachSeries}
            revenue={revenue}
          />
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
