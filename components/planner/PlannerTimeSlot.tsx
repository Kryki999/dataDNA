"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type PlannerTimeSlotProps = {
  id: string;
  className?: string;
  style?: React.CSSProperties;
};

export function PlannerTimeSlot({ id, className, style }: PlannerTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute inset-x-0 border-b border-zinc-800/20",
        isOver && "bg-sky-500/10",
        className,
      )}
    />
  );
}
