"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addClientNote, getClientFeed, type ClientFeedItem } from "@/lib/actions/notes";
import { EYEBROW } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type ClientTimelineFeedProps = {
  clientId: string;
  className?: string;
};

export function ClientTimelineFeed({ clientId, className }: ClientTimelineFeedProps) {
  const [items, setItems] = useState<ClientFeedItem[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const feed = await getClientFeed(clientId);
      setItems(feed);
    });
  }, [clientId]);

  function handleAdd() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const note = await addClientNote(clientId, draft);
      if (note) {
        setItems((current) => [
          {
            id: note.id,
            body: note.body,
            type: "user",
            createdAt: note.createdAt,
            dealId: note.dealId,
            dealTitle: null,
            metadata: null,
          },
          ...current,
        ]);
        setDraft("");
      }
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Szybka notatka…"
          rows={2}
          className="border-dna-border/40 bg-dna-inset"
        />
        <Button
          size="sm"
          variant="outline"
          className="border-dna-border/40"
          onClick={handleAdd}
          disabled={isPending || !draft.trim()}
        >
          Dodaj do osi czasu
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak wpisów. Dodaj pierwszą notatkę.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={cn(
                "rounded-xl border border-dna-border/25 bg-dna-inset p-3",
                item.type === "system" && "border-dna-border/15 opacity-90",
              )}
            >
              {item.dealTitle ? (
                <p className={cn(EYEBROW, "mb-1 normal-case tracking-normal")}>
                  Projekt: {item.dealTitle}
                </p>
              ) : null}
              <p className="text-sm leading-relaxed">{item.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {format(item.createdAt, "d MMM yyyy, HH:mm", { locale: pl })}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
