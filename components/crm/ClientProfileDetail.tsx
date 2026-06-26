"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ImageIcon, MoreHorizontal, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ClientCardColorControl } from "@/components/cards/ClientCardColorControl";
import { ClientTimelineFeed } from "@/components/crm/ClientTimelineFeed";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  archiveClient,
  deleteClient,
  removeClientCover,
  updateClient,
  uploadClientCover,
} from "@/lib/actions/clients";
import type { Client, ClientCardColor } from "@/lib/crm/clients";
import { isValidCardColor } from "@/lib/crm/clients";
import { getClientDisplayName } from "@/lib/crm/client-name";
import { getCardColorClasses } from "@/lib/design-tokens";
import {
  DNA_SCROLLBAR,
  EYEBROW,
  INPUT_SURFACE,
  MODAL_TITLE,
} from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type ClientProfileDetailProps = {
  client: Client;
  onUpdated: (client: Client) => void;
  onArchived: (clientId: string) => void;
  onClose: () => void;
};

export function ClientProfileDetail({
  client: initial,
  onUpdated,
  onArchived,
  onClose,
}: ClientProfileDetailProps) {
  const [client, setClient] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [company, setCompany] = useState(initial.company ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [cardColor, setCardColor] = useState<ClientCardColor>(
    isValidCardColor(initial.cardColor) ? initial.cardColor : "slate",
  );
  const [isPending, startTransition] = useTransition();
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClient(initial);
    setName(initial.name);
    setCompany(initial.company ?? "");
    setPhone(initial.phone ?? "");
    setEmail(initial.email ?? "");
    setCardColor(
      isValidCardColor(initial.cardColor) ? initial.cardColor : "slate",
    );
  }, [initial]);

  const colors = getCardColorClasses(cardColor);

  function syncClient(updated: Client) {
    setClient(updated);
    setCardColor(
      isValidCardColor(updated.cardColor) ? updated.cardColor : "slate",
    );
    onUpdated(updated);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const updated = await updateClient(client.id, {
          name,
          company,
          phone,
          email,
        });
        if (updated) {
          syncClient(updated);
          toast.success("Zapisano");
        }
      } catch {
        toast.error("Nie udało się zapisać");
      }
    });
  }

  function handleCoverSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("cover", file);

    startTransition(async () => {
      try {
        const updated = await uploadClientCover(client.id, formData);
        if (updated) {
          syncClient(updated);
          toast.success("Zdjęcie okładki zaktualizowane");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się dodać zdjęcia",
        );
      }
    });
  }

  function handleRemoveCover() {
    startTransition(async () => {
      try {
        const updated = await removeClientCover(client.id);
        if (updated) syncClient(updated);
      } catch {
        toast.error("Nie udało się usunąć zdjęcia");
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveClient(client.id);
      toast.success("Zarchiwizowano klienta");
      onArchived(client.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteClient(client.id);
        toast.success("Usunięto klienta");
        onArchived(client.id);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Nie można usunąć — użyj archiwizacji",
        );
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-dna-border">
        <div
          className={cn(
            "relative aspect-[21/9] w-full bg-gradient-to-br",
            colors.bg,
          )}
        >
          {client.coverUrl ? (
            <Image
              src={client.coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="640px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="size-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-dna-canvas/90 to-transparent p-4 pt-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 bg-dna-surface/90 text-xs"
              onClick={() => coverInputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="size-3.5" />
              Okładka
            </Button>
            {client.coverUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground"
                onClick={handleRemoveCover}
                disabled={isPending}
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={EYEBROW}>Profil klienta</p>
              <h2 className={MODAL_TITLE}>{getClientDisplayName(client)}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <ClientCardColorControl
                clientId={client.id}
                value={client.cardColor}
                onUpdated={syncClient}
                size="sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8" />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleArchive}>
                    Zarchiwizuj
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    Usuń
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
        </div>
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
            "mt-0 min-h-0 flex-1 overflow-y-auto px-5 py-4",
            DNA_SCROLLBAR,
          )}
        >
          <ClientTimelineFeed clientId={client.id} />
        </TabsContent>

        <TabsContent
          value="details"
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto space-y-3 px-5 py-4",
            DNA_SCROLLBAR,
          )}
        >
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Firma"
            className={INPUT_SURFACE}
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Osoba kontaktowa"
            className={INPUT_SURFACE}
          />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon"
            className={INPUT_SURFACE}
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className={INPUT_SURFACE}
          />
          <p className="text-xs text-muted-foreground">
            W bazie od{" "}
            {format(client.createdAt, "d MMM yyyy", { locale: undefined })}
          </p>
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-dna-border bg-dna-surface p-4">
        <Button
          className="h-11 w-full bg-dna-signal text-base font-semibold hover:bg-dna-signal/90"
          onClick={handleSave}
          disabled={isPending}
        >
          Zapisz dane kontaktowe
        </Button>
      </div>
    </div>
  );
}
