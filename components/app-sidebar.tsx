"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dna } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatarUrl?: string | null };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-zinc-800 bg-zinc-950"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/profil" />}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
