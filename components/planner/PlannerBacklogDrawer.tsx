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
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

type PlannerBacklogDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: PlannerEventWithMeta[];
  onQuickAdd: (title: string) => void;
  onSchedule: (eventId: string) => void;
};

export function PlannerBacklogDrawer({
  open,
  onOpenChange,
  events,
  onQuickAdd,
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
      <DrawerContent className="border-zinc-800 bg-zinc-950">
        <DrawerHeader>
          <DrawerTitle>Backlog</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj zadania…"
              className="border-zinc-800 bg-zinc-900 pl-9"
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
        <div className="border-t border-zinc-800 p-4">
          <Button
            variant="outline"
            className="w-full border-zinc-800"
            onClick={() => {
              const title = window.prompt("Tytuł zadania:");
              if (title?.trim()) onQuickAdd(title.trim());
            }}
          >
            <Plus className="size-4" />
            Szybkie dodanie
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
