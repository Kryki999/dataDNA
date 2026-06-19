"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type RevenueGoalBarProps = {
  total: number;
  goal: number;
  percent: number;
};

export function RevenueGoalBar({ total, goal, percent }: RevenueGoalBarProps) {
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
    <Card className="border-border/80 bg-card/80">
      <CardHeader>
        <CardDescription>Cel przychodu</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {total.toLocaleString("pl-PL")} PLN
        </CardTitle>
        <CardAction>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Zamknij deal
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Cel: {goal.toLocaleString("pl-PL")} PLN
          </span>
          <span className="font-medium tabular-nums">{percent}%</span>
        </div>
        <Progress
          value={percent}
          className="h-2 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-indicator]]:shadow-[0_0_12px_rgba(0,85,255,0.55)]"
        />
        <p className="text-xs text-muted-foreground">
          {Math.max(0, goal - total).toLocaleString("pl-PL")} PLN do celu
        </p>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-sm">
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
                inputMode="numeric"
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
            <Button
              onClick={handleCloseDeal}
              disabled={isPending}
              className="w-full"
            >
              Dodaj do celu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
