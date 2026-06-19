"use client";

import * as React from "react";
import {
  Archive,
  BarChart3,
  Dna,
  Grid3X3,
  Kanban,
  LayoutDashboard,
  Target,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  useDashboard,
  type DashboardSection,
} from "@/components/dashboard/dashboard-provider";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string };
};

const NAV_ITEMS: Array<{
  id: DashboardSection;
  title: string;
  icon: React.ReactNode;
}> = [
  { id: "overview", title: "Przegląd", icon: <LayoutDashboard /> },
  { id: "crm", title: "CRM — Lejek", icon: <Kanban /> },
  { id: "archive", title: "Archiwum", icon: <Archive /> },
  { id: "wall", title: "The Wall", icon: <Grid3X3 /> },
  { id: "reach", title: "Zasięgi", icon: <BarChart3 /> },
  { id: "revenue", title: "Cel przychodu", icon: <Target /> },
];

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { section, setSection, openNewLead } = useDashboard();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              onClick={() => setSection("overview")}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_rgba(0,85,255,0.35)]">
                <Dna className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">DataDNA</span>
                <span className="truncate text-xs text-muted-foreground">
                  Media DNA CRM
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={NAV_ITEMS.map((item) => ({
            ...item,
            isActive: section === item.id,
            onClick: () => setSection(item.id),
          }))}
          onQuickCreate={openNewLead}
          quickCreateLabel="Nowy klient"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ ...user, avatar: "" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
