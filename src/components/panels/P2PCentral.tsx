import {
  Check,
  Clock,
  Copy,
  Euro,
  Plus,
  Receipt,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PetGlyph } from "@/components/trade/PetGlyph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockSniper } from "@/components/panels/StockSniper";
import { VARIANT_LABEL, VARIANT_ORDER } from "@/lib/format";
import { useLiveStore } from "@/lib/live-store";
import { generateAd, marketEurFor, priceLadder } from "@/lib/p2p-ad";
import { generateP2PReceipt } from "@/lib/p2p-receipt";
import {
  daysListed,
  decayPrice,
  multiCurrency,
  defaultCostEur,
  listingProfitEur,
  useP2PStore,
  type Listing,
} from "@/lib/p2p";
import { downloadReceipt } from "@/lib/receipt";
import { getPet, searchPets } from "@/lib/pets/catalog";
import type { Variant } from "@/lib/pets/types";
import { cn } from "@/lib/utils";

function eur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

const STAGE_TONE = {
  golden: "accent",
  quick: "warn",
  breakeven: "loss",
} as const;

/* ------------------------------------------------------------------ */

function AddListing() {
  const overrides = useLiveStore((s) => s.overrides);
  const addListing = useP2PStore((s) => s.addListing);
  const [query, setQuery] = useState("");
  const [petId, setPetId] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>("fr");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState("");

  const results = useMemo(
    () => (query.trim().length > 0 ? searchPets(query, 6) : []),
    [query],
  );
  const pet = petId ? getPet(petId) : null;
  const marketEur = petId ? marketEurFor(petId, overrides) : 0;
  const variantMul = pet ? pet.values[variant].usd / pet.values.fr.usd : 1;
  const unitMarket = Math.round(marketEur * variantMul * 100) / 100;
  const ladder = priceLadder(unitMarket);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div>
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          Pôr à venda
        </p>
        <h3 className="text-base font-medium tracking-tight">
          Novo anúncio (venda direta por Revolut)
        </h3>
      </div>

      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPetId(null);
        }}
        placeholder="Que pet vais vender? (ex.: Shadow Dragon)"
      />

      {results.length > 0 && !petId ? (
        <ul className="flex flex-col gap-1">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setPetId(p.id);
                  setQuery(p.name);
                  if (!p.hasVariants) setVariant("regular");
                }}
                className="flex w-full items-center gap-2.5 rounded-md bg-bg-sunken px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
              >
                <PetGlyph id={p.id} glyph={p.glyph} size="sm" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="font-mono text-[11px] text-faint">
                  {eur(marketEurFor(p.id, overrides))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pet ? (
        <>
          {pet.hasVariants ? (
            <div className="flex flex-wrap gap-1">
              {VARIANT_ORDER.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={cn(
                    "h-8 rounded-sm px-2.5 font-mono text-[11px] transition-colors",
                    variant === v
                      ? "bg-fg text-bg"
                      : "bg-surface-2 text-muted hover:text-fg",
                  )}
                >
                  {VARIANT_LABEL[v]}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-wide text-faint uppercase">
                Quantidade
              </span>
              <Input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 1)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-wide text-faint uppercase">
                Quanto te custou (€/un) — opcional
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={cost}
                placeholder={String(defaultCostEur(unitMarket))}
                onChange={(e) => setCost(e.target.value)}
              />
            </label>
          </div>

          <p className="rounded-lg bg-accent-dim px-3 py-2 font-mono text-[11px] text-accent">
            Anúncio sai como: {multiCurrency(ladder.goldenEur * qty).tag}
          </p>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-bg-sunken p-3 sm:grid-cols-4">
            {[
              { k: "Mercado", v: ladder.marketEur, tone: "text-muted" },
              { k: "Site paga-te", v: ladder.siteNetEur, tone: "text-loss" },
              { k: "Golden", v: ladder.goldenEur, tone: "text-accent" },
              { k: "Rápida", v: ladder.quickEur, tone: "text-warn" },
            ].map((row) => (
              <div key={row.k}>
                <p className="font-mono text-[10px] tracking-wide text-faint uppercase">
                  {row.k}
                </p>
                <p className={cn("font-mono text-sm tabular-nums", row.tone)}>
                  {eur(row.v)}
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={() => {
              addListing({
                petId: pet.id,
                variant: pet.hasVariants ? variant : "regular",
                qty,
                marketEur: unitMarket,
                costEur: cost.trim() === "" ? undefined : Number(cost),
              });
              setQuery("");
              setPetId(null);
              setQty(1);
              setCost("");
            }}
          >
            <Plus className="size-4" />
            Criar anúncio
          </Button>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ListingCard({ listing }: { listing: Listing }) {
  const vouches = useP2PStore((s) => s.vouches);
  const markSold = useP2PStore((s) => s.markSold);
  const removeListing = useP2PStore((s) => s.removeListing);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  // Sem isto, fechar o cartaz antes dos 1,6 s deixava um `setState` a correr
  // num componente já desmontado (e o timer pendurado).
  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const pet = getPet(listing.petId);
  const price = decayPrice(listing);
  const days = daysListed(listing);
  const profit = listingProfitEur(listing);
  const sold = listing.status === "sold";
  const total = price.eur * listing.qty;

  const ad = useMemo(
    () => generateAd(listing, { vouches }),
    [listing, vouches],
  );

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-bg-sunken p-3",
        sold && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2.5">
        <PetGlyph id={listing.petId} glyph={pet?.glyph ?? "ink"} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {listing.qty > 1 ? `${listing.qty}× ` : ""}
            {pet?.name ?? listing.petId}
            {pet?.hasVariants ? ` ${listing.variant.toUpperCase()}` : ""}
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-faint">
            <Clock className="size-3" />
            {sold
              ? `vendido · ${eur(listing.soldEur ?? 0)}`
              : `dia ${days} · mercado ${eur(listing.marketEur)}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-base text-fg tabular-nums">{eur(total)}</p>
          {!sold ? (
            <p className="font-mono text-[10px] text-faint tabular-nums">
              ${multiCurrency(total).usd} · £{multiCurrency(total).gbp}
            </p>
          ) : null}
          <Badge tone={sold ? "neutral" : STAGE_TONE[price.stage]}>
            {sold ? "vendido" : price.label}
          </Badge>
        </div>
      </div>

      {!sold ? (
        <>
          <p className="text-[11px] text-muted">{price.hint}</p>
          <p className="font-mono text-[11px] text-faint">
            custo {eur(listing.costEur * listing.qty)} · lucro previsto{" "}
            <span className={profit >= 0 ? "text-accent" : "text-loss"}>
              {profit >= 0 ? "+" : ""}
              {eur(profit)}
            </span>
          </p>

          <details className="rounded-md bg-surface-2 p-2">
            <summary className="cursor-pointer font-mono text-[11px] text-muted">
              Ver anúncio pronto a colar
            </summary>
            <pre className="mt-2 max-h-56 overflow-auto text-[11px] leading-relaxed whitespace-pre-wrap text-fg">
              {ad}
            </pre>
          </details>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(ad);
                setCopied(true);
                if (copyTimer.current !== null)
                  window.clearTimeout(copyTimer.current);
                copyTimer.current = window.setTimeout(() => {
                  copyTimer.current = null;
                  setCopied(false);
                }, 1600);
              }}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar anúncio"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const vouch = vouches + 1;
                markSold(listing.id);
                const { url } = generateP2PReceipt({
                  petId: listing.petId,
                  variant: listing.variant,
                  eur: total,
                  vouch,
                });
                downloadReceipt(
                  url,
                  `vouch-${String(vouch).padStart(3, "0")}.png`,
                );
              }}
            >
              <Euro className="size-3.5" />
              Vendido · recibo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeListing(listing.id)}
              aria-label="Apagar anúncio"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

        </>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const { url } = generateP2PReceipt({
                petId: listing.petId,
                variant: listing.variant,
                eur: listing.soldEur ?? total,
                vouch: vouches,
                ts: listing.soldTs,
              });
              downloadReceipt(url, `vouch-${vouches}.png`);
            }}
          >
            <Receipt className="size-3.5" />
            Recibo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeListing(listing.id)}
            aria-label="Apagar anúncio"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

export function P2PCentral() {
  const hydrate = useP2PStore((s) => s.hydrate);
  const listings = useP2PStore((s) => s.listings);
  const vouches = useP2PStore((s) => s.vouches);
  const cashEur = useP2PStore((s) => s.cashEur);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const active = listings.filter((l) => l.status === "active");
  const sold = listings.filter((l) => l.status === "sold");
  const pipeline = active.reduce(
    (sum, l) => sum + decayPrice(l).eur * l.qty,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
            <Euro className="size-3" /> Caixa Revolut
          </p>
          <p className="font-mono text-2xl text-accent tabular-nums">
            {eur(cashEur)}
          </p>
          <p className="text-[11px] text-faint">{sold.length} vendas fechadas</p>
        </div>
        <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
            <Star className="size-3" /> Reputação
          </p>
          <p className="font-mono text-2xl tabular-nums">{vouches}</p>
          <p className="text-[11px] text-faint">vouches com recibo</p>
        </div>
        <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
            <Clock className="size-3" /> Em anúncio
          </p>
          <p className="font-mono text-2xl tabular-nums">{eur(pipeline)}</p>
          <p className="text-[11px] text-faint">{active.length} anúncios ativos</p>
        </div>
      </section>

      <AddListing />

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <header>
          <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
            Pipeline
          </p>
          <h3 className="text-base font-medium tracking-tight">
            Anúncios ativos · preço com decay automático
          </h3>
        </header>
        {active.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Sem anúncios. Cria um acima e copia o texto para o Discord/Facebook.
          </p>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {active.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
        {sold.length > 0 ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {sold.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : null}
      </section>

      <StockSniper />

      <p className="text-center text-[11px] text-faint">
        Recebe sempre primeiro (ou a meias) e guarda o recibo. Cross-trading por
        dinheiro real viola os Termos do Roblox/Uplift — a app é uma ferramenta
        de referência.
      </p>
    </div>
  );
}
