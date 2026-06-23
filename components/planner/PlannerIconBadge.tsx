import {
  Calendar,
  CheckSquare,
  Palette,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PlannerIcon } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<PlannerIcon, LucideIcon> = {
  task: CheckSquare,
  phone: Phone,
  follow_up: Calendar,
  design: Palette,
  meeting: Users,
};

export function PlannerIconBadge({
  icon,
  className,
}: {
  icon: PlannerIcon;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? CheckSquare;
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded border border-dna-border bg-dna-trough text-primary",
        className,
      )}
    >
      <Icon className="size-3" />
    </span>
  );
}
