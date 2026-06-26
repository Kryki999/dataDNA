"use client";

import { useEffect, useState, useTransition } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { ClientCardColorControl } from "@/components/cards/ClientCardColorControl";
import { ClientTimelineFeed } from "@/components/crm/ClientTimelineFeed";
import { ProjectKanban } from "@/components/crm/ProjectKanban";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  closePipelineDeal,
  updatePipelineDeal,
  type PipelineDealWithMeta,
} from "@/lib/actions/pipeline-deals";
import { addClientNote } from "@/lib/actions/notes";
import {
  PIPELINE_DEAL_COLUMNS,
  PIPELINE_DEAL_STATUS_LABELS,
  type PipelineDealStatus,
} from "@/lib/crm/pipeline-deals";
import {
  DNA_SCROLLBAR,
  EYEBROW,
  INPUT_PLAIN_NUMERIC,
  INPUT_SURFACE,
  MODAL_TITLE,
} from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PipelineDealDetailProps = {
  deal: PipelineDealWithMeta;
  onUpdated: (deal: PipelineDealWithMeta) => void;
  onClosed: (dealId: string) => void;
  onOpenClient?: (clientId: string) => void;
  onClose: () => void;
};

export function PipelineDealDetail({
  deal: initial,
  onUpdated,
  onClosed,
  onOpenClient,
  onClose,
}: PipelineDealDetailProps) {
  const [deal, setDeal] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [projectValue, setProjectValue] = useState(
    initial.projectValuePln ? String(initial.projectValuePln) : "",
  );
  const [status, setStatus] = useState<PipelineDealStatus>(initial.status);
  const [noteDraft, setNoteDraft] = useState("");
  const [feedKey, setFeedKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDeal(initial);
    setTitle(initial.title);
    setProjectValue(
      initial.projectValuePln ? String(initial.projectValuePln) : "",
    );
    setStatus(initial.status);
  }, [initial]);

  function handleSave() {
    startTransition(async () => {
      try {
        const updated = await updatePipelineDeal(deal.id, {
          title,
          status,
          projectValuePln: projectValue ? Number(projectValue) : null,
        });
        if (updated) {
          const next = { ...deal, ...updated };
          setDeal(next);
          onUpdated(next);
          toast.success("Zapisano");
        }
      } catch {
        toast.error("Nie udało się zapisać");
      }
    });
  }

  function handleAddNote() {
    if (!noteDraft.trim()) return;
    startTransition(async () => {
      await addClientNote(deal.clientId, noteDraft, { dealId: deal.id });
      setNoteDraft("");
      setFeedKey((k) => k + 1);
      toast.success("Dodano notatkę");
    });
  }

  function handleClose(next: "closed_won" | "closed_lost") {
    startTransition(async () => {
      const closed = await closePipelineDeal(deal.id, next);
      if (closed) {
        toast.success(
          next === "closed_won" ? "Projekt zrealizowany" : "Współpraca zakończona",
        );
        onClosed(deal.id);
      }
    });
  }

  const isClosed =
    status === "closed_won" || status === "closed_lost";

  const projectLeadId = deal.client.migratedFromLeadId ?? deal.clientId;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-4 border-b border-dna-border p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={EYEBROW}>{PIPELINE_DEAL_STATUS_LABELS[status]}</p>
            <h2 className={MODAL_TITLE}>{deal.displayName}</h2>
            <p className="text-sm text-muted-foreground">{deal.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {!isClosed ? (
              <ClientCardColorControl
                clientId={deal.clientId}
                value={deal.client.cardColor}
                onUpdated={(client) => {
                  const next = {
                    ...deal,
                    client,
                    cardColor: client.cardColor,
                  };
                  setDeal(next);
                  onUpdated(next);
                }}
                size="sm"
              />
            ) : null}
            {!isClosed ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8" />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleClose("closed_won")}>
                    Zrealizowano
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleClose("closed_lost")}>
                    Koniec współpracy
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        {onOpenClient ? (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => onOpenClient(deal.clientId)}
          >
            Otwórz profil klienta
          </button>
        ) : null}
      </div>

      <Tabs
        defaultValue="feed"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-5 mt-2 w-auto shrink-0 justify-start">
          <TabsTrigger value="feed">Oś czasu</TabsTrigger>
          <TabsTrigger value="details">Szczegóły</TabsTrigger>
        </TabsList>

        <TabsContent
          value="feed"
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto space-y-3 px-5 py-4",
            DNA_SCROLLBAR,
          )}
        >
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Notatka z tego projektu…"
            rows={2}
            className={INPUT_SURFACE}
          />
          <Button
            size="sm"
            variant="outline"
            className="border-dna-border/40"
            onClick={handleAddNote}
            disabled={isPending || !noteDraft.trim()}
          >
            Dodaj notatkę
          </Button>
          <ClientTimelineFeed key={feedKey} clientId={deal.clientId} />
        </TabsContent>

        <TabsContent
          value="details"
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto space-y-3 px-5 py-4",
            DNA_SCROLLBAR,
          )}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nazwa projektu"
            className={INPUT_SURFACE}
          />
          <Input
            value={projectValue}
            onChange={(e) =>
              setProjectValue(e.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="Wartość PLN"
            className={cn(INPUT_PLAIN_NUMERIC, "font-mono tabular-nums")}
          />
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_DEAL_COLUMNS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setStatus(col.id)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                  status === col.id
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-dna-border/40 text-muted-foreground",
                )}
              >
                {col.label}
              </button>
            ))}
          </div>
          {status === "closed_won" ? (
            <div className="rounded-lg border border-dna-border/25 bg-dna-inset p-2">
              <ProjectKanban leadId={projectLeadId} />
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-dna-border bg-dna-surface p-4">
        <Button
          className="h-11 w-full bg-dna-signal text-base font-semibold hover:bg-dna-signal/90"
          onClick={handleSave}
          disabled={isPending}
        >
          Zapisz
        </Button>
      </div>
    </div>
  );
}
