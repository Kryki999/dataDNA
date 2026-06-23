"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PipelineDealDetail } from "@/components/crm/PipelineDealDetail";
import { MotionDetailOverlay } from "@/components/ui/motion-detail-overlay";
import { getActivePipelineDealsWithMeta, type PipelineDealWithMeta } from "@/lib/actions/pipeline-deals";
import type { CurrentUser } from "@/lib/crm/current-user";
import { useCrmModals } from "@/components/crm/CrmModalsProvider";
import { EYEBROW } from "@/lib/ui-patterns";

type KlienciClientProps = {
  deals: PipelineDealWithMeta[];
  currentUser?: CurrentUser;
};

export function KlienciClient({
  deals: initialDeals,
  currentUser,
}: KlienciClientProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDealWithMeta | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const { openClient } = useCrmModals();

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const refreshDeals = useCallback(async () => {
    const rows = await getActivePipelineDealsWithMeta();
    setDeals(rows);
  }, []);

  function handleOpenDeal(deal: PipelineDealWithMeta) {
    setSelectedDeal(deal);
    setSheetOpen(true);
  }

  function handleDealUpdated(deal: PipelineDealWithMeta) {
    setDeals((current) =>
      current.map((item) => (item.id === deal.id ? deal : item)),
    );
    setSelectedDeal(deal);
  }

  function handleDealClosed(dealId: string) {
    setDeals((current) => current.filter((item) => item.id !== dealId));
    setSheetOpen(false);
    setSelectedDeal(null);
  }

  return (
    <DashboardPage full>
      <header className="mb-6">
        <p className={EYEBROW}>Pipeline sprzedaży</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aktywne projekty — kliknij + i wpisz nazwę
        </p>
      </header>

      <LayoutGroup id="crm-deals">
        <PipelineBoard
          deals={deals}
          currentUser={currentUser}
          onOpenDeal={handleOpenDeal}
          onDealClosed={handleDealClosed}
          onRefresh={refreshDeals}
          selectedDealId={sheetOpen ? selectedDeal?.id : null}
        />

        <MotionDetailOverlay
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          layoutId={
            selectedDeal ? `pipeline-deal-${selectedDeal.id}` : undefined
          }
          panelClassName="!flex !max-h-[min(88vh,760px)] !flex-col !overflow-hidden p-0"
        >
          {selectedDeal && sheetOpen ? (
            <PipelineDealDetail
              deal={selectedDeal}
              onUpdated={handleDealUpdated}
              onClosed={handleDealClosed}
              onOpenClient={(id) => {
                setSheetOpen(false);
                openClient(id);
              }}
              onClose={() => setSheetOpen(false)}
            />
          ) : null}
        </MotionDetailOverlay>
      </LayoutGroup>
    </DashboardPage>
  );
}
