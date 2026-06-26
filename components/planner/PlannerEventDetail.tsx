"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronDown, FileText, Link2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  deletePlannerAttachment,
  uploadPlannerAttachment,
} from "@/lib/actions/calendar";
import type {
  PlannerEventWithMeta,
  PlannerIcon,
  PlannerClientOption,
} from "@/lib/planner/types";
import { PLANNER_ICONS } from "@/lib/planner/types";
import { renderSimpleMarkdown } from "@/lib/planner/markdown";
import { ClientCardColorControl } from "@/components/cards/ClientCardColorControl";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import { clientLabel } from "@/components/planner/planner-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EYEBROW, INPUT_SURFACE, SURFACE_WELL } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type PlannerEventDetailProps = {
  event: PlannerEventWithMeta;
  clients: PlannerClientOption[];
  onPatch: (
    id: string,
    patch: Parameters<
      typeof import("@/lib/actions/calendar").updatePlannerEvent
    >[1],
  ) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onAttachmentsChange: (id: string, attachments: PlannerEventWithMeta["attachments"]) => void;
  onClientColorUpdated?: (eventId: string, cardColor: string | null) => void;
};

const ICON_LABELS: Record<PlannerIcon, string> = {
  task: "Zadanie",
  phone: "Telefon",
  follow_up: "Follow-up",
  design: "Design",
  meeting: "Spotkanie",
};

export function PlannerEventDetail({
  event,
  clients,
  onPatch,
  onComplete,
  onDelete,
  onClose,
  onAttachmentsChange,
  onClientColorUpdated,
}: PlannerEventDetailProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCrmLink, setShowCrmLink] = useState(Boolean(event.clientId));
  const [showPreview, setShowPreview] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [, startUpload] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description);
    setShowCrmLink(Boolean(event.clientId));
    setEditingTime(false);
    setShowPreview(false);
  }, [event.id, event.title, event.description, event.clientId]);

  const debouncedPatch = useCallback(
    (patch: Parameters<typeof onPatch>[1]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onPatch(event.id, patch), 400);
    },
    [event.id, onPatch],
  );

  const dueLocal = event.dueAt
    ? format(new Date(event.dueAt), "yyyy-MM-dd'T'HH:mm")
    : "";
  const endLocal = event.endsAt
    ? format(new Date(event.endsAt), "yyyy-MM-dd'T'HH:mm")
    : "";

  const timeLabel =
    event.dueAt && event.endsAt
      ? `${format(new Date(event.dueAt), "d MMM, HH:mm", { locale: pl })} – ${format(new Date(event.endsAt), "HH:mm", { locale: pl })}`
      : event.dueAt
        ? format(new Date(event.dueAt), "d MMM yyyy, HH:mm", { locale: pl })
        : "Bez terminu";

  function handleDueChange(value: string) {
    if (!value) return;
    const dueAt = new Date(value);
    const endsAt = event.endsAt
      ? new Date(event.endsAt)
      : new Date(dueAt.getTime() + 60 * 60 * 1000);
    onPatch(event.id, { dueAt, endsAt });
  }

  function handleEndChange(value: string) {
    if (!value || !event.dueAt) return;
    onPatch(event.id, { endsAt: new Date(value) });
  }

  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0]!;
    const formData = new FormData();
    formData.set("file", file);

    startUpload(async () => {
      try {
        const attachment = await uploadPlannerAttachment(event.id, formData);
        onAttachmentsChange(event.id, [...event.attachments, attachment]);
        toast.success("Załącznik dodany");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się dodać pliku",
        );
      }
    });
  }

  function handleRemoveAttachment(attachmentId: string) {
    startUpload(async () => {
      try {
        await deletePlannerAttachment(attachmentId);
        onAttachmentsChange(
          event.id,
          event.attachments.filter((a) => a.id !== attachmentId),
        );
      } catch {
        toast.error("Nie udało się usunąć załącznika");
      }
    });
  }

  return (
    <div>
      <div className="space-y-4 border-b border-dna-border p-5">
        <div className="flex items-start justify-between gap-2">
          <p className={EYEBROW}>
            {event.dueAt ? "Zaplanowane" : "Backlog"}
          </p>
          <div className="flex shrink-0 items-center gap-0.5">
            {event.clientId ? (
              <ClientCardColorControl
                clientId={event.clientId}
                value={event.clientCardColor}
                onUpdated={(client) => {
                  onClientColorUpdated?.(event.id, client.cardColor);
                }}
                size="sm"
              />
            ) : null}
            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            debouncedPatch({ title: e.target.value });
          }}
          className="border-transparent bg-transparent px-0 text-lg font-semibold text-foreground focus-visible:border-dna-border"
        />

        {event.dueAt ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setEditingTime((v) => !v)}
              className={cn(SURFACE_WELL, "flex w-full items-center justify-between px-3 py-2 text-left text-sm")}
            >
              <span className="tabular-nums text-foreground">{timeLabel}</span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  editingTime && "rotate-180",
                )}
              />
            </button>
            {editingTime ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="datetime-local"
                  value={dueLocal}
                  onChange={(e) => handleDueChange(e.target.value)}
                  className={INPUT_SURFACE}
                />
                <Input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => handleEndChange(e.target.value)}
                  className={INPUT_SURFACE}
                  disabled={!event.dueAt}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className={EYEBROW}>Typ</p>
          <div className="flex flex-wrap gap-1.5">
            {PLANNER_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onPatch(event.id, { icon: key })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
                  event.icon === key
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

        <div className="space-y-2">
          {!showCrmLink ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-dna-border/40"
              onClick={() => setShowCrmLink(true)}
            >
              <Link2 className="size-3.5" />
              Powiąż z klientem
            </Button>
          ) : (
            <Select
              value={event.clientId ?? "none"}
              onValueChange={(value) =>
                onPatch(event.id, {
                  clientId: value === "none" ? null : value,
                })
              }
            >
              <SelectTrigger className={INPUT_SURFACE}>
                <SelectValue placeholder="Wybierz klienta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Brak powiązania</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company ?? client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {clientLabel(event) ? (
            <p className="text-xs text-primary/90">{clientLabel(event)}</p>
          ) : null}
          {!event.clientId && showCrmLink ? (
            <p className="text-xs text-muted-foreground">
              Powiąż zadanie z klientem, aby ustawić kolor karty.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <p className={EYEBROW}>Opis</p>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              debouncedPatch({ description: e.target.value });
            }}
            rows={4}
            className={INPUT_SURFACE}
            placeholder="Notatki, **pogrubienie**, *kursywa*"
          />
          {description ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Ukryj podgląd" : "Podgląd"}
            </Button>
          ) : null}
          {showPreview && description ? (
            <div
              className={cn(SURFACE_WELL, "p-3 text-sm text-foreground")}
              dangerouslySetInnerHTML={{
                __html: renderSimpleMarkdown(description),
              }}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <p className={EYEBROW}>Załączniki</p>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dna-border/40 bg-dna-inset px-4 py-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-5 text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">
              Przeciągnij pliki lub kliknij
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
          {event.attachments.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {event.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group relative overflow-hidden rounded-lg bg-dna-inset"
                >
                  {attachment.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.url}
                      alt={attachment.fileName}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center gap-2 p-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <span className="line-clamp-2 text-center text-[10px]">
                        {attachment.fileName}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="absolute right-1 top-1 rounded bg-dna-surface p-1 text-rose-400 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3 border-t border-dna-border p-5">
        <Button
          className="h-12 flex-1"
          onClick={() => {
            onComplete(event.id);
            onClose();
          }}
          disabled={event.status === "completed"}
        >
          Oznacz jako zrobione
        </Button>
        {!confirmDelete ? (
          <Button
            variant="outline"
            className="h-12 w-12 shrink-0 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            onClick={() => setConfirmDelete(true)}
            aria-label="Usuń zadanie"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="h-12 shrink-0"
            onClick={() => {
              onDelete(event.id);
              onClose();
            }}
          >
            Usuń
          </Button>
        )}
      </div>
    </div>
  );
}
