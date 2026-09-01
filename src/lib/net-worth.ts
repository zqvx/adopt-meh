/**
 * Histórico de património (net worth) do utilizador.
 *
 * Grava um ponto por dia com o valor total do inventário (USD, convertido
 * para € na UI). O inventário vive no localStorage; aqui guardamos a série
 * temporal que o gráfico do separador Investir mostra.
 */
const KEY = "nexus-networth-v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_POINTS = 365;

export interface NetWorthPoint {
  /** Timestamp (meia-noite UTC do dia). */
  t: number;
  /** Valor total em USD nesse dia. */
  usd: number;
}

export function readNetWorth(): NetWorthPoint[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NetWorthPoint[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(points: NetWorthPoint[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(points));
  } catch {
    /* indisponível */
  }
}

/**
 * Meia-noite UTC do dia de `t` — a mesma unidade com que os pontos são
 * guardados. Exportada para a UI não inventar outro fuso e acabar com dois
 * pontos no mesmo dia.
 */
export function dayStart(t: number) {
  const d = new Date(t);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Regista o património de hoje. Se já houver um ponto no mesmo dia, atualiza
 * (mantém o valor mais recente). Devolve a série.
 */
export function recordNetWorth(totalUsd: number): NetWorthPoint[] {
  const points = readNetWorth();
  const today = dayStart(Date.now());
  const idx = points.findIndex((p) => p.t === today);
  if (idx >= 0) points[idx].usd = totalUsd;
  else points.push({ t: today, usd: totalUsd });

  const cutoff = today - MAX_POINTS * DAY_MS;
  const trimmed = points.filter((p) => p.t >= cutoff);
  write(trimmed);
  return trimmed;
}

// ---------------------------------------------------------------------------
// Meta de património (gamificação)
// ---------------------------------------------------------------------------

const GOAL_KEY = "nexus-networth-goal-v1";

export function readGoalUsd(): number | null {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    const n = raw ? Number.parseFloat(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeGoalUsd(usd: number | null) {
  try {
    if (usd === null || !Number.isFinite(usd) || usd <= 0)
      localStorage.removeItem(GOAL_KEY);
    else localStorage.setItem(GOAL_KEY, String(usd));
  } catch {
    /* indisponível */
  }
}

export interface GoalProjection {
  /** €/dia de ganho médio recente (regressão linear, pode ser negativo). */
  perDayUsd: number;
  /** Dias até à meta; null se não há progresso ou meta já atingida. */
  daysToGoal: number | null;
  /** Data estimada de chegada (timestamp) ou null. */
  eta: number | null;
  reached: boolean;
}

/**
 * Projeta quando se atinge a meta com base na velocidade recente.
 * Usa regressão linear simples sobre os pontos (últimos 7 dias, ou todos se
 * menos), o que é robusto a dias de salto. currentUsd é o valor de hoje.
 */
export function projectGoal(
  points: NetWorthPoint[],
  currentUsd: number,
  goalUsd: number | null,
): GoalProjection | null {
  if (!goalUsd || goalUsd <= 0) return null;
  if (currentUsd >= goalUsd) {
    return { perDayUsd: 0, daysToGoal: 0, eta: Date.now(), reached: true };
  }

  // Janela dos últimos 7 dias.
  const cutoff = Date.now() - 8 * DAY_MS;
  const win = points.filter((p) => p.t >= cutoff);
  const data = win.length >= 2 ? win : points;

  let perDayUsd = 0;
  if (data.length >= 2) {
    const t0 = data[0].t;
    const xs = data.map((p) => (p.t - t0) / DAY_MS);
    const ys = data.map((p) => p.usd);
    const n = xs.length;
    const xMean = xs.reduce((s, x) => s + x, 0) / n;
    const yMean = ys.reduce((s, y) => s + y, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i += 1) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    perDayUsd = den > 0 ? num / den : 0;
  }

  if (perDayUsd <= 0.01) {
    return { perDayUsd, daysToGoal: null, eta: null, reached: false };
  }

  const daysToGoal = Math.max(1, Math.ceil((goalUsd - currentUsd) / perDayUsd));
  return {
    perDayUsd,
    daysToGoal,
    eta: Date.now() + daysToGoal * DAY_MS,
    reached: false,
  };
}
