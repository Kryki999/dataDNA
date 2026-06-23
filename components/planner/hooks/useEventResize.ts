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

const RESIZE_CLICK_BLOCK_MS = 300;

export function useEventResize({ dueAt, endsAt, onResize }: UseEventResizeOptions) {
  const resizing = useRef(false);
  const moved = useRef(false);
  const startY = useRef(0);
  const startEnd = useRef(endsAt);
  const captureTarget = useRef<HTMLElement | null>(null);
  const blockClickUntil = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      resizing.current = true;
      moved.current = false;
      startY.current = event.clientY;
      startEnd.current = endsAt;
      captureTarget.current = event.currentTarget as HTMLElement;
      captureTarget.current.setPointerCapture(event.pointerId);
    },
    [endsAt],
  );

  const shouldBlockClick = useCallback(() => {
    if (Date.now() < blockClickUntil.current) {
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!resizing.current) return;
      const deltaY = event.clientY - startY.current;
      if (Math.abs(deltaY) > 2) {
        moved.current = true;
      }
      const deltaMinutes = snapMinutes((deltaY / HOUR_HEIGHT_PX) * 60);
      const nextEnd = addMinutes(startEnd.current, deltaMinutes);
      const minEnd = addMinutes(dueAt, SLOT_MINUTES);
      if (nextEnd >= minEnd) {
        onResize(nextEnd);
      }
    }

    function onPointerUp(event: PointerEvent) {
      if (!resizing.current) return;
      resizing.current = false;
      if (moved.current) {
        blockClickUntil.current = Date.now() + RESIZE_CLICK_BLOCK_MS;
      }
      if (captureTarget.current?.hasPointerCapture(event.pointerId)) {
        captureTarget.current.releasePointerCapture(event.pointerId);
      }
      captureTarget.current = null;
      event.stopPropagation();
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dueAt, onResize]);

  return { onPointerDown, shouldBlockClick };
}
