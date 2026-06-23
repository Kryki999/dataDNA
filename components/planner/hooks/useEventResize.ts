"use client";

import { useCallback, useEffect, useRef } from "react";
import { addMinutes } from "date-fns";
import { HOUR_HEIGHT_PX, SLOT_MINUTES } from "@/lib/planner/types";
import { snapMinutes } from "@/components/planner/planner-utils";

type UseEventResizeOptions = {
  dueAt: Date;
  endsAt: Date;
  onResize: (endsAt: Date) => void;
};

export function useEventResize({ dueAt, endsAt, onResize }: UseEventResizeOptions) {
  const resizing = useRef(false);
  const startY = useRef(0);
  const startEnd = useRef(endsAt);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      resizing.current = true;
      startY.current = event.clientY;
      startEnd.current = endsAt;
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [endsAt],
  );

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!resizing.current) return;
      const deltaY = event.clientY - startY.current;
      const deltaMinutes = snapMinutes((deltaY / HOUR_HEIGHT_PX) * 60);
      const nextEnd = addMinutes(startEnd.current, deltaMinutes);
      const minEnd = addMinutes(dueAt, SLOT_MINUTES);
      if (nextEnd >= minEnd) {
        onResize(nextEnd);
      }
    }

    function onPointerUp() {
      resizing.current = false;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dueAt, onResize]);

  return { onPointerDown };
}
