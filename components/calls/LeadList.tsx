"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Phone, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LeadDrawer } from "./LeadDrawer";
import type { leads } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;

const TEMPERATURE_STYLES = {
  cold: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  warm: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  hot: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
} as const;

const TEMPERATURE_LABELS = {
  cold: "Zimny",
  warm: "Ciepły",
  hot: "Gorący",
} as const;

type LeadListProps = {
  leads: Lead[];
  embedded?: boolean;
  onRegisterOpenNew?: (fn: () => void) => void;
};

export function LeadList({
  leads: initialLeads,
  embedded = false,
  onRegisterOpenNew,
}: LeadListProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<"all" | "cold" | "warm" | "hot">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((lead) => lead.temperature === filter);
  }, [filter, leads]);

  const openNew = useCallback(() => {
    setSelectedLead(null);
    setDrawerOpen(true);
  }, []);

  useEffect(() => {
    onRegisterOpenNew?.(openNew);
  }, [onRegisterOpenNew, openNew]);

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

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {!embedded ? (
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Cold Calling</h2>
            <p className="text-sm text-muted-foreground">
              Strzelectwo wyborowe — szybki drawer.
            </p>
          </div>
        ) : null}
        <Button onClick={openNew} className="shrink-0">
          <Plus className="size-4" />
          Kontakt
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2">
        {(["all", "hot", "warm", "cold"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
            className="min-h-9 shrink-0 px-3"
          >
            {value === "all" ? "Wszyscy" : TEMPERATURE_LABELS[value]}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredLeads.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Brak kontaktów. Dodaj pierwszy lead.
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => openLead(lead)}
              className="flex w-full min-h-[4.5rem] items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{lead.name}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", TEMPERATURE_STYLES[lead.temperature])}
                  >
                    {TEMPERATURE_LABELS[lead.temperature]}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
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
    </>
  );

  if (embedded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cold Calling</CardTitle>
          <CardDescription>
            Tapnij kontakt → odnotuj call
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{content}</CardContent>
      </Card>
    );
  }

  return <section className="space-y-4">{content}</section>;
}
