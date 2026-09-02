import { create } from "zustand";
import { initQuotes, tickQuotes, type LiveQuote, type MarketRange } from "./pets/live";

const TICK_MS = 2400;

interface LiveState {
  quotes: LiveQuote[];
  /** Overrides de preço real vindos do values.json (scraping). */
  overrides: Record<string, number>;
  /** Intervalos low/high de mercado por pet (Eldorado / estimativa). */
  ranges: Record<string, MarketRange>;
  hasRealData: boolean;
  started: boolean;
  start: () => void;
  setOverrides: (
    overrides: Record<string, number>,
    ranges?: Record<string, MarketRange>,
  ) => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  quotes: initQuotes(),
  overrides: {},
  ranges: {},
  hasRealData: false,
  started: false,
  start: () => {
    if (get().started) return;
    set({ started: true });
    window.setInterval(() => {
      set((state) => ({
        quotes: tickQuotes(state.quotes, state.overrides),
      }));
    }, TICK_MS);
  },
  setOverrides: (overrides, ranges = {}) => {
    set({
      overrides,
      ranges,
      hasRealData: Object.keys(overrides).length > 0,
      // Reancora o feed aos preços reais de referência.
      quotes: initQuotes(overrides),
    });
  },
}));
