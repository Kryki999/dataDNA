"use client";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CirclePlus, Phone } from "lucide-react";

export function NavMain({
  items,
  onQuickCreate,
  quickCreateLabel = "Nowy klient",
}: {
  items: {
    title: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
  }[];
  onQuickCreate?: () => void;
  quickCreateLabel?: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip={quickCreateLabel}
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={onQuickCreate}
            >
              <CirclePlus />
              <span>{quickCreateLabel}</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 shrink-0 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
              onClick={() =>
                items.find((i) => i.title.startsWith("CRM"))?.onClick?.()
              }
            >
              <Phone />
              <span className="sr-only">CRM</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.isActive}
                onClick={item.onClick}
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
