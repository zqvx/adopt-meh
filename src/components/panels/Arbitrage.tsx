import { useMemo, useState } from "react";
import { PETS, searchPets, variantsFor } from "@/lib/pets/catalog";
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

function toUsd(amount: number, currency: Currency) {
  return amount / FX[currency];
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
  const [cost, setCost] = useState("180");
  const [costCurrency, setCostCurrency] = useState<Currency>("USD");

  const matches = useMemo(() => searchPets(query, 6), [query]);
  const value = picked.values[picked.hasVariants ? variant : "regular"];
  const costNum = Number.parseFloat(cost.replace(",", ".")) || 0;
  const costUsd = toUsd(costNum, costCurrency);
  const fee = feePct / 100;
  const gross = value.usd;
  const net = gross * (1 - fee);
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
                {(["USD", "BRL", "EUR"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCostCurrency(c)}
                    className={cn(
                      "h-11 flex-1 rounded-md font-mono text-xs",
                      costCurrency === c
                        ? "bg-fg text-bg"
                        : "bg-surface-2 text-muted",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <label className="text-xs text-muted">
            Taxa do marketplace · {feePct.toFixed(0)}%
            <input
              type="range"
              min={5}
              max={15}
              step={1}
              value={feePct}
              onChange={(e) => setFeePct(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
            <span className="mt-1 flex justify-between font-mono text-[10px] text-faint">
              <span>5%</span>
              <span>10% padrão</span>
              <span>15%</span>
            </span>
          </label>
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
              <dt className="text-[11px] text-faint">Custo</dt>
              <dd className="font-mono text-sm tabular-nums">
                {CURRENCY_PREFIX[costCurrency]}
                {costNum.toFixed(2)}
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
