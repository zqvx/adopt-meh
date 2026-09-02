import {
  Backpack,
  Calculator,
  Coffee,
  Euro,
  FlaskConical,
  History,
  Radio,
  Scale,
  Table2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FX } from "@/lib/format";
import { useLiveStore } from "@/lib/live-store";
import {
  marketOverrides,
  marketRanges,
  resolveMarketUsd,
  useMarketStore,
} from "@/lib/market-data";
import { recordNetWorth } from "@/lib/net-worth";
import { getPet } from "@/lib/pets/catalog";
import type { Currency } from "@/lib/pets/types";
import { readHistory, readInventory, readPositions, readPrefs, useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TradeBoard } from "@/components/trade/TradeBoard";
import { Arbitrage } from "@/components/panels/Arbitrage";
import { ArbMatrix } from "@/components/panels/ArbMatrix";
import { HistoryPanel } from "@/components/panels/HistoryPanel";
import { TierTable } from "@/components/panels/TierTable";
import { LiveBoard } from "@/components/panels/LiveBoard";
import { SniperWatcher } from "@/components/panels/Sniper";
import { InvestPanel } from "@/components/panels/InvestPanel";
import { CraftPanel } from "@/components/panels/CraftPanel";
import { InventoryPanel } from "@/components/panels/InventoryPanel";
import { MorningBriefing } from "@/components/panels/MorningBriefing";
import { P2PCentral } from "@/components/panels/P2PCentral";
import { StockSniper } from "@/components/panels/StockSniper";

const TABS = [
  { id: "mission", label: "Missão do Dia", short: "Missão", icon: Coffee },
  { id: "p2p", label: "Central P2P", short: "P2P", icon: Euro },
  { id: "live", label: "Ao Vivo", short: "Ao Vivo", icon: Radio },
  { id: "invest", label: "Investir", short: "Investir", icon: TrendingUp },
  { id: "craft", label: "Criação", short: "Criar", icon: FlaskConical },
  { id: "trade", label: "Troca", short: "Troca", icon: Scale },
  { id: "inventory", label: "Inventário", short: "Inventário", icon: Backpack },
  { id: "table", label: "Tabela", short: "Tabela", icon: Table2 },
  { id: "arb", label: "Margem", short: "Margem", icon: Calculator },
  { id: "history", label: "Histórico", short: "Hist.", icon: History },
] as const;

const CURRENCIES: Currency[] = ["EUR", "USD", "BRL"];

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
  const hydratePositions = useTradeStore((s) => s.hydratePositions);
  const hydrateInventory = useTradeStore((s) => s.hydrateInventory);
  const setFeePct = useTradeStore((s) => s.setFeePct);
  const liveStarted = useLiveStore((s) => s.started);
  const startLive = useLiveStore((s) => s.start);
  const loadMarket = useMarketStore((s) => s.load);
  const marketData = useMarketStore((s) => s.data);
  const marketStatus = useMarketStore((s) => s.status);
  const setOverrides = useLiveStore((s) => s.setOverrides);

  const inventory = useTradeStore((s) => s.inventory);

  // Regista o património do dia com preços de mercado (não catálogo).
  useEffect(() => {
    const totalUsd = inventory.reduce((sum, it) => {
      const pet = getPet(it.petId);
      const variant = pet?.hasVariants ? it.variant : "regular";
      const { usd } = resolveMarketUsd(it.petId, variant, marketData);
      return sum + usd * it.qty;
    }, 0);
    if (totalUsd > 0) recordNetWorth(totalUsd);
  }, [inventory, marketData]);

  useEffect(() => {
    loadMarket();
    // Reconsulta o values.json a cada 30 min (o scraper pode atualizá-lo).
    const id = window.setInterval(loadMarket, 30 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadMarket]);

  useEffect(() => {
    if (marketData) {
      setOverrides(marketOverrides(marketData), marketRanges(marketData));
    }
  }, [marketData, setOverrides]);

  useEffect(() => {
    const prefs = readPrefs();
    if (prefs?.currency) setCurrency(prefs.currency);
    if (typeof prefs?.feePct === "number") setFeePct(prefs.feePct);
    hydrateHistory(readHistory());
    hydratePositions(readPositions());
    hydrateInventory(readInventory());
    const snapshot = useTradeStore.getState();
    if (snapshot.you.length === 0 && snapshot.them.length === 0) {
      loadExample();
    }
  }, [hydrateHistory, hydratePositions, hydrateInventory, loadExample, setCurrency, setFeePct]);

  useEffect(() => {
    if (!liveStarted) startLive();
  }, [liveStarted, startLive]);

  // Barra inferior móvel: traz o separador ativo para a vista (a barra é
  // scrollable porque agora tem TODOS os separadores).
  const mobileBarRef = useRef<HTMLUListElement>(null);
  const mobileTabRefs = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    const bar = mobileBarRef.current;
    const btn = mobileTabRefs.current.get(tab);
    if (!bar || !btn) return;
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.left < barRect.left || btnRect.right > barRect.right) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [tab]);

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
              <p className="truncate text-[11px] text-muted">Terminal de trading · Adopt Me · UE</p>
            </div>
          </div>

          <nav
            aria-label="Áreas da app"
            className="ml-4 hidden min-w-0 items-center gap-1 overflow-x-auto lg:flex"
          >
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? "page" : undefined}
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
            <div
              role="group"
              aria-label="Moeda"
              className="flex rounded-md bg-surface-2 p-0.5 shadow-[var(--shadow-border)]"
            >
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  aria-pressed={currency === c}
                  className={cn(
                    "h-8 rounded-sm px-2.5 font-mono text-[11px] transition-colors duration-150",
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
            Mercado UE · câmbio ref. 1 € = {(1 / FX.EUR).toFixed(2)} USD · R$
            {(FX.BRL / FX.EUR).toFixed(2)} · taxas 8–12%
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] sm:flex",
                marketStatus === "ok" ? "bg-accent-dim text-accent" : "bg-surface-2 text-muted",
              )}
              title="Fonte dos valores em dinheiro (scraping de sites de referência)"
            >
              <Radio className={cn("size-3", marketStatus === "ok" && "animate-pulse")} />
              {marketStatus === "ok"
                ? `Valores reais · ${
                    marketData?.meta?.scrapedAt
                      ? new Date(marketData.meta.scrapedAt).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      : "—"
                  }`
                : "Valores de referência"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                loadExample();
                setTab("trade");
              }}
            >
              Carregar exemplo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clear("all")}>
              Limpar mesa
            </Button>
          </div>
        </div>

        {tab === "mission" ? <MorningBriefing /> : null}
        {tab === "p2p" ? <P2PCentral /> : null}
        {tab === "live" ? <LiveBoard /> : null}
        {tab === "invest" ? <InvestPanel /> : null}
        {tab === "craft" ? <CraftPanel /> : null}
        {tab === "trade" ? <TradeBoard /> : null}
        {tab === "inventory" ? <InventoryPanel /> : null}
        {tab === "table" ? <TierTable /> : null}
        {tab === "arb" ? (
          <div className="flex flex-col gap-4">
            <ArbMatrix />
            <StockSniper />
            <Arbitrage />
          </div>
        ) : null}
        {tab === "history" ? <HistoryPanel /> : null}

        <SniperWatcher />

        <p className="pb-2 text-center text-[11px] text-faint">
          Valores independentes, para decisão rápida. Confirma sempre a procura atual antes de
          aceitar.
        </p>
      </main>

      <nav
        aria-label="Áreas da app"
        className="no-scrollbar fixed right-0 bottom-0 left-0 z-40 border-t border-line bg-bg/97 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
      >
        <ul
          ref={mobileBarRef}
          className="no-scrollbar mx-auto flex w-max min-w-full items-stretch gap-0.5 overflow-x-auto"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  ref={(el) => {
                    if (el) mobileTabRefs.current.set(item.id, el);
                    else mobileTabRefs.current.delete(item.id);
                  }}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 w-16 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] transition-colors duration-150",
                    active ? "bg-accent-dim text-accent" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-4" />
                  {item.short}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
