"use client";

import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { useNewLead } from "@/components/dashboard/new-lead-provider";
import type { Lead } from "@/lib/crm/pipeline";

type KlienciClientProps = {
  leads: Lead[];
};

export function KlienciClient({ leads }: KlienciClientProps) {
  const { registerOpenNewLead } = useNewLead();

  return (
    <DashboardPage wide>
      <PipelineBoard leads={leads} onRegisterOpenNew={registerOpenNewLead} />
    </DashboardPage>
  );
}
