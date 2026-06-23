"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Search } from "lucide-react";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerBacklogCard } from "@/components/planner/PlannerBacklogCard";
import { BACKLOG_DROP_ID } from "@/components/planner/planner-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EYEBROW, FLAT_CONTAINER, INPUT_SURFACE } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PlannerBacklogBoardProps = {
  events: PlannerEventWithMeta[];
  onQuickAddClick: () => void;
  onSelect?: (id: string) => void;
  className?: string;
};

export function PlannerBacklogBoard({
  events,
  onQuickAddClick,
  onSelect,
  className,
}: PlannerBacklogBoardProps) {
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
    <section className={cn("space-y-3 overflow-visible", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={EYEBROW}>Tablica zadań</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Przeciągnij karteczkę na kalendarz albo upuść tu z powrotem
          </p>
        </div>
        <Button onClick={onQuickAddClick}>
          <Plus className="size-4" />
          Dodaj zadanie na tablicę
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          FLAT_CONTAINER,
          "min-h-[200px] overflow-visible p-4 transition-colors",
          isOver && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
        )}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj na tablicy…"
              className={cn(INPUT_SURFACE, "pl-9")}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length}{" "}
            {filtered.length === 1 ? "karteczka" : "karteczek"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-dna-border/40 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Tablica pusta — dodaj karteczkę lub upuść tu zadanie z kalendarza
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 overflow-visible px-1 pb-1 pt-3">
            {filtered.map((event, index) => (
              <PlannerBacklogCard
                key={event.id}
                event={event}
                variant="sticky"
                stickyIndex={index}
                onClick={onSelect ? () => onSelect(event.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
