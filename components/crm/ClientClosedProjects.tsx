"use client";

import { useEffect, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCrmModals } from "@/components/crm/CrmModalsProvider";
import { Button } from "@/components/ui/button";
import {
  getPipelineDealsForClient,
  reactivatePipelineDeal,
} from "@/lib/actions/pipeline-deals";
import {
  isActivePipelineDeal,
  PIPELINE_DEAL_COLUMNS,
  PIPELINE_DEAL_STATUS_LABELS,
  type PipelineDeal,
} from "@/lib/crm/pipeline-deals";

type ClientClosedProjectsProps = {
  clientId: string;
};

export function ClientClosedProjects({ clientId }: ClientClosedProjectsProps) {
  const { openDeal } = useCrmModals();
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const rows = await getPipelineDealsForClient(clientId);
      setDeals(rows);
    });
  }, [clientId]);

  const closedDeals = deals.filter((deal) => !isActivePipelineDeal(deal));
  if (closedDeals.length === 0) return null;

  function handleReactivate(dealId: string) {
    startTransition(async () => {
      try {
        const revived = await reactivatePipelineDeal(dealId, "negotiation");
        if (revived) {
          setDeals((current) =>
            current.map((deal) => (deal.id === dealId ? revived : deal)),
          );
          toast.success("Projekt wrócił do Kanbanu");
        }
      } catch {
        toast.error("Nie udało się przywrócić projektu");
      }
    });
  }

  return (
    <div className="mb-4 space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
      <p className="text-xs font-medium text-amber-100/90">
        Zamknięte projekty — możesz je przywrócić do Kanbanu
      </p>
      {closedDeals.map((deal) => (
        <div
          key={deal.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dna-border/20 bg-dna-inset/60 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{deal.title}</p>
            <p className="text-xs text-muted-foreground">
              {PIPELINE_DEAL_STATUS_LABELS[deal.status]}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-amber-500/30 text-xs"
              onClick={() => handleReactivate(deal.id)}
              disabled={isPending}
            >
              <RotateCcw className="size-3.5" />
              Przywróć
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => openDeal(deal.id)}
            >
              Szczegóły
            </Button>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">
        Przywrócenie ustawia etap „
        {PIPELINE_DEAL_COLUMNS.find((col) => col.id === "negotiation")?.label}
        ” — możesz go zmienić w szczegółach projektu.
      </p>
    </div>
  );
}
