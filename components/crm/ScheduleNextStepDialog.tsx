"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { schedulePipelineDealFollowUp } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INPUT_SURFACE } from "@/lib/ui-patterns";

type ScheduleNextStepDialogProps = {
  dealId: string;
  dealTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: () => void;
};

function defaultDueLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function ScheduleNextStepDialog({
  dealId,
  dealTitle,
  open,
  onOpenChange,
  onScheduled,
}: ScheduleNextStepDialogProps) {
  const [title, setTitle] = useState(`Następny krok: ${dealTitle}`);
  const [dueLocal, setDueLocal] = useState(defaultDueLocal);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dueLocal) return;

    startTransition(async () => {
      try {
        await schedulePipelineDealFollowUp(dealId, {
          title: title.trim() || undefined,
          dueAt: new Date(dueLocal),
        });
        toast.success("Dodano do Plannera");
        onOpenChange(false);
        onScheduled?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się zaplanować",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zaplanuj następny krok</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="next-step-title">Zadanie</Label>
            <Input
              id="next-step-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT_SURFACE}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next-step-due">Kiedy</Label>
            <Input
              id="next-step-due"
              type="datetime-local"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
              className={INPUT_SURFACE}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            Dodaj do Plannera
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ScheduleNextStepButtonProps = {
  dealId: string;
  dealTitle: string;
  disabled?: boolean;
  onScheduled?: () => void;
};

export function ScheduleNextStepButton({
  dealId,
  dealTitle,
  disabled,
  onScheduled,
}: ScheduleNextStepButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-dna-border/40"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <CalendarPlus className="size-3.5" />
        Zaplanuj następny krok
      </Button>
      <ScheduleNextStepDialog
        dealId={dealId}
        dealTitle={dealTitle}
        open={open}
        onOpenChange={setOpen}
        onScheduled={onScheduled}
      />
    </>
  );
}
