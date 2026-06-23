"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SURFACE_CARD } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";
import {
  createProjectTask,
  deleteProjectTask,
  getProjectTasks,
  updateProjectTaskStage,
} from "@/lib/actions/project-tasks";
import {
  PROJECT_TASK_COLUMNS,
  type ProjectTask,
  type ProjectTaskStageId,
} from "@/lib/crm/project-pipeline";

type ProjectKanbanProps = {
  leadId: string;
};

function ProjectTaskCard({
  task,
  onDelete,
}: {
  task: ProjectTask;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        SURFACE_CARD,
        "group rounded-lg p-2.5 text-sm",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 size-3 shrink-0 cursor-grab rounded bg-muted-foreground/30 opacity-0 group-hover:opacity-100"
          {...listeners}
          {...attributes}
          aria-label="Przeciągnij zadanie"
        />
        <p className="min-w-0 flex-1 font-medium leading-snug">{task.title}</p>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label="Usuń zadanie"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {task.description ? (
        <p className="mt-1 pl-5 text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      ) : null}
    </div>
  );
}

function ProjectColumn({
  id,
  label,
  colorClass,
  tasks,
  onDelete,
}: {
  id: ProjectTaskStageId;
  label: string;
  colorClass: string;
  tasks: ProjectTask[];
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col rounded-lg border bg-card/30",
        colorClass,
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-2">
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {tasks.map((task) => (
          <ProjectTaskCard key={task.id} task={task} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export function ProjectKanban({ leadId }: ProjectKanbanProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const loadTasks = useCallback(() => {
    startTransition(async () => {
      const rows = await getProjectTasks(leadId);
      setTasks(rows);
    });
  }, [leadId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const columns = useMemo(
    () =>
      PROJECT_TASK_COLUMNS.map((col) => ({
        ...col,
        tasks: tasks.filter((t) => t.stage === col.id),
      })),
    [tasks],
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const taskId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId) return;

    const nextStage = String(overId) as ProjectTaskStageId;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.stage === nextStage) return;

    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, stage: nextStage } : t,
      ),
    );

    startTransition(async () => {
      try {
        await updateProjectTaskStage(taskId, nextStage);
      } catch {
        toast.error("Nie udało się przenieść zadania");
        loadTasks();
      }
    });
  }

  function handleAddTask() {
    const title = newTitle.trim();
    if (!title) return;

    startTransition(async () => {
      try {
        const task = await createProjectTask(leadId, { title });
        if (task) {
          setTasks((current) => [...current, task]);
          setNewTitle("");
        }
      } catch {
        toast.error("Nie udało się dodać zadania");
      }
    });
  }

  function handleDelete(taskId: string) {
    setTasks((current) => current.filter((t) => t.id !== taskId));
    startTransition(async () => {
      try {
        await deleteProjectTask(taskId);
      } catch {
        toast.error("Nie udało się usunąć zadania");
        loadTasks();
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Zadania techniczne tego projektu — nie trafiają na globalny kalendarz.
      </p>

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nowe zadanie (np. Setup CI/CD)..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTask();
          }}
        />
        <Button type="button" onClick={handleAddTask} disabled={!newTitle.trim()}>
          <Plus className="size-4" />
          Dodaj
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => (
            <ProjectColumn
              key={column.id}
              id={column.id}
              label={column.label}
              colorClass={column.color}
              tasks={column.tasks}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[220px] rotate-1 opacity-95">
              <ProjectTaskCard task={activeTask} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
