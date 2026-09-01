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

function dayStart(t: number) {
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
