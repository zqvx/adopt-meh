/**
 * Matemática de preços da Máquina de Revolut — sem dependências, para poder
 * ser testada isoladamente (ver p2p.test.ts). O store vive em p2p.ts.
 */
import type { Variant } from "./pets/types.ts";

export type ListingStatus = "active" | "sold";

export interface Listing {
  id: string;
  /** Momento em que o anúncio foi criado (base do decay). */
  ts: number;
  petId: string;
  variant: Variant;
  qty: number;
  /** Valor de mercado unitário em € (catálogo/values.json). */
  marketEur: number;
  /** Custo unitário efetivo em € (o que te ficou a pele). Break-even. */
  costEur: number;
  status: ListingStatus;
  /** Preço a que foi efetivamente vendido (total, em €). */
  soldEur?: number;
  soldTs?: number;
  note?: string;
}

/** Comissão média cobrada pelos marketplaces ao vendedor. */
export const SITE_FEE = 0.12;

/** Dias a preço golden antes de forçar liquidez. */
export const GOLDEN_DAYS = 3;
/** Último dia da janela de venda rápida (a partir daí é break-even). */
export const QUICK_DAYS = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Preço "charm" (…,99) — usado nos anúncios de venda rápida. */
function charm(n: number) {
  return round2(Math.max(0, Math.floor(n) + 0.99));
}

/** O que um marketplace te pagaria depois da comissão (~12%). */
export function siteNetEur(marketEur: number): number {
  return round2(marketEur * (1 - SITE_FEE));
}

/**
 * Golden spread: o preço que fica exatamente a meio do líquido do site e do
 * preço de mercado. Ganha-se mais do que a vender no site e o comprador
 * paga menos do que no site — ninguém tem razão para recusar.
 *
 * 50 € de mercado → 44 € líquidos no site → **47 €** de venda direta.
 */
export function goldenSpread(marketEur: number): number {
  if (!(marketEur > 0)) return 0;
  const mid = (siteNetEur(marketEur) + marketEur) / 2;
  return mid >= 20 ? Math.round(mid) : round2(mid);
}

/**
 * Venda rápida: iguala o líquido do site (charm price). O comprador poupa a
 * margem do marketplace inteira, o stock sai em horas.
 *
 * 50 € de mercado → **44,99 €**.
 */
export function quickSell(marketEur: number): number {
  if (!(marketEur > 0)) return 0;
  return charm(siteNetEur(marketEur));
}

export type PriceStage = "golden" | "quick" | "breakeven";

export interface DecayedPrice {
  /** Preço unitário a pedir hoje, em €. */
  eur: number;
  stage: PriceStage;
  /** Dias inteiros desde que o anúncio foi criado. */
  days: number;
  label: string;
  hint: string;
}

export function daysListed(listing: Pick<Listing, "ts">, now = Date.now()) {
  return Math.max(0, Math.floor((now - listing.ts) / DAY_MS));
}

/**
 * Decay automático do anúncio:
 *   dia 0–3  → golden spread (margem cheia)
 *   dia 4–6  → venda rápida (iguala o site)
 *   dia 7+   → preço de custo (break-even: liberta o capital)
 */
export function decayPrice(
  listing: Pick<Listing, "ts" | "marketEur" | "costEur">,
  now = Date.now(),
): DecayedPrice {
  const days = daysListed(listing, now);
  const golden = goldenSpread(listing.marketEur);
  const quick = quickSell(listing.marketEur);
  const cost = round2(Math.max(0, listing.costEur));

  if (days <= GOLDEN_DAYS) {
    return {
      eur: golden,
      stage: "golden",
      days,
      label: "Golden spread",
      hint: `Margem cheia. Ganhas +${round2(golden - siteNetEur(listing.marketEur)).toFixed(2)} € face ao site.`,
    };
  }
  if (days <= QUICK_DAYS) {
    return {
      eur: quick,
      stage: "quick",
      days,
      label: "Venda rápida",
      hint: "Iguala o líquido do marketplace — sai em horas.",
    };
  }
  return {
    eur: Math.min(cost > 0 ? cost : quick, quick),
    stage: "breakeven",
    days,
    label: "Break-even",
    hint: "Capital congelado há mais de uma semana: sai ao custo e roda o dinheiro.",
  };
}

/**
 * Custo por defeito de uma listagem, quando o utilizador não indica quanto
 * pagou: ~55% do valor de mercado (o preço típico a que se compra stock
 * barato para revender).
 */
export const DEFAULT_COST_RATIO = 0.55;

export function defaultCostEur(marketEur: number) {
  return round2(marketEur * DEFAULT_COST_RATIO);
}

/** Lucro estimado (total, em €) de uma listagem ao preço de hoje. */
export function listingProfitEur(listing: Listing, now = Date.now()) {
  const price = listing.status === "sold" && typeof listing.soldEur === "number"
    ? listing.soldEur / Math.max(1, listing.qty)
    : decayPrice(listing, now).eur;
  return round2((price - listing.costEur) * listing.qty);
}

