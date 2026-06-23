"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Search } from "lucide-react";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerBacklogCard } from "@/components/planner/PlannerBacklogCard";
import { BACKLOG_DROP_ID } from "@/components/planner/planner-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INPUT_SURFACE, SURFACE_INSET } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PlannerBacklogPanelProps = {
  events: PlannerEventWithMeta[];
  onQuickAddClick: () => void;
  onSelect?: (id: string) => void;
  className?: string;
};

export function PlannerBacklogPanel({
  events,
  onQuickAddClick,
  onSelect,
  className,
}: PlannerBacklogPanelProps) {
  const [query, setQuery] = useState("");
  const { isOver, setNodeRef } = useDroppable({ id: BACKLOG_DROP_ID });

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
    <aside
      ref={setNodeRef}
      className={cn(
        "flex w-full shrink-0 flex-col lg:w-[25%] lg:min-w-[240px] lg:max-w-[320px]",
        SURFACE_INSET,
        isOver && "bg-primary/5 ring-1 ring-primary/40",
        className,
      )}
    >
      <div className="border-b border-dna-border px-3 py-3">
        <h2 className="text-sm font-semibold text-foreground">Backlog</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Zadania bez terminu — przeciągnij na siatkę
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj zadania…"
            className={cn(INPUT_SURFACE, "pl-9")}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Brak zadań w backlogu
          </p>
        ) : (
          filtered.map((event) => (
            <PlannerBacklogCard
              key={event.id}
              event={event}
              onClick={onSelect ? () => onSelect(event.id) : undefined}
            />
          ))
        )}
      </div>

      <div className="border-t border-dna-border p-3">
        <Button
          variant="outline"
          className="w-full border-dna-border"
          onClick={onQuickAddClick}
        >
          <Plus className="size-4" />
          Szybkie dodanie
        </Button>
      </div>
    </aside>
  );
}
