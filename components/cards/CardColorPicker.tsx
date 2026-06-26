"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CARD_COLORS,
  type CardColorKey,
} from "@/lib/design-tokens";
import { CLIENT_CARD_COLORS, type ClientCardColor } from "@/lib/crm/clients";
import { cn } from "@/lib/utils";

export const COLOR_LABELS: Record<ClientCardColor, string> = {
  slate: "Szary",
  blue: "Niebieski",
  violet: "Fiolet",
  amber: "Bursztyn",
  emerald: "Szmaragd",
  rose: "Róż",
  cyan: "Cyjan",
  orange: "Pomarańcz",
};

type CardColorPickerProps = {
  value: ClientCardColor | null;
  onChange: (color: ClientCardColor) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  size?: "sm" | "md";
};

export function CardColorPicker({
  value,
  onChange,
  disabled,
  className,
  align = "end",
  size = "md",
}: CardColorPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ?? "slate";
  const triggerDot = size === "sm" ? "size-3.5" : "size-4";
  const triggerBtn = size === "sm" ? "size-7" : "size-8";
  const swatchSize = size === "sm" ? "size-5" : "size-6";

  function handleSelect(color: ClientCardColor) {
    onChange(color);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-label={`Kolor karty: ${COLOR_LABELS[selected]}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:bg-dna-inset/70 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-40",
              triggerBtn,
              open && "bg-dna-inset/70",
              className,
            )}
          />
        }
      >
        <span
          className={cn(
            "rounded-full shadow-sm ring-1 ring-black/6 dark:ring-white/12",
            triggerDot,
            CARD_COLORS[selected as CardColorKey].swatch,
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side="bottom"
        sideOffset={6}
        className="w-auto min-w-0 border-0 bg-dna-surface/95 p-2 shadow-lg backdrop-blur-xl ring-1 ring-dna-border/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-1.5"
          role="listbox"
          aria-label="Wybierz kolor karty"
        >
          {CLIENT_CARD_COLORS.map((key) => {
            const isActive = selected === key;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isActive}
                title={COLOR_LABELS[key]}
                aria-label={COLOR_LABELS[key]}
                disabled={disabled}
                onClick={() => handleSelect(key)}
                className={cn(
                  "rounded-full transition-transform hover:scale-110 disabled:opacity-50",
                  swatchSize,
                  CARD_COLORS[key as CardColorKey].swatch,
                  isActive
                    ? "ring-2 ring-foreground ring-offset-1 ring-offset-dna-surface"
                    : "opacity-80 hover:opacity-100",
                )}
              />
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
