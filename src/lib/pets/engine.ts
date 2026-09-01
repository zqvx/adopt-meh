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
  for (const line of lines) {
    const pet = getPet(line.petId);
    if (!pet) continue;
    const value = lineValue(line);
    totals.points += value.points;
    totals.usd += value.usd;
    totals.count += line.qty;
    if (pet.liquidity === "trash") {
      totals.trashCount += line.qty;
      totals.trashPoints += value.points;
      trashSet.add(pet.name);
    } else if (pet.liquidity === "low") {
      totals.lowLiqCount += line.qty;
    }
  }
  totals.trashNames = [...trashSet];
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
  };
}

export const RIDE_POTION_POINTS = 2.5;

export function toRidePots(points: number) {
  return points / RIDE_POTION_POINTS;
}
