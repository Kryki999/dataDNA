"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
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
  updateClient,
} from "@/lib/actions/clients";
import type { Client } from "@/lib/crm/clients";
import { getClientDisplayName } from "@/lib/crm/client-name";
import { EYEBROW, INPUT_SURFACE, MODAL_TITLE } from "@/lib/ui-patterns";

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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setClient(initial);
    setName(initial.name);
    setCompany(initial.company ?? "");
    setPhone(initial.phone ?? "");
    setEmail(initial.email ?? "");
  }, [initial]);

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
          setClient(updated);
          onUpdated(updated);
          toast.success("Zapisano");
        }
      } catch {
        toast.error("Nie udało się zapisać");
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b border-dna-border p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={EYEBROW}>Profil klienta</p>
            <h2 className={MODAL_TITLE}>
              {getClientDisplayName(client)}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
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

      <Tabs defaultValue="feed" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-5 mt-4 w-auto shrink-0 justify-start">
          <TabsTrigger value="feed">Oś czasu</TabsTrigger>
          <TabsTrigger value="details">Szczegóły</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-0 flex-1 px-5 py-4">
          <ClientTimelineFeed clientId={client.id} />
        </TabsContent>

        <TabsContent value="details" className="mt-0 space-y-3 px-5 py-4">
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

      <div className="shrink-0 border-t border-dna-border p-4">
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
