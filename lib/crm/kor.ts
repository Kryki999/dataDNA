/**
 * KOR — rdzeń produktu (Klient → Projekt → Zadanie).
 * Kanban preset A: lejek sprzedaży; realizacja po wygranej w Plannerze.
 */

export const KOR_RULE =
  "Kanban pokazuje etap współpracy. Planner pokazuje co zrobić i kiedy." as const;

export type KanbanPresetId = "sales" | "delivery";

/** Domyślny preset KOR — Wariant A (lejek sprzedaży). */
export const DEFAULT_KANBAN_PRESET: KanbanPresetId = "sales";

export const KANBAN_PRESETS = {
  sales: {
    id: "sales" as const,
    label: "Sprzedaż",
    description:
      "Projekt na Kanbanie to szansa lub negocjowany kontrakt. Po wygranej realizacja w Plannerze.",
    userRule: "Kanban = etap sprzedaży. Planner = co robisz dla klienta.",
  },
  delivery: {
    id: "delivery" as const,
    label: "Realizacja",
    description:
      "Projekt na Kanbanie przechodzi etapy produkcji usługi (np. przyjęte → w trakcie → odbiór).",
    userRule: "Kanban = gdzie jest usługa. Planner = kiedy robisz konkretny krok.",
  },
} as const;

export const MODULE_SUBTITLES = {
  baza: "Wszyscy, z kim pracujesz",
  klienci: "Na jakim etapie są Twoje projekty",
  kalendarz: "Co robisz i kiedy",
  profil: "Twój profil i statystyki",
  zasiegi: "Zasięgi i aktywność",
  zyski: "Przychody z projektów",
} as const;

/** Realizacja po wygranej — tylko Planner, bez drugiego Kanbana zadań. */
export const DELIVERY_WORKFLOW_COPY =
  "Po zrealizowaniu projektu zaplanuj kolejne kroki w Plannerze — powiąż zadanie z tym klientem.";
