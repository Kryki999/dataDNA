"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addWeeks, subWeeks } from "date-fns";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { PlannerBacklogDrawer } from "@/components/planner/PlannerBacklogDrawer";
import { PlannerBacklogPanel } from "@/components/planner/PlannerBacklogPanel";
import { PlannerDayAgenda } from "@/components/planner/PlannerDayAgenda";
import { PlannerEventDetail } from "@/components/planner/PlannerEventDetail";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import { PlannerSlotPicker } from "@/components/planner/PlannerSlotPicker";
import { PlannerToolbar } from "@/components/planner/PlannerToolbar";
import { PlannerWeekGrid } from "@/components/planner/PlannerWeekGrid";
import { usePlannerMutations } from "@/components/planner/hooks/usePlannerMutations";
import {
  BACKLOG_DROP_ID,
  addDefaultDuration,
  getWeekDays,
  parseSlotId,
} from "@/components/planner/planner-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  PlannerEventWithMeta,
  PlannerLeadOption,
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

  useEffect(() => {
    if (!selectedId) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDetail();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedId, closeDetail]);

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
        isMobile={isMobile}
      />

      {isMobile ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-800"
            onClick={() => setMobileBacklogOpen(true)}
          >
            <Inbox className="size-4" />
            Backlog ({backlog.length})
          </Button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <LayoutGroup id="planner-events">
          <div
            className={cn(
              "flex min-h-[calc(100vh-14rem)] gap-3",
              !isMobile && "flex-row",
              isMobile && "flex-col",
            )}
          >
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
              <>
                <div className={cn("flex min-w-0 flex-col", backlogOpen ? "w-[75%]" : "flex-1")}>
                  <PlannerWeekGrid
                    weekDays={weekDays}
                    events={scheduled}
                    hideCompleted={hideCompleted}
                    selectedId={selectedId}
                    draggingId={draggingId}
                    onSelect={setSelectedId}
                    onResize={mutations.resizeEvent}
                  />
                </div>
                {backlogOpen ? (
                  <PlannerBacklogPanel
                    events={backlog}
                    onQuickAdd={mutations.createBacklogEvent}
                    onSelect={setSelectedId}
                  />
                ) : null}
              </>
            )}
          </div>

          <AnimatePresence>
            {selectedEvent && selectedId ? (
              <>
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                  onClick={closeDetail}
                />
                <motion.div
                  key="detail"
                  layoutId={`planner-event-${selectedId}`}
                  className="fixed inset-x-4 top-[8%] z-50 mx-auto max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                >
                  <PlannerEventDetail
                    event={selectedEvent}
                    leads={leads}
                    onPatch={mutations.patchEvent}
                    onComplete={mutations.completeEvent}
                    onDelete={mutations.removeEvent}
                    onClose={closeDetail}
                    onAttachmentsChange={handleAttachmentsChange}
                  />
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </LayoutGroup>

        <DragOverlay>
          {activeDragEvent ? (
            <div className="w-48 rounded-md border border-sky-500/40 bg-zinc-900 p-2 shadow-lg">
              <div className="flex items-center gap-2">
                <PlannerIconBadge icon={activeDragEvent.icon} />
                <span className="truncate text-xs font-semibold text-zinc-100">
                  {activeDragEvent.title}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PlannerBacklogDrawer
        open={mobileBacklogOpen}
        onOpenChange={setMobileBacklogOpen}
        events={backlog}
        onQuickAdd={mutations.createBacklogEvent}
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
