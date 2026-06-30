"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  addClientNote,
  deleteClientNote,
  getClientFeed,
  updateClientNote,
  type ClientFeedItem,
} from "@/lib/actions/notes";
import { EYEBROW } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type ClientTimelineFeedProps = {
  clientId: string;
  className?: string;
};

export function ClientTimelineFeed({ clientId, className }: ClientTimelineFeedProps) {
  const [items, setItems] = useState<ClientFeedItem[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ClientFeedItem | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const feed = await getClientFeed(clientId);
      setItems(feed);
    });
  }, [clientId]);

  function handleAdd() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const note = await addClientNote(clientId, draft);
      if (note) {
        setItems((current) => [
          {
            id: note.id,
            body: note.body,
            type: "user",
            createdAt: note.createdAt,
            dealId: note.dealId,
            dealTitle: null,
            metadata: null,
          },
          ...current,
        ]);
        setDraft("");
      }
    });
  }

  function startEdit(item: ClientFeedItem) {
    setEditingId(item.id);
    setEditDraft(item.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  function handleSaveEdit(noteId: string) {
    if (!editDraft.trim()) return;
    startTransition(async () => {
      try {
        const updated = await updateClientNote(noteId, editDraft);
        if (updated) {
          setItems((current) =>
            current.map((item) =>
              item.id === noteId ? { ...item, body: updated.body } : item,
            ),
          );
          cancelEdit();
          toast.success("Zapisano notatkę");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się zapisać notatki",
        );
      }
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const noteId = deleteTarget.id;
    startTransition(async () => {
      try {
        await deleteClientNote(noteId);
        setItems((current) => current.filter((item) => item.id !== noteId));
        setDeleteTarget(null);
        toast.success("Usunięto notatkę");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się usunąć notatki",
        );
      }
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Szybka notatka…"
          rows={2}
          className="border-dna-border/40 bg-dna-inset"
        />
        <Button
          size="sm"
          variant="outline"
          className="border-dna-border/40"
          onClick={handleAdd}
          disabled={isPending || !draft.trim()}
        >
          Dodaj do osi czasu
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak wpisów. Dodaj pierwszą notatkę.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={cn(
                "rounded-xl border border-dna-border/25 bg-dna-inset p-3",
                item.type === "system" && "border-dna-border/15 opacity-90",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {item.dealTitle ? (
                    <p className={cn(EYEBROW, "mb-1 normal-case tracking-normal")}>
                      Projekt: {item.dealTitle}
                    </p>
                  ) : null}
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        className="border-dna-border/40 bg-dna-surface text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={isPending || !editDraft.trim()}
                        >
                          Zapisz
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={isPending}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{item.body}</p>
                  )}
                </div>
                {item.type === "user" && editingId !== item.id ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground"
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(item)}>
                        <Pencil className="size-3.5" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="size-3.5" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
              {editingId !== item.id ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {format(item.createdAt, "d MMM yyyy, HH:mm", { locale: pl })}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="border-dna-border/40 bg-dna-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Usunąć notatkę?</DialogTitle>
            <DialogDescription>
              Ta operacja jest nieodwracalna. Notatka zostanie trwale usunięta z
              osi czasu klienta.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <p className="rounded-lg border border-dna-border/25 bg-dna-inset p-3 text-sm leading-relaxed text-muted-foreground">
              {deleteTarget.body}
            </p>
          ) : null}
          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              Usuń notatkę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
