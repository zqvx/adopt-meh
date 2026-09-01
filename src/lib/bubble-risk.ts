import { getPet } from "./pets/catalog";
import { lineValue } from "./pets/engine";
import { petTheme, THEME_LABEL, type ThemeKey } from "./pets/theme";
import type { InventoryItem } from "./store";

export interface ThemeSlice {
  theme: ThemeKey;
  label: string;
  usd: number;
  /** Fração do património 0..1. */
  share: number;
  topPets: string[];
}

export interface BubbleRisk {
  totalUsd: number;
  slices: ThemeSlice[];
  level: "safe" | "watch" | "high";
  worst: ThemeSlice | null;
  tip: string;
}

/**
 * RISCO DE BOLHA — concentração do portfólio por classe/tema de pet.
 * Se >50% do capital estiver num só tema (ex.: Halloween), um evento novo ou
 * uma reedição pode fazer o valor derreter. Poções são tratadas como
 * equivalentes a dinheiro (líquidas), por isso não contam como concentração.
 */
export function bubbleRisk(inventory: InventoryItem[]): BubbleRisk {
  const byTheme = new Map<ThemeKey, { usd: number; pets: Map<string, number> }>();
  let totalUsd = 0;

  for (const it of inventory) {
    const pet = getPet(it.petId);
    if (!pet) continue;
    const v = lineValue({
      id: it.id,
      petId: it.petId,
      variant: it.variant,
      qty: it.qty,
    });
    if (v.usd <= 0) continue;
    const theme = petTheme(pet);
    if (!byTheme.has(theme)) byTheme.set(theme, { usd: 0, pets: new Map() });
    const slot = byTheme.get(theme)!;
    slot.usd += v.usd;
    slot.pets.set(pet.name, (slot.pets.get(pet.name) ?? 0) + v.usd);
    totalUsd += v.usd;
  }

  const slices: ThemeSlice[] = [...byTheme.entries()]
    .map(([theme, s]) => ({
      theme,
      label: THEME_LABEL[theme],
      usd: s.usd,
      share: totalUsd > 0 ? s.usd / totalUsd : 0,
      topPets: [...s.pets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name),
    }))
    .sort((a, b) => b.usd - a.usd);

  // Poções são o equivalente a dinheiro — não geram risco de concentração.
  const risky = slices.filter((s) => s.theme !== "potions");
  const worst = risky[0] ?? null;

  let level: BubbleRisk["level"] = "safe";
  if (worst && worst.share > 0.66) level = "high";
  else if (worst && worst.share > 0.5) level = "watch";

  let tip = "";
  if (worst && level !== "safe") {
    const example = worst.topPets[0] ?? worst.label;
    tip =
      `${Math.round(worst.share * 100)}% do capital está em ${worst.label}` +
      ` (${worst.topPets.join(", ")}). Vende pelo menos um ${example} e ` +
      `diversifica para pets Safari / Jungle / Aussie — se o Roblox lançar ` +
      `um evento novo ou reedição, esse valor derrete de um dia para o outro.`;
  }

  return { totalUsd, slices, level, worst, tip };
}
