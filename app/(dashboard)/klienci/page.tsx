import { getCrmLeads } from "@/lib/actions/leads";
import { KlienciClient } from "@/components/crm/KlienciClient";

export default async function KlienciPage() {
  const { active } = await getCrmLeads();
  return <KlienciClient leads={active} />;
}
