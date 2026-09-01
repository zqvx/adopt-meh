import { create } from "zustand";
import { getPet } from "./pets/catalog";

export interface MarketPetValue {
  frUsd?: number;
  nfrUsd?: number;
  mfrUsd?: number;
  lowUsd?: number;
  highUsd?: number;
  source?: string;
  /** Preço por plataforma (chave = id da fonte) para arbitragem. */
  src?: Record<string, number>;
}

export interface MarketData {
  meta?: {
    scrapedAt?: string;
    live?: boolean;
    errors?: string[];
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
export function hypeScore(petId: string, hype: HypeData | null, fallbackDemand: number): number {
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
/**
 * Mediana do $/ponto entre todos os pets com as duas fontes — a referência
 * com que se diz se um item está caro ou barato.
 *
 * Corria inteira por cada linha da tabela, a cada tick de 2,4 s: eram ~109
 * ordenações de ~109 elementos por render. Agora fica em cache por objeto de
 * dados (`WeakMap`), que é novo em cada scraping — a entrada antiga sai sozinha
 * quando ninguém a referencia, sem gestão de tamanho.
 */
const medianCache = new WeakMap<object, number>();

export function medianUsdPerPoint(data: MarketData | null): number {
  if (!data?.pets) return 0;
  const cached = medianCache.get(data.pets);
  if (cached !== undefined) return cached;

  const ratios: number[] = [];
  for (const [id, row] of Object.entries(data.pets)) {
    const frUsd = row.frUsd;
    const petPts = getPet(id)?.values.fr.points ?? 0;
    if (frUsd && petPts > 0) ratios.push(frUsd / petPts);
  }
  if (ratios.length < 5) return 0;

  ratios.sort((a, b) => a - b);
  const medianRatio = ratios[Math.floor(ratios.length / 2)];
  medianCache.set(data.pets, medianRatio);
  return medianRatio;
}

export function inflationFor(
  petId: string,
  data: MarketData | null,
  points: number,
): { inflation: Inflation; ratio: number; medianRatio: number } | null {
  if (!data?.pets) return null;
  const medianRatio = medianUsdPerPoint(data);
  if (!medianRatio) return null;
  const thisPts = points > 0 ? points : (getPet(petId)?.values.fr.points ?? 0);
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

// ---------------------------------------------------------------------------
// Preço de mercado por item (usado no inventário e nas trocas): funde o
// scraping (values.json / /api/market/live) com o catálogo. As variantes sem
// preço direto são escaladas a partir do FR com os multiplicadores do próprio
// catálogo — mesma abordagem do feed ao vivo (pets/live.ts).
// ---------------------------------------------------------------------------

export interface MarketPrice {
  usd: number;
  /** true quando veio do scraping (false = catálogo local). */
  live: boolean;
  source?: string;
  scrapedAt?: string;
}

const VARIANT_CASH_KEY: Partial<
  Record<import("./pets/types").Variant, "frUsd" | "nfrUsd" | "mfrUsd">
> = {
  fr: "frUsd",
  nfr: "nfrUsd",
  mfr: "mfrUsd",
};

/** Preço de mercado de um pet+variante (USD) — null se não houver dados. */
export function marketPriceFor(
  petId: string,
  variant: import("./pets/types").Variant,
  data: MarketData | null,
): MarketPrice | null {
  if (!data?.pets) return null;
  const row = data.pets[petId];
  const pet = getPet(petId);
  if (!row || !pet) return null;
  const scrapedAt = data.meta?.scrapedAt;
  const directKey = VARIANT_CASH_KEY[variant];
  const direct = directKey ? row[directKey] : undefined;
  if (typeof direct === "number" && direct > 0) {
    return { usd: direct, live: true, source: row.source, scrapedAt };
  }
  // Escala a variante pelo rácio do catálogo (ex.: regular = 0.86×FR).
  const catalogFr = pet.values.fr.usd;
  const catalogVariant = pet.values[variant]?.usd ?? 0;
  if (typeof row.frUsd === "number" && row.frUsd > 0 && catalogFr > 0 && catalogVariant > 0) {
    const usd = row.frUsd * (catalogVariant / catalogFr);
    return { usd: Math.round(usd * 100) / 100, live: true, source: row.source, scrapedAt };
  }
  return null;
}

/** "há 3 d" · "há 2 h" · "agora" — idade de um carimbo ISO. */
export function ageLabel(iso: string | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} d`;
}
