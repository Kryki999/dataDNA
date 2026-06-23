"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { Kanban, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { LeadsListTable } from "@/components/crm/LeadsListTable";
import { DealSheet } from "@/components/crm/DealSheet";
import { useNewLead } from "@/components/dashboard/new-lead-provider";
import type { Lead, LeadWithMeta, PipelineStageId } from "@/lib/crm/pipeline";
import type { CurrentUser } from "@/components/crm/PipelineCard";
import { EYEBROW } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type CrmView = "kanban" | "list";

type KlienciClientProps = {
  leads: LeadWithMeta[];
  currentUser?: CurrentUser;
};

export function KlienciClient({ leads: initialLeads, currentUser }: KlienciClientProps) {
  const [view, setView] = useState<CrmView>("kanban");
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<PipelineStageId | undefined>();
  const { registerOpenNewLead } = useNewLead();

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const openNewDeal = useCallback(() => {
    setSelectedLead(null);
    setDefaultStage(undefined);
    setSheetOpen(true);
  }, []);

  const openNewDealWithStage = useCallback((stage: PipelineStageId) => {
    setSelectedLead(null);
    setDefaultStage(stage);
    setSheetOpen(true);
  }, []);

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setDefaultStage(undefined);
  }

  useEffect(() => {
    registerOpenNewLead(openNewDeal);
  }, [registerOpenNewLead, openNewDeal]);

  function handleOpenLead(lead: Lead) {
    setSelectedLead(lead);
    setSheetOpen(true);
  }

  function handleLeadUpdated(lead: Lead) {
    setLeads((current) => {
      const exists = current.some((item) => item.id === lead.id);
      if (!exists) {
        return [{ ...lead, lastNoteBody: null }, ...current];
      }
      return current.map((item) =>
        item.id === lead.id ? { ...item, ...lead } : item,
      );
    });
    setSelectedLead(lead);
  }

  function handleLeadArchived(leadId: string) {
    setLeads((current) => current.filter((item) => item.id !== leadId));
    setSheetOpen(false);
    setSelectedLead(null);
  }

  return (
    <DashboardPage full>
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={EYEBROW}>Pipeline sprzedaży</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lejek sprzedażowy — aktywne procesy
            </p>
          </div>
          <Button onClick={openNewDeal}>
            <Plus className="size-4" />
            Nowy klient
          </Button>
        </div>

        <div className="flex items-center gap-1 border-b border-dna-border/40">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              view === "kanban"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Kanban className="size-4" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              view === "list"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-4" />
            Lista
          </button>
        </div>
      </header>

      <LayoutGroup id="crm-deals">
        {view === "kanban" ? (
          <PipelineBoard
            leads={leads}
            currentUser={currentUser}
            onOpenLead={handleOpenLead}
            onLeadUpdated={handleLeadUpdated}
            onLeadArchived={handleLeadArchived}
            onAddLead={openNewDealWithStage}
            selectedLeadId={sheetOpen ? selectedLead?.id : null}
          />
        ) : (
          <LeadsListTable leads={leads} onOpenLead={handleOpenLead} />
        )}

        <DealSheet
          open={sheetOpen}
          onOpenChange={handleSheetOpenChange}
          lead={selectedLead}
          defaultStage={defaultStage}
          onUpdated={handleLeadUpdated}
          onArchived={handleLeadArchived}
        />
      </LayoutGroup>
    </DashboardPage>
  );
}
