import {
  Archive,
  BarChart3,
  Calendar,
  Kanban,
  Target,
  User,
} from "lucide-react";

export const DASHBOARD_NAV = [
  { id: "profil", href: "/profil", title: "Profil", icon: User },
  { id: "klienci", href: "/klienci", title: "Klienci", icon: Kanban },
  { id: "zasiegi", href: "/zasiegi", title: "Zasięgi", icon: BarChart3 },
  { id: "zyski", href: "/zyski", title: "Zyski", icon: Target },
  { id: "kalendarz", href: "/kalendarz", title: "Planner", icon: Calendar },
  { id: "archiwum", href: "/archiwum", title: "Archiwum", icon: Archive },
] as const;

export type DashboardNavId = (typeof DASHBOARD_NAV)[number]["id"];

export function getNavTitle(pathname: string): string {
  const item = DASHBOARD_NAV.find(
    (nav) => pathname === nav.href || pathname.startsWith(`${nav.href}/`),
  );
  return item?.title ?? "DataDNA";
}
