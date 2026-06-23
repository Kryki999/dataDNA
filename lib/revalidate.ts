import { revalidatePath } from "next/cache";

const DASHBOARD_PATHS = [
  "/profil",
  "/klienci",
  "/zasiegi",
  "/zyski",
  "/kalendarz",
  "/baza",
] as const;

export function revalidateDashboard() {
  revalidatePath("/", "layout");
  for (const path of DASHBOARD_PATHS) {
    revalidatePath(path);
  }
}

export function revalidatePublicProfile(username?: string) {
  if (username) {
    revalidatePath(`/p/${username}`);
  }
}
