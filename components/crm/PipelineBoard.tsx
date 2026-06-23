"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { toast } from "sonner";
import { updateLeadStage } from "@/lib/actions/leads";
import {
  ACTIVE_PIPELINE_STAGES,
  ARCHIVE_STAGES,
  PIPELINE_COLUMNS,
  type Lead,
  type LeadWithMeta,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import type { CurrentUser } from "@/components/crm/PipelineCard";
import { PipelineColumn, PipelineColumnStatic } from "./PipelineColumn";
import { PipelineCardOverlay } from "./PipelineCard";
import {
  PipelineOutcomeZone,
  PipelineOutcomeZoneStatic,
} from "./PipelineOutcomeZone";
import { useMounted } from "@/hooks/use-mounted";

type PipelineBoardProps = {
  leads: LeadWithMeta[];
  currentUser?: CurrentUser;
  onOpenLead: (lead: Lead) => void;
  onLeadUpdated: (lead: Lead) => void;
  onLeadArchived: (leadId: string) => void;
  onAddLead: (stage: PipelineStageId) => void;
  selectedLeadId?: string | null;
};

export function PipelineBoard({
  leads: initialLeads,
  currentUser,
  onOpenLead,
  onLeadUpdated,
  onLeadArchived,
  onAddLead,
  selectedLeadId,
}: PipelineBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLead, setActiveLead] = useState<LeadWithMeta | null>(null);
  const [, startTransition] = useTransition();
  const mounted = useMounted();

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

  function handleLeadUpdated(lead: Lead) {
    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id ? { ...item, ...lead } : item,
      ),
    );
    onLeadUpdated(lead);
  }

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
          toast.success("Projekt zrealizowany — dodano do archiwum");
          onLeadArchived(leadId);
        } else if (nextStage === "lost") {
          toast.success("Współpraca zakończona — przeniesiono do archiwum");
          onLeadArchived(leadId);
        } else {
          toast.success("Etap zaktualizowany");
        }
      } catch {
        toast.error("Nie udało się zmienić etapu");
        setLeads(initialLeads);
      }
    });
  }

  const Column = mounted ? PipelineColumn : PipelineColumnStatic;
  const OutcomeZone = mounted ? PipelineOutcomeZone : PipelineOutcomeZoneStatic;

  const board = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            label={column.label}
            accentColor={column.accent}
            leads={column.leads}
            currentUser={currentUser}
            onOpenLead={onOpenLead}
            onLeadUpdated={handleLeadUpdated}
            onAddLead={onAddLead}
            selectedLeadId={selectedLeadId}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OutcomeZone
          id="lost"
          label="Koniec współpracy"
          description="Upuść tutaj — klient trafia do archiwum"
          variant="lost"
        />
        <OutcomeZone
          id="won"
          label="Zrealizowano"
          description="Upuść tutaj — projekt trafia do archiwum"
          variant="won"
        />
      </div>
    </>
  );

  if (!mounted) {
    return board;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {board}

      <DragOverlay>
        {activeLead ? <PipelineCardOverlay lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
