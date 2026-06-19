"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type DashboardSection =
  | "overview"
  | "crm"
  | "archive"
  | "wall"
  | "reach"
  | "revenue";

type DashboardContextValue = {
  section: DashboardSection;
  setSection: (section: DashboardSection) => void;
  openNewLead: () => void;
  registerOpenNewLead: (fn: () => void) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState<DashboardSection>("overview");
  const [newLeadHandler, setNewLeadHandler] = useState<(() => void) | null>(
    null,
  );

  return (
    <DashboardContext.Provider
      value={{
        section,
        setSection,
        openNewLead: () => newLeadHandler?.(),
        registerOpenNewLead: (fn) => setNewLeadHandler(() => fn),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}

export const SECTION_LABELS: Record<DashboardSection, string> = {
  overview: "Przegląd",
  crm: "CRM — Lejek",
  archive: "Archiwum",
  wall: "The Wall",
  reach: "Zasięgi",
  revenue: "Cel przychodu",
};
