import { create } from "zustand";
import { uid } from "./utils";
import {
  normalizeHandle,
  withPurchase,
  type Customer,
  type Purchase,
} from "./crm-match";

export * from "./crm-match";

const KEY = "nexus-crm-v1";

export interface CRMState {
  customers: Customer[];
  hydrate: () => void;
  /** Regista a compra; cria o cliente se o handle for novo. */
  recordSale: (
    handle: string,
    purchase: Purchase,
    platform?: Customer["platform"],
  ) => Customer | null;
  setNote: (id: string, note: string) => void;
  removeCustomer: (id: string) => void;
}

export function readCRM(): Customer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Customer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(customers: Customer[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(customers.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export const useCRMStore = create<CRMState>((set, get) => ({
  customers: [],
  hydrate: () => set({ customers: readCRM() }),
  recordSale: (handle, purchase, platform = "discord") => {
    const key = normalizeHandle(handle);
    if (!key) return null;
    const current = get().customers;
    const existing = current.find((c) => normalizeHandle(c.handle) === key);
    const updated: Customer = existing
      ? withPurchase(existing, purchase)
      : {
          id: uid(),
          handle: key,
          platform,
          purchases: [purchase],
          totalEur: purchase.eur,
          firstTs: purchase.ts,
          lastTs: purchase.ts,
        };
    const customers = existing
      ? current.map((c) => (c.id === existing.id ? updated : c))
      : [updated, ...current].slice(0, 200);
    set({ customers });
    persist(customers);
    return updated;
  },
  setNote: (id, note) => {
    const customers = get().customers.map((c) =>
      c.id === id ? { ...c, note } : c,
    );
    set({ customers });
    persist(customers);
  },
  removeCustomer: (id) => {
    const customers = get().customers.filter((c) => c.id !== id);
    set({ customers });
    persist(customers);
  },
}));
