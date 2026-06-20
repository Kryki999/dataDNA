"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CirclePlus } from "lucide-react";

export function NavMain({
  items,
  onQuickCreate,
  quickCreateLabel = "Nowy klient",
}: {
  items: {
    title: string;
    href: string;
    icon?: React.ReactNode;
    isActive?: boolean;
  }[];
  onQuickCreate?: () => void;
  quickCreateLabel?: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={quickCreateLabel}
              className="min-w-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onQuickCreate}
            >
              <CirclePlus />
              <span>{quickCreateLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.isActive}
                className={
                  item.isActive
                    ? "bg-zinc-900 text-foreground"
                    : "text-muted-foreground"
                }
                render={<Link href={item.href} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
