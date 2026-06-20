"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type NewLeadContextValue = {
  openNewLead: () => void;
  registerOpenNewLead: (fn: () => void) => void;
};

const NewLeadContext = createContext<NewLeadContextValue | null>(null);

export function NewLeadProvider({ children }: { children: ReactNode }) {
  const [handler, setHandler] = useState<(() => void) | null>(null);

  return (
    <NewLeadContext.Provider
      value={{
        openNewLead: () => handler?.(),
        registerOpenNewLead: (fn) => setHandler(() => fn),
      }}
    >
      {children}
    </NewLeadContext.Provider>
  );
}

export function useNewLead() {
  const ctx = useContext(NewLeadContext);
  if (!ctx) {
    throw new Error("useNewLead must be used within NewLeadProvider");
  }
  return ctx;
}
