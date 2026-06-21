import { auth } from "@/lib/auth";
import { getCrmLeadsWithMeta } from "@/lib/actions/leads";
import { KlienciClient } from "@/components/crm/KlienciClient";

export default async function KlienciPage() {
  const session = await auth();
  const { active } = await getCrmLeadsWithMeta();

  return (
    <KlienciClient
      leads={active}
      currentUser={{
        displayName: session?.user?.displayName,
        email: session?.user?.email,
        avatarUrl: session?.user?.avatarUrl,
      }}
    />
  );
}
