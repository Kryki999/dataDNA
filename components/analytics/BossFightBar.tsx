"use client";

import { useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { closeDeal } from "@/lib/actions/deals";

type BossFightBarProps = {
  total: number;
  goal: number;
  percent: number;
};

export function BossFightBar({ total, goal, percent }: BossFightBarProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCloseDeal() {
    const value = Number(amount);
    if (!value || value <= 0) return;

    startTransition(async () => {
      await closeDeal({
        amountPln: value,
        description,
      });
      setAmount("");
      setDescription("");
      setOpen(false);
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-emerald-400" />
          <div>
            <h2 className="text-lg font-semibold">Boss Fight</h2>
            <p className="text-sm text-muted-foreground">
              Cel: {goal.toLocaleString("pl-PL")} PLN
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="bg-emerald-500/20 text-emerald-300"
          onClick={() => setOpen(true)}
        >
          Zamknij deal
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowy deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Kwota (PLN)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Wdrożenie systemu..."
                />
              </div>
              <Button onClick={handleCloseDeal} disabled={isPending}>
                Dodaj do Boss Fight
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium tabular-nums">
            {total.toLocaleString("pl-PL")} PLN
          </span>
          <span className="text-muted-foreground tabular-nums">{percent}%</span>
        </div>
        <Progress
          value={percent}
          className="w-full [&_[data-slot=progress-track]]:h-4 [&_[data-slot=progress-track]]:bg-zinc-800 [&_[data-slot=progress-indicator]]:bg-emerald-400"
        />
        <p className="text-xs text-muted-foreground">
          {Math.max(0, goal - total).toLocaleString("pl-PL")} PLN do celu
        </p>
      </div>
    </section>
  );
}
