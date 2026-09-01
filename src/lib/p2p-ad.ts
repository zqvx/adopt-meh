import { getPet } from "./pets/catalog";
import { FX } from "./format";
import {
  DEFAULT_COST_RATIO,
  decayPrice,
  goldenSpread,
  multiCurrency,
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
  golden: "💎 FRIEND PRICE",
  quick: "⚡ QUICK SALE (today only)",
  breakeven: "🔥 AT COST — last call",
};

/** Emoji do pet para a primeira linha do anúncio (é o que trava o scroll). */
const EMOJI_RULES: [RegExp, string][] = [
  [/dragon|dino|raptor|rex/i, "🐉"],
  [/unicorn|pegasus/i, "🦄"],
  [/owl|parrot|crow|toucan|flamingo|penguin|chicken|turkey/i, "🦉"],
  [/cat|lion|tiger|panther|lynx|cheetah/i, "🐱"],
  [/dog|wolf|fox|husky|corgi|shiba/i, "🐶"],
  [/bear|panda|koala/i, "🐻"],
  [/turtle|frog|crocodile|snake|lizard/i, "🐢"],
  [/monkey|kangaroo|elephant|giraffe|zebra|rhino|hippo/i, "🐘"],
  [/shark|whale|octopus|axolotl|narwhal|crab|fish/i, "🐬"],
  [/bat|ghost|skele|zombie|evil|shadow/i, "🦇"],
  [/butterfly|bee|ladybug|snail|beetle/i, "🦋"],
  [/potion|egg/i, "🥚"],
];

function petEmoji(petId: string) {
  const pet = getPet(petId);
  const haystack = `${pet?.name ?? petId} ${pet?.aliases?.join(" ") ?? ""}`;
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(haystack)) return emoji;
  }
  return "🐾";
}

/**
 * Nome do item como o mercado o escreve: `MFR Shadow Dragon`. A variante vem
 * à frente porque é assim que se procura e se fala em inglês.
 */
export function adPetName(petId: string, variant: Variant) {
  const pet = getPet(petId);
  const name = pet?.name ?? petId;
  if (!pet?.hasVariants || variant === "regular") return name;
  return `${variant.toUpperCase()} ${name}`;
}

/** A primeira linha do anúncio: `🐉 MFR Shadow Dragon ➔ 47€ | $52 | £40`. */
export function adHeadline(
  petId: string,
  variant: Variant,
  totalEur: number,
  qty = 1,
): string {
  const prefix = qty > 1 ? `${qty}x ` : "";
  return `${petEmoji(petId)} ${prefix}${adPetName(petId, variant)} ➔ ${
    multiCurrency(totalEur).tag
  }`;
}

/** Linha de pagamento — o argumento que convence o comprador estrangeiro. */
export const PAYMENT_LINE =
  "💳 Payment: Revolut (Revolut auto-converts your USD/GBP to EUR for free!)";

/**
 * Texto de anúncio copy-paste, em inglês (o mercado com dinheiro é dos EUA e
 * do Reino Unido). Mostra o preço nas três moedas, o valor de mercado e a
 * poupança face aos marketplaces — é o argumento que fecha a venda.
 */
export function generateAd(listing: Listing, opts: AdOptions = {}): string {
  const { vouches = 0, revtag, now } = opts;
  const price = decayPrice(listing, now);
  const total = price.eur * listing.qty;
  const marketTotal = listing.marketEur * listing.qty;
  const savings = Math.max(0, marketTotal - total);

  // `null` = linha que não se aplica (some); "" = linha em branco de propósito.
  const lines: (string | null)[] = [
    STAGE_TAG[price.stage] ?? "💎",
    "",
    adHeadline(listing.petId, listing.variant, total, listing.qty),
    `📊 Market value: ${multiCurrency(marketTotal).tag}`,
    savings > 0
      ? `✅ You save ${multiCurrency(savings).eur}€ vs the marketplaces (no site fees)`
      : null,
    "",
    revtag ? `${PAYMENT_LINE.slice(0, -1)} · ${revtag})` : PAYMENT_LINE,
    "🤝 In-game delivery, you check the pet before you pay",
    vouches > 0
      ? `⭐ ${vouches} ${vouches === 1 ? "vouch" : "vouches"} — receipt for every trade`
      : "⭐ First trades: happy to split it (half before, half after)",
    price.stage !== "golden"
      ? "⏳ This price is today only — after that it goes back to market value."
      : null,
    "",
    "DMs open 📩",
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
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
