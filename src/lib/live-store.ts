import { create } from "zustand";
import { initQuotes, tickQuotes, type LiveQuote } from "./pets/live";

const TICK_MS = 2400;

interface LiveState {
  quotes: LiveQuote[];
  started: boolean;
  start: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  quotes: initQuotes(),
  started: false,
  start: () => {
    set({ started: true });
    window.setInterval(() => {
      set((state) => ({ quotes: tickQuotes(state.quotes) }));
    }, TICK_MS);
  },
}));
