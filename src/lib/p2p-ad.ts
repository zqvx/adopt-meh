import { getPet } from "./pets/catalog";
import { FX, VARIANT_LABEL } from "./format";
import {
  DEFAULT_COST_RATIO,
  decayPrice,
  goldenSpread,
  quickSell,
  siteNetEur,
  type Listing,
} from "./p2p-pricing";
import type { Variant } from "./pets/types";

/* ------------------------------------------------------------------ *
 * Anúncio pronto a colar (Discord / Facebook / Reddit)
 * ------------------------------------------------------------------ */

export interface AdOptions {
  /** Nº de vouches acumulados (prova social). */
  vouches?: number;
  /** Handle de pagamento a mostrar (ex.: @otiago). */
  revtag?: string;
  now?: number;
}

const STAGE_TAG: Record<string, string> = {
  golden: "💎 PREÇO DE AMIGO",
  quick: "⚡ VENDA RÁPIDA (hoje)",
  breakeven: "🔥 AO CUSTO — última chamada",
};

function eur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function petLabel(petId: string, variant: Variant) {
  const pet = getPet(petId);
  const name = pet?.name ?? petId;
  if (!pet?.hasVariants) return name;
  return `${name} ${VARIANT_LABEL[variant]}`;
}

/**
 * Texto de anúncio copy-paste. Mostra o preço de mercado riscado, o preço
 * de hoje (já com decay) e a poupança face ao marketplace — é o argumento
 * que fecha a venda.
 */
export function generateAd(listing: Listing, opts: AdOptions = {}): string {
  const { vouches = 0, revtag, now } = opts;
  const price = decayPrice(listing, now);
  const label = petLabel(listing.petId, listing.variant);
  const qty = listing.qty > 1 ? `${listing.qty}× ` : "";
  const total = price.eur * listing.qty;
  const savings = Math.max(0, listing.marketEur - price.eur) * listing.qty;

  const lines = [
    `${STAGE_TAG[price.stage] ?? "💎"} · ${qty}${label} (Adopt Me)`,
    "",
    `💰 Preço: ${eur(total)}${listing.qty > 1 ? ` (${eur(price.eur)}/un)` : ""}`,
    `📊 Valor de mercado: ${eur(listing.marketEur * listing.qty)}`,
    savings > 0 ? `✅ Poupas ${eur(savings)} face aos sites (sem taxas de marketplace)` : "",
    "",
    `💳 Pagamento: Revolut${revtag ? ` (${revtag})` : ""} · instantâneo, sem taxas na UE`,
    `🤝 Entrega em jogo na hora, tu confirmas antes de pagar`,
    vouches > 0
      ? `⭐ ${vouches} ${vouches === 1 ? "vouch" : "vouches"} — recibos de todas as trocas`
      : `⭐ Primeiras trocas: aceito ir a meias (metade antes, metade depois)`,
    price.stage !== "golden"
      ? `⏳ Este preço é só hoje — depois volta ao valor de tabela.`
      : "",
    "",
    `DM aberta 📩`,
  ];

  return lines.filter((l) => l !== "").join("\n");
}

/**
 * Valor de mercado (€) de um pet FR, já com o override do scraper quando
 * existe. É a base de todos os preços do modo P2P.
 */
export function marketEurFor(
  petId: string,
  overrides: Record<string, number> = {},
): number {
  const pet = getPet(petId);
  if (!pet) return 0;
  const usd = overrides[petId] ?? pet.values.fr.usd;
  return Math.round(usd * FX.EUR * 100) / 100;
}

/**
 * Preço máximo a que vale a pena COMPRAR stock para revender com margem.
 * Abaixo disto o flip compensa; acima é comprar trabalho.
 */
export function buyTargetEur(marketEur: number): number {
  return Math.round(marketEur * DEFAULT_COST_RATIO * 100) / 100;
}

/* ------------------------------------------------------------------ *
 * Deep links de stock (onde comprar barato)
 * ------------------------------------------------------------------ */

export interface StockLink {
  id: string;
  name: string;
  url: string;
  /** Preço observado nessa plataforma (€), quando conhecido. */
  eur: number | null;
  /** Comissão típica cobrada ao vendedor. */
  feeNote: string;
}

const SITES: {
  id: string;
  name: string;
  fee: string;
  build: (query: string) => string;
}[] = [
  {
    id: "eldorado",
    name: "Eldorado",
    fee: "~12% ao vendedor",
    build: (q) =>
      `https://www.eldorado.gg/adopt-me-items/i/10-0-0?search=${encodeURIComponent(q)}`,
  },
  {
    id: "gameflip",
    name: "Gameflip",
    fee: "~10% ao vendedor",
    build: (q) => `https://gameflip.com/shop?search=${encodeURIComponent(`adopt me ${q}`)}`,
  },
  {
    id: "starpets",
    name: "Starpets",
    fee: "~10% ao vendedor",
    build: (q) => `https://starpets.gg/pets?search=${encodeURIComponent(q)}`,
  },
  {
    id: "playerauctions",
    name: "PlayerAuctions",
    fee: "~10% ao vendedor",
    build: (q) =>
      `https://www.playerauctions.com/adopt-me-item/?keyword=${encodeURIComponent(q)}`,
  },
];

/**
 * Links diretos de pesquisa nos marketplaces, ordenados por preço crescente
 * quando há preços por plataforma no values.json (o mais barato primeiro é
 * onde compras stock).
 */
export function stockLinks(
  petId: string,
  variant: Variant = "fr",
  srcEur: Record<string, number> = {},
): StockLink[] {
  const pet = getPet(petId);
  const name = pet?.name ?? petId;
  const query = pet?.hasVariants && variant !== "regular"
    ? `${name} ${variant.toUpperCase()}`
    : name;

  return SITES.map((site) => ({
    id: site.id,
    name: site.name,
    url: site.build(query),
    eur: typeof srcEur[site.id] === "number" ? srcEur[site.id] : null,
    feeNote: site.fee,
  })).sort((a, b) => {
    if (a.eur === null && b.eur === null) return 0;
    if (a.eur === null) return 1;
    if (b.eur === null) return -1;
    return a.eur - b.eur;
  });
}

/** Resumo de preços para mostrar num cartão (mercado / site / golden / quick). */
export function priceLadder(marketEur: number) {
  return {
    marketEur,
    siteNetEur: siteNetEur(marketEur),
    goldenEur: goldenSpread(marketEur),
    quickEur: quickSell(marketEur),
    buyTargetEur: buyTargetEur(marketEur),
  };
}
