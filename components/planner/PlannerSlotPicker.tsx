"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { generateDaySlots } from "@/components/planner/planner-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PlannerSlotPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: Date;
  onSelect: (dueAt: Date) => void;
};

export function PlannerSlotPicker({
  open,
  onOpenChange,
  day,
  onSelect,
}: PlannerSlotPickerProps) {
  const slots = generateDaySlots(day);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-dna-border/40 bg-dna-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Wybierz slot — {format(day, "d MMMM yyyy", { locale: pl })}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {slots.map((slot) => (
            <Button
              key={slot.id}
              variant="ghost"
              className="w-full justify-start font-mono text-sm text-foreground hover:bg-dna-inset"
              onClick={() => {
                onSelect(slot.date);
                onOpenChange(false);
              }}
            >
              {format(slot.date, "HH:mm")}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
