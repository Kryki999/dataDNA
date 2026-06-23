"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import type { PlannerIcon } from "@/lib/planner/types";
import { PLANNER_ICONS } from "@/lib/planner/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EYEBROW, INPUT_SURFACE } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

const ICON_LABELS: Record<PlannerIcon, string> = {
  task: "Zadanie",
  phone: "Telefon",
  follow_up: "Follow-up",
  design: "Design",
  meeting: "Spotkanie",
};

function defaultDueLocal(): string {
  const d = new Date();
  const minutes = d.getMinutes();
  const rounded = minutes < 30 ? 30 : 0;
  if (rounded === 0) d.setHours(d.getHours() + 1);
  d.setMinutes(rounded, 0, 0);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

type PlannerScheduleAddProps = {
  onSubmit: (title: string, icon: PlannerIcon, dueAt: Date) => void;
  onClose: () => void;
};

export function PlannerScheduleAdd({ onSubmit, onClose }: PlannerScheduleAddProps) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<PlannerIcon>("task");
  const [dueLocal, setDueLocal] = useState(defaultDueLocal);

  useEffect(() => {
    document.getElementById("planner-schedule-add-title")?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed || !dueLocal) return;
    onSubmit(trimmed, icon, new Date(dueLocal));
    onClose();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 border-b border-dna-border p-5">
        <div>
          <p className={EYEBROW}>Nowe zadanie</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trafia od razu na kalendarz w wybranym terminie
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-4 p-5">
        <Input
          id="planner-schedule-add-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Tytuł zadania…"
          className={cn(INPUT_SURFACE, "text-base")}
        />

        <div className="space-y-2">
          <p className={EYEBROW}>Termin</p>
          <Input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className={INPUT_SURFACE}
          />
        </div>

        <div className="space-y-2">
          <p className={EYEBROW}>Typ</p>
          <div className="flex flex-wrap gap-1.5">
            {PLANNER_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  icon === key
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-dna-border/40 bg-dna-inset text-muted-foreground hover:text-foreground",
                )}
              >
                <PlannerIconBadge icon={key} className="size-4" />
                {ICON_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-dna-border p-5">
        <Button className="w-full" onClick={handleSubmit} disabled={!title.trim() || !dueLocal}>
          Dodaj zadanie
        </Button>
      </div>
    </div>
  );
}
