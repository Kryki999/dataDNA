"use client";

import { useCallback, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  completeCalendarEvent,
  createPlannerEvent,
  deletePlannerEvent,
  moveToBacklog,
  rescheduleCalendarEvent,
  schedulePlannerEvent,
  updatePlannerEvent,
} from "@/lib/actions/calendar";
import type { PlannerEventWithMeta, PlannerLeadOption } from "@/lib/planner/types";
import { DEFAULT_EVENT_DURATION_MS } from "@/lib/planner/types";
import { addDefaultDuration } from "@/components/planner/planner-utils";

type UsePlannerMutationsProps = {
  scheduled: PlannerEventWithMeta[];
  backlog: PlannerEventWithMeta[];
  leads: PlannerLeadOption[];
  setScheduled: React.Dispatch<React.SetStateAction<PlannerEventWithMeta[]>>;
  setBacklog: React.Dispatch<React.SetStateAction<PlannerEventWithMeta[]>>;
};

export function usePlannerMutations({
  scheduled,
  backlog,
  leads,
  setScheduled,
  setBacklog,
}: UsePlannerMutationsProps) {
  const [, startTransition] = useTransition();
  const scheduledRef = useRef(scheduled);
  const backlogRef = useRef(backlog);
  scheduledRef.current = scheduled;
  backlogRef.current = backlog;

  const findLead = useCallback(
    (leadId: string | null) => {
      if (!leadId) return { leadName: null, leadCompany: null };
      const lead = leads.find((l) => l.id === leadId);
      return {
        leadName: lead?.name ?? null,
        leadCompany: lead?.company ?? null,
      };
    },
    [leads],
  );

  const updateEventInState = useCallback(
    (eventId: string, updater: (e: PlannerEventWithMeta) => PlannerEventWithMeta) => {
      setScheduled((current) =>
        current.map((e) => (e.id === eventId ? updater(e) : e)),
      );
      setBacklog((current) =>
        current.map((e) => (e.id === eventId ? updater(e) : e)),
      );
    },
    [setScheduled, setBacklog],
  );

  const scheduleEvent = useCallback(
    (eventId: string, dueAt: Date, endsAt?: Date) => {
      const end = endsAt ?? addDefaultDuration(dueAt);
      const fromBacklog = backlogRef.current.find((e) => e.id === eventId);

      if (fromBacklog) {
        setBacklog((c) => c.filter((e) => e.id !== eventId));
        setScheduled((c) => [
          ...c,
          { ...fromBacklog, dueAt, endsAt: end },
        ]);
      } else {
        setScheduled((c) =>
          c.map((e) =>
            e.id === eventId ? { ...e, dueAt, endsAt: end } : e,
          ),
        );
      }

      startTransition(async () => {
        try {
          await schedulePlannerEvent(eventId, dueAt, end);
        } catch {
          toast.error("Nie udało się zaplanować zadania");
        }
      });
    },
    [setBacklog, setScheduled, startTransition],
  );

  const rescheduleEvent = useCallback(
    (eventId: string, dueAt: Date, endsAt: Date) => {
      setScheduled((c) =>
        c.map((e) => (e.id === eventId ? { ...e, dueAt, endsAt } : e)),
      );
      startTransition(async () => {
        try {
          await rescheduleCalendarEvent(eventId, dueAt, endsAt);
        } catch {
          toast.error("Nie udało się zaktualizować terminu");
        }
      });
    },
    [setScheduled, startTransition],
  );

  const moveEventToBacklog = useCallback(
    (eventId: string) => {
      const event = scheduledRef.current.find((e) => e.id === eventId);
      if (!event) return;
      setScheduled((c) => c.filter((e) => e.id !== eventId));
      setBacklog((c) => [{ ...event, dueAt: null, endsAt: null }, ...c]);

      startTransition(async () => {
        try {
          await moveToBacklog(eventId);
        } catch {
          toast.error("Nie udało się przenieść do backlogu");
        }
      });
    },
    [setBacklog, setScheduled, startTransition],
  );

  const createBacklogEvent = useCallback(
    (title: string) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: PlannerEventWithMeta = {
        id: tempId,
        organizationId: "",
        leadId: null,
        title,
        description: "",
        icon: "task",
        dueAt: null,
        endsAt: null,
        completedAt: null,
        status: "pending",
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
        leadName: null,
        leadCompany: null,
        attachments: [],
      };
      setBacklog((c) => [optimistic, ...c]);

      startTransition(async () => {
        try {
          const created = await createPlannerEvent({ title });
          setBacklog((c) =>
            c.map((e) =>
              e.id === tempId
                ? {
                    ...optimistic,
                    ...created,
                    id: created.id,
                    leadName: null,
                    leadCompany: null,
                    attachments: [],
                  }
                : e,
            ),
          );
        } catch {
          setBacklog((c) => c.filter((e) => e.id !== tempId));
          toast.error("Nie udało się dodać zadania");
        }
      });
    },
    [setBacklog, startTransition],
  );

  const patchEvent = useCallback(
    (eventId: string, patch: Parameters<typeof updatePlannerEvent>[1]) => {
      const meta = patch.leadId !== undefined ? findLead(patch.leadId) : {};
      updateEventInState(eventId, (e) => ({ ...e, ...patch, ...meta }));

      startTransition(async () => {
        try {
          await updatePlannerEvent(eventId, patch);
        } catch {
          toast.error("Nie udało się zapisać zmian");
        }
      });
    },
    [findLead, startTransition, updateEventInState],
  );

  const completeEvent = useCallback(
    (eventId: string) => {
      updateEventInState(eventId, (e) => ({
        ...e,
        status: "completed",
        completedAt: new Date(),
      }));

      startTransition(async () => {
        try {
          await completeCalendarEvent(eventId);
          toast.success("Zadanie oznaczone jako wykonane");
        } catch {
          toast.error("Nie udało się oznaczyć zadania");
        }
      });
    },
    [startTransition, updateEventInState],
  );

  const removeEvent = useCallback(
    (eventId: string) => {
      setScheduled((c) => c.filter((e) => e.id !== eventId));
      setBacklog((c) => c.filter((e) => e.id !== eventId));

      startTransition(async () => {
        try {
          await deletePlannerEvent(eventId);
          toast.success("Zadanie usunięte");
        } catch {
          toast.error("Nie udało się usunąć zadania");
        }
      });
    },
    [setBacklog, setScheduled, startTransition],
  );

  const resizeEvent = useCallback(
    (eventId: string, endsAt: Date) => {
      setScheduled((c) =>
        c.map((e) => (e.id === eventId ? { ...e, endsAt } : e)),
      );
      const event = scheduledRef.current.find((e) => e.id === eventId);
      if (!event?.dueAt) return;
      const dueAt = new Date(event.dueAt);

      startTransition(async () => {
        try {
          await rescheduleCalendarEvent(eventId, dueAt, endsAt);
        } catch {
          toast.error("Nie udało się zmienić czasu trwania");
        }
      });
    },
    [setScheduled, startTransition],
  );

  return {
    scheduleEvent,
    rescheduleEvent,
    moveEventToBacklog,
    createBacklogEvent,
    patchEvent,
    completeEvent,
    removeEvent,
    resizeEvent,
    updateEventInState,
  };
}
