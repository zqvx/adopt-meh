import { AlertTriangle, Backpack, FlaskConical, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getPet, searchPets, variantsFor } from "@/lib/pets/catalog";
import { lineValue, liquidityScore } from "@/lib/pets/engine";
import { readyFromInventory } from "@/lib/pets/craft";
import { formatMoney, formatPoints, VARIANT_SHORT } from "@/lib/format";
import { ageLabel, marketPriceFor, resolveMarketUsd, useMarketStore } from "@/lib/market-data";
import type { InventoryItem } from "@/lib/store";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetGlyph } from "@/components/trade/PetGlyph";
import { VerifyPet } from "@/components/verify/VerifyPet";

function DeadWeight({ onTrade }: { onTrade: () => void }) {
  const inventory = useTradeStore((s) => s.inventory);
  const currency = useTradeStore((s) => s.currency);
  const marketData = useMarketStore((s) => s.data);

  const dead = useMemo(() => {
    return inventory
      .map((it) => {
        const pet = getPet(it.petId);
        if (!pet) return null;
        const score = liquidityScore(pet.liquidity, pet.demand, pet.tier);
        if (score >= 4.5) return null; // amarelo/vermelho: < 4.5
        const { usd } = resolveMarketUsd(it.petId, it.variant, marketData);
        return { it, pet, score, usd };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.score - b.score || b.usd - a.usd);
  }, [inventory, marketData]);

  const tiedUsd = dead.reduce((s, d) => s + d.usd * d.it.qty, 0);

  if (inventory.length === 0) return null;

  if (dead.length === 0) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent-dim/30 p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-accent">
          <Backpack className="size-4" /> Inventário saudável
        </p>
        <p className="mt-1 text-[12px] text-muted">
          Nenhum peso morto: todos os teus pets têm liquidez alta (nota ≥ 4.5) e vendem depressa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warn/40 bg-warn-dim/20 p-3 sm:p-4">
      <div className="mb-1 flex items-center gap-2">
        <AlertTriangle className="size-5 text-warn" />
        <h3 className="text-sm font-semibold">Peso Morto — livra-te disto</h3>
      </div>
      <p className="text-[12px] text-muted">
        Tens <strong className="text-warn">{dead.length}</strong> pet(s) que valem dinheiro mas
        quase não se vendem (liquidez {"<"} 4.5). Capital preso:{" "}
        <strong className="text-fg">{formatMoney(tiedUsd, currency)}</strong>. Usa-os como{" "}
        <em>adds</em> para fechar upgrades — despachas a iliquidez para o outro jogador e ficas com
        um pet de topo que gira depressa.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {dead.map(({ it, pet, score, usd }) => (
          <li key={it.id} className="flex items-center gap-2.5 rounded-md bg-surface-2 p-2">
            <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{pet.name}</p>
              <p className="font-mono text-[11px] text-muted">
                {formatMoney(usd * it.qty, currency)} · liquidez{" "}
                <span className={cn(score < 2.5 ? "text-loss" : "text-warn")}>
                  {score.toFixed(1)}/10
                </span>
              </p>
            </div>
            <Badge tone={score < 2.5 ? "loss" : "warn"}>
              {score < 2.5 ? "Não vende" : "Lento"}
            </Badge>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onTrade}>
        Usar como adds numa troca →
      </Button>
    </div>
  );
}

function CraftBadge({ petId }: { petId: string }) {
  const inventory = useTradeStore((s) => s.inventory);
  const ready = useMemo(
    () => readyFromInventory(inventory).find((r) => r.pet.id === petId),
    [inventory, petId],
  );
  if (!ready || ready.qty < 4) return null;
  return (
    <Badge tone={ready.canMega ? "accent" : "warn"}>
      <FlaskConical className="mr-1 size-3" />
      {ready.canMega ? `${ready.megas}× MEGA` : `${ready.neons}× NÉON`}
    </Badge>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const pet = getPet(item.petId);
  const currency = useTradeStore((s) => s.currency);
  const setQty = useTradeStore((s) => s.setInventoryQty);
  const remove = useTradeStore((s) => s.removeInventory);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const marketData = useMarketStore((s) => s.data);
  if (!pet) return null;
  const value = lineValue({
    id: item.id,
    petId: item.petId,
    variant: item.variant,
    qty: 1,
  });
  const marketUsd = marketPriceFor(pet.id, marketData, item.variant);
  const displayUsd = marketUsd != null && marketUsd > 0 ? marketUsd : value.usd;
  const fromMarket = marketUsd != null && marketUsd > 0;
  const marketDrift =
    fromMarket && value.usd > 0 ? Math.abs(marketUsd! - value.usd) / value.usd : 0;
  const trash = pet.liquidity === "trash";

  return (
    <li className="flex items-center gap-2.5 rounded-md bg-surface-2 p-2.5 shadow-[var(--shadow-border)]">
      <PetGlyph id={pet.id} glyph={pet.glyph} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pet.name}</p>
            <p className="font-mono text-[11px] text-muted tabular-nums">
              {VARIANT_SHORT[item.variant]} · {formatPoints(value.points)} pts ·{" "}
              <span className={fromMarket ? "text-accent" : undefined}>
                {formatMoney(displayUsd, currency)}
              </span>
              {fromMarket ? " · mkt" : ""}
            </p>
            {fromMarket && marketDrift > 0.15 ? (
              <p className="font-mono text-[10px] tabular-nums text-warn">
                Catálogo: {formatMoney(value.usd, currency)} · desatualizado
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-faint hover:bg-loss-dim hover:text-loss"
            aria-label="Remover"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {trash ? <Badge tone="loss">Trash</Badge> : null}
          {pet.hasVariants && item.qty >= 4 ? <CraftBadge petId={pet.id} /> : null}
          <VerifyPet pet={pet} />
          <button
            type="button"
            onClick={() => {
              addLine("you", pet.id, item.variant);
              setTab("trade");
            }}
            className="rounded-full bg-surface-3 px-2.5 py-1 text-[11px] text-muted hover:text-fg"
          >
            Usar na troca →
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-sm bg-surface-3 text-muted hover:text-fg"
              onClick={() => setQty(item.id, item.qty - 1)}
              aria-label="Diminuir"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center font-mono text-sm tabular-nums">{item.qty}</span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-sm bg-surface-3 text-muted hover:text-fg"
              onClick={() => setQty(item.id, item.qty + 1)}
              aria-label="Aumentar"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function InventoryPanel() {
  const inventory = useTradeStore((s) => s.inventory);
  const addInventory = useTradeStore((s) => s.addInventory);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const currency = useTradeStore((s) => s.currency);
  const marketData = useMarketStore((s) => s.data);
  const marketStatus = useMarketStore((s) => s.status);
  const loadMarket = useMarketStore((s) => s.load);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const matches = useMemo(() => searchPets(query, 8), [query]);

  const marketTotal = useMemo(() => {
    let usd = 0;
    let liveCount = 0;
    for (const it of inventory) {
      const market = marketPriceFor(it.petId, marketData, it.variant);
      const catalog = lineValue({ id: it.id, petId: it.petId, variant: it.variant, qty: 1 });
      if (market != null && market > 0) {
        usd += market * it.qty;
        liveCount += it.qty;
      } else {
        usd += catalog.usd * it.qty;
      }
    }
    if (liveCount === 0) return null;
    return { usd, liveCount };
  }, [inventory, marketData]);
  const marketAge = ageLabel(marketData?.meta?.scrapedAt);

  function deadToTrade() {
    for (const it of inventory) {
      const pet = getPet(it.petId);
      if (!pet) continue;
      const score = liquidityScore(pet.liquidity, pet.demand, pet.tier);
      if (score < 4.5) addLine("you", it.petId, it.variant);
    }
  }

  const totalPts = inventory.reduce(
    (sum, it) =>
      sum + lineValue({ id: it.id, petId: it.petId, variant: it.variant, qty: it.qty }).points,
    0,
  );
  const totalUsd = inventory.reduce((sum, it) => {
    const { usd } = resolveMarketUsd(it.petId, it.variant, marketData);
    return sum + usd * it.qty;
  }, 0);

  return (
    <section className="flex flex-col gap-4">
      <DeadWeight
        onTrade={() => {
          deadToTrade();
          setTab("trade");
        }}
      />
      <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">Os teus pets</p>
        <h2 className="flex items-center gap-2 text-lg font-medium tracking-tight">
          <Backpack className="size-5 text-accent" />
          Meu Inventário
        </h2>
        <p className="text-sm text-muted">
          Regista o que tens. Assim, na troca, adicionas os teus pets num clique e o valor é
          calculado com precisão. Total:{" "}
          <strong className="text-fg">{formatPoints(totalPts)} pts</strong> ·{" "}
          <strong className="text-fg">{formatMoney(totalUsd, currency)}</strong>.
          {marketTotal ? (
            <>
              {" "}
              Valor de mercado (scraping):{" "}
              <strong className="text-accent">{formatMoney(marketTotal.usd, currency)}</strong>{" "}
              <span className="text-[11px] text-faint">
                ({marketTotal.liveCount} com preço online
                {marketAge ? `, atualizado ${marketAge}` : ""})
              </span>
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => loadMarket()}
          disabled={marketStatus === "loading"}
          className="mt-1 w-fit rounded-full bg-surface-3 px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-fg disabled:opacity-50"
        >
          {marketStatus === "loading" ? "A atualizar preços…" : "Atualizar preços agora ↻"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPicked(null);
              }}
              placeholder="Adicionar pet ao inventário…"
            />
          </div>

          {query && !picked ? (
            <ul className="mt-2 overflow-hidden rounded-md bg-bg-sunken">
              {matches.map((pet) => (
                <li key={pet.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(pet.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                    <span className="truncate">{pet.name}</span>
                    <Badge tone={pet.liquidity === "high" ? "accent" : "neutral"}>{pet.tier}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {picked ? (
            <div className="mt-3 rounded-lg bg-bg-sunken p-3">
              {(() => {
                const pet = getPet(picked);
                if (!pet) return null;
                return (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                      <p className="text-sm font-medium">{pet.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {variantsFor(pet).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            addInventory(pet.id, v);
                            setPicked(null);
                            setQuery("");
                          }}
                          className="h-9 rounded-full bg-surface-3 px-3 font-mono text-xs text-muted hover:bg-accent hover:text-accent-fg"
                        >
                          {VARIANT_SHORT[v]}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}

          <p className="mt-3 text-[11px] text-faint">
            Dica: adicionar o inventário não envia nada para servidores — fica só no teu navegador.
          </p>
        </div>

        <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
          <p className="mb-2 font-mono text-[10px] tracking-wide text-faint uppercase">
            {inventory.length} tipo(s) de item
          </p>
          <ul className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto">
            {inventory.length === 0 ? (
              <li className="rounded-lg bg-bg-sunken px-4 py-10 text-center text-sm text-muted">
                Ainda não tens pets no inventário. Pesquisa acima para adicionar.
              </li>
            ) : (
              inventory
                .slice()
                .sort((a, b) => {
                  const va = lineValue({
                    id: a.id,
                    petId: a.petId,
                    variant: a.variant,
                    qty: a.qty,
                  }).points;
                  const vb = lineValue({
                    id: b.id,
                    petId: b.petId,
                    variant: b.variant,
                    qty: b.qty,
                  }).points;
                  return vb - va;
                })
                .map((item) => <InventoryRow key={item.id} item={item} />)
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
