"use client";

import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EYEBROW } from "@/lib/ui-patterns";
import { formatWeekRange } from "@/components/planner/planner-utils";

type PlannerToolbarProps = {
  weekDays: Date[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  backlogOpen: boolean;
  onToggleBacklog: () => void;
  onAddTask: () => void;
  isMobile?: boolean;
};

export function PlannerToolbar({
  weekDays,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  hideCompleted,
  onToggleHideCompleted,
  backlogOpen,
  onToggleBacklog,
  onAddTask,
  isMobile,
}: PlannerToolbarProps) {
  return (
    <header className="mb-2 space-y-4">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <p className={EYEBROW}>Planner</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kalendarz i tablica zadań — zaplanuj lub zostaw na później
          </p>
        </div>
        <Button onClick={onAddTask} className="w-full shrink-0 lg:w-auto">
          <Plus className="size-4" />
          Dodaj zadanie
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!isMobile ? (
          <Button variant="outline" size="sm" onClick={onToggleBacklog}>
            {backlogOpen ? "Ukryj tablicę" : "Tablica zadań"}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onThisWeek}>
          Ten tydzień
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={onPrevWeek}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[128px] px-1 text-center text-sm font-medium capitalize text-foreground">
            {formatWeekRange(weekDays)}
          </span>
          <Button variant="outline" size="icon" onClick={onNextWeek}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          variant={hideCompleted ? "default" : "outline"}
          size="icon"
          onClick={onToggleHideCompleted}
          title="Ukryj wykonane"
          aria-label="Ukryj wykonane"
        >
          <Filter className="size-4" />
        </Button>
      </div>
    </header>
  );
}
