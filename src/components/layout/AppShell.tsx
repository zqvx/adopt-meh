import {
  Calculator,
  History,
  Scale,
  Table2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FX } from "@/lib/format";
import type { Currency } from "@/lib/pets/types";
import { readHistory, readPrefs, useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TradeBoard } from "@/components/trade/TradeBoard";
import { Arbitrage } from "@/components/panels/Arbitrage";
import { HistoryPanel } from "@/components/panels/HistoryPanel";
import { TierTable } from "@/components/panels/TierTable";

const TABS = [
  { id: "trade", label: "Troca", icon: Scale },
  { id: "table", label: "Tabela", icon: Table2 },
  { id: "arb", label: "Margem", icon: Calculator },
  { id: "history", label: "Histórico", icon: History },
] as const;

const CURRENCIES: Currency[] = ["USD", "BRL", "EUR"];

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className="hidden w-16 font-mono text-xs text-muted tabular-nums sm:block">
      {now
        ? now.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "--:--:--"}
    </time>
  );
}

export function AppShell() {
  const tab = useTradeStore((s) => s.tab);
  const setTab = useTradeStore((s) => s.setTab);
  const currency = useTradeStore((s) => s.currency);
  const setCurrency = useTradeStore((s) => s.setCurrency);
  const loadExample = useTradeStore((s) => s.loadExample);
  const clear = useTradeStore((s) => s.clear);
  const hydrateHistory = useTradeStore((s) => s.hydrateHistory);
  const setFeePct = useTradeStore((s) => s.setFeePct);

  useEffect(() => {
    const prefs = readPrefs();
    if (prefs?.currency) setCurrency(prefs.currency);
    if (typeof prefs?.feePct === "number") setFeePct(prefs.feePct);
    hydrateHistory(readHistory());
    const snapshot = useTradeStore.getState();
    if (snapshot.you.length === 0 && snapshot.them.length === 0) {
      loadExample();
    }
  }, [hydrateHistory, loadExample, setCurrency, setFeePct]);

  return (
    <div className="bg-grid min-h-dvh overflow-x-hidden pb-24 lg:pb-8">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-sm bg-surface-2 shadow-[var(--shadow-border)]">
              <span className="font-mono text-sm font-semibold text-accent">N</span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">NEXUS</p>
              <p className="truncate text-[11px] text-muted">
                Terminal de liquidez · Adopt Me
              </p>
            </div>
          </div>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]"
                      : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Clock />
            <div className="flex rounded-md bg-surface-2 p-0.5 shadow-[var(--shadow-border)]">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "h-8 rounded-sm px-2.5 font-mono text-[11px]",
                    currency === c ? "bg-fg text-bg" : "text-muted hover:text-fg",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 font-mono text-[11px] text-faint">
            Câmbio ref. · 1 USD = {FX.BRL.toFixed(2)} BRL · {FX.EUR.toFixed(2)} EUR
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadExample}>
              Carregar exemplo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clear("all")}>
              Limpar mesa
            </Button>
          </div>
        </div>

        {tab === "trade" ? <TradeBoard /> : null}
        {tab === "table" ? <TierTable /> : null}
        {tab === "arb" ? <Arbitrage /> : null}
        {tab === "history" ? <HistoryPanel /> : null}

        <p className="pb-2 text-center text-[11px] text-faint">
          Valores independentes, para decisão rápida. Confirma sempre a procura
          atual antes de aceitar.
        </p>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-line bg-bg/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex h-12 w-full flex-col items-center justify-center gap-0.5 text-[11px]",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
