"use client";

import { useMemo, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { Search } from "lucide-react";
import { ClientCardColorControl } from "@/components/cards/ClientCardColorControl";
import { EntityCard } from "@/components/cards/EntityCard";
import { ClientProfileDetail } from "@/components/crm/ClientProfileDetail";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Input } from "@/components/ui/input";
import { MotionDetailOverlay } from "@/components/ui/motion-detail-overlay";
import { scoreClientMatch } from "@/lib/crm/client-name";
import type { Client } from "@/lib/crm/clients";
import { EYEBROW, INPUT_SURFACE } from "@/lib/ui-patterns";

type ClientCatalogClientProps = {
  clients: Client[];
};

export function ClientCatalogClient({ clients: initial }: ClientCatalogClientProps) {
  const [clients, setClients] = useState(initial);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return clients;
    return clients
      .map((c) => ({
        client: c,
        score: scoreClientMatch(q, c),
      }))
      .filter((r) => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.client);
  }, [clients, query]);

  function syncClient(updated: Client) {
    setClients((cur) =>
      cur.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (selected?.id === updated.id) setSelected(updated);
  }

  return (
    <DashboardPage wide>
      <header className="mb-8 space-y-4">
        <div>
          <p className={EYEBROW}>Baza klientów</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kolor karty ustawisz kropką na karcie lub w profilu klienta
          </p>
        </div>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtruj po nazwie lub tagu…"
            className={INPUT_SURFACE + " pl-9"}
          />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((client) => {
          const title = client.company?.trim() || client.name;
          return (
            <div key={client.id} className="group relative">
              <EntityCard
                layoutId={`client-${client.id}`}
                title={title}
                coverUrl={client.coverUrl}
                cardColor={client.cardColor}
                tags={client.tags}
                onClick={() => {
                  setSelected(client);
                  setOpen(true);
                }}
              />
              <div
                className="absolute bottom-2.5 right-2.5 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <ClientCardColorControl
                  clientId={client.id}
                  value={client.cardColor}
                  onUpdated={syncClient}
                  size="sm"
                  align="end"
                  className="bg-dna-surface/80 shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Brak klientów pasujących do wyszukiwania.
        </p>
      ) : null}

      <LayoutGroup id="baza-clients">
        <MotionDetailOverlay
          open={open}
          onClose={() => setOpen(false)}
          layoutId={selected ? `client-${selected.id}` : undefined}
          embeddedLayout
          panelClassName="!flex !max-h-[min(88vh,760px)] !flex-col !overflow-hidden p-0"
        >
          {selected && open ? (
            <ClientProfileDetail
              client={selected}
              onUpdated={(c) => {
                setSelected(c);
                setClients((cur) =>
                  cur.map((item) => (item.id === c.id ? c : item)),
                );
              }}
              onArchived={(id) => {
                setClients((cur) => cur.filter((c) => c.id !== id));
                setOpen(false);
                setSelected(null);
              }}
              onClose={() => setOpen(false)}
            />
          ) : null}
        </MotionDetailOverlay>
      </LayoutGroup>
    </DashboardPage>
  );
}
