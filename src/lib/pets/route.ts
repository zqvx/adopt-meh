import { getPet, PETS } from "./catalog";
import type { InventoryItem } from "../store";
import type { Liquidity, Tier, Variant } from "./types";

export interface RouteStep {
  kind: "give" | "ladder" | "note";
  text: string;
  petId?: string;
  detail?: string;
}

export interface Route {
  steps: RouteStep[];
  /** Pets do inventário a oferecer (petId + variant). */
  givers: { petId: string; variant: Variant }[];
  /** Pontos que o teu inventário cobre já do alvo (0..1). */
  coverage: number;
  targetPts: number;
  coveredPts: number;
  gapPts: number;
  feasible: boolean;
}

interface HeldPet {
  petId: string;
  variant: Variant;
  qty: number;
  points: number;
  tier: Tier;
  demand: number;
  liq: Liquidity;
  name: string;
}

/**
 * Sugere uma rota de trocas para chegar a um pet-alvo (o "paperclip
 * challenge"): que pets do teu inventário usar, se vale a pena trocar para
 * um degrau intermio de alta procura, e qual o overpay esperado.
 *
 * Estratégia realista do cross-trading:
 *  1. junta os teus pets de mais valor/liquidez até cobrir o alvo (+overpay);
 *  2. os "pesos mortos" (ilíquidos) servem de adds para fechar a troca;
 *  3. se ainda faltar valor, trocar para um pet degrau (ladder) de alta
 *     procura que seja mais fácil de negociar para cima.
 */
export function suggestRoute(
  targetPetId: string,
  targetVariant: Variant,
  inventory: InventoryItem[],
): Route | null {
  const target = getPet(targetPetId);
  if (!target) return null;

  const targetPts = target.values[targetVariant]?.points ?? target.values.fr.points;
  // Quem recebe um upgrade pede ~12% de overpay (ver engine upgrade detection).
  const needed = targetPts * 1.12;

  const held: HeldPet[] = inventory
    .flatMap((it): HeldPet[] => {
      const p = getPet(it.petId);
      if (!p) return [];
      const points = (p.values[it.variant]?.points ?? p.values.fr.points) * it.qty;
      if (points <= 0) return [];
      return [
        {
          petId: it.petId,
          variant: it.variant,
          qty: it.qty,
          points,
          tier: p.tier,
          demand: p.demand,
          liq: p.liquidity,
          name: p.name,
        },
      ];
    })
    .sort((a, b) => b.points - a.points);

  const steps: RouteStep[] = [];
  const totalHeld = held.reduce((s, h) => s + h.points, 0);
  const coveredPts = Math.min(totalHeld, needed);
  const coverage = targetPts > 0 ? Math.min(1, totalHeld / needed) : 0;

  // 1) Escolhe os pets a oferecer: os maiores até cobrir o alvo.
  let acc = 0;
  const givers: HeldPet[] = [];
  const adds: HeldPet[] = [];
  for (const h of held) {
    if (acc < needed) {
      givers.push(h);
      acc += h.points;
    } else if (h.liq === "low" || h.liq === "trash") {
      adds.push(h);
    }
  }

  if (givers.length > 0) {
    steps.push({
      kind: "give",
      text: `Oferece ${givers
        .map((g) => `${g.qty > 1 ? g.qty + "× " : ""}${g.name}`)
        .join(" + ")}`,
      detail: `~${Math.round(acc)} pts do teu lado para ${target.name} (${Math.round(
        targetPts,
      )} pts + ~12% overpay).`,
    });
  }

  // 2) Pesos mortos como adds para fechar.
  if (adds.length > 0) {
    steps.push({
      kind: "note",
      text: `Usa como extra: ${adds.slice(0, 3).map((a) => a.name).join(", ")}`,
      detail:
        "São ilíquidos para ti mas fecham a troca — despachas peso morto e ficas com o pet de topo.",
    });
  }

  // 3) Se ainda falta valor, sugere um pet degrau (ladder) de alta procura.
  const gapPts = needed - acc;
  if (gapPts > 0) {
    // O teu pet mais forte serve de base; o degrau deve estar entre esse valor
    // e o alvo, ser high-demand e líquido.
    const strongest = givers[0]?.points ?? 0;
    const ladder = PETS.filter((p) => {
      const v = p.values.fr.points;
      return (
        p.demand >= 4 &&
        p.liquidity === "high" &&
        v > strongest * 1.1 &&
        v < targetPts * 0.85
      );
    }).sort((a, b) => b.demand - a.demand || b.values.fr.points - a.values.fr.points)[0];

    if (ladder) {
      steps.push({
        kind: "ladder",
        petId: ladder.id,
        text: `Degrau intermédio: troca por ${ladder.name}`,
        detail: `Alta procura e fácil de vender (~${ladder.values.fr.points} pts). Negocia dele para o ${target.name} — sobe mais depressa com um pet que toda a gente quer.`,
      });
    } else {
      steps.push({
        kind: "note",
        text: `Faltam ~${Math.round(gapPts)} pts`,
        detail:
          "Continua a acumular pets de alta procura (ou crafta um Néon de um lendário B-tier) antes de propor a troca.",
      });
    }
  }

  steps.push({
    kind: "note",
    text:
      gapPts <= 0
        ? "Rota viável — cobre o valor com folga para o overpay."
        : "Ainda não cobres o valor total; segue o degrau ou acumula.",
  });

  return {
    steps,
    givers: givers.map((g) => ({ petId: g.petId, variant: g.variant })),
    coverage,
    targetPts,
    coveredPts,
    gapPts: Math.max(0, gapPts),
    feasible: gapPts <= 0,
  };
}
