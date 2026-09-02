import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Plus,
  Radio,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPet } from "@/lib/pets/catalog";
import { useLiveStore } from "@/lib/live-store";
import {
  analyzeQuote,
  type QuoteSignal,
  SIGNAL_META,
} from "@/lib/pets/live";
import { hypeScore, inflationFor, useMarketStore } from "@/lib/market-data";
import { FX, formatMoney, formatPct, VARIANT_SHORT } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PetGlyph } from "@/components/trade/PetGlyph";
import { PetChartModal } from "@/components/trade/PetChartModal";
import type { Pet } from "@/lib/pets/types";
import { EggAlert } from "./EggAlert";
import { SniperCard } from "./Sniper";

function Sparkline({ data, signal }: { data: number[]; signal: "buy" | "hold" | "sell" }) {
  const w = 92;
  const h = 30;
  if (data.length < 2) return <svg width={w} height={h} className="opacity-30" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color =
    signal === "buy"
      ? "var(--color-accent)"
      : signal === "sell"
        ? "var(--color-warn)"
        : "var(--color-fair)";
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={w}
        cy={h - 3 - ((data[data.length - 1] - min) / span) * (h - 6)}
        r="2"
        fill={color}
      />
    </svg>
  );
}

function OpportunityRow({
  sig,
  onChart,
  onSnipe,
}: {
  sig: QuoteSignal;
  onChart: (pet: Pet) => void;
  onSnipe: () => void;
}) {
  const currency = useTradeStore((s) => s.currency);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const marketData = useMarketStore((s) => s.data);
  const hypeData = useMarketStore((s) => s.hype);
  const pet = getPet(sig.quote.petId);
  if (!pet) return null;
  const meta = SIGNAL_META[sig.signal];
  const variantLabel = pet.hasVariants
    ? VARIANT_SHORT[sig.quote.variant]
    : pet.category;
  const hype = hypeScore(sig.quote.petId, hypeData, pet.demand);
  const infl = inflationFor(sig.quote.petId, marketData, pet.values.fr.points);
  const inflTone =
    infl?.inflation === "overhyped"
      ? "loss"
      : infl?.inflation === "undervalued"
        ? "accent"
        : "neutral";
  const metric =
    sig.signal === "sell"
      ? { value: sig.overval, prefix: "+" }
      : { value: sig.edge, prefix: sig.edge > 0 ? "+" : "−" };
  const eur = FX.EUR;
  const profitEur =
    sig.signal === "sell"
      ? (sig.quote.priceUsd - sig.fairUsd) * eur
      : (sig.zones.netSellUsd - sig.quote.priceUsd) * eur;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 sm:gap-4 sm:px-4",
        sig.signal === "buy" && "bg-accent-dim/40",
        sig.signal === "sell" && "bg-warn-dim/30",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChart(pet)}
          title="Ver gráfico de 30 dias"
          className="shrink-0 cursor-pointer"
        >
          <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onChart(pet)}
            className="block truncate text-left text-sm font-medium hover:text-accent"
            title="Ver gráfico de 30 dias"
          >
            {pet.name}
          </button>
          <p className="flex items-center gap-1 font-mono text-[11px] text-muted uppercase">
            {variantLabel}
            <span title="Procura/hype (Discord)" className="text-accent/80">
              · 🔥{Math.round(hype)}
            </span>
            {infl && infl.inflation !== "fair" ? (
              <span
                title={
                  infl.inflation === "overhyped"
                    ? "Preço acima do justo em pontos — provavelmente inflacionado"
                    : "Preço abaixo do justo em pontos — possível oportunidade"
                }
              >
                <Badge tone={inflTone} className="px-1.5 py-0 text-[9px]">
                  {infl.inflation === "overhyped" ? "INFLACIONADO" : "BARATO"}
                </Badge>
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="w-24 shrink-0 text-right sm:w-28">
        <p className="font-mono text-sm tabular-nums">
          {formatMoney(sig.quote.priceUsd, currency)}
        </p>
        <p
          className={cn(
            "flex items-center justify-end font-mono text-[11px] tabular-nums",
            sig.session >= 0 ? "text-accent" : "text-loss",
          )}
        >
          {sig.session >= 0 ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {formatPct(sig.session)}
        </p>
      </div>

      <div className="w-20 shrink-0 text-right sm:w-24">
        <p
          className={cn(
            "font-mono text-sm font-bold tabular-nums",
            profitEur > 0 ? "text-accent" : "text-loss",
          )}
          title={
            sig.signal === "sell"
              ? "Sobre o valor justo — o que cobras a mais, em €"
              : "Lucro líquido por pet depois das taxas, em €"
          }
        >
          {profitEur >= 0 ? "+" : "−"}€{Math.abs(profitEur).toFixed(2)}
        </p>
        <p className="hidden font-mono text-[11px] text-faint md:block">
          liq. {formatMoney(sig.zones.netSellUsd, currency)}
        </p>
      </div>

      <div className="hidden sm:block">
        <Sparkline data={sig.quote.history} signal={sig.signal} />
      </div>

      <div className="flex w-28 shrink-0 items-center justify-end gap-2 sm:w-auto">
        <Badge tone={meta.tone} className="hidden md:inline-flex">
          {meta.label}
        </Badge>
        <div className="text-right">
          <p
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              sig.signal === "buy"
                ? "text-accent"
                : sig.signal === "sell"
                  ? "text-warn"
                  : "text-fair",
            )}
          >
            {metric.prefix}
            {Math.abs(metric.value * 100).toFixed(1)}%
          </p>
          <p className="hidden font-mono text-[10px] text-faint sm:block">
            {sig.signal === "sell" ? "sobre val." : "ROI liq."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          title="Armar alarme de preço (sniper)"
          onClick={onSnipe}
        >
          <Bell className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          title="Adicionar à compra (lado dele na troca)"
          onClick={() => {
            addLine("them", pet.id, sig.quote.variant);
            setTab("trade");
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Ticker({ quotes }: { quotes: ReturnType<typeof useLiveStore.getState>["quotes"] }) {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const overrides = useLiveStore((s) => s.overrides);
  const ranges = useLiveStore((s) => s.ranges);
  const items = useMemo(() => {
    return quotes
      .map((q) => analyzeQuote(q, feePct, overrides, ranges))
      .filter((s): s is QuoteSignal => Boolean(s))
      .slice(0, 14);
  }, [quotes, feePct, overrides, ranges]);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-sunken">
      <div className="ticker-track flex w-max gap-8 px-4 py-2">
        {[...items, ...items].map((sig, i) => {
          const pet = getPet(sig.quote.petId);
          if (!pet) return null;
          return (
            <span
              key={`${sig.quote.key}-${i}`}
              className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] whitespace-nowrap"
            >
              <span className="text-muted">{pet.name}</span>
              <span className="tabular-nums">{formatMoney(sig.quote.priceUsd, currency)}</span>
              <span
                className={cn(
                  "tabular-nums",
                  sig.session >= 0 ? "text-accent" : "text-loss",
                )}
              >
                {formatPct(sig.session)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function LiveBoard() {
  const feePct = useTradeStore((s) => s.feePct);
  const quotes = useLiveStore((s) => s.quotes);
  const overrides = useLiveStore((s) => s.overrides);
  const ranges = useLiveStore((s) => s.ranges);
  const hasRealData = useLiveStore((s) => s.hasRealData);
  const marketMeta = useMarketStore((s) => s.data?.meta) as
    | { live?: boolean; errors?: string[]; scrapedAt?: string }
    | undefined;
  const priceState: "live" | "cache" | "base" = (() => {
    if (!marketMeta) return "base";
    const t = marketMeta.scrapedAt ? Date.parse(marketMeta.scrapedAt) : NaN;
    const fresh =
      Number.isFinite(t) && Date.now() - t < 12 * 60 * 60 * 1000;
    if (fresh && marketMeta.live !== false) return "live";
    return "cache";
  })();
  const [paused, setPaused] = useState(false);
  const [frozen, setFrozen] = useState<QuoteSignal[] | null>(null);
  const [chart, setChart] = useState<QuoteSignal | null>(null);
  const [snipe, setSnipe] = useState<{ petId: string; variant: import("@/lib/pets/types").Variant } | null>(null);
  const snipeRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (scrollTimer.current !== null) window.clearTimeout(scrollTimer.current);
    },
    [],
  );

  function armSniper(sig: QuoteSignal) {
    setSnipe({ petId: sig.quote.petId, variant: sig.quote.variant });
    if (scrollTimer.current !== null) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      scrollTimer.current = null;
      snipeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  const signals = useMemo(() => {
    return quotes
      .map((q) => analyzeQuote(q, feePct, overrides, ranges))
      .filter((s): s is QuoteSignal => Boolean(s))
      .sort((a, b) => b.score - a.score);
  }, [quotes, feePct, overrides, ranges]);

  function togglePause() {
    setPaused((wasPaused) => {
      setFrozen(wasPaused ? null : signals);
      return !wasPaused;
    });
  }

  const shown = frozen ?? signals;
  const buys = shown.filter((s) => s.signal === "buy");
  const sells = shown.filter((s) => s.signal === "sell");
  const top = shown.slice(0, 9);

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
              Feed de mercado · simulação em tempo real
            </p>
            <h2 className="text-lg font-medium tracking-tight">
              Quando comprar e vender
            </h2>
            <p className="text-sm text-muted">
              {hasRealData
                ? "Preços de referência extraídos por scraping de sites de valores reais (BloxUltra/Eldorado), com volatilidade simulada e taxas de "
                : "Sinais sobre valores de referência comunitários, com taxas de "}
              {feePct.toFixed(0)}% já descontadas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px]",
                paused ? "bg-surface-2 text-muted" : "bg-accent-dim text-accent",
              )}
            >
              <Radio className={cn("size-3", !paused && "animate-pulse")} />
              {paused ? "PAUSADO" : "AO VIVO"}
            </span>
            <Button variant="secondary" size="sm" onClick={togglePause}>
              <Activity className="size-3.5" />
              {paused ? "Retomar" : "Pausar"}
            </Button>
          </div>
        </header>

        <div className="mt-3">
          {paused ? (
            <div className="rounded-lg border border-line bg-bg-sunken px-4 py-2 text-center font-mono text-[11px] text-muted">
              Feed pausado — as cotações deixam de atualizar.
            </div>
          ) : (
            <Ticker quotes={quotes} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
        <p className="flex items-center gap-2 font-mono text-[11px] text-muted">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5",
              priceState === "live"
                ? "bg-accent-dim text-accent"
                : "bg-surface-2 text-faint",
            )}
          >
            <Radio className={cn("size-3", priceState === "live" && "animate-pulse")} />
            {priceState === "live"
              ? "PREÇOS ATUALIZADOS"
              : priceState === "cache"
                ? "PREÇOS ANTIGOS"
                : "VALORES BASE"}
          </span>
          {priceState === "live"
            ? "Scraping automático das fontes OK"
            : priceState === "cache"
              ? "Fontes indisponíveis na última recolha — valores guardados"
              : "A correr nos valores incluídos"}
        </p>
        <p className="font-mono text-[10px] text-faint">
          {marketMeta?.scrapedAt
            ? `atualizado ${new Date(marketMeta.scrapedAt).toLocaleString("pt-PT", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </p>
      </div>

      <EggAlert />

      <div className="grid gap-2 font-mono text-[11px] sm:grid-cols-3">
        <div className="rounded-lg bg-accent-dim px-3 py-2">
          <span className="text-accent">{buys.length}</span>
          <span className="ml-1.5 text-muted">
            {buys.length === 1 ? "zona de compra" : "zonas de compra"} · ROI ≥ +7%
          </span>
        </div>
        <div className="rounded-lg bg-warn-dim px-3 py-2">
          <span className="text-warn">{sells.length}</span>
          <span className="ml-1.5 text-muted">
            {sells.length === 1 ? "zona de venda" : "zonas de venda"} · sobrevalorizados
          </span>
        </div>
        <div className="rounded-lg bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
          <span className="text-faint">
            Verde = comprar abaixo do teto · Amarelo = vender acima do chão
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <div className="hidden items-center gap-4 border-b border-line px-4 py-2 font-mono text-[10px] tracking-wide text-faint uppercase sm:flex">
          <span className="flex-1">Ativo</span>
          <span className="w-28 text-right">Preço atual</span>
          <span className="w-20 text-right sm:w-24">Lucro € / venda liq.</span>
          <span className="hidden w-[92px] sm:block">Tendência</span>
          <span className="w-28 text-right sm:w-auto">Sinal</span>
        </div>
        {top.map((sig) => (
          <OpportunityRow
            key={sig.quote.key}
            sig={sig}
            onChart={() => setChart(sig)}
            onSnipe={() => armSniper(sig)}
          />
        ))}
      </div>

      {chart ? (
        <PetChartModal
          petId={chart.quote.petId}
          variant={chart.quote.variant}
          fairUsd={chart.fairUsd}
          nowUsd={chart.quote.priceUsd}
          onClose={() => setChart(null)}
        />
      ) : null}

      <div ref={snipeRef} className="scroll-mt-24">
        <SniperCard quickPet={snipe} />
      </div>

      <p className="text-[11px] text-faint">
        Simulação para treino de decisão (não são cotações reais da Uplift Games nem
        de marketplaces). Regras: só compres com sinal verde e liquidez alta; vende
        quando o sinal amarelo aparecer. Para acompanhar as tuas posições reais, abre o
        separador <strong>Investir</strong>.
      </p>
    </section>
  );
}
