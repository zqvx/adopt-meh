import { CircleDollarSign, Plus, Search, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPet, searchPets, variantsFor } from "@/lib/pets/catalog";
import { useLiveStore } from "@/lib/live-store";
import {
  analyzeQuote,
  livePriceUsd,
  SIGNAL_META,
  type QuoteSignal,
  type Signal,
} from "@/lib/pets/live";
import { RIDE_POTION_USD } from "@/lib/pets/engine";
import { CURRENCY_PREFIX, FX, formatMoney, formatPct, VARIANT_SHORT } from "@/lib/format";
import type { Currency, Pet, Variant } from "@/lib/pets/types";
import { useTradeStore, type Position } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetGlyph } from "@/components/trade/PetGlyph";
import { SourcesCard } from "./SourcesCard";
import { NetWorthChart } from "./NetWorthChart";
import { BubbleRiskCard } from "./BubbleRiskCard";

type CostUnit = Currency | "RP";

function toUnits(usd: number, unit: CostUnit) {
  if (unit === "RP") return usd / RIDE_POTION_USD;
  return usd * FX[unit];
}

function RecommendCard({ sig }: { sig: QuoteSignal }) {
  const currency = useTradeStore((s) => s.currency);
  const addPosition = useTradeStore((s) => s.addPosition);
  const pet = getPet(sig.quote.petId);
  if (!pet) return null;
  const meta = SIGNAL_META[sig.signal];
  const isBuy = sig.signal === "buy";

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-bg-sunken p-3",
        isBuy && "border-accent/40",
        sig.signal === "sell" && "border-warn/40",
      )}
    >
      <div className="flex items-center gap-2.5">
        <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {pet.name}
            <span className="ml-1.5 font-mono text-[11px] text-muted">
              {pet.hasVariants ? VARIANT_SHORT[sig.quote.variant] : pet.category}
            </span>
          </p>
          <p className="font-mono text-[11px] text-muted">
            agora {formatMoney(sig.quote.priceUsd, currency)} · ref.{" "}
            {formatMoney(sig.fairUsd, currency)}
          </p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="rounded bg-surface-2 px-2 py-1.5">
          <p className="text-faint">Compra abaixo de</p>
          <p className="text-accent tabular-nums">{formatMoney(sig.zones.buyBelowUsd, currency)}</p>
        </div>
        <div className="rounded bg-surface-2 px-2 py-1.5">
          <p className="text-faint">Vende acima de</p>
          <p className="text-warn tabular-nums">{formatMoney(sig.zones.sellAboveUsd, currency)}</p>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        {isBuy
          ? `Margem líquida estimada de ${formatPct(sig.edge)} depois da taxa — boa entrada.`
          : sig.signal === "sell"
            ? `Mercado a pagar ${formatPct(sig.overval)} acima da referência — boa saída.`
            : "Preço perto do justo: não entrares agora nem vendas à pressa."}
      </p>

      {isBuy ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-2.5 w-full"
          onClick={() =>
            addPosition({
              petId: pet.id,
              variant: sig.quote.variant,
              qty: 1,
              costUsd: sig.quote.priceUsd,
            })
          }
        >
          <Plus className="size-3.5" />
          Registar compra a este preço
        </Button>
      ) : null}
    </div>
  );
}

interface PositionView extends Position {
  pet: Pet;
  priceUsd: number;
  live: boolean;
  netUsd: number;
  pnlUsd: number;
  pnlPct: number;
  action: Signal;
}

function PositionRow({ pos }: { pos: PositionView }) {
  const currency = useTradeStore((s) => s.currency);
  const removePosition = useTradeStore((s) => s.removePosition);
  const variantLabel = pos.pet.hasVariants ? VARIANT_SHORT[pos.variant] : pos.pet.category;
  const meta = SIGNAL_META[pos.action];
  const profit = pos.pnlUsd >= 0;

  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0 sm:px-4">
      <PetGlyph id={pos.pet.id} glyph={pos.pet.glyph} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {pos.pet.name}
          <span className="ml-1.5 font-mono text-[11px] text-muted">
            {pos.qty > 1 ? `${pos.qty}× ` : ""}
            {variantLabel}
          </span>
        </p>
        <p className="font-mono text-[11px] text-muted">
          custo {formatMoney(pos.costUsd, currency)} → vale {formatMoney(pos.netUsd, currency)} líq.
          {!pos.live ? " (ref.)" : ""}
        </p>
      </div>
      <div className="w-24 shrink-0 text-right">
        <p
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            profit ? "text-accent" : "text-loss",
          )}
        >
          {profit ? "+" : "−"}
          {formatMoney(Math.abs(pos.pnlUsd), currency)}
        </p>
        <p
          className={cn("font-mono text-[11px] tabular-nums", profit ? "text-accent" : "text-loss")}
        >
          {profit ? "+" : "−"}
          {Math.abs(pos.pnlPct * 100).toFixed(1)}%
        </p>
      </div>
      <Badge tone={meta.tone} className="hidden sm:inline-flex">
        {pos.action === "sell" ? "VENDER" : pos.action === "buy" ? "COMPRAR +" : "MANTER"}
      </Badge>
      <button
        type="button"
        onClick={() => removePosition(pos.id)}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-faint hover:text-loss"
        aria-label={`Remover ${pos.pet.name}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function AddPositionForm() {
  const feePct = useTradeStore((s) => s.feePct);
  const addPosition = useTradeStore((s) => s.addPosition);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Pet | null>(null);
  const [variant, setVariant] = useState<Variant>("fr");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [unit, setUnit] = useState<CostUnit>("EUR");
  const rootRef = useRef<HTMLDivElement>(null);

  // Fecha a lista de sugestões ao clicar fora. Sem isto, a lista ficava aberta
  // por cima do resto do painel até se escolher um pet.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const matches = useMemo(() => searchPets(query, 6), [query]);
  const qtyNum = Math.max(1, Math.min(99, Math.round(Number(qty) || 1)));
  const costNum = Number.parseFloat(cost.replace(",", ".")) || 0;
  const unitUsd = unit === "RP" ? RIDE_POTION_USD : 1 / FX[unit];
  const costUsd = costNum * unitUsd;

  function choose(pet: Pet) {
    setPicked(pet);
    setVariant(pet.hasVariants ? "fr" : "regular");
    setOpen(false);
    if (!cost) {
      const { price } = livePriceUsd(
        useLiveStore.getState().quotes,
        pet.id,
        pet.hasVariants ? "fr" : "regular",
        useLiveStore.getState().overrides,
      );
      setCost(toUnits(price, unit).toFixed(2));
    }
  }

  /**
   * Troca a unidade do custo convertendo o valor já escrito — sem isto,
   * mudar de € para $ reinterpretava o número silenciosamente (10 € → "10 $").
   */
  function changeUnit(next: CostUnit) {
    if (next === unit) return;
    if (cost.trim() !== "" && costNum > 0) {
      const usd = costNum * unitUsd;
      const nextRate = next === "RP" ? RIDE_POTION_USD : 1 / FX[next];
      setCost((usd * nextRate).toFixed(2));
    }
    setUnit(next);
  }

  function submit() {
    if (!picked || costNum <= 0) return;
    addPosition({ petId: picked.id, variant, qty: qtyNum, costUsd });
    setPicked(null);
    setQuery("");
    setCost("");
    setQty("1");
  }

  return (
    <div ref={rootRef} className="rounded-lg bg-bg-sunken p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
        <CircleDollarSign className="size-3.5" />
        Registar compra (a tua carteira)
      </p>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input
          className="pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Pet que compraste…"
        />
        {open && query && matches.length > 0 ? (
          <ul className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-md bg-surface-2 shadow-[var(--shadow-border)]">
            {matches.map((pet) => (
              <li key={pet.id}>
                <button
                  type="button"
                  onClick={() => choose(pet)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-3"
                >
                  <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                  <span className="truncate">{pet.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {picked ? (
        <div className="mt-3 flex flex-col gap-2">
          {picked.hasVariants ? (
            <div className="flex flex-wrap gap-1">
              {variantsFor(picked).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={variant === v}
                  className={cn(
                    "h-8 rounded-full px-2.5 font-mono text-[11px]",
                    variant === v ? "bg-fg text-bg" : "bg-surface-2 text-muted",
                  )}
                >
                  {VARIANT_SHORT[v]}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <label className="text-[11px] text-muted">
              Qtd
              <Input
                className="mt-1 font-mono"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </label>
            <label className="text-[11px] text-muted">
              Preço total pago
              <div className="mt-1 flex gap-1">
                <Input
                  className="font-mono"
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0,00"
                />
                <div className="flex shrink-0 rounded-md bg-surface-2">
                  {(["EUR", "USD", "BRL", "RP"] as CostUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => changeUnit(u)}
                      aria-pressed={unit === u}
                      className={cn(
                        "h-11 w-11 rounded-md font-mono text-[11px]",
                        unit === u ? "bg-fg text-bg" : "text-muted hover:text-fg",
                      )}
                    >
                      {u === "RP" ? "RP" : CURRENCY_PREFIX[u]}
                    </button>
                  ))}
                </div>
              </div>
            </label>
          </div>

          <Button size="sm" onClick={submit} disabled={costNum <= 0}>
            <Plus className="size-3.5" />
            Adicionar à carteira
          </Button>
          <p className="text-[10px] text-faint">
            Custo em USD: ${costUsd.toFixed(2)} · valor de venda líquido calculado com taxa de{" "}
            {feePct}%
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function InvestPanel() {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const positions = useTradeStore((s) => s.positions);
  const quotes = useLiveStore((s) => s.quotes);
  const overrides = useLiveStore((s) => s.overrides);

  const signals = useMemo(
    () =>
      quotes
        .map((q) => analyzeQuote(q, feePct, overrides))
        .filter((s): s is QuoteSignal => Boolean(s))
        .sort((a, b) => b.score - a.score),
    [quotes, feePct, overrides],
  );

  const buys = signals.filter((s) => s.signal === "buy").slice(0, 4);
  const sells = signals.filter((s) => s.signal === "sell").slice(0, 4);

  const holdings = useMemo<PositionView[]>(() => {
    return positions
      .map((pos) => {
        const pet = getPet(pos.petId);
        if (!pet) return null;
        const variant: Variant = pet.hasVariants ? pos.variant : "regular";
        const { price, live } = livePriceUsd(quotes, pos.petId, variant, overrides);
        const gross = price * pos.qty;
        const net = gross * (1 - feePct / 100);
        const pnlUsd = net - pos.costUsd;
        const pnlPct = pos.costUsd > 0 ? pnlUsd / pos.costUsd : 0;
        const sig = analyzeQuote(
          quotes.find((q) => q.petId === pos.petId && q.variant === variant) ?? {
            key: `${pos.petId}-${variant}`,
            petId: pos.petId,
            variant,
            bias: 0,
            priceUsd: price,
            history: [price],
          },
          feePct,
          overrides,
        );
        let action: Signal = sig?.signal ?? "hold";
        if (action !== "sell" && pnlPct >= 0.12) action = "sell";
        return { ...pos, pet, priceUsd: price, live, netUsd: net, pnlUsd, pnlPct, action };
      })
      .filter((p): p is PositionView => Boolean(p))
      .sort((a, b) => b.pnlPct - a.pnlPct);
  }, [positions, quotes, feePct, overrides]);

  const totalCost = holdings.reduce((acc, p) => acc + p.costUsd, 0);
  const totalNet = holdings.reduce((acc, p) => acc + p.netUsd, 0);
  const totalPnl = totalNet - totalCost;
  const totalPnlPct = totalCost > 0 ? totalPnl / totalCost : 0;
  const toSell = holdings.filter((p) => p.action === "sell").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          Carteira de investimento
        </p>
        <h2 className="text-lg font-medium tracking-tight">Comprar na baixa, vender na alta</h2>
        <p className="text-sm text-muted">
          Regista o que compraste; o terminal avalia em tempo real e diz-te quando vender. Valores
          sobre referências comunitárias (não há preços oficiais).
        </p>

        {holdings.length > 0 ? (
          <div className="mt-3 grid gap-2 font-mono sm:grid-cols-3">
            <div className="rounded-lg bg-bg-sunken px-3 py-2">
              <p className="text-[11px] text-faint">Investido</p>
              <p className="tabular-nums">{formatMoney(totalCost, currency)}</p>
            </div>
            <div
              className={cn(
                "rounded-lg px-3 py-2",
                totalPnl >= 0 ? "bg-accent-dim" : "bg-loss-dim",
              )}
            >
              <p className="text-[11px] text-faint">Lucro líquido (após taxa)</p>
              <p className={cn("tabular-nums", totalPnl >= 0 ? "text-accent" : "text-loss")}>
                {totalPnl >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(totalPnl), currency)} · {totalPnl >= 0 ? "+" : "−"}
                {Math.abs(totalPnlPct * 100).toFixed(1)}%
              </p>
            </div>
            <div
              className={cn("rounded-lg px-3 py-2", toSell > 0 ? "bg-warn-dim" : "bg-bg-sunken")}
            >
              <p className="text-[11px] text-faint">Posições para vender</p>
              <p className={cn("tabular-nums", toSell > 0 && "text-warn")}>
                {toSell} {toSell === 1 ? "posição" : "posições"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <NetWorthChart />

      <BubbleRiskCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <TrendingDown className="size-4 text-accent" />
              Zonas de compra
              <span className="font-mono text-[11px] text-faint">(preço abaixo do teto)</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {buys.map((sig) => (
                <RecommendCard key={`b-${sig.quote.key}`} sig={sig} />
              ))}
              {buys.length === 0 ? (
                <p className="rounded-lg bg-bg-sunken px-3 py-4 text-xs text-muted">
                  Sem oportunidades de compra neste momento — espera que o mercado arrefeça.
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="size-4 text-warn" />
              Zonas de venda
              <span className="font-mono text-[11px] text-faint">(preço acima do chão)</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sells.map((sig) => (
                <RecommendCard key={`s-${sig.quote.key}`} sig={sig} />
              ))}
              {sells.length === 0 ? (
                <p className="rounded-lg bg-bg-sunken px-3 py-4 text-xs text-muted">
                  Nada sobrevalorizado agora — se tens posição, aguenta.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <AddPositionForm />

          <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            <p className="border-b border-line px-4 py-2 font-mono text-[10px] tracking-wide text-faint uppercase">
              A minha carteira
            </p>
            {holdings.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Ainda não registaste compras. Usa o formulário acima ou o botão “Registar compra”
                nas zonas de compra.
              </p>
            ) : (
              holdings.map((pos) => <PositionRow key={pos.id} pos={pos} />)
            )}
          </div>
        </div>
      </div>

      <SourcesCard />

      <p className="text-[11px] text-faint">
        Os sinais usam valores de referência comunitários e um feed simulado — não existe cotação
        oficial em tempo real do Adopt Me. Confirma a procura atual antes de fechar negócio e
        lembra-te: cross-trading por dinheiro real viola os Termos do Roblox.
      </p>
    </section>
  );
}
