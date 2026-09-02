import { create } from "zustand";
import { getPet } from "./pets/catalog";
import type { MarketRange } from "./pets/live";
import type { Variant } from "./pets/types";

/** Uma linha de preço vinda do values.json (scraper). */
export interface MarketPetRow {
  frUsd?: number;
  nfrUsd?: number;
  mfrUsd?: number;
  lowUsd?: number;
  highUsd?: number;
  storeUsd?: number;
  source?: string;
  src?: Record<string, number>;
}

export interface MarketMeta {
  scrapedAt?: string;
  currency?: string;
  variant?: string;
  live?: boolean;
  errors?: string[];
  sources?: Array<{ id: string; name: string; url: string }>;
  stats?: Record<string, number>;
}

export interface MarketData {
  meta?: MarketMeta;
  pets: Record<string, MarketPetRow>;
}

/** Snapshot de recolha do scraper (scripts/price-history.mjs): FR USD por pet. */
export interface PriceSnapshot {
  t: number;
  p: Record<string, number>;
}

/** Histórico REAL de preços — public/data/price-history.json. */
export interface PriceHistory {
  snapshots: PriceSnapshot[];
}

export type MarketStatus = "idle" | "loading" | "ok" | "error";

interface HypeEntry {
  score?: number;
  mentions?: number;
}

interface MarketState {
  data: MarketData | null;
  hype: Record<string, HypeEntry> | null;
  history: PriceHistory | null;
  status: MarketStatus;
  error: string | null;
  load: () => Promise<void>;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const useMarketStore = create<MarketState>((set) => ({
  data: null,
  hype: null,
  history: null,
  status: "idle",
  error: null,
  load: async () => {
    set({ status: "loading", error: null });
    const [values, hype, history] = await Promise.all([
      fetchJson<MarketData>("/data/values.json"),
      fetchJson<Record<string, HypeEntry>>("/data/hype.json"),
      fetchJson<PriceHistory>("/data/price-history.json"),
    ]);
    if (!values || !values.pets) {
      set({ status: "error", error: "values.json indisponível", data: null });
      return;
    }
    set({
      data: values,
      hype: hype ?? null,
      history:
        history && Array.isArray(history.snapshots) ? history : null,
      status: "ok",
      error: null,
    });
  },
}));

/**
 * Preço FR de referência (USD) por pet — prioridade: frUsd do scrape,
 * depois storeUsd estimado. Usado para ancorar o feed live.
 */
export function marketOverrides(data: MarketData | null): Record<string, number> {
  if (!data?.pets) return {};
  const out: Record<string, number> = {};
  for (const [id, row] of Object.entries(data.pets)) {
    const price =
      typeof row.frUsd === "number" && row.frUsd > 0
        ? row.frUsd
        : typeof row.storeUsd === "number" && row.storeUsd > 0
          ? row.storeUsd * 0.56 // loja costuma ser inflacionada vs mercado
          : null;
    if (price != null) out[id] = Math.round(price * 100) / 100;
  }
  return out;
}

/**
 * Intervalos low/high de mercado (Eldorado ou estimativa a partir da loja).
 * Alimenta as 3 zonas de venda: Rápida / Justa / Ambiciosa.
 */
export function marketRanges(data: MarketData | null): Record<string, MarketRange> {
  if (!data?.pets) return {};
  const out: Record<string, MarketRange> = {};
  for (const [id, row] of Object.entries(data.pets)) {
    let low = typeof row.lowUsd === "number" ? row.lowUsd : 0;
    let high = typeof row.highUsd === "number" ? row.highUsd : 0;
    if (low <= 0 || high < low) {
      // Fallback: deriva banda a partir do frUsd / storeUsd
      const mid =
        typeof row.frUsd === "number" && row.frUsd > 0
          ? row.frUsd
          : typeof row.storeUsd === "number"
            ? row.storeUsd * 0.56
            : 0;
      if (mid <= 0) continue;
      low = Math.round(mid * 0.85 * 100) / 100;
      high = Math.round(mid * 1.18 * 100) / 100;
    }
    out[id] = { lowUsd: low, highUsd: high };
  }
  return out;
}

function frAnchor(row: MarketPetRow): number | null {
  if (typeof row.frUsd === "number" && row.frUsd > 0) return row.frUsd;
  if (typeof row.storeUsd === "number" && row.storeUsd > 0) {
    return Math.round(row.storeUsd * 0.56 * 100) / 100;
  }
  return null;
}

/** Preço de mercado (USD) para um pet + variante. Escala NFR/MFR a partir do FR se faltar. */
export function marketPriceFor(
  petId: string,
  data: MarketData | null,
  variant: Variant = "fr",
): number | null {
  if (!data?.pets?.[petId]) return null;
  const row = data.pets[petId];

  if (variant === "nfr" && typeof row.nfrUsd === "number" && row.nfrUsd > 0) {
    return row.nfrUsd;
  }
  if (variant === "mfr" && typeof row.mfrUsd === "number" && row.mfrUsd > 0) {
    return row.mfrUsd;
  }

  const fr = frAnchor(row);
  if (fr == null) return null;
  if (variant === "fr" || variant === "regular") return fr;

  // Escala a partir do rácio do catálogo quando só temos FR de mercado
  const pet = getPet(petId);
  const catalogFr = pet?.values?.fr?.usd ?? 0;
  const catalogVar = pet?.values?.[variant]?.usd ?? 0;
  if (catalogFr > 0 && catalogVar > 0) {
    return Math.round((catalogVar / catalogFr) * fr * 100) / 100;
  }
  return fr;
}

/**
 * Resolve USD de mercado com fallback ao catálogo.
 * Preferência: scrape → catálogo.
 */
export function resolveMarketUsd(
  petId: string,
  variant: Variant,
  data: MarketData | null,
): { usd: number; fromMarket: boolean } {
  const market = marketPriceFor(petId, data, variant);
  if (market != null && market > 0) return { usd: market, fromMarket: true };
  const pet = getPet(petId);
  const catalog = pet?.values?.[pet?.hasVariants ? variant : "regular"]?.usd ?? 0;
  return { usd: catalog, fromMarket: false };
}

export function marketBandFor(
  petId: string,
  data: MarketData | null,
): MarketRange | null {
  const ranges = marketRanges(data);
  return ranges[petId] ?? null;
}

export interface PriceSeriesPoint {
  daysAgo: number;
  price: number;
  t: number;
}

/**
 * Série diária (mais antiga → mais recente) a partir do histórico REAL
 * acumulado pelas recolhas automáticas (a cada 6h pelo scraper).
 * Devolve null quando há menos de 2 pontos no último mês — a UI cai nesse
 * caso para a série simulada.
 */
export function realPriceSeries(
  history: PriceHistory | null,
  petId: string,
): PriceSeriesPoint[] | null {
  const snaps = history?.snapshots;
  if (!snaps || snaps.length < 2) return null;
  const DAY = 86_400_000;
  const today = Math.floor(Date.now() / DAY);
  const out: PriceSeriesPoint[] = [];
  for (const s of snaps) {
    const usd = s.p?.[petId];
    if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0) continue;
    const daysAgo = today - Math.floor(s.t / DAY);
    if (daysAgo < 0 || daysAgo > 30) continue;
    // Um ponto por dia; os snapshots vêm do mais antigo para o mais recente,
    // por isso o último do dia é o que fica.
    const existing = out.find((o) => o.daysAgo === daysAgo);
    if (existing) existing.price = usd;
    else out.push({ daysAgo, price: usd, t: s.t });
  }
  if (out.length < 2) return null;
  out.sort((a, b) => b.daysAgo - a.daysAgo);
  return out;
}

/** Mediana do rácio USD/ponto entre pets com preço de mercado + pontos no catálogo. */
export function medianUsdPerPoint(data: MarketData | null): number {
  if (!data?.pets) return 0;
  const ratios: number[] = [];
  for (const [id, row] of Object.entries(data.pets)) {
    const usd = typeof row.frUsd === "number" ? row.frUsd : 0;
    if (usd <= 0) continue;
    const pet = getPet(id);
    const pts = pet?.values?.fr?.points ?? 0;
    if (pts <= 0) continue;
    ratios.push(usd / pts);
  }
  if (ratios.length < 5) return 0;
  ratios.sort((a, b) => a - b);
  const mid = Math.floor(ratios.length / 2);
  return ratios.length % 2 === 0
    ? (ratios[mid - 1] + ratios[mid]) / 2
    : ratios[mid];
}

export type InflationLabel = "undervalued" | "fair" | "overhyped";

export interface InflationInfo {
  medianRatio: number;
  petRatio: number;
  inflation: InflationLabel;
}

/**
 * Compara o $/ponto deste pet com a mediana do mercado.
 * Útil para detetar hype inflacionado vs oportunidades baratas.
 */
export function inflationFor(
  petId: string,
  data: MarketData | null,
  points: number,
): InflationInfo | null {
  const median = medianUsdPerPoint(data);
  if (median <= 0 || points <= 0) return null;
  const usd = marketPriceFor(petId, data, "fr");
  if (usd == null || usd <= 0) return null;
  const petRatio = usd / points;
  const rel = petRatio / median;
  let inflation: InflationLabel = "fair";
  if (rel >= 1.28) inflation = "overhyped";
  else if (rel <= 0.78) inflation = "undervalued";
  return { medianRatio: median, petRatio, inflation };
}

/** Score de hype (Discord / menções) normalizado 0–100. */
export function hypeScore(
  petId: string,
  hype: Record<string, HypeEntry> | null,
  demandFallback = 3,
): number {
  const entry = hype?.[petId];
  if (entry && typeof entry.score === "number") {
    return Math.max(0, Math.min(100, entry.score));
  }
  // Fallback suave a partir da procura do catálogo (1–5 → ~20–100)
  return Math.max(0, Math.min(100, demandFallback * 18));
}

/** Idade legível do último scrape ("há 2 h", "ontem"…). */
export function ageLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}
