"use client";

import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTION_LABEL } from "@/lib/ui-patterns";
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
  isMobile,
}: PlannerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className={SECTION_LABEL}>Planner</p>
      <div className="flex flex-wrap items-center gap-2">
        {!isMobile && (
          <Button variant="outline" size="sm" onClick={onToggleBacklog}>
            {backlogOpen ? "Ukryj backlog" : "Backlog"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onThisWeek}>
          Ten tydzień
        </Button>
        <Button variant="outline" size="icon" onClick={onPrevWeek}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[120px] text-center text-sm font-medium capitalize text-zinc-200">
          {formatWeekRange(weekDays)}
        </span>
        <Button variant="outline" size="icon" onClick={onNextWeek}>
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant={hideCompleted ? "default" : "outline"}
          size="icon"
          onClick={onToggleHideCompleted}
          title="Ukryj wykonane"
        >
          <Filter className="size-4" />
        </Button>
      </div>
    </div>
  );
}
