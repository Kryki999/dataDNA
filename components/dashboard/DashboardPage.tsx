import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PAGE_SHELL } from "@/lib/ui-patterns";

type DashboardPageProps = {
  children: ReactNode;
  className?: string;
  wide?: boolean;
};

export function DashboardPage({
  children,
  className,
  wide = false,
}: DashboardPageProps) {
  return (
    <div
      className={cn(
        PAGE_SHELL,
        wide && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
