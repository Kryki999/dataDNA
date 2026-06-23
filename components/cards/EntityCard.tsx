"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCardColorClasses } from "@/lib/design-tokens";
import { getTagColorClass } from "@/lib/crm/tags";
import { CARD_TITLE, SURFACE_CARD, SIGNAL_EDGE_HOVER } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

export type EntityCardAvatar = {
  url?: string | null;
  initials: string;
};

export type EntityCardProps = {
  layoutId?: string;
  title: string;
  coverUrl?: string | null;
  cardColor?: string | null;
  tags?: string[];
  avatars?: EntityCardAvatar[];
  subtitle?: string | null;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function EntityCard({
  layoutId,
  title,
  coverUrl,
  cardColor,
  tags = [],
  avatars = [],
  subtitle,
  selected = false,
  compact = false,
  onClick,
  className,
  children,
}: EntityCardProps) {
  const colors = getCardColorClasses(cardColor);

  if (selected) {
    return (
      <div
        className={cn(
          "invisible rounded-xl",
          compact ? "h-24" : "min-h-[120px]",
        )}
        aria-hidden
      />
    );
  }

  const inner = (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl text-left transition-all",
        SURFACE_CARD,
        SIGNAL_EDGE_HOVER,
        colors.border,
        onClick && "cursor-pointer hover:brightness-105",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {!compact ? (
        <div
          className={cn(
            "relative aspect-[16/9] w-full bg-gradient-to-br",
            colors.bg,
          )}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col p-3", compact && "gap-1")}>
        {tags.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                  getTagColorClass(tag),
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <p className={cn(CARD_TITLE, "line-clamp-2")}>{title}</p>

        {subtitle ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {subtitle}
          </p>
        ) : null}

        {avatars.length > 0 ? (
          <div className="mt-auto flex -space-x-1.5 pt-3">
            {avatars.slice(0, 3).map((a, i) => (
              <Avatar
                key={i}
                className="size-6 border-2 border-dna-surface"
              >
                <AvatarImage src={a.url ?? undefined} alt="" />
                <AvatarFallback className="text-[9px]">
                  {a.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );

  if (layoutId) {
    return (
      <motion.div layoutId={layoutId} className="h-full">
        {inner}
      </motion.div>
    );
  }

  return inner;
}
