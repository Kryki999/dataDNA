"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  searchClients,
  type ClientSearchResult,
} from "@/lib/actions/clients";
import type { PipelineDealStatus } from "@/lib/crm/pipeline-deals";
import {
  silentCreatePipelineDeal,
} from "@/lib/actions/pipeline-deals";
import { cn } from "@/lib/utils";
import { SURFACE_CARD } from "@/lib/ui-patterns";

type ClientTypeaheadProps = {
  placeholder?: string;
  autoFocus?: boolean;
  defaultStatus?: PipelineDealStatus;
  onCreated: (result: { clientId: string; dealId: string }) => void;
  onCancel?: () => void;
  className?: string;
};

export function ClientTypeahead({
  placeholder = "Nazwa firmy lub klienta…",
  autoFocus,
  defaultStatus = "new",
  onCreated,
  onCancel,
  className,
}: ClientTypeaheadProps) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ClientSearchResult[]>([]);
  const [pickRequired, setPickRequired] = useState<ClientSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const results = await searchClients(trimmed);
        setMatches(results);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function submit(clientId?: string) {
    const name = query.trim();
    if (!name) return;

    startTransition(async () => {
      const result = await silentCreatePipelineDeal({
        name,
        clientId,
        status: defaultStatus,
      });

      if (!result.ok) {
        setPickRequired(result.matches);
        toast.message("Wybierz klienta z listy", {
          description: "Znaleźliśmy podobny profil w bazie.",
        });
        return;
      }

      setQuery("");
      setMatches([]);
      setPickRequired([]);
      onCreated(result);
      toast.success("Dodano na tablicę");
    });
  }

  const showList = matches.length > 0 || pickRequired.length > 0;
  const list = pickRequired.length > 0 ? pickRequired : matches;

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPickRequired([]);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onCancel?.();
            return;
          }
          if (e.key === "Enter" && !pickRequired.length) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={isPending}
        className="border-dna-border/50 bg-dna-inset"
      />

      {showList ? (
        <ul
          className={cn(
            "absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg p-1",
            SURFACE_CARD,
          )}
        >
          {list.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-dna-inset"
                onClick={() => submit(m.id)}
              >
                <span className="font-medium">{m.displayName}</span>
                {m.company && m.name !== m.company ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {m.name}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
