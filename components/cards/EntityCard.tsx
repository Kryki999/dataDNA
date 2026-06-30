"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCardColorClasses } from "@/lib/design-tokens";
import { getTagColorClass } from "@/lib/crm/tags";
import { CARD_TITLE, SURFACE_CARD } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";

export type EntityCardAvatar = {
  url?: string | null;
  initials: string;
};

export type EntityCardVariant = "tile" | "task";

export type EntityCardDensity = "comfortable" | "compact" | "scheduled";

export type EntityCardProps = {
  layoutId?: string;
  variant?: EntityCardVariant;
  density?: EntityCardDensity;
  title: string;
  coverUrl?: string | null;
  cardColor?: string | null;
  tags?: string[];
  avatars?: EntityCardAvatar[];
  subtitle?: string | null;
  description?: string | null;
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
  density = "comfortable",
  title,
  coverUrl,
  cardColor,
  tags = [],
  avatars = [],
  subtitle,
  description,
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
          variant === "task"
            ? density === "compact"
              ? "h-[72px]"
              : "min-h-[200px]"
            : "min-h-[140px]",
        )}
        aria-hidden
      />
    );
  }

  const interactive = Boolean(onClick);

  const interactiveProps = {
    onClick,
    onKeyDown: interactive
      ? (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }
      : undefined,
    role: interactive ? ("button" as const) : undefined,
    tabIndex: interactive ? 0 : undefined,
  };

  const taskCardCompact = (
    <div
      className={cn(
        "group relative flex h-full min-h-[56px] overflow-hidden rounded-xl text-left transition-all",
        SURFACE_CARD,
        interactive && "cursor-pointer hover:bg-dna-raised/40",
        completed && "opacity-55",
        className,
      )}
      {...interactiveProps}
    >
      {coverUrl ? (
        <div className="relative w-12 shrink-0 self-stretch sm:w-14">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          {leading}
          {meta ? (
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            CARD_TITLE,
            "line-clamp-2 text-[13px] leading-snug",
            completed && "line-through text-muted-foreground",
          )}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-[10px] font-medium text-primary/80">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );

  const taskCardComfortable = (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl text-left transition-all",
        SURFACE_CARD,
        interactive && "cursor-pointer hover:bg-dna-raised/30",
        completed && "opacity-55",
        className,
      )}
      {...interactiveProps}
    >
      <div
        className={cn(
          "relative aspect-[4/3] w-full bg-gradient-to-br",
          colors.bg,
        )}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 240px"
          />
        ) : null}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <div className="flex items-center gap-1.5">
            {leading ? (
              <span className="rounded-md bg-dna-surface/80 p-1 backdrop-blur-sm">
                {leading}
              </span>
            ) : null}
          </div>
          {meta ? (
            <span className="rounded-md bg-dna-surface/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground backdrop-blur-sm">
              {meta}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p
          className={cn(
            CARD_TITLE,
            "line-clamp-2",
            completed && "line-through text-muted-foreground",
          )}
        >
          {title}
        </p>
        {description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {subtitle ? (
          <p className="truncate text-[11px] font-medium text-primary/80">
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );

  const taskCardScheduled = (
    <div
      className={cn(
        "group relative flex h-full min-h-[56px] flex-col overflow-hidden rounded-xl border bg-gradient-to-b text-left transition-all",
        colors.border,
        colors.bg,
        interactive && "cursor-pointer hover:brightness-110",
        completed && "opacity-55",
        className,
      )}
      {...interactiveProps}
    >
      {coverUrl ? (
        <div className="relative h-[38%] min-h-[22px] max-h-12 shrink-0">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="160px"
          />
          {leading ? (
            <div className="absolute left-1.5 top-1.5">{leading}</div>
          ) : null}
        </div>
      ) : leading ? (
        <div className="flex shrink-0 items-center px-2 pt-1.5">{leading}</div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 px-2 py-1.5">
        <p
          className={cn(
            CARD_TITLE,
            "line-clamp-2 text-[13px] leading-snug",
            completed && "line-through text-muted-foreground",
          )}
        >
          {title}
        </p>
        {description ? (
          <p className="line-clamp-2 text-[10px] leading-snug text-foreground/70">
            {description}
          </p>
        ) : null}
        {subtitle ? (
          <p className="truncate text-[10px] font-medium text-foreground/60">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );

  const taskCard =
    density === "compact"
      ? taskCardCompact
      : density === "scheduled"
        ? taskCardScheduled
        : taskCardComfortable;

  const tileCard = (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl text-left transition-all",
        SURFACE_CARD,
        interactive && "cursor-pointer hover:bg-dna-raised/30",
        className,
      )}
      {...interactiveProps}
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
        ) : null}
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
