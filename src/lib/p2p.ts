import { create } from "zustand";
import { getPet } from "./pets/catalog";
import type { Variant } from "./pets/types";
import { uid } from "./utils";
import { decayPrice, defaultCostEur, type Listing } from "./p2p-pricing";

/**
 * MÁQUINA DE REVOLUT (modo P2P)
 * ------------------------------------------------------------------
 * A ideia: os sites (Eldorado, Gameflip, Starpets) cobram comissão ao
 * vendedor (~12%). Quem vende lá recebe o líquido; quem compra lá paga o
 * preço de mercado cheio. Vender diretamente a uma pessoa (Discord/FB) e
 * receber por Revolut deixa-te ficar com esse spread inteiro:
 *
 *   mercado 50 € → o site paga-te 44 € líquidos → tu vendes a 47 €
 *   (o comprador poupa 3 €, tu ganhas +3 € face ao site)
 *
 * Capital parado é capital morto: um anúncio decai sozinho de "golden"
 * (dias 1–3) para "venda rápida" (dias 4–6) e finalmente para o preço de
 * custo (dia 7+) — melhor sair a zero do que ficar com stock congelado.
 *
 * A matemática dos preços vive em `p2p-pricing.ts` (sem dependências, com
 * testes) e é reexportada aqui para quem só quer importar de `@/lib/p2p`.
 */
export * from "./p2p-pricing";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export interface P2PState {
  listings: Listing[];
  /** Nº de trocas concluídas com prova (constrói reputação no Discord). */
  vouches: number;
  /** Dinheiro já recebido por Revolut, em €. */
  cashEur: number;
  hydrate: () => void;
  addListing: (input: {
    petId: string;
    variant: Variant;
    qty?: number;
    marketEur: number;
    costEur?: number;
    note?: string;
  }) => Listing | null;
  removeListing: (id: string) => void;
  /** Marca vendido: soma o dinheiro à caixa e conta +1 vouch. */
  markSold: (id: string, eur?: number) => void;
  /** +1 vouch avulso (ex.: venda registada a partir do histórico). */
  addVouch: (amountEur?: number) => number;
  setCash: (eur: number) => void;
  reset: () => void;
}

const KEY = "nexus-p2p-v1";

interface Persisted {
  listings: Listing[];
  vouches: number;
  cashEur: number;
}

export function readP2P(): Persisted {
  const empty: Persisted = { listings: [], vouches: 0, cashEur: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      vouches: typeof parsed.vouches === "number" ? parsed.vouches : 0,
      cashEur: typeof parsed.cashEur === "number" ? parsed.cashEur : 0,
    };
  } catch {
    return empty;
  }
}

function persist(state: Persisted) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        listings: state.listings.slice(0, 80),
        vouches: state.vouches,
        cashEur: state.cashEur,
      }),
    );
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

export const useP2PStore = create<P2PState>((set, get) => ({
  listings: [],
  vouches: 0,
  cashEur: 0,
  hydrate: () => {
    const data = readP2P();
    set({ listings: data.listings, vouches: data.vouches, cashEur: data.cashEur });
  },
  addListing: ({ petId, variant, qty = 1, marketEur, costEur, note }) => {
    if (!getPet(petId) || !(marketEur > 0)) return null;
    const listing: Listing = {
      id: uid(),
      ts: Date.now(),
      petId,
      variant,
      qty: Math.max(1, Math.min(99, Math.round(qty))),
      marketEur: round2(marketEur),
      costEur: round2(costEur ?? defaultCostEur(marketEur)),
      status: "active",
      note,
    };
    const listings = [listing, ...get().listings].slice(0, 80);
    set({ listings });
    persist({ ...get(), listings });
    return listing;
  },
  removeListing: (id) => {
    const listings = get().listings.filter((l) => l.id !== id);
    set({ listings });
    persist({ ...get(), listings });
  },
  markSold: (id, eur) => {
    const current = get();
    const listing = current.listings.find((l) => l.id === id);
    if (!listing || listing.status === "sold") return;
    const total =
      typeof eur === "number" && eur > 0
        ? round2(eur)
        : round2(decayPrice(listing).eur * listing.qty);
    const listings = current.listings.map((l) =>
      l.id === id
        ? { ...l, status: "sold" as const, soldEur: total, soldTs: Date.now() }
        : l,
    );
    const next = {
      listings,
      vouches: current.vouches + 1,
      cashEur: round2(current.cashEur + total),
    };
    set(next);
    persist(next);
  },
  addVouch: (amountEur = 0) => {
    const current = get();
    const next = {
      listings: current.listings,
      vouches: current.vouches + 1,
      cashEur: round2(current.cashEur + Math.max(0, amountEur)),
    };
    set({ vouches: next.vouches, cashEur: next.cashEur });
    persist(next);
    return next.vouches;
  },
  setCash: (eur) => {
    const cashEur = round2(Math.max(0, eur));
    set({ cashEur });
    persist({ ...get(), cashEur });
  },
  reset: () => {
    const empty = { listings: [], vouches: 0, cashEur: 0 };
    set(empty);
    persist(empty);
  },
}));
