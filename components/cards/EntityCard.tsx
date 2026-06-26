"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCardColorClasses, type CardColorKey } from "@/lib/design-tokens";
import { getTagColorClass } from "@/lib/crm/tags";
import { CARD_TITLE, SURFACE_CARD, SIGNAL_EDGE_HOVER } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

export type EntityCardAvatar = {
  url?: string | null;
  initials: string;
};

export type EntityCardVariant = "tile" | "task";

export type EntityCardProps = {
  layoutId?: string;
  variant?: EntityCardVariant;
  title: string;
  coverUrl?: string | null;
  cardColor?: string | null;
  tags?: string[];
  avatars?: EntityCardAvatar[];
  subtitle?: string | null;
  meta?: string | null;
  leading?: ReactNode;
  selected?: boolean;
  completed?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
};

export function EntityCard({
  layoutId,
  variant = "tile",
  title,
  coverUrl,
  cardColor,
  tags = [],
  avatars = [],
  subtitle,
  meta,
  leading,
  selected = false,
  completed = false,
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
          variant === "task" ? "h-[72px]" : "min-h-[140px]",
        )}
        aria-hidden
      />
    );
  }

  const interactive = Boolean(onClick);

  const taskCard = (
    <div
      className={cn(
        "group relative flex min-h-[72px] overflow-hidden rounded-xl text-left transition-all",
        SURFACE_CARD,
        colors.border,
        colors.accentBorder,
        "border-l-[5px]",
        interactive && "cursor-pointer hover:brightness-110",
        completed && "opacity-55",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {leading}
          {meta ? (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            CARD_TITLE,
            "line-clamp-2 leading-snug",
            completed && "line-through text-muted-foreground",
          )}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-[10px] font-medium text-primary/90">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );

  const tileCard = (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl text-left transition-all",
        SURFACE_CARD,
        SIGNAL_EDGE_HOVER,
        colors.border,
        colors.accentBorder,
        "border-l-[5px]",
        interactive && "cursor-pointer hover:brightness-110",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
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
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90",
              colors.bg,
            )}
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
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

  const inner = variant === "task" ? taskCard : tileCard;

  if (layoutId) {
    return (
      <motion.div layoutId={layoutId} className="h-full">
        {inner}
      </motion.div>
    );
  }

  return inner;
}
