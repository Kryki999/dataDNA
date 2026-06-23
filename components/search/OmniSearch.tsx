"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchClients, type ClientSearchResult } from "@/lib/actions/clients";
import { cn } from "@/lib/utils";

type OmniSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectClient: (clientId: string) => void;
};

export function OmniSearch({
  open,
  onOpenChange,
  onSelectClient,
}: OmniSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchClients(q, 12);
        setResults(rows);
      });
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-dna-border bg-dna-surface p-0 sm:max-w-md">
        <DialogHeader className="border-b border-dna-border px-4 py-3">
          <DialogTitle className="sr-only">Szukaj klientów</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj klientów…"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              autoFocus
            />
            <kbd className="hidden rounded border border-dna-border px-1.5 text-[10px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>
        </DialogHeader>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {query.trim() ? "Brak wyników" : "Wpisz nazwę firmy lub tag"}
            </li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-dna-inset",
                  )}
                  onClick={() => onSelectClient(r.id)}
                >
                  <span className="font-medium">{r.displayName}</span>
                  {r.tags.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {r.tags.slice(0, 3).join(" · ")}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
