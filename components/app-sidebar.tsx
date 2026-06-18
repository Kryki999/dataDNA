"use client";

import * as React from "react";
import {
  BarChart3,
  Dna,
  Grid3X3,
  LayoutDashboard,
  Phone,
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
  { id: "calls", title: "Cold Calling", icon: <Phone /> },
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Dna className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">DataDNA</span>
                <span className="truncate text-xs text-muted-foreground">
                  Sales & Reach
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
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ ...user, avatar: "" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
