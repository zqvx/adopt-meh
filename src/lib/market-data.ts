import { create } from "zustand";

export interface MarketPetValue {
  frUsd?: number;
  lowUsd?: number;
  highUsd?: number;
  source?: string;
}

export interface MarketData {
  meta?: {
    scrapedAt?: string;
    sources?: { id: string; name: string; url: string }[];
  };
  pets: Record<string, MarketPetValue>;
}

interface MarketState {
  data: MarketData | null;
  status: "idle" | "loading" | "ok" | "error";
  /** true quando os valores vieram do JSON de scraping. */
  loaded: boolean;
  load: () => Promise<void>;
}

const DATA_URL = "/data/values.json";

async function fetchMarket(): Promise<MarketData> {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MarketData;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  data: null,
  status: "idle",
  loaded: false,
  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    try {
      const data = await fetchMarket();
      if (!data || typeof data.pets !== "object") throw new Error("JSON inválido");
      set({ data, status: "ok", loaded: true });
    } catch {
      set({ status: "error" });
    }
  },
}));

/** Overrides de preço (USD) por pet — fundem com o catálogo. */
export function marketOverrides(data: MarketData | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!data?.pets) return out;
  for (const [id, row] of Object.entries(data.pets)) {
    if (typeof row.frUsd === "number" && row.frUsd > 0) out[id] = row.frUsd;
  }
  return out;
}
