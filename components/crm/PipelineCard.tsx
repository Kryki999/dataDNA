"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { EntityCard } from "@/components/cards/EntityCard";
import type { PipelineDealWithMeta } from "@/lib/actions/pipeline-deals";
import type { CurrentUser } from "@/lib/crm/current-user";
import { cn } from "@/lib/utils";

export type { CurrentUser };

type PipelineCardProps = {
  deal: PipelineDealWithMeta;
  onOpen: (deal: PipelineDealWithMeta) => void;
  currentUser?: CurrentUser;
  selectedDealId?: string | null;
};

type PipelineCardViewProps = PipelineCardProps & {
  cardRef?: (element: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  useLayout?: boolean;
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

function PipelineCardView({
  deal,
  onOpen,
  currentUser,
  cardRef,
  style,
  isDragging = false,
  dragListeners,
  dragAttributes,
  useLayout = false,
  selectedDealId,
}: PipelineCardViewProps) {
  const isSelected = selectedDealId === deal.id;
  const dragEnabled = Boolean(dragListeners && dragAttributes);

  const card = (
    <div
      ref={cardRef}
      style={style}
      className={cn(
        "relative",
        dragEnabled && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...dragListeners}
      {...dragAttributes}
    >
      <EntityCard
        layoutId={
          useLayout && !isDragging
            ? `pipeline-deal-${deal.id}`
            : undefined
        }
        title={deal.displayName}
        coverUrl={deal.coverUrl}
        cardColor={deal.cardColor}
        tags={deal.tags}
        subtitle={deal.title !== deal.displayName ? deal.title : deal.lastNoteBody}
        selected={isSelected}
        onClick={() => onOpen(deal)}
        avatars={
          currentUser
            ? [
                {
                  url: currentUser.avatarUrl,
                  initials: getInitials(
                    currentUser.displayName,
                    currentUser.email,
                  ),
                },
              ]
            : []
        }
      />
      {dragEnabled ? (
        <GripVertical className="absolute bottom-3 right-3 size-3 text-muted-foreground/30" />
      ) : null}
    </div>
  );

  return card;
}

export function PipelineCardStatic(props: PipelineCardProps) {
  return <PipelineCardView {...props} />;
}

export function PipelineCard({
  deal,
  onOpen,
  currentUser,
  selectedDealId,
}: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { deal, status: deal.status },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <PipelineCardView
      deal={deal}
      onOpen={onOpen}
      currentUser={currentUser}
      selectedDealId={selectedDealId}
      cardRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragListeners={listeners}
      dragAttributes={attributes}
      useLayout
    />
  );
}

export function PipelineCardOverlay({ deal }: { deal: PipelineDealWithMeta }) {
  return (
    <div className="w-[min(100vw-2rem,300px)] rotate-1 scale-[1.02]">
      <PipelineCardStatic deal={deal} onOpen={() => {}} />
    </div>
  );
}
