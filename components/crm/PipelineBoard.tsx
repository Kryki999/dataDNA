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
import {
  getActivePipelineDealsWithMeta,
  updatePipelineDealStatus,
  type PipelineDealWithMeta,
} from "@/lib/actions/pipeline-deals";
import {
  CLOSED_PIPELINE_DEAL_STATUSES,
  PIPELINE_DEAL_COLUMNS,
  type PipelineDealStatus,
} from "@/lib/crm/pipeline-deals";
import type { CurrentUser } from "@/lib/crm/current-user";
import { PipelineColumn, PipelineColumnStatic } from "./PipelineColumn";
import { PipelineCardOverlay } from "./PipelineCard";
import {
  PipelineOutcomeZone,
  PipelineOutcomeZoneStatic,
} from "./PipelineOutcomeZone";
import { useMounted } from "@/hooks/use-mounted";

const OUTCOME_IDS = CLOSED_PIPELINE_DEAL_STATUSES;

type PipelineBoardProps = {
  deals: PipelineDealWithMeta[];
  currentUser?: CurrentUser;
  onOpenDeal: (deal: PipelineDealWithMeta) => void;
  onDealClosed: (dealId: string) => void;
  onRefresh: () => void;
  selectedDealId?: string | null;
};

export function PipelineBoard({
  deals: initialDeals,
  currentUser,
  onOpenDeal,
  onDealClosed,
  onRefresh,
  selectedDealId,
}: PipelineBoardProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeDeal, setActiveDeal] = useState<PipelineDealWithMeta | null>(
    null,
  );
  const [, startTransition] = useTransition();
  const mounted = useMounted();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    return PIPELINE_DEAL_COLUMNS.map((column) => ({
      ...column,
      deals: deals.filter((deal) => deal.status === column.id),
    }));
  }, [deals]);

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((item) => item.id === event.active.id);
    if (deal) setActiveDeal(deal);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const dealId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId) return;

    const nextStatus = String(overId) as PipelineDealStatus;
    const valid = [
      ...PIPELINE_DEAL_COLUMNS.map((c) => c.id),
      ...OUTCOME_IDS,
    ];
    if (!valid.includes(nextStatus)) return;

    const deal = deals.find((item) => item.id === dealId);
    if (!deal || deal.status === nextStatus) return;

    const isClosing = OUTCOME_IDS.includes(
      nextStatus as (typeof OUTCOME_IDS)[number],
    );

    if (isClosing) {
      setDeals((current) => current.filter((item) => item.id !== dealId));
    } else {
      setDeals((current) =>
        current.map((item) =>
          item.id === dealId ? { ...item, status: nextStatus } : item,
        ),
      );
    }

    startTransition(async () => {
      try {
        await updatePipelineDealStatus(dealId, nextStatus);
        if (nextStatus === "closed_won") {
          toast.success("Projekt zrealizowany");
          onDealClosed(dealId);
        } else if (nextStatus === "closed_lost") {
          toast.success("Współpraca zakończona");
          onDealClosed(dealId);
        } else {
          toast.success("Etap zaktualizowany");
        }
      } catch {
        toast.error("Nie udało się zmienić etapu");
        const refreshed = await getActivePipelineDealsWithMeta();
        setDeals(refreshed);
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
            deals={column.deals}
            currentUser={currentUser}
            onOpenDeal={onOpenDeal}
            onDealCreated={onRefresh}
            selectedDealId={selectedDealId}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OutcomeZone
          id="closed_lost"
          label="Koniec współpracy"
          description="Karta znika z tablicy — profil zostaje w bazie"
          variant="lost"
        />
        <OutcomeZone
          id="closed_won"
          label="Zrealizowano"
          description="Projekt zamknięty — historia w profilu klienta"
          variant="won"
        />
      </div>
    </>
  );

  if (!mounted) return board;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {board}
      <DragOverlay>
        {activeDeal ? <PipelineCardOverlay deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
