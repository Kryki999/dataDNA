"use client";

import { useRef } from "react";

type UseSwipeDaysOptions = {
  onPrev: () => void;
  onNext: () => void;
  threshold?: number;
};

export function useSwipeDays({
  onPrev,
  onNext,
  threshold = 50,
}: UseSwipeDaysOptions) {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (event: React.TouchEvent) => {
      startX.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (startX.current === null) return;
      const endX = event.changedTouches[0]?.clientX ?? startX.current;
      const delta = endX - startX.current;
      if (delta > threshold) onPrev();
      else if (delta < -threshold) onNext();
      startX.current = null;
    },
  };
}
