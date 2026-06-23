"use client";

import { MotionDetailOverlay } from "@/components/ui/motion-detail-overlay";
import { DealDetail } from "@/components/crm/DealDetail";
import type { Lead, PipelineStageId } from "@/lib/crm/pipeline";

type DealSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  defaultStage?: PipelineStageId;
  onUpdated: (lead: Lead) => void;
  onArchived: (leadId: string) => void;
};

export function DealSheet({
  open,
  onOpenChange,
  lead,
  defaultStage,
  onUpdated,
  onArchived,
}: DealSheetProps) {
  const layoutId = lead?.id ? `deal-${lead.id}` : undefined;

  return (
    <MotionDetailOverlay
      open={open}
      onClose={() => onOpenChange(false)}
      layoutId={layoutId}
    >
      {open ? (
        <DealDetail
          lead={lead}
          defaultStage={defaultStage}
          onUpdated={onUpdated}
          onArchived={onArchived}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </MotionDetailOverlay>
  );
}
