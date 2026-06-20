import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  let displayName = session.user.displayName;
  let avatarUrl = session.user.avatarUrl;

  if (!displayName || avatarUrl === undefined) {
    const [user] = await db
      .select({
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    displayName =
      user?.displayName ?? user?.email.split("@")[0] ?? session.user.email.split("@")[0] ?? "User";
    avatarUrl = user?.avatarUrl ?? null;
  }

  return (
    <DashboardShell
      user={{
        name: displayName ?? session.user.email.split("@")[0] ?? "User",
        email: session.user.email,
        avatarUrl: avatarUrl ?? null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
