import { getPet } from "./catalog";
import type { Pet, Variant } from "./types";
import type { InventoryItem } from "../store";

/**
 * Economia do flip de criação de Néon / Mega.
 *
 * NFR: 4 pets iguais FULL GROWN + 1 Fly + 1 Ride poção (≈ 1 poção de cada).
 * MFR: 4 néons (16 pets), e cada néon leva o seu par de poções → 4 × (F+R).
 *
 * O "trabalho" de envelhecer os pets é grátis (grind), por isso o lucro real
 * vem do prémio de néon menos o custo dos pets base.
 */
export const FLY_POTION_USD = 1;
export const RIDE_POTION_USD = 1.2;
export const POTION_COST_USD = FLY_POTION_USD + RIDE_POTION_USD; // 2.2

export type CraftKind = "nfr" | "mfr";

export interface CraftEconomy {
  pet: Pet;
  kind: CraftKind;
  /** Preço de venda do resultado (valor de referência). */
  sellUsd: number;
  /** Venda líquida após taxa do marketplace. */
  netUsd: number;
  /** Pets base necessários (4 para NFR, 16 para MFR). */
  baseCount: number;
  /** Poções necessárias em USD. */
  potionUsd: number;
  /**
   * Preço máximo a pagar por cada pet BASE (regular/whatever) para empatar a
   * venda líquida — ou seja, tudo acima disto torna o flip em prejuízo.
   */
  breakEvenBaseUsd: number;
  /** Preço de mercado atual de um pet base regular (para comparação). */
  baseMarketUsd: number;
  /** Rácio break-even / mercado. ≥1 dá lucro mesmo comprando a preço de loja;
   *  0.6–0.9 só compensa com grind/barato; <0.6 precisa de pets quase grátis. */
  ratio: number;
  /** Euros/dólar de lucro por craft se comprares os pets ao preço de mercado. */
  profitAtMarketUsd: number;
}

function variantUsd(
  pet: Pet,
  variant: Variant,
  overrides: Record<string, { frUsd?: number; nfrUsd?: number; mfrUsd?: number }>,
): number {
  const o = overrides[pet.id];
  if (variant === "fr") return o?.frUsd ?? pet.values.fr.usd;
  if (variant === "nfr") return o?.nfrUsd ?? pet.values.nfr.usd;
  if (variant === "mfr") return o?.mfrUsd ?? pet.values.mfr.usd;
  return pet.values[variant].usd;
}

export function craftEconomy(
  petId: string,
  kind: CraftKind,
  feePct: number,
  overrides: Record<string, { frUsd?: number; nfrUsd?: number; mfrUsd?: number }>,
): CraftEconomy | null {
  const pet = getPet(petId);
  if (!pet || !pet.hasVariants) return null;

  const sellVariant: Variant = kind === "nfr" ? "nfr" : "mfr";
  const sellUsd = variantUsd(pet, sellVariant, overrides);
  const netUsd = sellUsd * (1 - feePct / 100);

  const baseCount = kind === "nfr" ? 4 : 16;
  // Poções: NFR usa 1 fly + 1 ride. O MFR precisa de 4 néons, e **cada** néon
  // leva o seu par de poções — o mega não herda as do primeiro (era o que aqui
  // se assumia, e dava o break-even do mega inflado em ~6,60 USD).
  const potionUsd = kind === "nfr" ? POTION_COST_USD : POTION_COST_USD * 4;

  // Break-even: (net - potions) / baseCount = teto por pet base.
  const breakEvenBaseUsd = Math.max(0, (netUsd - potionUsd) / baseCount);

  // Preço de "mercado" de um pet base regular (não-FR), como referência.
  const baseMarketUsd = pet.values.regular.usd;
  const ratio = baseMarketUsd > 0 ? breakEvenBaseUsd / baseMarketUsd : 0;

  // Lucro se comprar 4/16 pets regulares ao preço de mercado atual.
  const costAtMarket = baseMarketUsd * baseCount + potionUsd;
  const profitAtMarketUsd = netUsd - costAtMarket;

  return {
    pet,
    kind,
    sellUsd,
    netUsd,
    baseCount,
    potionUsd,
    breakEvenBaseUsd,
    baseMarketUsd,
    ratio,
    profitAtMarketUsd,
  };
}

export type CraftRating = "great" | "grind" | "hard";

export function rateCraft(eco: CraftEconomy): {
  rating: CraftRating;
  label: string;
  hint: string;
} {
  if (eco.ratio >= 0.9) {
    return {
      rating: "great",
      label: "FLIP FÁCIL",
      hint: "Dá lucro mesmo comprando os pets perto do preço de mercado. Ideal para começar.",
    };
  }
  if (eco.ratio >= 0.55) {
    return {
      rating: "grind",
      label: "SÓ COM GRIND",
      hint: "Compensa se juntares/envelheceres os pets tu mesmo (trabalho grátis) ou os comprares barato em eventos.",
    };
  }
  return {
    rating: "hard",
    label: "NÃO COMPRES A PREÇO DE LOJA",
    hint: "Só vale a pena se conseguires os pets base muito abaixo do mercado — nunca pagues preço cheio para craftar.",
  };
}

/** Melhores pets para craftar, ordenados por rácio de break-even. */
export function rankCrafts(
  petIds: string[],
  kind: CraftKind,
  feePct: number,
  overrides: Record<string, { frUsd?: number; nfrUsd?: number; mfrUsd?: number }>,
): CraftEconomy[] {
  return petIds
    .map((id) => craftEconomy(id, kind, feePct, overrides))
    .filter((e): e is CraftEconomy => Boolean(e))
    .sort((a, b) => b.ratio - a.ratio);
}

export interface CraftReady {
  pet: Pet;
  /** Variante base que tens no inventário. */
  variant: Variant;
  /** Quantidade de pets base iguais. */
  qty: number;
  /** Nº de néons que consegues fazer (qty/4). */
  neons: number;
  /** Nº de megas (qty/16). */
  megas: number;
  /** Passa o limiar de néon (4). */
  canNeon: boolean;
  /** Passa o limiar de mega (16). */
  canMega: boolean;
}

/**
 * Agrupa o inventário por pet e diz quantas cópias tens — e se chegam para
 * craftar Néon (4) ou Mega (16). Só conta pets com variantes (pets a sério,
 * não poções/ovos).
 */
export function readyFromInventory(inventory: InventoryItem[]): CraftReady[] {
  const byPet = new Map<string, { variant: Variant; qty: number }>();
  for (const it of inventory) {
    const pet = getPet(it.petId);
    if (!pet || !pet.hasVariants) continue;
    const cur = byPet.get(it.petId);
    if (cur) cur.qty += it.qty;
    else byPet.set(it.petId, { variant: it.variant, qty: it.qty });
  }
  const out: CraftReady[] = [];
  for (const [petId, info] of byPet) {
    const pet = getPet(petId);
    if (!pet) continue;
    const neons = Math.floor(info.qty / 4);
    const megas = Math.floor(info.qty / 16);
    if (info.qty >= 3) {
      // Mostra a partir de 3 (quase lá); só marca "pronto" com 4/16.
      out.push({
        pet,
        variant: info.variant,
        qty: info.qty,
        neons,
        megas,
        canNeon: neons >= 1,
        canMega: megas >= 1,
      });
    }
  }
  return out.sort((a, b) => b.qty - a.qty);
}
