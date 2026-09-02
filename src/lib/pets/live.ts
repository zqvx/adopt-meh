import { getPet } from "./catalog";
import type { Liquidity, Variant } from "./types";

export interface LiveQuote {
  key: string;
  petId: string;
  variant: Variant;
  /** Long-term market bias of this quote vs fair value (negative = descontado). */
  bias: number;
  /** Live mid price in USD. */
  priceUsd: number;
  /** Recent price history (oldest -> newest). */
  history: number[];
}

interface WatchRow {
  petId: string;
  variant: Variant;
  bias: number;
}

const WATCHLIST: WatchRow[] = [
  { petId: "shadow-dragon", variant: "fr", bias: -0.14 },
  { petId: "bat-dragon", variant: "fr", bias: -0.04 },
  { petId: "giraffe", variant: "fr", bias: 0.09 },
  { petId: "frost-dragon", variant: "fr", bias: -0.09 },
  { petId: "owl", variant: "fr", bias: -0.07 },
  { petId: "crow", variant: "fr", bias: -0.11 },
  { petId: "parrot", variant: "fr", bias: -0.05 },
  { petId: "evil-unicorn", variant: "fr", bias: -0.08 },
  { petId: "arctic-reindeer", variant: "fr", bias: -0.17 },
  { petId: "turtle", variant: "fr", bias: -0.06 },
  { petId: "kangaroo", variant: "fr", bias: -0.1 },
  { petId: "african-wild-dog", variant: "fr", bias: -0.07 },
  { petId: "dragon", variant: "fr", bias: -0.03 },
  { petId: "unicorn", variant: "fr", bias: 0.11 },
  { petId: "frost-fury", variant: "fr", bias: 0.08 },
  { petId: "ride-potion", variant: "regular", bias: -0.02 },
  { petId: "shadow-dragon", variant: "nfr", bias: -0.06 },
  { petId: "frost-dragon", variant: "nfr", bias: -0.12 },
  { petId: "owl", variant: "nfr", bias: 0.08 },
];

export const BUY_EDGE = 0.07;
export const WATCH_EDGE = 0.02;
export const SELL_OVERVAL = 0.05;

export function fairUsd(petId: string, variant: Variant): number {
  return getPet(petId)?.values[variant]?.usd ?? 0;
}

export function initQuotes(overrides: Record<string, number> = {}): LiveQuote[] {
  return WATCHLIST.map((w) => {
    const fair = marketFair(w.petId, w.variant, overrides);
    const price = fair * (1 + w.bias);
    return {
      key: `${w.petId}-${w.variant}`,
      petId: w.petId,
      variant: w.variant,
      bias: w.bias,
      priceUsd: price,
      history: [price],
    };
  });
}

function marketFair(
  petId: string,
  variant: Variant,
  overrides: Record<string, number>,
): number {
  const catalog = fairUsd(petId, variant);
  const fr = overrides[petId];
  if (!fr) return catalog;
  if (variant === "fr") return fr;
  const catalogFr = fairUsd(petId, "fr");
  if (!catalogFr) return catalog;
  return (catalog / catalogFr) * fr;
}

export function tickQuotes(
  quotes: LiveQuote[],
  overrides: Record<string, number> = {},
): LiveQuote[] {
  return quotes.map((q) => {
    const fair = marketFair(q.petId, q.variant, overrides);
    const target = fair * (1 + q.bias);
    const noise = (Math.random() - 0.5) * fair * 0.016;
    const drift = (target - q.priceUsd) * 0.05;
    const next = q.priceUsd + drift + noise;
    const clamped = Math.max(fair * 0.55, Math.min(fair * 1.22, next));
    return {
      ...q,
      priceUsd: clamped,
      history: [...q.history, clamped].slice(-48),
    };
  });
}

export type Signal = "buy" | "hold" | "sell";

export interface PriceZones {
  netSellUsd: number;
  buyBelowUsd: number;
  sellAboveUsd: number;
  quickSellUsd: number;
  fairSellUsd: number;
  ambitiousSellUsd: number;
}

export interface MarketRange {
  lowUsd: number;
  highUsd: number;
}

export function priceZones(
  fair: number,
  feePct: number,
  range?: MarketRange | null,
): PriceZones {
  const netSell = fair * (1 - feePct / 100);
  if (range && range.lowUsd > 0 && range.highUsd >= range.lowUsd) {
    const quick = range.lowUsd;
    const ambitious = range.highUsd;
    return {
      netSellUsd: netSell,
      buyBelowUsd: Math.min(netSell / (1 + BUY_EDGE), quick * 1.02),
      sellAboveUsd: ambitious * 0.92,
      quickSellUsd: quick,
      fairSellUsd: fair,
      ambitiousSellUsd: ambitious,
    };
  }
  return {
    netSellUsd: netSell,
    buyBelowUsd: netSell / (1 + BUY_EDGE),
    sellAboveUsd: fair * (1 + SELL_OVERVAL),
    quickSellUsd: fair * 0.85,
    fairSellUsd: fair,
    ambitiousSellUsd: fair * 1.15,
  };
}

export interface QuoteSignal {
  quote: LiveQuote;
  fairUsd: number;
  zones: PriceZones;
  edge: number;
  overval: number;
  discount: number;
  session: number;
  signal: Signal;
  score: number;
}

function liqWeight(liq: Liquidity): number {
  if (liq === "high") return 1;
  if (liq === "medium") return 0.75;
  if (liq === "low") return 0.45;
  return 0.1;
}

export function analyzeQuote(
  quote: LiveQuote,
  feePct: number,
  overrides: Record<string, number> = {},
  ranges: Record<string, MarketRange> = {},
): QuoteSignal | null {
  const pet = getPet(quote.petId);
  if (!pet) return null;
  const fair = marketFair(quote.petId, quote.variant, overrides);
  const range = ranges[quote.petId] ?? null;
  const zones = priceZones(fair, feePct, range);
  const realisticNet = zones.fairSellUsd * (1 - feePct / 100);
  const edge = (realisticNet - quote.priceUsd) / quote.priceUsd;
  const discount = (fair - quote.priceUsd) / fair;
  const overval = (quote.priceUsd - fair) / fair;
  const first = quote.history[0] ?? quote.priceUsd;
  const session = (quote.priceUsd - first) / first;

  let signal: Signal = "hold";
  let score = 0;
  if (quote.priceUsd >= zones.sellAboveUsd) {
    signal = "sell";
    score = overval * (pet.demand / 5) * liqWeight(pet.liquidity);
  } else if (edge >= BUY_EDGE) {
    signal = "buy";
    score = edge * (pet.demand / 5) * liqWeight(pet.liquidity);
  } else if (edge >= WATCH_EDGE) {
    score = edge * (pet.demand / 5) * liqWeight(pet.liquidity) * 0.5;
  }

  return { quote, fairUsd: fair, zones, edge, overval, discount, session, signal, score };
}

export const SIGNAL_META: Record<
  Signal,
  { label: string; tone: "accent" | "warn" | "fair" }
> = {
  buy: { label: "COMPRAR", tone: "accent" },
  hold: { label: "AGUARDAR", tone: "fair" },
  sell: { label: "VENDER", tone: "warn" },
};

export function livePriceUsd(
  quotes: LiveQuote[],
  petId: string,
  variant: Variant,
  overrides: Record<string, number> = {},
): { price: number; live: boolean } {
  const q = quotes.find((row) => row.petId === petId && row.variant === variant);
  if (q) return { price: q.priceUsd, live: true };
  return { price: marketFair(petId, variant, overrides), live: false };
}
