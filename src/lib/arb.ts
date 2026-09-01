import { getPet } from "./pets/catalog";
import type { MarketData } from "./market-data";
import { liquidityScore } from "./pets/engine";

export interface ArbRow {
  petId: string;
  name: string;
  /** Melhor preço a que se CONSEGUE comprar (o mais barato). */
  buyUsd: number;
  /** Melhor preço a que se CONSEGUE vender (o mais caro). */
  sellUsd: number;
  /** Margem líquida em USD após taxas de compra e venda. */
  netUsd: number;
  /** Taxa de retorno sobre o capital. */
  roi: number;
  liqScore: number;
  buyPlatform: string;
  sellPlatform: string;
}

export const PLATFORM_LABEL: Record<string, string> = {
  eldorado: "Eldorado",
  bloxultra: "BloxUltra",
  range: "faixa do mercado",
};

/**
 * Matriz de arbitragem multi-plataforma. Para cada pet, combina os preços
 * por fonte (src) e a faixa low/high para estimar o melhor preço de compra
 * (vendedor barato) e o melhor de venda (comprador caro), descontando as
 * taxas dos marketplaces. O cruzamento de ≥3 sites (Gameflip/Starpets) entra
 * automaticamente quando o scraper os adicionar a `src`.
 */
export function arbitrageRows(data: MarketData | null, feePct: number): ArbRow[] {
  if (!data?.pets) return [];
  const fee = feePct / 100;
  const rows: ArbRow[] = [];

  for (const [id, row] of Object.entries(data.pets)) {
    const prices: { platform: string; price: number }[] = [];
    if (row.src) {
      for (const [plat, price] of Object.entries(row.src)) {
        if (typeof price === "number" && price > 0)
          prices.push({ platform: plat, price });
      }
    }
    // A faixa low/high do Eldorado representa, na prática, o spread entre
    // listagens baratas e pedidos caros dentro do marketplace.
    if (typeof row.lowUsd === "number")
      prices.push({ platform: "range", price: row.lowUsd });
    if (typeof row.highUsd === "number")
      prices.push({ platform: "range", price: row.highUsd });
    if (prices.length < 2) continue;

    const buy = prices.reduce((a, b) => (b.price < a.price ? b : a));
    const sell = prices.reduce((a, b) => (b.price > a.price ? b : a));
    if (buy.price >= sell.price) continue;

    const pet = getPet(id);
    const sellNet = sell.price * (1 - fee);
    const netUsd = sellNet - buy.price;
    if (netUsd <= 0) continue;

    rows.push({
      petId: id,
      name: pet?.name ?? id,
      buyUsd: buy.price,
      sellUsd: sell.price,
      netUsd,
      roi: buy.price > 0 ? netUsd / buy.price : 0,
      liqScore: pet
        ? liquidityScore(pet.liquidity, pet.demand, pet.tier)
        : 4,
      buyPlatform: PLATFORM_LABEL[buy.platform] ?? buy.platform,
      sellPlatform: PLATFORM_LABEL[sell.platform] ?? sell.platform,
    });
  }

  return rows
    .sort((a, b) => b.netUsd * Math.min(1, b.liqScore / 6) - a.netUsd * Math.min(1, a.liqScore / 6))
    .slice(0, 20);
}
