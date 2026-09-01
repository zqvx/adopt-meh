import { create } from "zustand";
import { FEATURED_PETS, getPet } from "@/lib/pets/catalog";
import { evaluateTrade } from "@/lib/pets/engine";
import type { Currency, TradeLine, TradeSide, Variant } from "@/lib/pets/types";
import { uid } from "@/lib/utils";

export interface HistoryEntry {
  id: string;
  ts: number;
  you: TradeLine[];
  them: TradeLine[];
  youLabel: string;
  themLabel: string;
  pct: number;
  deltaPoints: number;
  kind: string;
}

interface AppState {
  you: TradeLine[];
  them: TradeLine[];
  currency: Currency;
  feePct: number;
  history: HistoryEntry[];
  tab: "live" | "trade" | "table" | "arb" | "history";
  addLine: (side: TradeSide, petId: string, variant: Variant) => void;
  removeLine: (side: TradeSide, id: string) => void;
  setQty: (side: TradeSide, id: string, qty: number) => void;
  setVariant: (side: TradeSide, id: string, variant: Variant) => void;
  clear: (side?: TradeSide | "all") => void;
  swap: () => void;
  loadExample: () => void;
  setCurrency: (currency: Currency) => void;
  setFeePct: (feePct: number) => void;
  setTab: (tab: AppState["tab"]) => void;
  saveHistory: () => void;
  deleteHistory: (id: string) => void;
  restoreHistory: (id: string) => void;
  hydrateHistory: (entries: HistoryEntry[]) => void;
}

const HISTORY_KEY = "nexus-trade-history-v1";
const PREFS_KEY = "nexus-prefs-v2";

function sideOf(state: AppState, side: TradeSide) {
  return side === "you" ? state.you : state.them;
}

function setSide(state: AppState, side: TradeSide, lines: TradeLine[]) {
  return side === "you" ? { you: lines } : { them: lines };
}

function summarize(lines: TradeLine[]) {
  return lines
    .map((line) => {
      const pet = getPet(line.petId);
      if (!pet) return null;
      const qty = line.qty > 1 ? `${line.qty}× ` : "";
      const variant = pet.hasVariants ? ` ${line.variant.toUpperCase()}` : "";
      return `${qty}${pet.name}${variant}`;
    })
    .filter(Boolean)
    .join(" · ");
}

function persistPrefs(currency: Currency, feePct: number) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ currency, feePct }));
  } catch {
    /* ignore */
  }
}

function persistHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function readPrefs(): { currency: Currency; feePct: number } | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { currency: Currency; feePct: number };
  } catch {
    return null;
  }
}

export function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useTradeStore = create<AppState>((set, get) => ({
  you: [],
  them: [],
  currency: "EUR",
  feePct: 10,
  history: [],
  tab: "live",
  addLine: (side, petId, variant) => {
    const pet = getPet(petId);
    if (!pet) return;
    const resolved: Variant = pet.hasVariants ? variant : "regular";
    set((state) => {
      const current = sideOf(state, side);
      const existing = current.find(
        (line) => line.petId === petId && line.variant === resolved,
      );
      if (existing) {
        return setSide(
          state,
          side,
          current.map((line) =>
            line.id === existing.id ? { ...line, qty: line.qty + 1 } : line,
          ),
        );
      }
      return setSide(state, side, [
        ...current,
        { id: uid(), petId, variant: resolved, qty: 1 },
      ]);
    });
  },
  removeLine: (side, id) => {
    set((state) =>
      setSide(
        state,
        side,
        sideOf(state, side).filter((line) => line.id !== id),
      ),
    );
  },
  setQty: (side, id, qty) => {
    const next = Math.max(1, Math.min(99, Math.round(qty)));
    set((state) =>
      setSide(
        state,
        side,
        sideOf(state, side).map((line) =>
          line.id === id ? { ...line, qty: next } : line,
        ),
      ),
    );
  },
  setVariant: (side, id, variant) => {
    set((state) =>
      setSide(
        state,
        side,
        sideOf(state, side).map((line) =>
          line.id === id ? { ...line, variant } : line,
        ),
      ),
    );
  },
  clear: (side = "all") => {
    if (side === "all") set({ you: [], them: [] });
    else if (side === "you") set({ you: [] });
    else set({ them: [] });
  },
  swap: () => {
    set((state) => ({ you: state.them, them: state.you }));
  },
  loadExample: () => {
    const frost = FEATURED_PETS.find((p) => p.id === "frost-dragon");
    const owl = getPet("owl");
    const crow = getPet("crow");
    if (!frost || !owl || !crow) return;
    set({
      you: [{ id: uid(), petId: "shadow-dragon", variant: "fr", qty: 1 }],
      them: [
        { id: uid(), petId: "frost-dragon", variant: "fr", qty: 1 },
        { id: uid(), petId: "owl", variant: "fr", qty: 1 },
        { id: uid(), petId: "crow", variant: "fr", qty: 1 },
      ],
    });
  },
  setCurrency: (currency) => {
    set({ currency });
    persistPrefs(currency, get().feePct);
  },
  setFeePct: (feePct) => {
    const next = Math.max(0, Math.min(25, feePct));
    set({ feePct: next });
    persistPrefs(get().currency, next);
  },
  setTab: (tab) => set({ tab }),
  saveHistory: () => {
    const { you, them, history } = get();
    if (you.length === 0 && them.length === 0) return;
    const verdict = evaluateTrade(you, them);
    const entry: HistoryEntry = {
      id: uid(),
      ts: Date.now(),
      you: you.map((line) => ({ ...line })),
      them: them.map((line) => ({ ...line })),
      youLabel: summarize(you) || "—",
      themLabel: summarize(them) || "—",
      pct: verdict.pct,
      deltaPoints: verdict.deltaPoints,
      kind: verdict.kind,
    };
    const next = [entry, ...history].slice(0, 40);
    set({ history: next });
    persistHistory(next);
  },
  deleteHistory: (id) => {
    const next = get().history.filter((entry) => entry.id !== id);
    set({ history: next });
    persistHistory(next);
  },
  restoreHistory: (id) => {
    const entry = get().history.find((row) => row.id === id);
    if (!entry) return;
    set({
      you: entry.you.map((line) => ({ ...line, id: uid() })),
      them: entry.them.map((line) => ({ ...line, id: uid() })),
      tab: "trade",
    });
  },
  hydrateHistory: (entries) => set({ history: entries }),
}));
