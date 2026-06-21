"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectTasks } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";
import type { ProjectTaskStageId } from "@/lib/crm/project-pipeline";

export type ProjectTaskInput = {
  title: string;
  description?: string;
  stage?: ProjectTaskStageId;
};

export async function getProjectTasks(leadId: string) {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select()
    .from(projectTasks)
    .where(
      and(
        eq(projectTasks.leadId, leadId),
        eq(projectTasks.organizationId, organizationId),
      ),
    )
    .orderBy(projectTasks.sortOrder, desc(projectTasks.createdAt));
}

export async function createProjectTask(
  leadId: string,
  input: ProjectTaskInput,
) {
  const organizationId = await getCurrentOrganizationId();
  const title = input.title.trim();
  if (!title) return null;

  const existing = await getProjectTasks(leadId);

  const [task] = await db
    .insert(projectTasks)
    .values({
      organizationId,
      leadId,
      title,
      description: input.description?.trim() || null,
      stage: input.stage ?? "todo",
      sortOrder: existing.length,
    })
    .returning();

  revalidateDashboard();
  return task;
}

export async function updateProjectTaskStage(
  taskId: string,
  stage: ProjectTaskStageId,
) {
  const organizationId = await getCurrentOrganizationId();

  const [task] = await db
    .update(projectTasks)
    .set({ stage, updatedAt: new Date() })
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(projectTasks.organizationId, organizationId),
      ),
    )
    .returning();

  revalidateDashboard();
  return task ?? null;
}

export async function deleteProjectTask(taskId: string) {
  const organizationId = await getCurrentOrganizationId();

  await db
    .delete(projectTasks)
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(projectTasks.organizationId, organizationId),
      ),
    );

  revalidateDashboard();
}
