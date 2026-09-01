#!/usr/bin/env node
/**
 * Acumulador de histórico de preços.
 *
 * A cada recolha do scraper (cron de 6h), guarda um snapshot compacto de
 * todos os preços FR em public/data/price-history.json. Com o tempo isto
 * forma o histórico REAL que o gráfico de 30 dias da app usa (padrões como
 * "o Bat Dragon cai no fim do mês" só se veem com dados acumulados).
 *
 * Regras:
 *   - só adiciona um ponto se a última recolha bem-sucedida tiver ≥3h
 *     (evita duplicados se o workflow correr várias vezes);
 *   - quando TODAS as fontes falharam (meta.live === false), não regista
 *     nada — não queremos pontos falsos no histórico;
 *   - mantém no máximo MAX_DAYS dias (1 ano por padrão); o ficheiro fica
 *     com ~140 KB/ano para ~100 pets.
 *
 * Uso: node scripts/price-history.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const VALUES = resolve(ROOT, "public/data/values.json");
const OUT = resolve(ROOT, "public/data/price-history.json");

const MAX_DAYS = Number(process.env.HISTORY_MAX_DAYS ?? 365);
const MIN_GAP_MS = 3 * 60 * 60 * 1000;

async function loadJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const values = await loadJson(VALUES, null);
  if (!values?.pets) {
    console.log("Sem values.json — histórico não atualizado.");
    return;
  }
  // Só acumulamos recolhas REAIS e recentes: é preciso meta.live === true
  // (scraper conseguiu pelo menos uma fonte) e um scrapedAt das últimas 12h.
  // O values.json estático do repo não tem isto, por isso nunca polui o
  // histórico — só os runs do scraper é que geram pontos.
  const scrapedAt = values.meta?.scrapedAt ? Date.parse(values.meta.scrapedAt) : NaN;
  const fresh =
    values.meta?.live === true &&
    Number.isFinite(scrapedAt) &&
    Date.now() - scrapedAt < 12 * 60 * 60 * 1000;
  if (!fresh) {
    console.log("Sem recolha real recente (live:true) — histórico não alterado.");
    return;
  }

  const now = scrapedAt;
  const hist = await loadJson(OUT, { snapshots: [] });
  if (!Array.isArray(hist.snapshots)) hist.snapshots = [];

  const last = hist.snapshots[hist.snapshots.length - 1];
  if (last && now - last.t < MIN_GAP_MS) {
    console.log("Último ponto há menos de 3h — nada a acrescentar.");
    return;
  }

  const prices = {};
  for (const [id, row] of Object.entries(values.pets)) {
    if (typeof row.frUsd === "number" && Number.isFinite(row.frUsd)) {
      prices[id] = Math.round(row.frUsd * 100) / 100;
    }
  }

  hist.snapshots.push({ t: now, p: prices });

  const cutoff = now - MAX_DAYS * 24 * 60 * 60 * 1000;
  hist.snapshots = hist.snapshots.filter((s) => s.t >= cutoff);

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(hist), "utf8");
  console.log(
    `Histórico: ${hist.snapshots.length} pontos · ${Object.keys(prices).length} pets neste snapshot.`,
  );
}

main().catch((err) => {
  console.error("Erro no histórico:", err);
  process.exit(1);
});
