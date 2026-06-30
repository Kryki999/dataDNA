"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronDown,
  ImageIcon,
  Link2,
  MoreHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
import { ClientCardColorControl } from "@/components/cards/ClientCardColorControl";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import {
  clientLabel,
  plannerTaskColor,
  plannerTaskCoverUrl,
} from "@/components/planner/planner-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCardColorClasses } from "@/lib/design-tokens";
import {
  DNA_SCROLLBAR,
  EYEBROW,
  INPUT_SURFACE,
  MODAL_TITLE,
  SURFACE_WELL,
} from "@/lib/ui-patterns";
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
  onAttachmentsChange: (
    id: string,
    attachments: PlannerEventWithMeta["attachments"],
  ) => void;
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
  const [showCrmLink, setShowCrmLink] = useState(Boolean(event.clientId));
  const [editingTime, setEditingTime] = useState(false);
  const [, startUpload] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description);
    setShowCrmLink(Boolean(event.clientId));
    setEditingTime(false);
  }, [event.id, event.title, event.description, event.clientId]);

  const debouncedPatch = useCallback(
    (patch: Parameters<typeof onPatch>[1]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onPatch(event.id, patch), 400);
    },
    [event.id, onPatch],
  );

  const coverUrl = plannerTaskCoverUrl(event);
  const colors = getCardColorClasses(plannerTaskColor(event));

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

  function handleCoverSelect(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0]!;
    if (!file.type.startsWith("image/")) {
      toast.error("Okładka musi być zdjęciem");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);

    startUpload(async () => {
      try {
        const attachment = await uploadPlannerAttachment(event.id, formData);
        onAttachmentsChange(event.id, [...event.attachments, attachment]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się dodać zdjęcia",
        );
      }
    });
  }

  function handleRemoveCover() {
    const image = event.attachments.find((a) =>
      a.mimeType.startsWith("image/"),
    );
    if (!image) return;
    startUpload(async () => {
      try {
        await deletePlannerAttachment(image.id);
        onAttachmentsChange(
          event.id,
          event.attachments.filter((a) => a.id !== image.id),
        );
      } catch {
        toast.error("Nie udało się usunąć zdjęcia");
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dna-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <PlannerIconBadge icon={event.icon} className="size-5 shrink-0" />
          <p className={cn(EYEBROW, "truncate")}>
            {event.dueAt ? "Zaplanowane" : "Backlog"}
          </p>
        </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Typ zadania</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {PLANNER_ICONS.map((key) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => onPatch(event.id, { icon: key })}
                    >
                      <PlannerIconBadge icon={key} className="size-4" />
                      {ICON_LABELS[key]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => setShowCrmLink(true)}>
                <Link2 className="size-3.5" />
                Powiąż z klientem
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                Usuń zadanie
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
          DNA_SCROLLBAR,
        )}
      >
        <div
          className={cn(
            "relative h-32 w-full shrink-0 bg-gradient-to-br sm:h-36",
            colors.bg,
          )}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="512px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/30">
              <ImageIcon className="size-8" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-dna-canvas/85 to-transparent px-4 pb-3 pt-8">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 gap-1.5 bg-dna-surface/90 text-xs"
              onClick={() => coverInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Zdjęcie
            </Button>
            {coverUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleRemoveCover}
              >
                <Trash2 className="size-3.5" />
                Usuń
              </Button>
            ) : null}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleCoverSelect(e.target.files)}
            />
          </div>
        </div>

        <div className="space-y-4 p-5">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedPatch({ title: e.target.value });
            }}
            className={cn(
              MODAL_TITLE,
              "h-auto border-transparent bg-transparent px-0 focus-visible:border-dna-border",
            )}
          />

          {clientLabel(event) ? (
            <p className="text-xs font-medium text-primary/90">
              {clientLabel(event)}
            </p>
          ) : null}

          {event.dueAt ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setEditingTime((v) => !v)}
                className={cn(
                  SURFACE_WELL,
                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm",
                )}
              >
                <span className="tabular-nums text-foreground">{timeLabel}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    editingTime && "rotate-180",
                  )}
                />
              </button>
              {editingTime ? (
                <div className="grid gap-2">
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

          {showCrmLink ? (
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
          ) : null}

          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              debouncedPatch({ description: e.target.value });
            }}
            rows={8}
            className={cn(
              INPUT_SURFACE,
              "min-h-[min(40vh,280px)] resize-y",
            )}
            placeholder="Opis zadania…"
          />
        </div>
      </div>

      <div className="shrink-0 border-t border-dna-border p-4">
        <Button
          className="h-11 w-full"
          onClick={() => {
            onComplete(event.id);
            onClose();
          }}
          disabled={event.status === "completed"}
        >
          {event.status === "completed" ? "Zrobione" : "Oznacz jako zrobione"}
        </Button>
      </div>
    </div>
  );
}
