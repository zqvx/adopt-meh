import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Radio,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getPet } from "@/lib/pets/catalog";
import { useLiveStore } from "@/lib/live-store";
import {
  analyzeQuote,
  type QuoteSignal,
  SIGNAL_META,
} from "@/lib/pets/live";
import { formatMoney, formatPct, VARIANT_SHORT } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PetGlyph } from "@/components/trade/PetGlyph";

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

function OpportunityRow({ sig }: { sig: QuoteSignal }) {
  const currency = useTradeStore((s) => s.currency);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const pet = getPet(sig.quote.petId);
  if (!pet) return null;
  const meta = SIGNAL_META[sig.signal];
  const variantLabel = pet.hasVariants
    ? VARIANT_SHORT[sig.quote.variant]
    : pet.category;
  const metric =
    sig.signal === "sell"
      ? { value: sig.overval, prefix: "+" }
      : { value: sig.edge, prefix: sig.edge > 0 ? "+" : "−" };

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 sm:gap-4 sm:px-4",
        sig.signal === "buy" && "bg-accent-dim/40",
        sig.signal === "sell" && "bg-warn-dim/30",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{pet.name}</p>
          <p className="font-mono text-[11px] text-muted uppercase">{variantLabel}</p>
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

      <div className="hidden w-24 shrink-0 text-right md:block">
        <p className="font-mono text-sm tabular-nums text-muted">
          {formatMoney(sig.zones.netSellUsd, currency)}
        </p>
        <p className="font-mono text-[11px] text-faint">
          ref. {formatMoney(sig.fairUsd, currency)}
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
  const items = useMemo(() => {
    return quotes
      .map((q) => analyzeQuote(q, feePct))
      .filter((s): s is QuoteSignal => Boolean(s))
      .slice(0, 14);
  }, [quotes, feePct]);

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
  const [paused, setPaused] = useState(false);

  const signals = useMemo(() => {
    return quotes
      .map((q) => analyzeQuote(q, feePct))
      .filter((s): s is QuoteSignal => Boolean(s))
      .sort((a, b) => b.score - a.score);
  }, [quotes, feePct]);

  const buys = signals.filter((s) => s.signal === "buy");
  const sells = signals.filter((s) => s.signal === "sell");
  const top = signals.slice(0, 9);

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
              Sinais sobre valores de referência comunitários, com taxas de{" "}
              {feePct.toFixed(0)}% já descontadas. Não há cotações oficiais em tempo real.
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
            <Button variant="secondary" size="sm" onClick={() => setPaused((p) => !p)}>
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
          <span className="hidden w-24 text-right md:block">Venda liq. / ref.</span>
          <span className="hidden w-[92px] sm:block">Tendência</span>
          <span className="w-28 text-right sm:w-auto">Sinal</span>
        </div>
        {top.map((sig) => (
          <OpportunityRow key={sig.quote.key} sig={sig} />
        ))}
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
