import type { projectTasks } from "@/lib/db/schema";

export type ProjectTask = typeof projectTasks.$inferSelect;

export type ProjectTaskStageId =
  | "todo"
  | "in_progress"
  | "review"
  | "done";

export const PROJECT_TASK_COLUMNS = [
  { id: "todo" as const, label: "To Do", color: "border-blue-500/40" },
  {
    id: "in_progress" as const,
    label: "In Progress",
    color: "border-amber-500/40",
  },
  { id: "review" as const, label: "Review", color: "border-violet-500/40" },
  { id: "done" as const, label: "Done", color: "border-emerald-500/40" },
] as const;

export const PROJECT_TASK_STAGE_LABELS: Record<ProjectTaskStageId, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const PROJECT_TASK_STAGES = PROJECT_TASK_COLUMNS.map((c) => c.id);
