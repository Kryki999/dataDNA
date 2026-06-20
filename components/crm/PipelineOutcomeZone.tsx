"use client";

import { useDroppable } from "@dnd-kit/core";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStageId } from "@/lib/crm/pipeline";

type PipelineOutcomeZoneProps = {
  id: Extract<PipelineStageId, "won" | "lost">;
  label: string;
  description: string;
  variant: "won" | "lost";
};

export function PipelineOutcomeZone({
  id,
  label,
  description,
  variant,
}: PipelineOutcomeZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center transition-colors",
        variant === "won"
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-zinc-600/60 bg-zinc-900/40",
        isOver &&
          (variant === "won"
            ? "border-emerald-400 bg-emerald-500/15 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]"
            : "border-zinc-400 bg-zinc-800/60 shadow-[inset_0_0_0_1px_rgba(161,161,170,0.35)]"),
      )}
    >
      {variant === "won" ? (
        <CheckCircle2 className="size-5 text-emerald-400" />
      ) : (
        <XCircle className="size-5 text-zinc-400" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
