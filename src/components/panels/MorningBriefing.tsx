import { ArrowRight, Coffee, Flame, TrendingDown, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PetGlyph } from "@/components/trade/PetGlyph";
import { StockSniper } from "@/components/panels/StockSniper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FX } from "@/lib/format";
import { useLiveStore } from "@/lib/live-store";
import { decayPrice, useP2PStore, QUICK_DAYS, daysListed } from "@/lib/p2p";
import { buyTargetEur } from "@/lib/p2p-ad";
import { getPet } from "@/lib/pets/catalog";
import { lineValue } from "@/lib/pets/engine";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function eur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function greeting(hour: number | null) {
  // `null` = ainda não sabemos as horas (servidor, ou primeiro render no
  // cliente): fica neutro para não destoar entre os dois e dar erro de
  // hidratação.
  if (hour === null) return "Olá";
  if (hour < 6) return "Boa madrugada";
  if (hour < 13) return "Bom dia";
  if (hour < 20) return "Boa tarde";
  return "Boa noite";
}


/**
 * Briefing matinal — o ecrã de arranque. Responde a três perguntas antes do
 * café acabar: o que tenho de despachar hoje, o que está a cair (vende já) e
 * quanto capital tenho livre para comprar.
 */
export function MorningBriefing() {
  const hydrate = useP2PStore((s) => s.hydrate);
  const listings = useP2PStore((s) => s.listings);
  const cashEur = useP2PStore((s) => s.cashEur);
  const vouches = useP2PStore((s) => s.vouches);
  const setTab = useTradeStore((s) => s.setTab);
  const inventory = useTradeStore((s) => s.inventory);
  const quotes = useLiveStore((s) => s.quotes);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Depende de `listings` (e não do `active` calculado em baixo): como `active`
  // é um array novo a cada render, o `useMemo` nunca acertava na cache.
  const active = useMemo(
    () => listings.filter((l) => l.status === "active"),
    [listings],
  );

  /** Stock parado: já saiu da janela golden (dia 4+) — tem de sair hoje. */
  const stale = useMemo(
    () =>
      active
        .filter((l) => daysListed(l) > 3)
        .sort((a, b) => daysListed(b) - daysListed(a)),
    [active],
  );

  /** Pets a cair ≥3% no feed: se tens, vende antes de continuar a descer. */
  const falling = useMemo(() => {
    const owned = new Set(inventory.map((it) => it.petId));
    return quotes
      .map((q) => {
        const first = q.history[0] ?? q.priceUsd;
        const change = first > 0 ? (q.priceUsd - first) / first : 0;
        return { ...q, change };
      })
      .filter((q) => q.change <= -0.03)
      .sort((a, b) => a.change - b.change)
      .map((q) => ({ ...q, owned: owned.has(q.petId) }))
      .sort((a, b) => Number(b.owned) - Number(a.owned))
      .slice(0, 5);
  }, [quotes, inventory]);

  /** Capital livre: caixa Revolut + valor do inventário ainda não anunciado. */
  const inventoryEur = useMemo(
    () =>
      inventory.reduce(
        (sum, it) =>
          sum +
          lineValue({ id: it.id, petId: it.petId, variant: it.variant, qty: it.qty })
            .usd *
            FX.EUR,
        0,
      ),
    [inventory],
  );

  const toCollect = useMemo(
    () => active.reduce((s, l) => s + decayPrice(l).eur * l.qty, 0),
    [active],
  );
  // Só no cliente: no servidor não há "hora de abrir a app".
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          <Coffee className="size-3.5 text-accent" />
          Missão do dia
        </p>
        <h2 className="mt-1 text-xl font-medium tracking-tight">
          {greeting(hour)} — {stale.length > 0
            ? `${stale.length} ${stale.length === 1 ? "anúncio precisa" : "anúncios precisam"} de sair hoje`
            : active.length > 0
              ? "pipeline saudável, nada parado"
              : "sem stock anunciado — hora de comprar barato"}
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-bg-sunken p-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
              <Wallet className="size-3" /> Capital livre
            </p>
            <p className="font-mono text-xl text-accent tabular-nums">
              {eur(cashEur)}
            </p>
            <p className="text-[11px] text-faint">
              dá para ~{Math.max(0, Math.floor(cashEur / Math.max(1, buyTargetEur(20))))} compras de stock médio
            </p>
          </div>
          <div className="rounded-lg bg-bg-sunken p-3">
            <p className="font-mono text-[10px] tracking-wide text-faint uppercase">
              A receber (pipeline)
            </p>
            <p className="font-mono text-xl tabular-nums">{eur(toCollect)}</p>
            <p className="text-[11px] text-faint">{active.length} anúncios ativos</p>
          </div>
          <div className="rounded-lg bg-bg-sunken p-3">
            <p className="font-mono text-[10px] tracking-wide text-faint uppercase">
              Inventário
            </p>
            <p className="font-mono text-xl tabular-nums">{eur(inventoryEur)}</p>
            <p className="text-[11px] text-faint">
              {vouches} {vouches === 1 ? "vouch" : "vouches"} de reputação
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
              <Flame className="size-3.5 text-warn" />
              Despachar hoje
            </p>
            <h3 className="text-base font-medium tracking-tight">
              Stock parado (capital congelado)
            </h3>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setTab("p2p")}>
            Abrir Central P2P
            <ArrowRight className="size-3.5" />
          </Button>
        </header>

        {stale.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Nada parado. Todos os anúncios ainda estão na janela golden (dias 1–
            {QUICK_DAYS - 3}).
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {stale.map((l) => {
              const pet = getPet(l.petId);
              const price = decayPrice(l);
              return (
                <li
                  key={l.id}
                  className="flex items-center gap-2.5 rounded-lg bg-bg-sunken p-3"
                >
                  <PetGlyph id={l.petId} glyph={pet?.glyph ?? "ink"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {l.qty > 1 ? `${l.qty}× ` : ""}
                      {pet?.name ?? l.petId}
                    </p>
                    <p className="font-mono text-[11px] text-faint">
                      {price.days} dias em anúncio · {price.hint}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm tabular-nums">
                      {eur(price.eur * l.qty)}
                    </p>
                    <Badge tone={price.stage === "breakeven" ? "loss" : "warn"}>
                      {price.label}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <header>
          <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
            <TrendingDown className="size-3.5 text-loss" />
            Alerta de queda
          </p>
          <h3 className="text-base font-medium tracking-tight">
            A cair ≥3% — vende antes que desça mais
          </h3>
        </header>
        {falling.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Nenhum pet do feed está a cair 3% ou mais neste momento.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {falling.map((q) => {
              const pet = getPet(q.petId);
              return (
                <li
                  key={q.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg bg-bg-sunken p-2.5",
                    q.owned && "shadow-[var(--shadow-border)]",
                  )}
                >
                  <PetGlyph id={q.petId} glyph={pet?.glyph ?? "ink"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {pet?.name ?? q.petId}{" "}
                      <span className="font-mono text-[11px] text-faint">
                        {q.variant.toUpperCase()}
                      </span>
                    </p>
                    {q.owned ? (
                      <p className="text-[11px] text-warn">
                        Tens este pet no inventário — considera despachar.
                      </p>
                    ) : (
                      <p className="text-[11px] text-faint">
                        Alvo de compra: {eur(buyTargetEur(q.priceUsd * FX.EUR))}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 font-mono text-sm text-loss tabular-nums">
                    {(q.change * 100).toFixed(1)}%
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <StockSniper compact />
    </div>
  );
}
