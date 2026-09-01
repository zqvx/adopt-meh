/**
 * LIVRO NEGRO — motor de matching de clientes (sem dependências, testável).
 *
 * Quem já pagou 50 € por um pet volta a pagar. Vender por DM a alguém que já
 * confia em ti demora 30 segundos: zero scammers, zero canais públicos. Este
 * módulo cruza o stock em anúncio com o histórico de compras de cada cliente.
 */
import type { Variant } from "./pets/types.ts";

export interface Purchase {
  ts: number;
  petId: string;
  variant: Variant;
  /** Valor pago (total, em €). */
  eur: number;
}

export interface Customer {
  id: string;
  /** @ do Discord (ou outro contacto). Chave natural do cliente. */
  handle: string;
  platform: "discord" | "facebook" | "reddit" | "outro";
  purchases: Purchase[];
  /** Total gasto, em €. */
  totalEur: number;
  firstTs: number;
  lastTs: number;
  note?: string;
}

/** Normaliza o handle: sem @, minúsculas, sem espaços. */
export function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@+/, "").toLowerCase();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias desde a última compra. */
export function daysSince(ts: number, now = Date.now()) {
  return Math.max(0, Math.floor((now - ts) / DAY_MS));
}

/**
 * Uma "baleia" é quem já gastou bem ou repetiu compras. São estes que
 * recebem o stock novo primeiro.
 */
export function isWhale(customer: Customer): boolean {
  return customer.totalEur >= 40 || customer.purchases.length >= 2;
}

export type MatchReason = "same-pet" | "price-band" | "whale";

export interface Match {
  customer: Customer;
  /** 0..1 — quanto faz sentido oferecer-lhe este item primeiro. */
  score: number;
  reason: MatchReason;
  detail: string;
}

/** Maior compra do cliente (âncora do poder de compra). */
export function topSpendEur(customer: Customer): number {
  return customer.purchases.reduce((max, p) => Math.max(max, p.eur), 0);
}

/**
 * Clientes a quem vale a pena mandar DM sobre um item.
 *
 * Prioridade: já comprou este pet → gasta nesta faixa de preço → é baleia.
 * Clientes inativos há muito tempo perdem peso (mas não desaparecem).
 */
export function matchCustomers(
  item: { petId: string; priceEur: number },
  customers: Customer[],
  now = Date.now(),
  limit = 4,
): Match[] {
  const matches: Match[] = [];

  for (const customer of customers) {
    if (customer.purchases.length === 0) continue;
    const top = topSpendEur(customer);
    const boughtSame = customer.purchases.some((p) => p.petId === item.petId);
    // Faixa de preço confortável: entre 60% e 160% da maior compra.
    const inBand =
      top > 0 && item.priceEur >= top * 0.6 && item.priceEur <= top * 1.6;

    let score = 0;
    let reason: MatchReason = "whale";
    let detail = "";

    if (boughtSame) {
      score = 0.9;
      reason = "same-pet";
      detail = "já comprou este pet — quer provavelmente outro";
    } else if (inBand) {
      score = 0.7;
      reason = "price-band";
      detail = `compra nesta faixa (maior compra: ${top.toFixed(0)} €)`;
    } else if (isWhale(customer) && item.priceEur <= top * 1.6) {
      score = 0.5;
      reason = "whale";
      detail = `cliente fiel · ${customer.totalEur.toFixed(0)} € gastos`;
    } else {
      continue;
    }

    // Fidelidade: mais compras = mais confiança.
    score += Math.min(0.15, (customer.purchases.length - 1) * 0.05);
    // Arrefecimento: quem não compra há 60+ dias vale menos.
    const idle = daysSince(customer.lastTs, now);
    if (idle > 60) score -= 0.2;
    else if (idle > 30) score -= 0.1;

    matches.push({
      customer,
      score: Math.max(0, Math.min(1, Math.round(score * 100) / 100)),
      reason,
      detail,
    });
  }

  return matches
    .sort((a, b) => b.score - a.score || b.customer.totalEur - a.customer.totalEur)
    .slice(0, limit);
}

/** Junta uma compra a um cliente já existente (devolve um novo objeto). */
export function withPurchase(customer: Customer, purchase: Purchase): Customer {
  const purchases = [purchase, ...customer.purchases].slice(0, 40);
  return {
    ...customer,
    purchases,
    totalEur: Math.round(purchases.reduce((s, p) => s + p.eur, 0) * 100) / 100,
    firstTs: Math.min(customer.firstTs, purchase.ts),
    lastTs: Math.max(customer.lastTs, purchase.ts),
  };
}
