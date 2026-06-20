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
  ARCHIVE_STAGES,
  PIPELINE_COLUMNS,
  type Lead,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineCard } from "./PipelineCard";
import { PipelineOutcomeZone } from "./PipelineOutcomeZone";
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

    const nextStage = String(overId) as PipelineStageId;
    const validStages = [...ACTIVE_PIPELINE_STAGES, ...ARCHIVE_STAGES];
    if (!validStages.includes(nextStage)) return;

    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.pipelineStage === nextStage) return;

    const isClosing = nextStage === "won" || nextStage === "lost";

    if (isClosing) {
      setLeads((current) => current.filter((item) => item.id !== leadId));
    } else {
      setLeads((current) =>
        current.map((item) =>
          item.id === leadId ? { ...item, pipelineStage: nextStage } : item,
        ),
      );
    }

    startTransition(async () => {
      try {
        await updateLeadStage(leadId, nextStage);
        if (nextStage === "won") {
          toast.success("Deal wygrany — dodano do Zysków");
        } else if (nextStage === "lost") {
          toast.success("Deal przeniesiony do Archiwum");
        } else {
          toast.success("Etap zaktualizowany");
        }
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
              Przeciągaj karty między etapami · upuść w strefie wygrany/przegrany
            </CardDescription>
          </div>
          <Button onClick={openNewDeal}>
            <Plus className="size-4" />
            Nowy klient
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PipelineOutcomeZone
                id="won"
                label="Wygrany"
                description="Upuść tutaj — deal trafia do Zysków"
                variant="won"
              />
              <PipelineOutcomeZone
                id="lost"
                label="Przegrany"
                description="Upuść tutaj — deal trafia do Archiwum"
                variant="lost"
              />
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="w-full max-w-[280px] rotate-2 opacity-95">
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
