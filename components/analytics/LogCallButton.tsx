"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logQuickCall } from "@/lib/actions/reach";
import { cn } from "@/lib/utils";

type LogCallButtonProps = {
  callsToday: number;
  streak: number;
  onOptimisticLog?: () => void;
  compact?: boolean;
  className?: string;
};

export function LogCallButton({
  callsToday,
  streak,
  onOptimisticLog,
  compact = false,
  className,
}: LogCallButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogCall() {
    onOptimisticLog?.();

    toast.success("Call zalogowany!", {
      description: `+1 do dzisiejszego wyniku · Streak: ${streak} dni`,
    });

    startTransition(async () => {
      try {
        await logQuickCall();
        router.refresh();
      } catch {
        toast.error("Nie udało się zapisać calla", {
          description: "Spróbuj ponownie za chwilę.",
        });
        router.refresh();
      }
    });
  }

  if (compact) {
    return (
      <Button
        size="lg"
        onClick={handleLogCall}
        disabled={isPending}
        className={cn(
          "h-14 w-full gap-2 bg-primary text-base font-semibold text-primary-foreground shadow-[0_0_24px_oklch(0.78_0.19_155/0.35)] hover:bg-primary/90",
          className,
        )}
      >
        <Plus className="size-5" />
        Log Call
        <span className="ml-1 font-mono tabular-nums opacity-80">
          ({callsToday})
        </span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogCall}
      disabled={isPending}
      className={cn(
        "group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-primary/30 bg-card px-6 py-10 transition-all",
        "shadow-[0_0_40px_oklch(0.78_0.19_155/0.12)] hover:border-primary/60 hover:shadow-[0_0_48px_oklch(0.78_0.19_155/0.22)]",
        "active:scale-[0.99] disabled:opacity-60",
        className,
      )}
    >
      <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary shadow-[0_0_24px_oklch(0.78_0.19_155/0.35)]">
        <Phone className="size-7" />
        <Plus className="absolute -right-0.5 -top-0.5 size-5 rounded-full bg-primary p-0.5 text-primary-foreground" />
      </div>
      <div className="relative text-center">
        <p className="text-xl font-semibold tracking-tight">Log Call</p>
        <p className="mt-1 text-sm text-muted-foreground">
          +1 do dzisiejszego wyniku · teraz:{" "}
          <span className="font-mono font-medium text-primary tabular-nums">
            {callsToday}
          </span>
        </p>
      </div>
    </button>
  );
}
