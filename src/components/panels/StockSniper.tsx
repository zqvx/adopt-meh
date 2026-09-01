import { ExternalLink, ShoppingCart, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { PetGlyph } from "@/components/trade/PetGlyph";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FX } from "@/lib/format";
import { useLiveStore } from "@/lib/live-store";
import { useMarketStore } from "@/lib/market-data";
import {
  buyTargetEur,
  marketEurFor,
  priceLadder,
  stockLinks,
} from "@/lib/p2p-ad";
import { PETS, searchPets } from "@/lib/pets/catalog";
import { cn } from "@/lib/utils";

function eur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

/**
 * Stock Sniper — onde comprar barato para revender.
 * Mostra o teto de compra (buy target) e os links diretos de pesquisa nos
 * marketplaces, do mais barato para o mais caro quando há preços por fonte.
 */
export function StockSniper({ compact = false }: { compact?: boolean }) {
  const overrides = useLiveStore((s) => s.overrides);
  const market = useMarketStore((s) => s.data);
  const [query, setQuery] = useState("");

  const picks = useMemo(() => {
    if (query.trim().length > 0) return searchPets(query, 4);
    // Por defeito: pets líquidos e de procura alta — o stock que roda.
    return PETS.filter(
      (p) => p.hasVariants && p.liquidity === "high" && p.demand >= 4,
    )
      .sort((a, b) => b.values.fr.usd - a.values.fr.usd)
      .slice(0, compact ? 3 : 6);
  }, [query, compact]);

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
            Abastecimento
          </p>
          <h3 className="text-base font-medium tracking-tight">
            Stock Sniper · onde comprar barato
          </h3>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar pet…"
          className="h-9 w-full sm:w-48"
        />
      </header>

      <div className={cn("grid gap-2", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
        {picks.map((pet) => {
          const marketEur = marketEurFor(pet.id, overrides);
          const ladder = priceLadder(marketEur);
          const srcUsd = market?.pets?.[pet.id]?.src ?? {};
          const srcEur = Object.fromEntries(
            Object.entries(srcUsd).map(([k, v]) => [k, v * FX.EUR]),
          );
          const links = stockLinks(pet.id, "fr", srcEur);

          return (
            <article key={pet.id} className="rounded-lg bg-bg-sunken p-3">
              <div className="flex items-center gap-2.5">
                <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{pet.name} FR</p>
                  <p className="font-mono text-[11px] text-faint">
                    mercado {eur(marketEur)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center justify-end gap-1 font-mono text-sm text-accent tabular-nums">
                    <Target className="size-3.5" />
                    {eur(buyTargetEur(marketEur))}
                  </p>
                  <p className="text-[10px] text-faint">teto de compra</p>
                </div>
              </div>

              <p className="mt-2 font-mono text-[11px] text-muted">
                compra ≤{eur(ladder.buyTargetEur)} → revende{" "}
                <span className="text-accent">{eur(ladder.goldenEur)}</span> ={" "}
                <span className="text-accent">
                  +{eur(ladder.goldenEur - ladder.buyTargetEur)}
                </span>
              </p>

              <ul className="mt-2 flex flex-wrap gap-1.5">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[11px] transition-colors hover:bg-surface-3"
                      title={`${link.name} · ${link.feeNote}`}
                    >
                      <ShoppingCart className="size-3 text-faint group-hover:text-accent" />
                      {link.name}
                      {link.eur !== null ? (
                        <Badge tone={link.eur <= ladder.buyTargetEur ? "accent" : "neutral"}>
                          {eur(link.eur)}
                        </Badge>
                      ) : null}
                      <ExternalLink className="size-3 text-faint" />
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="text-[11px] text-faint">
        Os links abrem a pesquisa do pet em cada marketplace. Compra abaixo do
        teto, entrega em jogo e recebe por Revolut — a margem do site fica
        contigo.
      </p>
    </section>
  );
}
