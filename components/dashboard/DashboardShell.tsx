"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { NewLeadProvider } from "@/components/dashboard/new-lead-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type DashboardShellProps = {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <NewLeadProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset className="bg-zinc-950">
          <SiteHeader />
          <div className="flex-1">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </NewLeadProvider>
  );
}
