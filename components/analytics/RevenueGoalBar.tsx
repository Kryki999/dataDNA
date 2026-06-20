"use client";

import { Progress } from "@/components/ui/progress";
import { STAT_LABEL, STAT_VALUE, SECTION_LABEL } from "@/lib/ui-patterns";

type RevenueGoalBarProps = {
  total: number;
  goal: number;
  percent: number;
};

export function RevenueGoalBar({ total, goal, percent }: RevenueGoalBarProps) {
  return (
    <section className="space-y-4">
      <p className={SECTION_LABEL}>Zyski</p>
      <p className={STAT_VALUE}>
        {total.toLocaleString("pl-PL")}{" "}
        <span className="text-lg font-normal text-muted-foreground">
          / {goal.toLocaleString("pl-PL")} PLN
        </span>
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={STAT_LABEL}>Postęp celu</span>
          <span className="font-medium tabular-nums">{percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {Math.max(0, goal - total).toLocaleString("pl-PL")} PLN do celu
        </p>
      </div>
    </section>
  );
}
