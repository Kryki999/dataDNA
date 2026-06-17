import { auth } from "@/lib/auth";

export async function getCurrentOrganizationId(): Promise<string> {
  const session = await auth();
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    throw new Error("Unauthorized: missing organization context");
  }

  return organizationId;
}

export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized: missing user context");
  }

  return userId;
}
