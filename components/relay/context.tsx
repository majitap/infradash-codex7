"use client";
import { createContext, useContext, useState } from "react";
import { useDashboard } from "@/components/overview/dashboard-provider";
type RelayContextValue = {
  acknowledged: string[];
  toggleAcknowledged: (id: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
};
const Context = createContext<RelayContextValue | null>(null);
export function RelayProvider({ children }: { children: React.ReactNode }) {
  const { data } = useDashboard();
  const [records, setRecords] = useState<Record<string, string[]>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const key = data
    ? `${data.source}/${data.workspace}/${data.collectedAt}`
    : "empty";
  const acknowledged = records[key] ?? [];
  function toggleAcknowledged(id: string) {
    setRecords((current) => {
      const list = current[key] ?? [];
      return {
        ...current,
        [key]: list.includes(id) ? list.filter((i) => i !== id) : [...list, id],
      };
    });
  }
  return (
    <Context.Provider
      value={{ acknowledged, toggleAcknowledged, searchOpen, setSearchOpen }}
    >
      {children}
    </Context.Provider>
  );
}
export function useRelay() {
  const context = useContext(Context);
  if (!context) throw new Error("RelayProvider is missing");
  return context;
}
