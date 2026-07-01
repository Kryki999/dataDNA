"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ClientCardColorControl } from "@/components/cards/ClientCardColorControl";
import { ClientTimelineFeed } from "@/components/crm/ClientTimelineFeed";
import { ScheduleNextStepButton } from "@/components/crm/ScheduleNextStepDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  closePipelineDeal,
  reactivatePipelineDeal,
  updatePipelineDeal,
  type PipelineDealWithMeta,
} from "@/lib/actions/pipeline-deals";
import { addClientNote } from "@/lib/actions/notes";
import {
  PIPELINE_DEAL_COLUMNS,
  PIPELINE_DEAL_STATUS_LABELS,
  type PipelineDealStatus,
} from "@/lib/crm/pipeline-deals";
import { DELIVERY_WORKFLOW_COPY, KANBAN_PRESETS } from "@/lib/crm/kor";
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
  const [pendingClose, setPendingClose] = useState<
    "closed_won" | "closed_lost" | null
  >(null);
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
    setPendingClose(null);
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

  const pendingCloseLabel =
    pendingClose === "closed_won"
      ? "Zrealizowano"
      : pendingClose === "closed_lost"
        ? "Koniec współpracy"
        : null;

  function handleReactivate(targetStatus: PipelineDealStatus) {
    startTransition(async () => {
      try {
        const revived = await reactivatePipelineDeal(deal.id, targetStatus);
        if (revived) {
          const next = { ...deal, ...revived, status: targetStatus };
          setDeal(next);
          setStatus(targetStatus);
          onUpdated(next);
          toast.success("Przywrócono projekt do Kanbanu");
        }
      } catch {
        toast.error("Nie udało się przywrócić projektu");
      }
    });
  }

  const isClosed =
    status === "closed_won" || status === "closed_lost";

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
        {!isClosed ? (
          <ScheduleNextStepButton
            dealId={deal.id}
            dealTitle={deal.title}
            onScheduled={() => setFeedKey((k) => k + 1)}
          />
        ) : null}
      </div>

      {status === "closed_won" ? (
        <div className="mx-5 mt-2 shrink-0 rounded-lg border border-dna-border/30 bg-dna-inset/50 px-3 py-2 text-xs text-muted-foreground">
          {DELIVERY_WORKFLOW_COPY}
        </div>
      ) : null}

      {isClosed ? (
        <div className="mx-5 mt-3 shrink-0 space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <p className="text-sm text-foreground">
            Ten projekt jest zamknięty i nie widać go w Kanbanie. Jeśli to
            pomyłka, przywróć go do wybranego etapu.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_DEAL_COLUMNS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => handleReactivate(col.id)}
                disabled={isPending}
                className="rounded-md border border-amber-500/30 bg-dna-surface/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-amber-500/10"
              >
                Przywróć: {col.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
          <p className="text-xs text-muted-foreground">
            {KANBAN_PRESETS.sales.userRule}
          </p>
          {!isClosed ? (
            <div className="border-t border-dna-border/30 pt-4">
              <p className="text-[11px] text-muted-foreground">Zamknij projekt</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => setPendingClose("closed_won")}
                >
                  Zrealizowano
                </button>
                <span className="text-dna-border/60" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => setPendingClose("closed_lost")}
                >
                  Koniec współpracy
                </button>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog
        open={pendingClose !== null}
        onOpenChange={(open) => {
          if (!open) setPendingClose(null);
        }}
      >
        <DialogContent showCloseButton className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Zamknąć projekt?</DialogTitle>
            <DialogDescription>
              {pendingCloseLabel} — „{deal.title}”. Karta zniknie z Kanbanu,
              historia zostanie u klienta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingClose(null)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={() => pendingClose && handleClose(pendingClose)}
              disabled={isPending || !pendingClose}
            >
              {pendingCloseLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
