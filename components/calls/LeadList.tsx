"use client";

import { useMemo, useState, useTransition } from "react";
import { Phone, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadDrawer } from "./LeadDrawer";
import type { leads } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;

const TEMPERATURE_STYLES = {
  cold: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  warm: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  hot: "border-rose-500/40 bg-rose-500/10 text-rose-300",
} as const;

const TEMPERATURE_LABELS = {
  cold: "Zimny",
  warm: "Ciepły",
  hot: "Gorący",
} as const;

type LeadListProps = {
  leads: Lead[];
};

export function LeadList({ leads: initialLeads }: LeadListProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<"all" | "cold" | "warm" | "hot">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((lead) => lead.temperature === filter);
  }, [filter, leads]);

  function openNew() {
    setSelectedLead(null);
    setDrawerOpen(true);
  }

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setDrawerOpen(true);
  }

  function handleUpdated(lead: Lead) {
    startTransition(() => {
      setLeads((current) => {
        const exists = current.some((item) => item.id === lead.id);
        if (exists) {
          return current.map((item) => (item.id === lead.id ? lead : item));
        }
        return [lead, ...current];
      });
    });
  }

  function handleDeleted(leadId: string) {
    setLeads((current) => current.filter((item) => item.id !== leadId));
    setDrawerOpen(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Cold Calling</h2>
          <p className="text-sm text-muted-foreground">
            Strzelectwo wyborowe — szybki drawer, zero przeładowań.
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-400 text-black">
          <Plus className="size-4" />
          Kontakt
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "hot", "warm", "cold"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "Wszyscy" : TEMPERATURE_LABELS[value]}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredLeads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            Brak kontaktów. Dodaj pierwszy lead i odnotuj call.
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => openLead(lead)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-left transition hover:border-emerald-500/40 hover:bg-card"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium truncate">{lead.name}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", TEMPERATURE_STYLES[lead.temperature])}
                  >
                    {TEMPERATURE_LABELS[lead.temperature]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {[lead.company, lead.phone, lead.email]
                    .filter(Boolean)
                    .join(" · ") || "Brak danych kontaktowych"}
                </p>
              </div>
              <Phone className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      <LeadDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </section>
  );
}
