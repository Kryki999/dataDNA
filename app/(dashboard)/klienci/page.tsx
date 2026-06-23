import { auth } from "@/lib/auth";
import { getActivePipelineDealsWithMeta } from "@/lib/actions/pipeline-deals";
import { KlienciClient } from "@/components/crm/KlienciClient";

export default async function KlienciPage() {
  const session = await auth();
  const deals = await getActivePipelineDealsWithMeta();

  return (
    <KlienciClient
      deals={deals}
      currentUser={{
        displayName: session?.user?.displayName,
        email: session?.user?.email,
        avatarUrl: session?.user?.avatarUrl,
      }}
    />
  );
}
