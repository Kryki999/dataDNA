"use client";

import { useTransition } from "react";
import { addDays, addWeeks } from "date-fns";
import { Bell, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateLead } from "@/lib/actions/leads";
import type { Lead } from "@/lib/crm/pipeline";
import { cn } from "@/lib/utils";

type QuickReminderButtonProps = {
  lead: Lead;
  onUpdated: (lead: Lead) => void;
  className?: string;
};

export function QuickReminderButton({
  lead,
  onUpdated,
  className,
}: QuickReminderButtonProps) {
  const [isPending, startTransition] = useTransition();

  function schedule(at: Date) {
    startTransition(async () => {
      try {
        const updated = await updateLead(lead.id, { nextFollowUpAt: at });
        if (updated) {
          onUpdated(updated);
          toast.success("Przypomnienie ustawione");
        }
      } catch {
        toast.error("Nie udało się ustawić przypomnienia");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            className={cn(
              "size-7 shrink-0 text-muted-foreground hover:text-primary",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label="Dodaj przypomnienie"
          />
        }
      >
        <Plus className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => schedule(addDays(new Date(), 1))}>
          <Bell className="size-3.5" />
          Jutro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => schedule(addDays(new Date(), 3))}>
          <Bell className="size-3.5" />
          Za 3 dni
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => schedule(addWeeks(new Date(), 1))}>
          <Bell className="size-3.5" />
          Za tydzień
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => schedule(addDays(new Date(), 14))}
        >
          <Bell className="size-3.5" />
          Za 2 tygodnie
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
