"use client";

import { useTransition } from "react";
import { Flame, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

type DashboardHeaderProps = {
  currentStreak: number;
};

export function DashboardHeader({ currentStreak }: DashboardHeaderProps) {
  const [isPending] = useTransition();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
          Selly
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Sales & Reach Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <Flame className="size-4 text-emerald-400" />
          <span className="text-sm font-semibold tabular-nums">
            {currentStreak} dni
          </span>
        </div>
        <form action={logoutAction}>
          <Button variant="ghost" size="icon" disabled={isPending} type="submit">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
