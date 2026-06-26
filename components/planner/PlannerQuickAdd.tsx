"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import {
  searchClients,
  type ClientSearchResult,
} from "@/lib/actions/clients";
import type { PlannerIcon } from "@/lib/planner/types";
import { PLANNER_ICONS } from "@/lib/planner/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EYEBROW, INPUT_SURFACE, SURFACE_CARD } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

const ICON_LABELS: Record<PlannerIcon, string> = {
  task: "Zadanie",
  phone: "Telefon",
  follow_up: "Follow-up",
  design: "Design",
  meeting: "Spotkanie",
};

type PlannerQuickAddProps = {
  onSubmit: (title: string, icon: PlannerIcon, clientId?: string | null) => void;
  onClose: () => void;
};

function parseMentionQuery(title: string): { query: string; start: number } | null {
  const match = /@([^\s@]*)$/.exec(title);
  if (!match || match.index === undefined) return null;
  return { query: match[1] ?? "", start: match.index };
}

export function PlannerQuickAdd({ onSubmit, onClose }: PlannerQuickAddProps) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<PlannerIcon>("task");
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(
    null,
  );
  const [mentionMatches, setMentionMatches] = useState<ClientSearchResult[]>([]);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const mention = parseMentionQuery(title);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mention || mention.query.length < 1) {
      setMentionMatches([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const results = await searchClients(mention.query);
        setMentionMatches(results);
      });
    }, 150);
    return () => clearTimeout(t);
  }, [mention?.query]);

  function applyMention(client: ClientSearchResult) {
    if (!mention) return;
    const before = title.slice(0, mention.start);
    const display = client.company ?? client.name;
    setTitle(`${before}@${display} `);
    setSelectedClient(client);
    setMentionMatches([]);
    inputRef.current?.focus();
  }

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const cleanTitle = trimmed.replace(/@[^\s@]+\s*/g, "").trim() || trimmed;
    onSubmit(cleanTitle, icon, selectedClient?.id ?? null);
    onClose();
  }

  return (
    <div className="flex max-h-[min(85vh,480px)] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-dna-border p-5">
        <div>
          <p className={EYEBROW}>Nowe zadanie</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Użyj @ aby powiązać z klientem — przeciągnij na kalendarz później
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-4 p-5">
        <div className="relative">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!e.target.value.includes("@")) {
                setSelectedClient(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !mentionMatches.length) handleSubmit();
            }}
            placeholder="Tytuł zadania… (@klient)"
            className={cn(INPUT_SURFACE, "text-base")}
          />
          {mention && mentionMatches.length > 0 ? (
            <div
              className={cn(
                SURFACE_CARD,
                "absolute inset-x-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-lg border border-dna-border p-1",
              )}
            >
              {mentionMatches.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className="flex w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-dna-inset"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyMention(client);
                  }}
                >
                  <span className="font-medium text-foreground">
                    {client.company ?? client.name}
                  </span>
                  {client.company ? (
                    <span className="ml-2 truncate text-muted-foreground">
                      {client.name}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedClient ? (
          <p className="text-xs text-primary/90">
            Klient: {selectedClient.company ?? selectedClient.name}
          </p>
        ) : null}

        <div className="space-y-2">
          <p className={EYEBROW}>Typ</p>
          <div className="flex flex-wrap gap-1.5">
            {PLANNER_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  icon === key
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-dna-border/40 bg-dna-inset text-muted-foreground hover:text-foreground",
                )}
              >
                <PlannerIconBadge icon={key} className="size-4" />
                {ICON_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-dna-border p-5">
        <Button className="w-full" onClick={handleSubmit} disabled={!title.trim()}>
          Dodaj zadanie na tablicę
        </Button>
      </div>
    </div>
  );
}
