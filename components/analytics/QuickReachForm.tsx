"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logReachMetrics } from "@/lib/actions/reach";

export function QuickReachForm() {
  const [coldCalls, setColdCalls] = useState("0");
  const [xImpressions, setXImpressions] = useState("0");
  const [metaClicks, setMetaClicks] = useState("0");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await logReachMetrics({
        coldCalls: Number(coldCalls) || 0,
        xImpressions: Number(xImpressions) || 0,
        metaClicks: Number(metaClicks) || 0,
      });
      setSaved(true);
      setColdCalls("0");
      setXImpressions("0");
      setMetaClicks("0");
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="coldCalls">Telefony (+)</Label>
        <Input
          id="coldCalls"
          type="number"
          min="0"
          inputMode="numeric"
          value={coldCalls}
          onChange={(event) => setColdCalls(event.target.value)}
          className="min-h-11"
        />
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
          className="min-h-11"
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
          className="min-h-11"
        />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" disabled={isPending} className="min-h-11 w-full">
          {saved ? "Zapisano!" : isPending ? "Zapis..." : "Loguj zasięg"}
        </Button>
      </div>
    </form>
  );
}
