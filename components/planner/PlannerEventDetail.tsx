"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deletePlannerAttachment,
  uploadPlannerAttachment,
} from "@/lib/actions/calendar";
import type {
  PlannerEventWithMeta,
  PlannerIcon,
  PlannerLeadOption,
} from "@/lib/planner/types";
import { PLANNER_ICONS } from "@/lib/planner/types";
import { renderSimpleMarkdown } from "@/lib/planner/markdown";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import { leadLabel } from "@/components/planner/planner-utils";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PlannerEventDetailProps = {
  event: PlannerEventWithMeta;
  leads: PlannerLeadOption[];
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
  leads,
  onPatch,
  onComplete,
  onDelete,
  onClose,
  onAttachmentsChange,
}: PlannerEventDetailProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startUpload] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description);
  }, [event.id, event.title, event.description]);

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
    <div className="flex max-h-[min(85vh,720px)] flex-col overflow-hidden">
      <div className="space-y-4 border-b border-zinc-800 p-5">
        <div className="flex items-start gap-3">
          <PlannerIconBadge icon={event.icon} className="size-8" />
          <div className="min-w-0 flex-1 space-y-3">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                debouncedPatch({ title: e.target.value });
              }}
              className="border-transparent bg-transparent px-0 text-lg font-semibold text-zinc-100 focus-visible:border-zinc-700"
            />
            {leadLabel(event) ? (
              <span className="inline-flex rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
                {leadLabel(event)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Start</Label>
            <Input
              type="datetime-local"
              value={dueLocal}
              onChange={(e) => handleDueChange(e.target.value)}
              className="border-zinc-800 bg-zinc-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Koniec</Label>
            <Input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => handleEndChange(e.target.value)}
              className="border-zinc-800 bg-zinc-900"
              disabled={!event.dueAt}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Typ</Label>
            <Select
              value={event.icon}
              onValueChange={(value) =>
                onPatch(event.id, { icon: value as PlannerIcon })
              }
            >
              <SelectTrigger className="border-zinc-800 bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANNER_ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {ICON_LABELS[icon]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Klient (CRM)</Label>
            <Select
              value={event.leadId ?? "none"}
              onValueChange={(value) =>
                onPatch(event.id, {
                  leadId: value === "none" ? null : value,
                })
              }
            >
              <SelectTrigger className="border-zinc-800 bg-zinc-900">
                <SelectValue placeholder="Brak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Brak</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.company ?? lead.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500">Opis</Label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              debouncedPatch({ description: e.target.value });
            }}
            rows={4}
            className="border-zinc-800 bg-zinc-900"
            placeholder="Notatki, **pogrubienie**, *kursywa*"
          />
          {description ? (
            <div
              className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300"
              dangerouslySetInnerHTML={{
                __html: renderSimpleMarkdown(description),
              }}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-500">Załączniki</Label>
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-8 transition-colors hover:border-sky-500/40 hover:bg-sky-500/5",
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-5 text-zinc-500" />
            <p className="mt-2 text-xs text-zinc-400">
              Przeciągnij pliki lub kliknij, aby dodać
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {event.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                >
                  {attachment.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.url}
                      alt={attachment.fileName}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center gap-2 p-2 text-zinc-400">
                      <FileText className="size-8" />
                      <span className="line-clamp-2 text-center text-[10px]">
                        {attachment.fileName}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="absolute right-1 top-1 rounded bg-zinc-950/80 p-1 text-rose-400 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-800 p-5">
        <Button
          className="flex-1 bg-sky-500 text-zinc-950 hover:bg-sky-400"
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
            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            Usuń
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(event.id);
              onClose();
            }}
          >
            Potwierdź usunięcie
          </Button>
        )}
      </div>
    </div>
  );
}
