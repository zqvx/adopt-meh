/**
 * Verificação de valores na net — ligações diretas para o utilizador conferir
 * um pet nas fontes, e tipos da resposta do endpoint /api/market/verify
 * (o servidor vai à Game.Guide buscar a tabela de variantes do pet).
 */
import type { Variant } from "./pets/types";

export const VERIFY_LINKS = {
  gameGuide: (name: string) => `https://www.game.guide/${slugify(name)}-value-adopt-me`,
  elvebredd: () => "https://elvebredd.com",
  eldorado: () => "https://www.eldorado.gg/blog/adopt-me-trading-values/",
  google: (name: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`${name} adopt me value`)}`,
} as const;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tabela de variantes em dinheiro que a app mostra ao lado dos valores GG. */
export type GGVariants = Partial<Record<Variant, number>>;

export interface WebVerifyResult {
  name: string;
  url: string;
  source: string;
  sourceName: string;
  checkedAt: string;
  /** "3d ago" — idade dos valores na fonte. */
  updatedLabel: string | null;
  /** Tabela completa da fonte, na unidade da comunidade (AMV). */
  gg: Record<string, number>;
  /** Variantes que a app usa: regular/fly/ride/fr/nfr/mfr. */
  variants: GGVariants;
}

export interface VerifyResponse {
  ok: boolean;
  result?: WebVerifyResult;
  error?: string;
}

export const GG_VARIANT_LABEL: Record<string, string> = {
  regular: "Normal",
  fly: "Fly",
  ride: "Ride",
  fr: "Fly Ride",
  nfr: "Neon Fly Ride",
  mfr: "Mega Fly Ride",
};

/**
 * Converte um valor da Game.Guide (unidade AMV) para o nosso dinheiro (USD),
 * ancorando na variante FR: gg[variant] × (o nosso FR em $ / FR da GG).
 */
export function ggToUsd(variants: GGVariants, variant: Variant, ourFrUsd: number): number | null {
  const ggValue = variants[variant];
  const ggFr = variants.fr;
  if (!ggValue || !ggFr || !ourFrUsd) return null;
  return (ggValue / ggFr) * ourFrUsd;
}
