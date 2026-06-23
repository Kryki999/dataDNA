"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dna } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatarUrl?: string | null };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-2 p-2">
        {/* Zwinięty: przycisk nad logo (bez nakładania) */}
        <div className="hidden justify-center group-data-[collapsible=icon]:flex">
          <SidebarTrigger className="size-8 text-muted-foreground hover:bg-dna-inset hover:text-foreground" />
        </div>

        {/* Rozwinięty: logo + trigger w jednym rzędzie */}
        <div className="relative w-full group-data-[collapsible=icon]:hidden">
          <SidebarTrigger className="absolute top-0 right-0 z-10 size-8 text-muted-foreground hover:bg-dna-inset hover:text-foreground" />
          <SidebarMenu className="pr-10">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[slot=sidebar-menu-button]:p-1.5!"
                render={<Link href="/profil" />}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Dna className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">DataDNA</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Media DNA CRM
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* Zwinięty: samo logo pod przyciskiem */}
        <SidebarMenu className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="size-8! p-1.5!"
              render={<Link href="/profil" />}
              tooltip="DataDNA"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Dna className="size-4" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={DASHBOARD_NAV.map((item) => ({
            title: item.title,
            href: item.href,
            icon: <item.icon className="size-4" />,
            isActive:
              pathname === item.href || pathname.startsWith(`${item.href}/`),
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatarUrl ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
