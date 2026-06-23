"use client";

import { usePathname } from "next/navigation";
import { getNavTitle } from "@/lib/dashboard-nav";
import { SURFACE_HEADER } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      data-slot="dashboard-header"
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        SURFACE_HEADER,
      )}
    >
      <div className="flex w-full items-center px-4 lg:px-6">
        <h1 className="text-base font-medium text-foreground">
          {getNavTitle(pathname)}
        </h1>
      </div>
    </header>
  );
}
