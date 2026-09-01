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

/**
 * Watchlist do feed "ao vivo". A bias negativa simula ativos que estão a
 * negociar abaixo do valor de referência (oportunidades de flip); bias
 * positiva simula ativos aquecidos/caros.
 */
const WATCHLIST: WatchRow[] = [
  { petId: "shadow-dragon", variant: "fr", bias: -0.14 },
  { petId: "bat-dragon", variant: "fr", bias: -0.04 },
  { petId: "giraffe", variant: "fr", bias: 0.03 },
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
  { petId: "unicorn", variant: "fr", bias: 0.05 },
  { petId: "ride-potion", variant: "regular", bias: -0.02 },
  { petId: "shadow-dragon", variant: "nfr", bias: -0.06 },
  { petId: "frost-dragon", variant: "nfr", bias: -0.12 },
  { petId: "owl", variant: "nfr", bias: 0.02 },
];

export function fairUsd(petId: string, variant: Variant): number {
  return getPet(petId)?.values[variant]?.usd ?? 0;
}

export function initQuotes(): LiveQuote[] {
  return WATCHLIST.map((w) => {
    const fair = fairUsd(w.petId, w.variant);
    const price = fair * (1 + w.bias) * (1 + (Math.random() - 0.5) * 0.02);
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

/** Avança o feed um tick: random walk com reversão à média do bias. */
export function tickQuotes(quotes: LiveQuote[]): LiveQuote[] {
  return quotes.map((q) => {
    const fair = fairUsd(q.petId, q.variant);
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

export type Signal = "buy" | "watch" | "over";

export interface QuoteSignal {
  quote: LiveQuote;
  fairUsd: number;
  /** Valor de venda líquido após taxa de marketplace. */
  netUsd: number;
  /** ROI líquido projetado: (venda líq. - compra) / compra. */
  edge: number;
  /** Desconto face ao valor de referência. */
  discount: number;
  /** Variação desde o início da sessão. */
  session: number;
  signal: Signal;
  /** Score de oportunidade (liquidez × procura × edge). */
  score: number;
}

function liqWeight(liq: Liquidity): number {
  if (liq === "high") return 1;
  if (liq === "medium") return 0.75;
  if (liq === "low") return 0.45;
  return 0.1;
}

export function analyzeQuote(quote: LiveQuote, feePct: number): QuoteSignal | null {
  const pet = getPet(quote.petId);
  if (!pet) return null;
  const fair = fairUsd(quote.petId, quote.variant);
  const net = fair * (1 - feePct / 100);
  const edge = (net - quote.priceUsd) / quote.priceUsd;
  const discount = (fair - quote.priceUsd) / fair;
  const first = quote.history[0] ?? quote.priceUsd;
  const session = (quote.priceUsd - first) / first;
  const score = edge * (pet.demand / 5) * liqWeight(pet.liquidity);

  let signal: Signal = "over";
  if (edge >= 0.07) signal = "buy";
  else if (edge >= 0.02) signal = "watch";

  return { quote, fairUsd: fair, netUsd: net, edge, discount, session, signal, score };
}

export const SIGNAL_META: Record<
  Signal,
  { label: string; tone: "accent" | "warn" | "loss" }
> = {
  buy: { label: "COMPRAR", tone: "accent" },
  watch: { label: "OBSERVAR", tone: "warn" },
  over: { label: "CARO", tone: "loss" },
};
