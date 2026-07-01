"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureKorSchema } from "@/lib/db/ensure-kor-schema";
import { organizations } from "@/lib/db/schema";
import type { DashboardNavId } from "@/lib/dashboard-nav";
import {
  DEFAULT_ENABLED_MODULES,
  parseEnabledModules,
} from "@/lib/organization-modules";
import { getCurrentOrganizationId } from "@/lib/tenant";

export async function getOrganizationEnabledModules(): Promise<DashboardNavId[]> {
  try {
    await ensureKorSchema();
    const organizationId = await getCurrentOrganizationId();

    const [org] = await db
      .select({ enabledModules: organizations.enabledModules })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org?.enabledModules) return DEFAULT_ENABLED_MODULES;
    return parseEnabledModules(org.enabledModules);
  } catch {
    return DEFAULT_ENABLED_MODULES;
  }
}
