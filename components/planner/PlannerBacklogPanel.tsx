"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Search } from "lucide-react";
import type { PlannerEventWithMeta } from "@/lib/planner/types";
import { PlannerBacklogCard } from "@/components/planner/PlannerBacklogCard";
import { BACKLOG_DROP_ID } from "@/components/planner/planner-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PlannerBacklogPanelProps = {
  events: PlannerEventWithMeta[];
  onQuickAdd: (title: string) => void;
  onSelect?: (id: string) => void;
  className?: string;
};

export function PlannerBacklogPanel({
  events,
  onQuickAdd,
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

  function handleQuickAdd() {
    const title = window.prompt("Tytuł zadania:");
    if (title?.trim()) onQuickAdd(title.trim());
  }

  return (
    <aside
      ref={setNodeRef}
      className={cn(
        "flex w-full shrink-0 flex-col rounded-lg border border-zinc-800 bg-zinc-950/50 lg:w-[25%] lg:min-w-[240px] lg:max-w-[320px]",
        isOver && "border-sky-500/40 bg-sky-500/5",
        className,
      )}
    >
      <div className="border-b border-zinc-800 px-3 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">Backlog</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Zadania bez terminu — przeciągnij na siatkę
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj zadania…"
            className="border-zinc-800 bg-zinc-900 pl-9"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500">
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

      <div className="border-t border-zinc-800 p-3">
        <Button
          variant="outline"
          className="w-full border-zinc-800"
          onClick={handleQuickAdd}
        >
          <Plus className="size-4" />
          Szybkie dodanie
        </Button>
      </div>
    </aside>
  );
}
