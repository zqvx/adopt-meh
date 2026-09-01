import { Landmark, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { PETS, searchPets, variantsFor } from "@/lib/pets/catalog";
import { FEE_PRESETS, RIDE_POTION_USD } from "@/lib/pets/engine";
import {
  CURRENCY_PREFIX,
  FX,
  formatMoney,
  formatPoints,
  VARIANT_SHORT,
} from "@/lib/format";
import type { Currency, Pet, Variant } from "@/lib/pets/types";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PetGlyph } from "@/components/trade/PetGlyph";

type CostUnit = Currency | "RP";

const UNIT_PREFIX: Record<CostUnit, string> = {
  ...CURRENCY_PREFIX,
  RP: "",
};

function toUsd(amount: number, unit: CostUnit) {
  if (unit === "RP") return amount * RIDE_POTION_USD;
  return amount / FX[unit];
}

export function Arbitrage() {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const setFeePct = useTradeStore((s) => s.setFeePct);
  const [query, setQuery] = useState("Shadow Dragon");
  const [picked, setPicked] = useState<Pet>(
    () => PETS.find((p) => p.id === "shadow-dragon") ?? PETS[0],
  );
  const [variant, setVariant] = useState<Variant>("fr");
  const [cost, setCost] = useState("170");
  const [costUnit, setCostUnit] = useState<CostUnit>("EUR");

  const matches = useMemo(() => searchPets(query, 6), [query]);
  const value = picked.values[picked.hasVariants ? variant : "regular"];
  const costNum = Number.parseFloat(cost.replace(",", ".")) || 0;
  const costUsd = toUsd(costNum, costUnit);
  const fee = feePct / 100;
  const gross = value.usd;
  const net = gross * (1 - fee);
  const feeUsd = gross * fee;
  const grossMargin = gross - costUsd;
  const netMargin = net - costUsd;
  const roi = costUsd > 0 ? netMargin / costUsd : 0;
  const healthy = netMargin > 0;

  return (
    <section className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="mb-4">
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          Margem líquida
        </p>
        <h2 className="text-lg font-medium tracking-tight">Calculadora de arbitragem</h2>
        <p className="text-sm text-muted">
          Insere o preço de compra. Descontamos a taxa do marketplace e mostramos a
          margem real.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted">
            Ativo
            <Input
              className="mt-1.5"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome do pet"
            />
          </label>
          <ul className="overflow-hidden rounded-md bg-bg-sunken">
            {matches.map((pet) => (
              <li key={pet.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(pet);
                    setQuery(pet.name);
                    if (!pet.hasVariants) setVariant("regular");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2",
                    picked.id === pet.id && "bg-surface-2",
                  )}
                >
                  <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                  {pet.name}
                </button>
              </li>
            ))}
          </ul>

          {picked.hasVariants ? (
            <div className="flex flex-wrap gap-1.5">
              {variantsFor(picked).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={cn(
                    "h-9 rounded-full px-3 font-mono text-xs",
                    variant === v ? "bg-fg text-bg" : "bg-surface-2 text-muted",
                  )}
                >
                  {VARIANT_SHORT[v]}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted">
              Preço de compra
              <div className="mt-1.5 flex gap-2">
                <Input
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="font-mono"
                />
              </div>
            </label>
            <label className="text-xs text-muted">
              Moeda da compra
              <div className="mt-1.5 flex gap-1">
                {(["EUR", "USD", "BRL", "RP"] as CostUnit[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCostUnit(c)}
                    title={c === "RP" ? "Ride Potions" : undefined}
                    className={cn(
                      "h-11 flex-1 rounded-md font-mono text-xs",
                      costUnit === c ? "bg-fg text-bg" : "bg-surface-2 text-muted",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <ReceiptText className="size-3.5" />
              Taxa do marketplace · {feePct.toFixed(0)}%
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {FEE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFeePct(preset.fee)}
                  className={cn(
                    "h-9 rounded-md px-1 text-[11px]",
                    feePct === preset.fee
                      ? "bg-fg text-bg"
                      : "bg-surface-2 text-muted hover:text-fg",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={feePct}
              onChange={(e) => setFeePct(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
              aria-label="Taxa do marketplace"
            />
            <span className="mt-1 flex justify-between font-mono text-[10px] text-faint">
              <span>0% Revolut</span>
              <span>10% G2G</span>
              <span>12% Eldorado</span>
            </span>
          </div>

          <p className="flex items-start gap-1.5 rounded-md bg-bg-sunken px-3 py-2 text-[11px] text-muted">
            <Landmark className="mt-0.5 size-3.5 shrink-0 text-faint" />
            Venda na UE: recebe via Revolut ou PayPal em € (não há Pix). O
            cross-trading fora do jogo viola os Termos do Roblox — usa contas
            verificadas e nunca pagues primeiro.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-bg-sunken p-4">
          <div className="flex items-center gap-3">
            <PetGlyph id={picked.id} glyph={picked.glyph} size="lg" />
            <div>
              <p className="font-medium">{picked.name}</p>
              <p className="font-mono text-xs text-muted">
                {picked.hasVariants ? VARIANT_SHORT[variant] : picked.category} ·{" "}
                {formatPoints(value.points)} pts
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] text-faint">Valor de mercado</dt>
              <dd className="font-mono text-sm tabular-nums">
                {formatMoney(gross, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-faint">Após taxa ({feePct}%)</dt>
              <dd className="font-mono text-sm tabular-nums">
                {formatMoney(net, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-faint">
                Custo{costUnit === "RP" ? " (Ride Pots)" : ""}
              </dt>
              <dd className="font-mono text-sm tabular-nums">
                {UNIT_PREFIX[costUnit]}
                {costNum.toFixed(2)}
                {costUnit === "RP" ? " RP" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-faint">Margem bruta</dt>
              <dd
                className={cn(
                  "font-mono text-sm tabular-nums",
                  grossMargin >= 0 ? "text-accent" : "text-loss",
                )}
              >
                {formatMoney(grossMargin, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-faint">Taxa retida</dt>
              <dd className="font-mono text-sm tabular-nums text-loss">
                −{formatMoney(feeUsd, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-faint">Custo em {currency}</dt>
              <dd className="font-mono text-sm tabular-nums text-muted">
                {formatMoney(costUsd, currency)}
              </dd>
            </div>
          </dl>

          <div
            className={cn(
              "mt-auto rounded-md px-3 py-3",
              healthy ? "bg-accent-dim" : "bg-loss-dim",
            )}
          >
            <p className="text-[11px] tracking-wide text-muted uppercase">
              Margem líquida
            </p>
            <p
              className={cn(
                "font-mono text-2xl font-medium tabular-nums",
                healthy ? "text-accent" : "text-loss",
              )}
            >
              {formatMoney(netMargin, currency)}
            </p>
            <p className="text-sm text-muted">
              ROI {roi >= 0 ? "+" : "−"}
              {Math.abs(roi * 100).toFixed(1)}% depois da taxa.{" "}
              {healthy
                ? "Operação viável se a liquidez se confirmar."
                : "A taxa come o lucro — não vendas a este preço."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
