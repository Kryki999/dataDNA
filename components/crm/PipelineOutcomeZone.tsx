"use client";

import { useDroppable } from "@dnd-kit/core";
import { CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStageId } from "@/lib/crm/pipeline";

type PipelineOutcomeZoneProps = {
  id: Extract<PipelineStageId, "won" | "lost">;
  label: string;
  description: string;
  variant: "won" | "lost";
};

type PipelineOutcomeZoneViewProps = PipelineOutcomeZoneProps & {
  zoneRef?: (element: HTMLElement | null) => void;
  isOver?: boolean;
};

function PipelineOutcomeZoneView({
  label,
  description,
  variant,
  zoneRef,
  isOver = false,
}: PipelineOutcomeZoneViewProps) {
  return (
    <div
      ref={zoneRef}
      className={cn(
        "flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
        variant === "won"
          ? "border-emerald-400/60 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          : "border-rose-400/60 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
        isOver &&
          (variant === "won"
            ? "border-emerald-300 bg-emerald-500/30 ring-2 ring-emerald-400/40"
            : "border-rose-300 bg-rose-500/30 ring-2 ring-rose-400/40"),
      )}
    >
      {variant === "won" ? (
        <CheckCircle2 className="size-7 text-emerald-300" />
      ) : (
        <Trash2 className="size-7 text-rose-300" />
      )}
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            variant === "won" ? "text-emerald-200" : "text-rose-200",
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function PipelineOutcomeZoneStatic(props: PipelineOutcomeZoneProps) {
  return <PipelineOutcomeZoneView {...props} />;
}

export function PipelineOutcomeZone({
  id,
  ...props
}: PipelineOutcomeZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <PipelineOutcomeZoneView
      id={id}
      {...props}
      zoneRef={setNodeRef}
      isOver={isOver}
    />
  );
}
