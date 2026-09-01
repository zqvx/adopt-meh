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

export interface Position {
  id: string;
  ts: number;
  petId: string;
  variant: Variant;
  qty: number;
  /** Preço total de compra em USD (custo efetivo). */
  costUsd: number;
}

export interface InventoryItem {
  id: string;
  petId: string;
  variant: Variant;
  qty: number;
}

interface AppState {
  you: TradeLine[];
  them: TradeLine[];
  currency: Currency;
  feePct: number;
  history: HistoryEntry[];
  positions: Position[];
  inventory: InventoryItem[];
  tab: "live" | "invest" | "craft" | "trade" | "inventory" | "table" | "arb" | "history";
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
  addPosition: (pos: Omit<Position, "id" | "ts">) => void;
  removePosition: (id: string) => void;
  hydratePositions: (positions: Position[]) => void;
  addInventory: (petId: string, variant: Variant) => void;
  setInventoryQty: (id: string, qty: number) => void;
  removeInventory: (id: string) => void;
  /** Consome 4 (néon) ou 16 (mega) pets base e junta o resultado ao inventário. */
  craftPet: (petId: string, kind: "nfr" | "mfr") => boolean;
  hydrateInventory: (items: InventoryItem[]) => void;
}

const HISTORY_KEY = "nexus-trade-history-v1";
const PREFS_KEY = "nexus-prefs-v2";
const PORTFOLIO_KEY = "nexus-portfolio-v1";
const INVENTORY_KEY = "nexus-inventory-v1";

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

function persistPositions(positions: Position[]) {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(positions.slice(0, 60)));
  } catch {
    /* ignore */
  }
}

export function readPositions(): Position[] {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Position[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistInventory(items: InventoryItem[]) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export function readInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InventoryItem[];
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
  positions: [],
  inventory: [],
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
  addPosition: (pos) => {
    const entry: Position = { ...pos, id: uid(), ts: Date.now() };
    const next = [entry, ...get().positions].slice(0, 60);
    set({ positions: next });
    persistPositions(next);
  },
  removePosition: (id) => {
    const next = get().positions.filter((p) => p.id !== id);
    set({ positions: next });
    persistPositions(next);
  },
  hydratePositions: (positions) => set({ positions }),
  addInventory: (petId, variant) => {
    const pet = getPet(petId);
    if (!pet) return;
    const resolved: Variant = pet.hasVariants ? variant : "regular";
    set((state) => {
      const existing = state.inventory.find(
        (it) => it.petId === petId && it.variant === resolved,
      );
      const inventory = existing
        ? state.inventory.map((it) =>
            it.id === existing.id ? { ...it, qty: it.qty + 1 } : it,
          )
        : [
            ...state.inventory,
            { id: uid(), petId, variant: resolved, qty: 1 },
          ];
      persistInventory(inventory);
      return { inventory };
    });
  },
  setInventoryQty: (id, qty) => {
    const next = Math.max(0, Math.min(999, Math.round(qty)));
    set((state) => {
      const inventory = state.inventory
        .map((it) => (it.id === id ? { ...it, qty: next } : it))
        .filter((it) => it.qty > 0);
      persistInventory(inventory);
      return { inventory };
    });
  },
  removeInventory: (id) => {
    set((state) => {
      const inventory = state.inventory.filter((it) => it.id !== id);
      persistInventory(inventory);
      return { inventory };
    });
  },
  craftPet: (petId, kind) => {
    let done = false;
    set((state) => {
      const need = kind === "mfr" ? 16 : 4;
      // Conta apenas cópias BASE (não-neon): regular/fly/ride/fr.
      const baseVariants: Variant[] = ["regular", "fly", "ride", "fr"];
      const lines = state.inventory
        .filter((it) => it.petId === petId && baseVariants.includes(it.variant))
        .sort((a, b) => a.qty - b.qty); // consome primeiro as menores pilhas
      const total = lines.reduce((s, l) => s + l.qty, 0);
      if (total < need) return {};

      let remaining = need;
      const consumeIds = new Map<string, number>(); // id -> qty a remover
      for (const l of lines) {
        if (remaining <= 0) break;
        const take = Math.min(l.qty, remaining);
        consumeIds.set(l.id, take);
        remaining -= take;
      }

      let inventory = state.inventory
        .map((it) => {
          const take = consumeIds.get(it.id);
          return take ? { ...it, qty: it.qty - take } : it;
        })
        .filter((it) => it.qty > 0);

      // Junta o resultado (néon/mega) ao inventário.
      const resultVariant: Variant = kind;
      const existing = inventory.find(
        (it) => it.petId === petId && it.variant === resultVariant,
      );
      if (existing) {
        inventory = inventory.map((it) =>
          it.id === existing.id ? { ...it, qty: it.qty + 1 } : it,
        );
      } else {
        inventory = [
          ...inventory,
          { id: uid(), petId, variant: resultVariant, qty: 1 },
        ];
      }

      persistInventory(inventory);
      done = true;
      return { inventory };
    });
    return done;
  },
  hydrateInventory: (items) => set({ inventory: items }),
}));
