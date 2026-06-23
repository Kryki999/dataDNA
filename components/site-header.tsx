"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useCrmModals } from "@/components/crm/CrmModalsProvider";
import { Button } from "@/components/ui/button";
import { getNavTitle } from "@/lib/dashboard-nav";
import { SURFACE_HEADER } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { openSearch } = useCrmModals();

  return (
    <header
      data-slot="dashboard-header"
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        SURFACE_HEADER,
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
        <h1 className="text-base font-medium text-foreground">
          {getNavTitle(pathname)}
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 border-dna-border/50 bg-dna-inset text-muted-foreground sm:inline-flex"
          onClick={openSearch}
        >
          <Search className="size-3.5" />
          <span className="text-xs">Szukaj</span>
          <kbd className="rounded border border-dna-border/60 px-1 text-[10px]">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 sm:hidden"
          onClick={openSearch}
          aria-label="Szukaj klientów"
        >
          <Search className="size-4" />
        </Button>
      </div>
    </header>
  );
}
