import { create } from "zustand";
import { getPet } from "./pets/catalog";

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

export interface HypeData {
  meta?: { updatedAt?: string; source?: string };
  /** petId -> score 0..100 (procura/hype medido em Discord/trades recentes). */
  hype: Record<string, number>;
  /** petId -> nº de menções recentes (cru). */
  mentions?: Record<string, number>;
}

/** Snapshot acumulado pelo scraper ao longo do tempo (histórico real). */
export interface PriceHistory {
  snapshots: { t: number; p: Record<string, number> }[];
}

interface MarketState {
  data: MarketData | null;
  hype: HypeData | null;
  history: PriceHistory | null;
  status: "idle" | "loading" | "ok" | "error";
  /** true quando os valores vieram do JSON de scraping. */
  loaded: boolean;
  load: () => Promise<void>;
}

const DATA_URL = "/data/values.json";
const LIVE_URL = "/api/market/live";
const HISTORY_URL = "/data/price-history.json";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Preços frescos via servidor local (que tem internet); cai no JSON estático. */
function fetchMarket(): Promise<MarketData> {
  return fetchJson<MarketData>(LIVE_URL)
    .then((live) => {
      if (live && typeof live.pets === "object" && Object.keys(live.pets).length > 0) {
        return live;
      }
      throw new Error("live vazio");
    })
    .catch(() => fetchJson<MarketData>(DATA_URL));
}

export const useMarketStore = create<MarketState>((set, get) => ({
  data: null,
  hype: null,
  history: null,
  status: "idle",
  loaded: false,
  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    try {
      // No PC do utilizador o endpoint local (/api/market/live) faz scraping
      // na hora; no site estático cai no JSON servido pelo cron. Ambos com
      // fallback para o JSON estático do repositório.
      const data = await fetchMarket();
      if (!data || typeof data.pets !== "object") throw new Error("JSON inválido");
      // Hype e histórico são opcionais — se faltarem, a app usa fallbacks.
      let hype: HypeData | null = null;
      try {
        hype = await fetchJson<HypeData>("/data/hype.json");
      } catch {
        hype = null;
      }
      let history: PriceHistory | null = null;
      try {
        const h = await fetchJson<PriceHistory>(HISTORY_URL);
        if (h && Array.isArray(h.snapshots)) history = h;
      } catch {
        history = null;
      }
      set({ data, hype, history, status: "ok", loaded: true });
    } catch {
      set({ status: "error" });
    }
  },
}));

/**
 * Série de preços REAL de um pet a partir do histórico acumulado pelo
 * scraper. Devolve null quando ainda não há dados suficientes (< 2 pontos),
 * caso em que o gráfico usa a série simulada.
 */
export function realPriceSeries(
  history: PriceHistory | null,
  petId: string,
): { daysAgo: number; price: number; t: number }[] | null {
  const snaps = history?.snapshots ?? [];
  const pts = snaps
    .map((s) => ({ t: s.t, price: s.p?.[petId] }))
    .filter((p): p is { t: number; price: number } => typeof p.price === "number");
  if (pts.length < 2) return null;
  const newest = pts[pts.length - 1].t;
  return pts.map((p) => ({
    ...p,
    daysAgo: Math.round((newest - p.t) / (24 * 60 * 60 * 1000)),
  }));
}

/** Score de procura 0..100 de um pet: hype do Discord se existir, senão catálogo. */
export function hypeScore(
  petId: string,
  hype: HypeData | null,
  fallbackDemand: number,
): number {
  const h = hype?.hype?.[petId];
  if (typeof h === "number") return Math.max(0, Math.min(100, h));
  return (fallbackDemand / 5) * 100;
}

export type Inflation = "overhyped" | "fair" | "undervalued";

/**
 * Cruzamento de fontes: compara o preço em dinheiro (scraping) com os pontos
 * do catálogo (ElveBredd). Pets cujo $/ponto desvia muito da mediana estão
 * inflacionados (overhyped) ou baratos (oportunidade).
 */
export function inflationFor(
  petId: string,
  data: MarketData | null,
  points: number,
): { inflation: Inflation; ratio: number; medianRatio: number } | null {
  if (!data?.pets) return null;
  // Mediana do $/ponto entre todos os pets com as duas fontes.
  const ratios: number[] = [];
  for (const [id, row] of Object.entries(data.pets)) {
    const frUsd = row.frUsd;
    const petPts = getPet(id)?.values.fr.points ?? 0;
    if (frUsd && petPts > 0) ratios.push(frUsd / petPts);
  }
  if (ratios.length < 5) return null;
  ratios.sort((a, b) => a - b);
  const medianRatio = ratios[Math.floor(ratios.length / 2)];
  const thisPts = points > 0 ? points : getPet(petId)?.values.fr.points ?? 0;
  const frUsd = data.pets[petId]?.frUsd;
  if (!frUsd || thisPts <= 0) return null;
  const ratio = frUsd / thisPts;
  const deviation = (ratio - medianRatio) / medianRatio;
  let inflation: Inflation = "fair";
  if (deviation >= 0.28) inflation = "overhyped";
  else if (deviation <= -0.22) inflation = "undervalued";
  return { inflation, ratio, medianRatio };
}

/** Overrides de preço (USD) por pet — fundem com o catálogo. */
export function marketOverrides(data: MarketData | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!data?.pets) return out;
  for (const [id, row] of Object.entries(data.pets)) {
    if (typeof row.frUsd === "number" && row.frUsd > 0) out[id] = row.frUsd;
  }
  return out;
}
