"use client";

import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerBacklogCard } from "@/components/planner/PlannerBacklogCard";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { INPUT_SURFACE } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

type PlannerBacklogDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: PlannerEventWithMeta[];
  onQuickAddClick: () => void;
  onSchedule: (eventId: string) => void;
};

export function PlannerBacklogDrawer({
  open,
  onOpenChange,
  events,
  onQuickAddClick,
  onSchedule,
}: PlannerBacklogDrawerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }, [events, query]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-dna-border/40 bg-dna-surface">
        <DrawerHeader>
          <DrawerTitle>Backlog</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj zadania…"
              className={cn(INPUT_SURFACE, "pl-9")}
            />
          </div>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto px-4 pb-4">
          {filtered.map((event) => (
            <PlannerBacklogCard
              key={event.id}
              event={event}
              isMobile
              onSchedule={() => {
                onSchedule(event.id);
                onOpenChange(false);
              }}
            />
          ))}
        </div>
        <div className="border-t border-dna-border p-4">
          <Button
            variant="outline"
            className="w-full border-dna-border"
            onClick={onQuickAddClick}
          >
            <Plus className="size-4" />
            Szybkie dodanie
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
