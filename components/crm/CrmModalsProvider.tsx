"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { LayoutGroup } from "framer-motion";
import { ClientProfileDetail } from "@/components/crm/ClientProfileDetail";
import { PipelineDealDetail } from "@/components/crm/PipelineDealDetail";
import { OmniSearch } from "@/components/search/OmniSearch";
import { MotionDetailOverlay } from "@/components/ui/motion-detail-overlay";
import { getClientById } from "@/lib/actions/clients";
import { getPipelineDealById, getActivePipelineDealsWithMeta, type PipelineDealWithMeta } from "@/lib/actions/pipeline-deals";
import type { Client } from "@/lib/crm/clients";

type CrmModalsContextValue = {
  openSearch: () => void;
  openClient: (clientId: string) => void;
  openDeal: (dealId: string) => void;
};

const CrmModalsContext = createContext<CrmModalsContextValue | null>(null);

export function useCrmModals() {
  const ctx = useContext(CrmModalsContext);
  if (!ctx) throw new Error("useCrmModals must be used within CrmModalsProvider");
  return ctx;
}

export function CrmModalsProvider({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [deal, setDeal] = useState<PipelineDealWithMeta | null>(null);
  const [dealOpen, setDealOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const openClient = useCallback(async (clientId: string) => {
    const row = await getClientById(clientId);
    if (row) {
      setClient(row);
      setClientOpen(true);
    }
  }, []);

  const openDeal = useCallback(async (dealId: string) => {
    const rows = await getActivePipelineDealsWithMeta();
    const found = rows.find((d) => d.id === dealId);
    if (found) {
      setDeal(found);
      setDealOpen(true);
      return;
    }
    const raw = await getPipelineDealById(dealId);
    if (!raw) return;
    const c = await getClientById(raw.clientId);
    if (!c) return;
    setDeal({
      ...raw,
      client: c,
      displayName: c.company?.trim() || c.name,
      tags: c.tags,
      coverUrl: c.coverUrl,
      cardColor: c.cardColor,
      lastNoteBody: null,
    });
    setDealOpen(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CrmModalsContext.Provider value={{ openSearch, openClient, openDeal }}>
      {children}
      <OmniSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectClient={(id) => {
          setSearchOpen(false);
          openClient(id);
        }}
      />
      <LayoutGroup id="crm-global-modals">
        <MotionDetailOverlay
          open={clientOpen}
          onClose={() => setClientOpen(false)}
          layoutId={client ? `client-${client.id}` : undefined}
          embeddedLayout
          panelClassName="!flex !max-h-[min(88vh,760px)] !flex-col !overflow-hidden p-0"
        >
          {client && clientOpen ? (
            <ClientProfileDetail
              client={client}
              onUpdated={setClient}
              onArchived={() => {
                setClientOpen(false);
                setClient(null);
              }}
              onClose={() => setClientOpen(false)}
            />
          ) : null}
        </MotionDetailOverlay>
        <MotionDetailOverlay
          open={dealOpen}
          onClose={() => setDealOpen(false)}
          layoutId={deal ? `pipeline-deal-${deal.id}` : undefined}
          embeddedLayout
          panelClassName="!flex !max-h-[min(88vh,760px)] !flex-col !overflow-hidden p-0"
        >
          {deal && dealOpen ? (
            <PipelineDealDetail
              deal={deal}
              onUpdated={setDeal}
              onClosed={() => {
                setDealOpen(false);
                setDeal(null);
              }}
              onOpenClient={(id) => {
                setDealOpen(false);
                openClient(id);
              }}
              onClose={() => setDealOpen(false)}
            />
          ) : null}
        </MotionDetailOverlay>
      </LayoutGroup>
    </CrmModalsContext.Provider>
  );
}
