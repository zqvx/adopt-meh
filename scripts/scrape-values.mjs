#!/usr/bin/env node
/**
 * Pseudo-API de valores reais — scraping dos sites de referência.
 *
 * Extrai preços em dinheiro real (USD) dos pets e grava em
 * public/data/values.json, que o terminal consome como "fonte da verdade".
 *
 * Fontes (sem API oficial):
 *   - BloxUltra : preços de loja em dinheiro  -> campo frUsd
 *   - Eldorado  : intervalos de mercado       -> lowUsd / highUsd
 *
 * Uso:
 *   node scripts/scrape-values.mjs          # pesquisa e grava
 *   node scripts/scrape-values.mjs --check  # só mostra o que encontrou
 *
 * Para atualizar de 6 em 6 horas, põe no crontab (Linux/macOS):
 *   0 0,6,12,18 * * * cd /caminho/adopt-meh && node scripts/scrape-values.mjs
 *
 * Nota: se um site mudar de estrutura ou bloquear (Cloudflare), o script
 * mantém os valores anteriores para essa fonte e avisa — nunca apaga dados.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(ROOT, "public/data/values.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Nome no site -> id interno do catálogo (correspondência manual e robusta).
const NAME_TO_ID = {
  "bat dragon": "bat-dragon",
  "shadow dragon": "shadow-dragon",
  "giraffe": "giraffe",
  "frost dragon": "frost-dragon",
  "owl": "owl",
  "parrot": "parrot",
  "crow": "crow",
  "evil unicorn": "evil-unicorn",
  "african wild dog": "african-wild-dog",
  "giant panda": "giant-panda",
  "balloon unicorn": "balloon-unicorn",
  "arctic reindeer": "arctic-reindeer",
  "cow": "cow",
  "turtle": "turtle",
  "kangaroo": "kangaroo",
  "unicorn": "unicorn",
  "dragon": "dragon",
  "queen bee": "queen-bee",
  "king bee": "king-bee",
  "hedgehog": "hedgehog",
  "flamingo": "flamingo",
  "lion": "lion",
  "dalmatian": "dalmatian",
  "hawk": "hawk",
  "vampire dragon": "vampire-dragon",
  "lavender dragon": "lavender-dragon",
  "ghost dragon": "ghost-dragon",
  "phoenix": "phoenix",
  "t-rex": "t-rex",
  "trex": "t-rex",
  "dodo": "dodo",
  "griffin": "griffin",
  "shark": "shark",
  "kitsune": "kitsune",
  "octopus": "octopus",
  "frost fury": "frost-fury",
};

const SOURCES = {
  bloxultra: {
    name: "BloxUltra (preços de loja em dinheiro)",
    url: "https://bloxultra.com/adopt-me-values",
  },
  eldorado: {
    name: "Eldorado (intervalos de mercado)",
    url: "https://www.eldorado.gg/blog/adopt-me-trading-values/",
  },
};

function money(n) {
  return Math.round(n * 100) / 100;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function normalizeName(raw) {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

function idFor(rawName) {
  const n = normalizeName(rawName).replace(/\s*(fr|nfr|mfr|fly ride|mega)\s*.*$/i, "");
  return NAME_TO_ID[n] ?? null;
}

/** BloxUltra: linhas de tabela do tipo  "...Bat Dragon... | $412.51 | Buy". */
function parseBloxUltra(html) {
  const out = {};
  // Apaga tags para ficar só com o texto das células, mas mantém o $ colado.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
  // Procura "Nome ... $123.45"
  const re = /([A-Z][A-Za-z'\- ]{2,30}?)\s*\$([0-9]{1,4}(?:\.[0-9]{2})?)/g;
  let m;
  while ((m = re.exec(text))) {
    const id = idFor(m[1]);
    if (!id) continue;
    const price = money(Number(m[2]));
    // Mantém o primeiro preço encontrado por pet (a tabela principal).
    if (!out[id]) out[id] = { frUsd: price, source: "bloxultra" };
  }
  return out;
}

/** Eldorado: tabelas FR/NFR/MFR com intervalos "$80 – $160". */
function parseEldorado(html) {
  const out = {};
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
  // "Bat Dragon FR ... $250 - $550"
  const re = /([A-Z][A-Za-z'\- ]{2,30}?)\s+FR\s.*?\$([0-9,]+(?:\.[0-9]{2})?)\s*-\s*\$([0-9,]+(?:\.[0-9]{2})?)/g;
  let m;
  while ((m = re.exec(text))) {
    const id = idFor(m[1]);
    if (!id) continue;
    const low = money(Number(m[2].replace(/,/g, "")));
    const high = money(Number(m[3].replace(/,/g, "")));
    if (!out[id]) {
      out[id] = { frUsd: money((low + high) / 2), lowUsd: low, highUsd: high, source: "eldorado" };
    }
  }
  return out;
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return { meta: {}, pets: {} };
  }
}

async function main() {
  const check = process.argv.includes("--check");
  const existing = await loadExisting();
  const pets = { ...(existing.pets ?? {}) };

  const scraped = { bloxultra: {}, eldorado: {} };
  for (const [key, src] of Object.entries(SOURCES)) {
    try {
      process.stdout.write(`A pesquisar ${src.name} ... `);
      const html = await fetchHtml(src.url);
      const parsed = key === "bloxultra" ? parseBloxUltra(html) : parseEldorado(html);
      scraped[key] = parsed;
      console.log(`${Object.keys(parsed).length} pets`);
    } catch (err) {
      console.warn(`FALHOU (${err.message}) — mantenho valores anteriores desta fonte`);
    }
  }

  // Merge: BloxUltra tem prioridade no frUsd (preço real de compra);
  // Eldorado fornece os intervalos.
  for (const [id, row] of Object.entries(scraped.eldorado)) {
    pets[id] = { ...pets[id], ...row, ...(pets[id]?.frUsd ? { frUsd: pets[id].frUsd } : {}) };
  }
  for (const [id, row] of Object.entries(scraped.bloxultra)) {
    pets[id] = { ...pets[id], frUsd: row.frUsd, source: "bloxultra" };
  }

  const result = {
    meta: {
      scrapedAt: new Date().toISOString(),
      currency: "USD",
      variant: "fr",
      sources: Object.entries(SOURCES).map(([id, s]) => ({ id, name: s.name, url: s.url })),
      note: "Gerado por scripts/scrape-values.mjs. Valores reais de mercado em dinheiro (FR).",
    },
    pets,
  };

  console.log(`\nTotal de pets no ficheiro: ${Object.keys(pets).length}`);
  for (const [id, row] of Object.entries(pets).slice(0, 12)) {
    console.log(
      `  ${id.padEnd(20)} $${row.frUsd ?? "?"}${
        row.lowUsd ? ` (intervalo $${row.lowUsd}-$${row.highUsd})` : ""
      }  [${row.source ?? "?"}]`,
    );
  }

  if (check) {
    console.log("\n--check: não grava.");
    return;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`\nGravado em ${OUT.replace(ROOT + "/", "")}`);
}

main().catch((err) => {
  console.error("Erro no scraping:", err);
  process.exit(1);
});
