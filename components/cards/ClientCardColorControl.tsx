"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CardColorPicker } from "@/components/cards/CardColorPicker";
import { updateClient } from "@/lib/actions/clients";
import type { Client, ClientCardColor } from "@/lib/crm/clients";
import { isValidCardColor } from "@/lib/crm/clients";

type ClientCardColorControlProps = {
  clientId: string;
  value: string | null;
  onUpdated: (client: Client) => void;
  className?: string;
  size?: "sm" | "md";
  align?: "start" | "center" | "end";
};

export function ClientCardColorControl({
  clientId,
  value,
  onUpdated,
  className,
  size = "md",
  align = "end",
}: ClientCardColorControlProps) {
  const [isPending, startTransition] = useTransition();
  const selected = isValidCardColor(value) ? value : "slate";

  function handleChange(color: ClientCardColor) {
    startTransition(async () => {
      try {
        const updated = await updateClient(clientId, { cardColor: color });
        if (updated) {
          onUpdated(updated);
        }
      } catch {
        toast.error("Nie udało się zapisać koloru");
      }
    });
  }

  return (
    <CardColorPicker
      value={selected}
      onChange={handleChange}
      disabled={isPending}
      className={className}
      size={size}
      align={align}
    />
  );
}
