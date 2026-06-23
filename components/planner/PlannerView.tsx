"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addWeeks, subWeeks } from "date-fns";
import { LayoutGroup } from "framer-motion";
import { Inbox } from "lucide-react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { MotionDetailOverlay } from "@/components/ui/motion-detail-overlay";
import { SURFACE_CARD } from "@/lib/ui-patterns";
import { PlannerBacklogBoard } from "@/components/planner/PlannerBacklogBoard";
import { PlannerBacklogDrawer } from "@/components/planner/PlannerBacklogDrawer";
import { PlannerDayAgenda } from "@/components/planner/PlannerDayAgenda";
import { PlannerEventDetail } from "@/components/planner/PlannerEventDetail";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import { PlannerQuickAdd } from "@/components/planner/PlannerQuickAdd";
import { PlannerScheduleAdd } from "@/components/planner/PlannerScheduleAdd";
import { PlannerSlotPicker } from "@/components/planner/PlannerSlotPicker";
import { PlannerToolbar } from "@/components/planner/PlannerToolbar";
import { PlannerWeekGrid } from "@/components/planner/PlannerWeekGrid";
import { usePlannerMutations } from "@/components/planner/hooks/usePlannerMutations";
import {
  BACKLOG_DROP_ID,
  addDefaultDuration,
  getWeekDays,
  parseSlotId,
  plannerCollisionDetection,
} from "@/components/planner/planner-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  PlannerEventWithMeta,
  PlannerLeadOption,
  PlannerIcon,
} from "@/lib/planner/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlannerViewProps = {
  scheduled: PlannerEventWithMeta[];
  backlog: PlannerEventWithMeta[];
  leads: PlannerLeadOption[];
};

export function PlannerView({
  scheduled: initialScheduled,
  backlog: initialBacklog,
  leads,
}: PlannerViewProps) {
  const isMobile = useIsMobile();
  const [scheduled, setScheduled] = useState(initialScheduled);
  const [backlog, setBacklog] = useState(initialBacklog);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [mobileDay, setMobileDay] = useState(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [scheduleAddOpen, setScheduleAddOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeDragEvent, setActiveDragEvent] =
    useState<PlannerEventWithMeta | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [backlogOpen, setBacklogOpen] = useState(true);
  const [mobileBacklogOpen, setMobileBacklogOpen] = useState(false);
  const [slotPickerEventId, setSlotPickerEventId] = useState<string | null>(
    null,
  );

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

  const mutations = usePlannerMutations({
    scheduled,
    backlog,
    leads,
    setScheduled,
    setBacklog,
  });

  useEffect(() => {
    setScheduled(initialScheduled);
    setBacklog(initialBacklog);
  }, [initialScheduled, initialBacklog]);

  const selectedEvent = useMemo(() => {
    if (!selectedId) return null;
    return (
      scheduled.find((e) => e.id === selectedId) ??
      backlog.find((e) => e.id === selectedId) ??
      null
    );
  }, [selectedId, scheduled, backlog]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const closeDetail = useCallback(() => setSelectedId(null), []);
  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), []);
  const closeScheduleAdd = useCallback(() => setScheduleAddOpen(false), []);

  function handleScheduleAdd(title: string, icon: PlannerIcon, dueAt: Date) {
    mutations.createScheduledEvent(title, icon, dueAt);
    setWeekAnchor(dueAt);
    setMobileDay(dueAt);
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setDraggingId(id);
    const fromScheduled = scheduled.find((e) => e.id === id);
    const fromBacklog = backlog.find((e) => e.id === id);
    setActiveDragEvent(fromScheduled ?? fromBacklog ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    setActiveDragEvent(null);
    const eventId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    if (overId === BACKLOG_DROP_ID) {
      mutations.moveEventToBacklog(eventId);
      return;
    }

    const slot = parseSlotId(overId);
    if (!slot) return;

    const dueAt = new Date(slot.day);
    dueAt.setHours(slot.hour, slot.minute, 0, 0);
    const endsAt = addDefaultDuration(dueAt);

    const inBacklog = backlog.some((e) => e.id === eventId);
    if (inBacklog) {
      mutations.scheduleEvent(eventId, dueAt, endsAt);
    } else {
      const existing = scheduled.find((e) => e.id === eventId);
      const duration =
        existing?.dueAt && existing.endsAt
          ? new Date(existing.endsAt).getTime() -
            new Date(existing.dueAt).getTime()
          : 60 * 60 * 1000;
      mutations.rescheduleEvent(
        eventId,
        dueAt,
        new Date(dueAt.getTime() + duration),
      );
    }
  }

  function handleAttachmentsChange(
    eventId: string,
    attachments: PlannerEventWithMeta["attachments"],
  ) {
    mutations.updateEventInState(eventId, (e) => ({ ...e, attachments }));
  }

  return (
    <DashboardPage full className="space-y-4">
      <PlannerToolbar
        weekDays={weekDays}
        onPrevWeek={() => setWeekAnchor((d) => subWeeks(d, 1))}
        onNextWeek={() => setWeekAnchor((d) => addWeeks(d, 1))}
        onThisWeek={() => {
          const now = new Date();
          setWeekAnchor(now);
          setMobileDay(now);
        }}
        hideCompleted={hideCompleted}
        onToggleHideCompleted={() => setHideCompleted((v) => !v)}
        backlogOpen={backlogOpen}
        onToggleBacklog={() => setBacklogOpen((v) => !v)}
        onAddTask={() => setScheduleAddOpen(true)}
        isMobile={isMobile}
      />

      {isMobile ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-dna-border"
            onClick={() => setMobileBacklogOpen(true)}
          >
            <Inbox className="size-4" />
            Backlog ({backlog.length})
          </Button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={plannerCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <LayoutGroup id="planner-events">
          <div className="flex flex-col gap-5">
            {isMobile ? (
              <PlannerDayAgenda
                day={mobileDay}
                events={scheduled}
                backlog={backlog}
                hideCompleted={hideCompleted}
                selectedId={selectedId}
                draggingId={draggingId}
                onSelect={setSelectedId}
                onResize={mutations.resizeEvent}
                onPrevDay={() =>
                  setMobileDay((d) => new Date(d.getTime() - 86400000))
                }
                onNextDay={() =>
                  setMobileDay((d) => new Date(d.getTime() + 86400000))
                }
                onScheduleBacklog={setSlotPickerEventId}
              />
            ) : (
              <PlannerWeekGrid
                weekDays={weekDays}
                events={scheduled}
                hideCompleted={hideCompleted}
                selectedId={selectedId}
                draggingId={draggingId}
                onSelect={setSelectedId}
                onResize={mutations.resizeEvent}
              />
            )}

            {backlogOpen && !isMobile ? (
              <PlannerBacklogBoard
                events={backlog}
                onQuickAddClick={() => setQuickAddOpen(true)}
                onSelect={setSelectedId}
              />
            ) : null}
          </div>

          <MotionDetailOverlay
            open={Boolean(selectedEvent && selectedId)}
            onClose={closeDetail}
            layoutId={
              selectedId ? `planner-event-${selectedId}` : undefined
            }
          >
            {selectedEvent ? (
              <PlannerEventDetail
                event={selectedEvent}
                leads={leads}
                onPatch={mutations.patchEvent}
                onComplete={mutations.completeEvent}
                onDelete={mutations.removeEvent}
                onClose={closeDetail}
                onAttachmentsChange={handleAttachmentsChange}
              />
            ) : null}
          </MotionDetailOverlay>
        </LayoutGroup>

        <DragOverlay>
          {activeDragEvent ? (
            <div className={cn("w-52 rounded-lg p-3", SURFACE_CARD, "border border-dna-signal/40")}>
              <div className="flex items-center gap-2">
                <PlannerIconBadge icon={activeDragEvent.icon} />
                <span className="truncate text-xs font-semibold text-foreground">
                  {activeDragEvent.title}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <MotionDetailOverlay open={quickAddOpen} onClose={closeQuickAdd}>
        <PlannerQuickAdd
          onSubmit={mutations.createBacklogEvent}
          onClose={closeQuickAdd}
        />
      </MotionDetailOverlay>

      <MotionDetailOverlay open={scheduleAddOpen} onClose={closeScheduleAdd}>
        <PlannerScheduleAdd
          onSubmit={handleScheduleAdd}
          onClose={closeScheduleAdd}
        />
      </MotionDetailOverlay>

      <PlannerBacklogDrawer
        open={mobileBacklogOpen}
        onOpenChange={setMobileBacklogOpen}
        events={backlog}
        onQuickAddClick={() => {
          setMobileBacklogOpen(false);
          setQuickAddOpen(true);
        }}
        onSchedule={setSlotPickerEventId}
      />

      <PlannerSlotPicker
        open={slotPickerEventId !== null}
        onOpenChange={(open) => !open && setSlotPickerEventId(null)}
        day={mobileDay}
        onSelect={(dueAt) => {
          if (slotPickerEventId) {
            mutations.scheduleEvent(slotPickerEventId, dueAt);
            setSlotPickerEventId(null);
          }
        }}
      />
    </DashboardPage>
  );
}
