"use client";

import { useState } from "react";
import { LayoutGroup } from "framer-motion";
import { EntityCard } from "@/components/cards/EntityCard";
import { ClientProfileDetail } from "@/components/crm/ClientProfileDetail";
import { MotionDetailOverlay } from "@/components/ui/motion-detail-overlay";
import type { Client } from "@/lib/crm/clients";
import { EYEBROW } from "@/lib/ui-patterns";

export type RevenueClientRow = Client & {
  displayName: string;
  totalRevenuePln: number;
};

type RevenueClientGridProps = {
  clients: RevenueClientRow[];
};

export function RevenueClientGrid({ clients }: RevenueClientGridProps) {
  const [selected, setSelected] = useState<RevenueClientRow | null>(null);
  const [open, setOpen] = useState(false);

  if (clients.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Brak zrealizowanych klientów z przychodem.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className={EYEBROW}>Zrealizowani klienci</p>
        <p className="text-sm text-muted-foreground">
          {clients.length} {clients.length === 1 ? "profil" : "profile"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <EntityCard
            key={client.id}
            layoutId={`client-${client.id}`}
            title={client.displayName}
            coverUrl={client.coverUrl}
            cardColor={client.cardColor}
            tags={client.tags}
            subtitle={
              client.totalRevenuePln > 0
                ? `${client.totalRevenuePln.toLocaleString("pl-PL")} PLN`
                : null
            }
            onClick={() => {
              setSelected(client);
              setOpen(true);
            }}
          />
        ))}
      </div>

      <LayoutGroup id="zyski-clients">
        <MotionDetailOverlay
          open={open}
          onClose={() => setOpen(false)}
          layoutId={selected ? `client-${selected.id}` : undefined}
          panelClassName="!flex !max-h-[min(88vh,760px)] !flex-col !overflow-hidden p-0"
        >
          {selected && open ? (
            <ClientProfileDetail
              client={selected}
              onUpdated={(c) => {
                setSelected((prev) =>
                  prev ? { ...prev, ...c } : null,
                );
              }}
              onArchived={() => {
                setOpen(false);
                setSelected(null);
              }}
              onClose={() => setOpen(false)}
            />
          ) : null}
        </MotionDetailOverlay>
      </LayoutGroup>
    </section>
  );
}
