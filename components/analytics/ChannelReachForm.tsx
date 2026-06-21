"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logReachMetrics } from "@/lib/actions/reach";
import type { ReachChannelConfig } from "@/lib/reach-channels";

type ChannelReachFormProps = {
  channel: ReachChannelConfig;
  onSuccess?: () => void;
};

export function ChannelReachForm({ channel, onSuccess }: ChannelReachFormProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const numValue = Number(value) || 0;
    if (numValue <= 0) {
      toast.error("Wpisz wartość większą od zera");
      return;
    }

    const payload = {
      coldCalls: channel.id === "coldCalls" ? numValue : 0,
      xImpressions: channel.id === "xImpressions" ? numValue : 0,
      metaClicks: channel.id === "metaClicks" ? numValue : 0,
    };

    startTransition(async () => {
      try {
        await logReachMetrics(payload);
        toast.success("Zapisano", {
          description: `${channel.label} +${numValue.toLocaleString("pl-PL")}`,
        });
        setValue("");
        onSuccess?.();
        router.refresh();
      } catch {
        toast.error("Nie udało się zapisać");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`reach-${channel.id}`} className="text-xs uppercase tracking-wide text-zinc-500">
          {channel.inputLabel}
        </Label>
        <Input
          id={`reach-${channel.id}`}
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={channel.inputPlaceholder}
          className="border-zinc-800 bg-zinc-900/80 font-mono text-zinc-100 placeholder:text-zinc-600"
        />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="w-full border-0 font-medium"
        style={{
          backgroundColor: channel.color,
          boxShadow: `0 0 20px ${channel.glowColor}`,
        }}
      >
        {isPending ? "Zapis..." : channel.submitLabel}
      </Button>
    </form>
  );
}
