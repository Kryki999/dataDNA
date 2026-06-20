import { getArchivedLeads } from "@/lib/actions/leads";
import { ArchiveDataTable } from "@/components/crm/ArchiveDataTable";

export default async function ArchiwumPage() {
  const leads = await getArchivedLeads();
  return <ArchiveDataTable leads={leads} />;
}
