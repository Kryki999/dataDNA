"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logReachMetrics } from "@/lib/actions/reach";

export function QuickReachForm() {
  const [xImpressions, setXImpressions] = useState("");
  const [metaClicks, setMetaClicks] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const xValue = Number(xImpressions) || 0;
    const metaValue = Number(metaClicks) || 0;

    if (xValue <= 0 && metaValue <= 0) {
      toast.error("Wpisz wartość X lub Meta");
      return;
    }

    startTransition(async () => {
      try {
        await logReachMetrics({
          xImpressions: xValue,
          metaClicks: metaValue,
        });
        toast.success("Zasięgi zapisane", {
          description: [
            xValue > 0 ? `X +${xValue}` : null,
            metaValue > 0 ? `Meta +${metaValue}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        });
        setXImpressions("");
        setMetaClicks("");
      } catch {
        toast.error("Nie udało się zapisać zasięgów");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-border/80 bg-muted/20 p-4 sm:grid-cols-2"
    >
      <div className="space-y-2 sm:col-span-2">
        <p className="text-sm text-muted-foreground">
          Wpisz zbiorcze wartości na koniec dnia (X / Meta Ads).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="xImpressions">X zasięgi (+)</Label>
        <Input
          id="xImpressions"
          type="number"
          min="0"
          inputMode="numeric"
          value={xImpressions}
          onChange={(event) => setXImpressions(event.target.value)}
          placeholder="0"
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaClicks">Meta kliki (+)</Label>
        <Input
          id="metaClicks"
          type="number"
          min="0"
          inputMode="numeric"
          value={metaClicks}
          onChange={(event) => setMetaClicks(event.target.value)}
          placeholder="0"
          className="font-mono"
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Zapis..." : "Loguj zasięgi X / Meta"}
        </Button>
      </div>
    </form>
  );
}
