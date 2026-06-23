"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CheckCircle2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ProjectKanban } from "@/components/crm/ProjectKanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addLeadNote,
  createLead,
  getLeadNotes,
  updateLead,
  updateLeadStage,
} from "@/lib/actions/leads";
import { PREDEFINED_LEAD_TAGS } from "@/lib/constants";
import {
  PIPELINE_STAGE_LABELS,
  type Lead,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import { EYEBROW, INPUT_PLAIN_NUMERIC, INPUT_SURFACE } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type LeadNote = {
  id: string;
  body: string;
  createdAt: Date;
};

type DealDetailProps = {
  lead: Lead | null;
  defaultStage?: PipelineStageId;
  onUpdated: (lead: Lead) => void;
  onArchived: (leadId: string) => void;
  onClose: () => void;
};

export function DealDetail({
  lead,
  defaultStage,
  onUpdated,
  onArchived,
  onClose,
}: DealDetailProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [stage, setStage] = useState<PipelineStageId>("new");
  const [tags, setTags] = useState<string[]>([]);
  const [followUpAt, setFollowUpAt] = useState("");
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(lead?.name ?? "");
    setCompany(lead?.company ?? "");
    setPhone(lead?.phone ?? "");
    setProjectValue(
      lead?.projectValuePln ? String(lead.projectValuePln) : "",
    );
    setStage(lead?.pipelineStage ?? defaultStage ?? "new");
    setTags(lead?.tags ?? []);
    setFollowUpAt(
      lead?.nextFollowUpAt
        ? format(lead.nextFollowUpAt, "yyyy-MM-dd'T'HH:mm")
        : "",
    );
    setNewNote("");
    setProjectOpen(false);

    if (lead?.id) {
      startTransition(async () => {
        const rows = await getLeadNotes(lead.id);
        setNotes(
          rows.map((row) => ({
            id: row.id,
            body: row.body,
            createdAt: row.createdAt,
          })),
        );
      });
    } else {
      setNotes([]);
    }
  }, [lead, defaultStage]);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Podaj osobę kontaktową");
      return;
    }

    const payload = {
      name,
      company,
      phone,
      email: lead?.email ?? "",
      source: lead?.source ?? ("cold_call" as const),
      projectValuePln: projectValue ? Number(projectValue) : null,
      pipelineStage: stage,
      tags,
      nextFollowUpAt: followUpAt ? new Date(followUpAt) : null,
    };

    startTransition(async () => {
      try {
        if (lead) {
          const updated = await updateLead(lead.id, payload);
          if (updated) {
            onUpdated(updated);
            toast.success("Zapisano");
          }
        } else {
          const created = await createLead(payload);
          onUpdated(created);
          toast.success("Klient dodany");
          onClose();
        }
      } catch {
        toast.error("Nie udało się zapisać");
      }
    });
  }

  function handleAddNote() {
    if (!lead || !newNote.trim()) return;

    startTransition(async () => {
      const note = await addLeadNote(lead.id, newNote);
      if (note) {
        setNotes((current) => [
          { id: note.id, body: note.body, createdAt: note.createdAt },
          ...current,
        ]);
        setNewNote("");
      }
    });
  }

  function handleCloseDeal(nextStage: "won" | "lost") {
    if (!lead) return;

    startTransition(async () => {
      try {
        await updateLead(lead.id, {
          projectValuePln: projectValue ? Number(projectValue) : null,
        });
        await updateLeadStage(lead.id, nextStage);
        toast.success(
          nextStage === "won"
            ? "Projekt zrealizowany — przeniesiono do archiwum"
            : "Współpraca zakończona",
        );
        onArchived(lead.id);
      } catch {
        toast.error("Nie udało się zaktualizować statusu");
      }
    });
  }

  const stageLabel =
    PIPELINE_STAGE_LABELS[stage] ?? PIPELINE_STAGE_LABELS.new;

  return (
    <div>
      <div className="space-y-4 border-b border-dna-border p-5">
        <div className="flex items-start justify-between gap-2">
          <p className={EYEBROW}>{stageLabel}</p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Nazwa firmy"
          className="border-transparent bg-transparent px-0 text-lg font-semibold text-foreground focus-visible:border-dna-border"
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Osoba kontaktowa"
            className={INPUT_SURFACE}
          />
          <Input
            value={projectValue}
            onChange={(e) =>
              setProjectValue(e.target.value.replace(/[^\d]/g, ""))
            }
            inputMode="numeric"
            placeholder="Wartość PLN"
            className={cn(INPUT_PLAIN_NUMERIC, "font-mono tabular-nums")}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PREDEFINED_LEAD_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setTags((current) =>
                    active
                      ? current.filter((t) => t !== tag)
                      : [...current, tag],
                  )
                }
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-dna-border/40 bg-dna-inset text-muted-foreground hover:text-foreground",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <Button className="w-full" onClick={handleSave} disabled={isPending}>
          Zapisz
        </Button>
      </div>

      <div className="space-y-5 p-5">
        <section className="space-y-2">
          <p className={EYEBROW}>Kontakt</p>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon"
            className={INPUT_SURFACE}
          />
          <Input
            type="datetime-local"
            value={followUpAt}
            onChange={(e) => setFollowUpAt(e.target.value)}
            className={INPUT_SURFACE}
            aria-label="Kolejny kontakt"
          />
        </section>

        {lead ? (
          <section className="space-y-2">
            <p className={EYEBROW}>Notatki</p>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ustalenia, ustalenia z rozmowy…"
              rows={2}
              className={INPUT_SURFACE}
            />
            <Button
              size="sm"
              variant="outline"
              className="border-dna-border/40"
              onClick={handleAddNote}
              disabled={isPending || !newNote.trim()}
            >
              Dodaj notatkę
            </Button>
            <div className="space-y-2 pt-1">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak notatek.</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-dna-border/25 bg-dna-inset p-3"
                  >
                    <p className="text-sm leading-relaxed">{note.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(note.createdAt, "d MMM yyyy, HH:mm", {
                        locale: pl,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {lead?.pipelineStage === "won" ? (
          <section className="space-y-2">
            <p className={EYEBROW}>Projekt</p>
            {projectOpen ? (
              <div className="rounded-lg border border-dna-border/25 bg-dna-inset p-2">
                <ProjectKanban leadId={lead.id} />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dna-border/40"
                onClick={() => setProjectOpen(true)}
              >
                Otwórz tablicę projektu
              </Button>
            )}
          </section>
        ) : null}
      </div>

      {lead && lead.pipelineStage !== "won" && lead.pipelineStage !== "lost" ? (
        <div className="grid grid-cols-2 gap-3 border-t border-dna-border p-5">
          <button
            type="button"
            onClick={() => handleCloseDeal("lost")}
            disabled={isPending}
            className={cn(
              "flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 transition-colors",
              "border-rose-400/70 bg-rose-500/25 text-rose-200",
              "shadow-[0_0_24px_rgba(244,63,94,0.22)]",
              "hover:border-rose-300 hover:bg-rose-500/35",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <Trash2 className="size-7 shrink-0" />
            <span className="text-sm font-semibold leading-tight">Koniec współpracy</span>
          </button>
          <button
            type="button"
            onClick={() => handleCloseDeal("won")}
            disabled={isPending}
            className={cn(
              "flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 transition-colors",
              "border-emerald-400/70 bg-emerald-500/25 text-emerald-200",
              "shadow-[0_0_24px_rgba(16,185,129,0.22)]",
              "hover:border-emerald-300 hover:bg-emerald-500/35",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <CheckCircle2 className="size-7 shrink-0" />
            <span className="text-sm font-semibold leading-tight">Zrealizowano</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
