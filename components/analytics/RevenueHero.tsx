"use client";

import { cn } from "@/lib/utils";
import { REVENUE_GOAL_PLN } from "@/lib/constants";

type RevenueHeroProps = {
  total: number;
  goal: number;
  percentChange: number;
  thisMonth: number;
};

export function RevenueHero({
  total,
  goal,
  percentChange,
  thisMonth,
}: RevenueHeroProps) {
  const isPositive = percentChange >= 0;
  const formattedChange = `${isPositive ? "+" : ""}${percentChange.toFixed(2)}%`;

  return (
    <section className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Całkowity przychód
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-zinc-50 sm:text-5xl">
          {total.toLocaleString("pl-PL")}
          <span className="ml-2 text-xl font-normal text-zinc-500 sm:text-2xl">
            PLN
          </span>
        </p>
        {total > 0 || percentChange !== 0 ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              isPositive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400",
            )}
          >
            {formattedChange}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <p className="text-zinc-400">
          Ten miesiąc:{" "}
          <span
            className={cn(
              "font-medium tabular-nums",
              thisMonth > 0 ? "text-emerald-400" : "text-zinc-300",
            )}
          >
            {thisMonth > 0 ? "+" : ""}
            {thisMonth.toLocaleString("pl-PL")} PLN
          </span>
        </p>
        <p className="text-zinc-600">·</p>
        <p className="text-zinc-500">
          Cel: {goal.toLocaleString("pl-PL")} PLN
          {goal === REVENUE_GOAL_PLN ? null : (
            <span className="ml-1 text-zinc-600">(env)</span>
          )}
        </p>
      </div>
    </section>
  );
}
