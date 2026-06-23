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
        "absolute inset-x-0",
        isOver && "bg-primary/15 ring-1 ring-inset ring-primary/30",
        className,
      )}
    />
  );
}
