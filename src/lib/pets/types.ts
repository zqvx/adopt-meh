export type Variant = "regular" | "fly" | "ride" | "fr" | "nfr" | "mfr";

export type Liquidity = "high" | "medium" | "low" | "trash";

export type Tier = "S" | "A" | "B" | "C" | "D";

export type Category = "pet" | "potion" | "egg" | "item";

export type Glyph =
  | "night"
  | "ember"
  | "frost"
  | "moss"
  | "sand"
  | "ink"
  | "copper"
  | "teal"
  | "bone"
  | "blood"
  | "pearl"
  | "forest"
  | "storm"
  | "sun"
  | "void"
  | "mint"
  | "clay"
  | "steel"
  | "ocean"
  | "wine";

export type Currency = "USD" | "BRL" | "EUR";

export interface VariantValue {
  points: number;
  usd: number;
}

export interface Pet {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  tier: Tier;
  liquidity: Liquidity;
  demand: 1 | 2 | 3 | 4 | 5;
  featured?: boolean;
  hasVariants: boolean;
  glyph: Glyph;
  values: Record<Variant, VariantValue>;
}

export interface TradeLine {
  id: string;
  petId: string;
  variant: Variant;
  qty: number;
}

export type TradeSide = "you" | "them";

export type VerdictKind =
  | "empty"
  | "massive"
  | "gain"
  | "fair"
  | "loss"
  | "heavy";

export interface SideTotals {
  points: number;
  usd: number;
  count: number;
  trashCount: number;
  trashPoints: number;
  trashNames: string[];
  lowLiqCount: number;
  /** Items de procura/liquidez alta (pet tier S/A ou liq. high). */
  strongCount: number;
  /** Pontos concentrados num único item (0..1). */
  concentration: number;
  /** Procura média ponderada pelos pontos (1..5). */
  avgDemand: number;
}

export interface TradeVerdict {
  kind: VerdictKind;
  label: string;
  hint: string;
  pct: number;
  deltaPoints: number;
  deltaUsd: number;
  you: SideTotals;
  them: SideTotals;
  risk: "clear" | "watch" | "danger";
  riskLabel: string;
  riskDetail: string;
  /** Alerta de downgrade: trocas 1 item forte por muitos itens fracos. */
  downgrade: boolean;
  downgradeDetail: string;
  /** Contra-proposta: pet forte que o outro devia acrescentar/trocar. */
  counter: CounterSuggestion | null;
}

export interface CounterSuggestion {
  petId: string;
  variant: Variant;
  /** Porquê esta sugestão. */
  reason: string;
  /** Pontos do pet sugerido. */
  points: number;
  /** Quantos em falta (geralmente 1). */
  qty: number;
}
