"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SURFACE_OVERLAY } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type MotionDetailOverlayProps = {
  open: boolean;
  onClose: () => void;
  layoutId?: string;
  children: React.ReactNode;
  className?: string;
};

export function MotionDetailOverlay({
  open,
  onClose,
  layoutId,
  children,
  className,
}: MotionDetailOverlayProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="motion-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className={cn("fixed inset-0 z-50", SURFACE_OVERLAY)}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="motion-detail-panel"
            layoutId={layoutId}
            className={cn(
              "fixed inset-x-4 top-[8%] z-50 mx-auto max-h-[min(85vh,720px)] w-full max-w-lg overflow-x-hidden overflow-y-auto rounded-xl bg-dna-surface shadow-2xl",
              className,
            )}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 400, damping: 32 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
