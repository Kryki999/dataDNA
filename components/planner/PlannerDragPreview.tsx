"use client";

import { EntityCard } from "@/components/cards/EntityCard";
import { PlannerIconBadge } from "@/components/planner/PlannerIconBadge";
import {
  formatEventTime,
  getEventEnd,
  getEventHeightPx,
  plannerTaskColor,
  plannerTaskCoverUrl,
  plannerTaskDescription,
  plannerTaskSubtitle,
} from "@/components/planner/planner-utils";
import type { PlannerEventWithMeta } from "@/lib/planner/types";

const SCHEDULED_CARD_WIDTH_PX = 140;
const BACKLOG_CARD_WIDTH_PX = 200;

type PlannerDragPreviewProps = {
  event: PlannerEventWithMeta;
};

export function PlannerDragPreview({ event }: PlannerDragPreviewProps) {
  const dueAt = event.dueAt ? new Date(event.dueAt) : null;
  const endsAt = dueAt ? getEventEnd(event) : null;
  const completed = event.status === "completed";

  if (dueAt && endsAt) {
    const heightPx = Math.max(getEventHeightPx(dueAt, endsAt), 64);

    return (
      <div
        className="cursor-grabbing shadow-xl"
        style={{ width: SCHEDULED_CARD_WIDTH_PX, height: heightPx }}
      >
        <EntityCard
          variant="task"
          density="scheduled"
          title={event.title}
          coverUrl={plannerTaskCoverUrl(event)}
          cardColor={plannerTaskColor(event)}
          description={plannerTaskDescription(event)}
          subtitle={plannerTaskSubtitle(event)}
          leading={<PlannerIconBadge icon={event.icon} className="size-3.5" />}
          completed={completed}
          className="h-full shadow-xl"
        />
      </div>
    );
  }

  return (
    <div
      className="cursor-grabbing shadow-xl"
      style={{ width: BACKLOG_CARD_WIDTH_PX }}
    >
      <EntityCard
        variant="task"
        density="comfortable"
        title={event.title}
        coverUrl={plannerTaskCoverUrl(event)}
        cardColor={plannerTaskColor(event)}
        description={plannerTaskDescription(event)}
        subtitle={plannerTaskSubtitle(event)}
        meta={dueAt ? formatEventTime(dueAt) : null}
        leading={<PlannerIconBadge icon={event.icon} className="size-4" />}
        completed={completed}
        className="shadow-xl"
      />
    </div>
  );
}
