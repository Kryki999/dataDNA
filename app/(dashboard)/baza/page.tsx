import { getClients } from "@/lib/actions/clients";
import { ClientCatalogClient } from "@/components/crm/ClientCatalogClient";

export default async function BazaPage() {
  const clients = await getClients();
  return <ClientCatalogClient clients={clients} />;
}
