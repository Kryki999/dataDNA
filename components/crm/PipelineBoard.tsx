"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateLeadStage } from "@/lib/actions/leads";
import {
  ACTIVE_PIPELINE_STAGES,
  PIPELINE_COLUMNS,
  type Lead,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineCard } from "./PipelineCard";
import { DealSheet } from "./DealSheet";

type PipelineBoardProps = {
  leads: Lead[];
  onRegisterOpenNew?: (fn: () => void) => void;
};

export function PipelineBoard({
  leads: initialLeads,
  onRegisterOpenNew,
}: PipelineBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    return PIPELINE_COLUMNS.map((column) => ({
      ...column,
      leads: leads.filter((lead) => lead.pipelineStage === column.id),
    }));
  }, [leads]);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const openNewDeal = useCallback(() => {
    setSelectedLead(null);
    setSheetOpen(true);
  }, []);

  useEffect(() => {
    onRegisterOpenNew?.(openNewDeal);
  }, [onRegisterOpenNew, openNewDeal]);

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((item) => item.id === event.active.id);
    if (lead) setActiveLead(lead);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const leadId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId) return;

    const nextStage = String(overId);
    if (
      !ACTIVE_PIPELINE_STAGES.includes(
        nextStage as (typeof ACTIVE_PIPELINE_STAGES)[number],
      )
    ) {
      return;
    }

    const stage = nextStage as (typeof ACTIVE_PIPELINE_STAGES)[number];
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.pipelineStage === stage) return;

    setLeads((current) =>
      current.map((item) =>
        item.id === leadId ? { ...item, pipelineStage: stage } : item,
      ),
    );

    startTransition(async () => {
      try {
        await updateLeadStage(leadId, stage);
        toast.success("Etap zaktualizowany");
      } catch {
        toast.error("Nie udało się zmienić etapu");
        setLeads(initialLeads);
      }
    });
  }

  function handleLeadUpdated(lead: Lead) {
    setLeads((current) => {
      const exists = current.some((item) => item.id === lead.id);
      if (!exists) return [lead, ...current];
      return current.map((item) => (item.id === lead.id ? lead : item));
    });
    setSelectedLead(lead);
  }

  function handleLeadArchived(leadId: string) {
    setLeads((current) => current.filter((item) => item.id !== leadId));
    setSheetOpen(false);
    setSelectedLead(null);
  }

  return (
    <>
      <Card className="border-border/80 bg-card/80">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Lejek sprzedażowy</CardTitle>
            <CardDescription>
              Przeciągaj karty między kolumnami · kliknij kartę po szczegóły
            </CardDescription>
          </div>
          <Button onClick={openNewDeal}>
            <Plus className="size-4" />
            Nowy klient
          </Button>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
              {columns.map((column) => (
                <PipelineColumn
                  key={column.id}
                  id={column.id}
                  label={column.label}
                  colorClass={column.color}
                  leads={column.leads}
                  onOpenLead={(lead) => {
                    setSelectedLead(lead);
                    setSheetOpen(true);
                  }}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? (
                <div className="w-[280px] rotate-2 opacity-95">
                  <PipelineCard lead={activeLead} onOpen={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      <DealSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lead={selectedLead}
        onUpdated={handleLeadUpdated}
        onArchived={handleLeadArchived}
      />
    </>
  );
}
