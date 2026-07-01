import type { DashboardNavId } from "@/lib/dashboard-nav";
import {
  DASHBOARD_NAV,
  KOR_NAV_IDS,
  OPTIONAL_MODULE_NAV_IDS,
} from "@/lib/dashboard-nav";

export const DEFAULT_ENABLED_MODULES: DashboardNavId[] = [
  ...KOR_NAV_IDS,
  "profil",
  "zasiegi",
  "zyski",
];

export function parseEnabledModules(raw: unknown): DashboardNavId[] {
  if (!Array.isArray(raw)) return DEFAULT_ENABLED_MODULES;

  const allowed = new Set(DASHBOARD_NAV.map((item) => item.id));
  const parsed = raw.filter(
    (id): id is DashboardNavId =>
      typeof id === "string" && allowed.has(id as DashboardNavId),
  );

  const withKor = new Set<DashboardNavId>([...KOR_NAV_IDS, ...parsed]);
  return DASHBOARD_NAV.filter((item) => withKor.has(item.id)).map(
    (item) => item.id,
  );
}

export function filterNavByModules(
  enabledIds: readonly DashboardNavId[],
) {
  const enabled = new Set(enabledIds);
  return DASHBOARD_NAV.filter((item) => enabled.has(item.id));
}

export function isOptionalModule(id: DashboardNavId): boolean {
  return (OPTIONAL_MODULE_NAV_IDS as readonly string[]).includes(id);
}
