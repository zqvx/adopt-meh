import { getPet } from "./catalog";
import type {
  SideTotals,
  TradeLine,
  TradeVerdict,
  Variant,
  VerdictKind,
} from "./types";

function emptyTotals(): SideTotals {
  return {
    points: 0,
    usd: 0,
    count: 0,
    trashCount: 0,
    trashPoints: 0,
    trashNames: [],
    lowLiqCount: 0,
    strongCount: 0,
    concentration: 0,
    avgDemand: 0,
  };
}

export function lineValue(line: TradeLine) {
  const pet = getPet(line.petId);
  if (!pet) return { points: 0, usd: 0 };
  const variant: Variant = pet.hasVariants ? line.variant : "regular";
  const value = pet.values[variant] ?? pet.values.fr;
  return {
    points: value.points * line.qty,
    usd: value.usd * line.qty,
  };
}

export function summarizeSide(lines: TradeLine[]): SideTotals {
  const totals = emptyTotals();
  const trashSet = new Set<string>();
  let maxLinePoints = 0;
  let demandWeighted = 0;
  for (const line of lines) {
    const pet = getPet(line.petId);
    if (!pet) continue;
    const value = lineValue(line);
    totals.points += value.points;
    totals.usd += value.usd;
    totals.count += line.qty;
    maxLinePoints = Math.max(maxLinePoints, value.points);
    demandWeighted += value.points * pet.demand;
    const strong =
      (pet.liquidity === "high" && pet.demand >= 4) ||
      (pet.tier === "S" && pet.liquidity !== "low");
    if (strong) totals.strongCount += line.qty;
    if (pet.liquidity === "trash") {
      totals.trashCount += line.qty;
      totals.trashPoints += value.points;
      trashSet.add(pet.name);
    } else if (pet.liquidity === "low") {
      totals.lowLiqCount += line.qty;
    }
  }
  totals.trashNames = [...trashSet];
  totals.concentration = totals.points > 0 ? maxLinePoints / totals.points : 0;
  totals.avgDemand = totals.points > 0 ? demandWeighted / totals.points : 0;
  return totals;
}

function verdictOf(pct: number, empty: boolean): { kind: VerdictKind; label: string; hint: string } {
  if (empty) {
    return {
      kind: "empty",
      label: "Aguarda itens",
      hint: "Adiciona pets nos dois lados para ler o resultado.",
    };
  }
  if (pct >= 0.15) {
    return {
      kind: "massive",
      label: "Lucro massivo",
      hint: "A oferta está claramente a teu favor. Aceitar.",
    };
  }
  if (pct >= 0.05) {
    return {
      kind: "gain",
      label: "Ganho ligeiro",
      hint: "Margem positiva. Confirma liquidez antes de aceitar.",
    };
  }
  if (pct > -0.05) {
    return {
      kind: "fair",
      label: "Troca justa",
      hint: "Valores alinhados. Decide pela procura e pela liquidez.",
    };
  }
  if (pct > -0.15) {
    return {
      kind: "loss",
      label: "Prejuízo",
      hint: "Estás a perder valor. Pede add ou recusa.",
    };
  }
  return {
    kind: "heavy",
    label: "Prejuízo grave",
    hint: "Capital a sair da mesa. Recusar.",
  };
}

export function evaluateTrade(you: TradeLine[], them: TradeLine[]): TradeVerdict {
  const youTot = summarizeSide(you);
  const themTot = summarizeSide(them);
  const empty = youTot.count === 0 && themTot.count === 0;
  const deltaPoints = themTot.points - youTot.points;
  const deltaUsd = themTot.usd - youTot.usd;
  let pct = 0;
  if (empty) pct = 0;
  else if (youTot.points === 0) pct = themTot.points > 0 ? 1 : 0;
  else pct = deltaPoints / youTot.points;

  const { kind, label, hint } = verdictOf(pct, empty);
  const trashRatio = themTot.points > 0 ? themTot.trashPoints / themTot.points : 0;

  let risk: TradeVerdict["risk"] = "clear";
  let riskLabel = "Liquidez alta";
  let riskDetail = "Nenhum trash pet na oferta dele.";

  if (themTot.trashCount >= 3 || trashRatio >= 0.2) {
    risk = "danger";
    riskLabel = "Risco alto · trash pets";
    riskDetail = `${themTot.trashCount} item${themTot.trashCount === 1 ? "" : "s"} sem liquidez (${themTot.trashNames.join(", ")}). ${Math.round(trashRatio * 100)}% da oferta é lixo.`;
  } else if (themTot.trashCount > 0 || trashRatio >= 0.08) {
    risk = "watch";
    riskLabel = "Atenção · liquidez fraca";
    riskDetail = `Detetado: ${themTot.trashNames.join(", ") || "itens de baixa liquidez"}. Não deixes lixo inflacionar a troca.`;
  } else if (themTot.lowLiqCount >= 4) {
    risk = "watch";
    riskLabel = "Liquidez média";
    riskDetail = "Vários pets de procura baixa. O valor em pontos pode não se vender.";
  } else if (themTot.count === 0) {
    riskLabel = "Sem oferta";
    riskDetail = "O outro jogador ainda não tem itens na mesa.";
  }

  // Downgrade: trocas poucos itens FORTES (teu lado) por muitos fracos (dele).
  // O manómetro pode dizer "justa", mas ficas com ativos difíceis de voltar a
  // trocar — é uma das armadilhas mais comuns.
  let downgrade = false;
  let downgradeDetail = "";
  if (!empty) {
    const youConcentrated =
      youTot.concentration >= 0.6 && youTot.strongCount >= 1;
    const manyItems = themTot.count - youTot.count >= 3;
    const demandGap = youTot.avgDemand - themTot.avgDemand >= 0.7;
    const themWeak =
      themTot.strongCount === 0 || themTot.avgDemand < 3.1;
    const roughlyFair = pct < 0.12; // não compensa se for lucro enorme
    if (youConcentrated && manyItems && demandGap && themWeak && roughlyFair) {
      downgrade = true;
      downgradeDetail = `Dás ${youTot.count} item${youTot.count === 1 ? "" : "s"} de alta procura e recebes ${themTot.count} itens mais fracos. Em pontos parece ${
        pct > -0.05 && pct < 0.05 ? "justo" : pct >= 0.05 ? "lucro" : "perda"
      }, mas ficas com ativos difíceis de voltar a vender — é um downgrade. Pede um pet forte como add ou recusa.`;
    }
  }

  return {
    kind,
    label,
    hint,
    pct,
    deltaPoints,
    deltaUsd,
    you: youTot,
    them: themTot,
    risk,
    riskLabel,
    riskDetail,
    downgrade,
    downgradeDetail,
  };
}

export const RIDE_POTION_POINTS = 2.5;
export const RIDE_POTION_USD = 1.2;

export function toRidePots(points: number) {
  return points / RIDE_POTION_POINTS;
}

/** Presets de taxa dos métodos de recebimento usados no cross-trading na UE. */
export const FEE_PRESETS = [
  { id: "revolut", label: "Revolut (direto)", fee: 0 },
  { id: "paypal", label: "PayPal (direto)", fee: 5 },
  { id: "g2g", label: "G2G", fee: 10 },
  { id: "eldorado", label: "Eldorado", fee: 12 },
] as const;
