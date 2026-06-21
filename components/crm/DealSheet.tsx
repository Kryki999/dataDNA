"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Phone, Trash2, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ProjectKanban } from "@/components/crm/ProjectKanban";
import {
  addLeadNote,
  createLead,
  deleteLead,
  getLeadNotes,
  logColdCall,
  updateLead,
  updateLeadStage,
} from "@/lib/actions/leads";
import { PREDEFINED_LEAD_TAGS } from "@/lib/constants";
import {
  LEAD_SOURCE_LABELS,
  PIPELINE_STAGE_LABELS,
  type Lead,
  type LeadSourceId,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import { cn } from "@/lib/utils";

type LeadNote = {
  id: string;
  body: string;
  createdAt: Date;
};

type DealSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onUpdated: (lead: Lead) => void;
  onArchived: (leadId: string) => void;
};

export function DealSheet({
  open,
  onOpenChange,
  lead,
  onUpdated,
  onArchived,
}: DealSheetProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [source, setSource] = useState<LeadSourceId>("cold_call");
  const [stage, setStage] = useState<PipelineStageId>("new");
  const [tags, setTags] = useState<string[]>([]);
  const [followUpAt, setFollowUpAt] = useState("");
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(lead?.name ?? "");
    setCompany(lead?.company ?? "");
    setPhone(lead?.phone ?? "");
    setEmail(lead?.email ?? "");
    setProjectValue(
      lead?.projectValuePln ? String(lead.projectValuePln) : "",
    );
    setSource(lead?.source ?? "cold_call");
    setStage(lead?.pipelineStage ?? "new");
    setTags(lead?.tags ?? []);
    setFollowUpAt(
      lead?.nextFollowUpAt
        ? format(lead.nextFollowUpAt, "yyyy-MM-dd'T'HH:mm")
        : "",
    );
    setNewNote("");

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
  }, [open, lead]);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Podaj nazwę klienta");
      return;
    }

    const payload = {
      name,
      company,
      phone,
      email,
      source,
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
          toast.success("Klient dodany do lejka");
          onOpenChange(false);
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

  function handleArchive(nextStage: "won" | "lost") {
    if (!lead) return;

    startTransition(async () => {
      try {
        await updateLead(lead.id, {
          projectValuePln: projectValue ? Number(projectValue) : null,
        });
        await updateLeadStage(lead.id, nextStage);
        toast.success(
          nextStage === "won"
            ? "Deal wygrany — przeniesiono do archiwum"
            : "Deal przegrany — przeniesiono do archiwum",
        );
        onArchived(lead.id);
      } catch {
        toast.error("Nie udało się zamknąć deala");
      }
    });
  }

  function handleLogCall() {
    if (!lead) return;
    startTransition(async () => {
      await logColdCall(lead.id);
      const rows = await getLeadNotes(lead.id);
      setNotes(
        rows.map((row) => ({
          id: row.id,
          body: row.body,
          createdAt: row.createdAt,
        })),
      );
      toast.success("Call zalogowany w osi czasu");
    });
  }

  function handleDelete() {
    if (!lead) return;
    startTransition(async () => {
      await deleteLead(lead.id);
      onArchived(lead.id);
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-3xl"
      >
        <SheetHeader>
          <SheetTitle>
            {lead ? lead.company || lead.name : "Nowy klient"}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList
            className={cn(
              "grid w-full",
              lead?.pipelineStage === "won"
                ? "grid-cols-3"
                : "grid-cols-2",
            )}
          >
            <TabsTrigger value="details">Szczegóły</TabsTrigger>
            <TabsTrigger value="timeline" disabled={!lead}>
              Oś czasu
            </TabsTrigger>
            {lead?.pipelineStage === "won" ? (
              <TabsTrigger value="project">Tablica Projektu</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company">Nazwa firmy</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Sp. z o.o."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Osoba kontaktowa</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Kowalski"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectValue">Wartość projektu (PLN)</Label>
                <Input
                  id="projectValue"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={projectValue}
                  onChange={(e) => setProjectValue(e.target.value)}
                  placeholder="15000"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Źródło</Label>
                <Select
                  value={source}
                  onValueChange={(value) => setSource(value as LeadSourceId)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_SOURCE_LABELS).map(([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etap lejka</Label>
                <Select
                  value={stage}
                  onValueChange={(value) => setStage(value as PipelineStageId)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PIPELINE_STAGE_LABELS)
                      .filter(([id]) => id !== "won" && id !== "lost")
                      .map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="followUp">Follow-up</Label>
                <Input
                  id="followUp"
                  type="datetime-local"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tagi</Label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_LEAD_TAGS.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                      <Button
                        key={tag}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() =>
                          setTags((current) =>
                            active
                              ? current.filter((t) => t !== tag)
                              : [...current, tag],
                          )
                        }
                      >
                        {tag}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <Button onClick={handleSave} disabled={isPending}>
                Zapisz
              </Button>
              {lead ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleLogCall}
                    disabled={isPending}
                  >
                    <Phone className="size-4" />
                    Log Call
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary/40 text-primary"
                    onClick={() => handleArchive("won")}
                    disabled={isPending}
                  >
                    <Trophy className="size-4" />
                    Wygrany
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleArchive("lost")}
                    disabled={isPending}
                  >
                    <XCircle className="size-4" />
                    Przegrany
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                    Usuń
                  </Button>
                </>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newNote">Nowa notatka</Label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Notatka z rozmowy, ustalenia, next step..."
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                disabled={isPending || !newNote.trim()}
              >
                Dodaj notatkę
              </Button>
            </div>

            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak notatek — dodaj pierwszą z rozmowy.
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border/70 bg-muted/20 p-3"
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
          </TabsContent>

          {lead?.pipelineStage === "won" ? (
            <TabsContent value="project" className="mt-4">
              <ProjectKanban leadId={lead.id} />
            </TabsContent>
          ) : null}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
