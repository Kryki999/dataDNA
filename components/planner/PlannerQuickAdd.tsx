"use client";

import { useEffect, useState } from "react";
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

type PlannerQuickAddProps = {
  onSubmit: (title: string, icon: PlannerIcon) => void;
  onClose: () => void;
};

export function PlannerQuickAdd({ onSubmit, onClose }: PlannerQuickAddProps) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<PlannerIcon>("task");

  useEffect(() => {
    const input = document.getElementById("planner-quick-add-title");
    input?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, icon);
    onClose();
  }

  return (
    <div className="flex max-h-[min(85vh,480px)] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-dna-border p-5">
        <div>
          <p className={EYEBROW}>Nowe zadanie</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bez terminu — przeciągnij na kalendarz, gdy będziesz gotowy
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-4 p-5">
        <Input
          id="planner-quick-add-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Tytuł zadania…"
          className={cn(INPUT_SURFACE, "text-base")}
        />

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
        <Button className="w-full" onClick={handleSubmit} disabled={!title.trim()}>
          Dodaj zadanie na tablicę
        </Button>
      </div>
    </div>
  );
}
