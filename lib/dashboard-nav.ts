import {
  BarChart3,
  Calendar,
  Database,
  Kanban,
  Target,
  User,
} from "lucide-react";
import { MODULE_SUBTITLES } from "@/lib/crm/kor";

export const DASHBOARD_NAV = [
  {
    id: "profil",
    href: "/profil",
    title: "Profil",
    subtitle: MODULE_SUBTITLES.profil,
    icon: User,
    tier: "optional",
  },
  {
    id: "klienci",
    href: "/klienci",
    title: "Projekty",
    subtitle: MODULE_SUBTITLES.klienci,
    icon: Kanban,
    tier: "kor",
  },
  {
    id: "baza",
    href: "/baza",
    title: "Baza klientów",
    subtitle: MODULE_SUBTITLES.baza,
    icon: Database,
    tier: "kor",
  },
  {
    id: "zasiegi",
    href: "/zasiegi",
    title: "Zasięgi",
    subtitle: MODULE_SUBTITLES.zasiegi,
    icon: BarChart3,
    tier: "optional",
  },
  {
    id: "zyski",
    href: "/zyski",
    title: "Zyski",
    subtitle: MODULE_SUBTITLES.zyski,
    icon: Target,
    tier: "optional",
  },
  {
    id: "kalendarz",
    href: "/kalendarz",
    title: "Planner",
    subtitle: MODULE_SUBTITLES.kalendarz,
    icon: Calendar,
    tier: "kor",
  },
] as const;

export type DashboardNavId = (typeof DASHBOARD_NAV)[number]["id"];

/** KOR — zawsze włączone w nawigacji. */
export const KOR_NAV_IDS = [
  "baza",
  "klienci",
  "kalendarz",
] as const satisfies readonly DashboardNavId[];

export const OPTIONAL_MODULE_NAV_IDS = [
  "profil",
  "zasiegi",
  "zyski",
] as const satisfies readonly DashboardNavId[];

export function getNavTitle(pathname: string): string {
  const item = DASHBOARD_NAV.find(
    (nav) => pathname === nav.href || pathname.startsWith(`${nav.href}/`),
  );
  return item?.title ?? "DataDNA";
}

export function getNavItem(id: DashboardNavId) {
  return DASHBOARD_NAV.find((nav) => nav.id === id);
}
