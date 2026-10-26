"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { shots, type SectionId } from "@/data/portfolio";

type Store = {
  section: SectionId | null;
  selectedId: string | null;
  spotlight: boolean;
  setSection: (section: SectionId | null, shotId?: string) => void;
  openSpotlight: (shotId: string, section: SectionId) => void;
  closeSpotlight: () => void;
  showPhoto: (shotId: string) => void;
  zoom: number;
  setZoom: (zoom: number | ((zoom: number) => number)) => void;
  aimedId: string | null;
  setAimed: (id: string | null) => void;
  holding: boolean;
  setHolding: (holding: boolean) => void;
};

const StoreContext = createContext<Store | null>(null);

export const frameLock = { on: false, aimedId: null as string | null };

function photoFor(section: SectionId, current: string | null, shotId?: string) {
  if (shotId) return shotId;
  const currentShot = shots.find((shot) => shot.id === current);
  if (currentShot?.section === section) return current;
  return shots.find((shot) => shot.section === section)?.id ?? null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [section, setSectionState] = useState<SectionId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState(false);
  const [zoom, setZoomState] = useState(1);
  const [aimedId, setAimed] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);

  const setSection = (next: SectionId | null, shotId?: string) => {
    setSectionState(next);
    setSpotlight(false);
    setHolding(false);
    setAimed(null);
    setSelectedId((current) => (next ? photoFor(next, current, shotId) : null));
  };

  const openSpotlight = (shotId: string, next: SectionId) => {
    setSectionState(next);
    setSelectedId(shotId);
    setSpotlight(true);
    setZoomState(1);
  };

  const closeSpotlight = () => {
    setSpotlight(false);
    setZoomState(1);
  };
  const showPhoto = (shotId: string) => {
    setSelectedId(shotId);
    setZoomState(1);
  };
  const setZoom = (next: number | ((zoom: number) => number)) => {
    setZoomState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      return Math.min(1.85, Math.max(0.72, value));
    });
  };

  const value = useMemo(
    () => ({
      section,
      selectedId,
      spotlight,
      setSection,
      openSpotlight,
      closeSpotlight,
      showPhoto,
      zoom,
      setZoom,
      aimedId,
      setAimed,
      holding,
      setHolding,
    }),
    [section, selectedId, spotlight, zoom, aimedId, holding],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return store;
}
