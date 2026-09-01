import { create } from "zustand";
import type { Variant } from "./pets/types";

export type SniperDirection = "below" | "above";

export interface SniperAlert {
  id: string;
  petId: string;
  variant: Variant;
  /** Limite em EUR (o utilizador é PT). */
  eurTarget: number;
  direction: SniperDirection; // below = dispara se cair abaixo; above = se subir acima
  createdAt: number;
  triggered?: boolean;
  triggeredAt?: number;
  /** Preço (EUR) no momento do disparo. */
  firedPriceEur?: number;
}

const KEY = "nexus-sniper-v1";

function persist(alerts: SniperAlert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(alerts));
  } catch {
    /* indisponível */
  }
}

function load(): SniperAlert[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SniperAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface SniperState {
  alerts: SniperAlert[];
  addAlert: (a: Omit<SniperAlert, "id" | "createdAt">) => void;
  removeAlert: (id: string) => void;
  markTriggered: (id: string, priceEur: number) => void;
  resetAlert: (id: string) => void;
}

export const useSniperStore = create<SniperState>((set) => ({
  alerts: load(),
  addAlert: (a) =>
    set((s) => {
      const alert: SniperAlert = { ...a, id: uid(), createdAt: Date.now() };
      const alerts = [...s.alerts, alert];
      persist(alerts);
      return { alerts };
    }),
  removeAlert: (id) =>
    set((s) => {
      const alerts = s.alerts.filter((x) => x.id !== id);
      persist(alerts);
      return { alerts };
    }),
  markTriggered: (id, priceEur) =>
    set((s) => {
      const alerts = s.alerts.map((x) =>
        x.id === id
          ? { ...x, triggered: true, triggeredAt: Date.now(), firedPriceEur: priceEur }
          : x,
      );
      persist(alerts);
      return { alerts };
    }),
  resetAlert: (id) =>
    set((s) => {
      const alerts = s.alerts.map((x) =>
        x.id === id
          ? { ...x, triggered: false, triggeredAt: undefined, firedPriceEur: undefined }
          : x,
      );
      persist(alerts);
      return { alerts };
    }),
}));
