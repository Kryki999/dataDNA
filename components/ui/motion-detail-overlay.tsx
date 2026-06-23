"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { DNA_SCROLLBAR, SURFACE_OVERLAY } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

type MotionDetailOverlayProps = {
  open: boolean;
  onClose: () => void;
  layoutId?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  panelClassName?: string;
};

export function MotionDetailOverlay({
  open,
  onClose,
  layoutId,
  children,
  footer,
  className,
  panelClassName,
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
              "fixed inset-x-4 top-[6%] z-50 mx-auto flex max-h-[min(88vh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-dna-surface shadow-2xl",
              className,
              panelClassName,
            )}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 400, damping: 32 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                footer ? "" : "overflow-y-auto",
                !footer && DNA_SCROLLBAR,
              )}
            >
              {footer ? (
                <div
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto",
                    DNA_SCROLLBAR,
                  )}
                >
                  {children}
                </div>
              ) : (
                children
              )}
            </div>
            {footer ? (
              <div className="shrink-0 border-t border-dna-border bg-dna-surface p-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
