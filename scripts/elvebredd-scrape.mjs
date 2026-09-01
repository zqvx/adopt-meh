#!/usr/bin/env node
/**
 * Scraper de pontos comunitários (ElveBredd) para CRUZAR fontes.
 *
 * O ElveBredd usa a sua própria unidade de pontos. Este script extrai os
 * pontos FR por pet e grava em public/data/points.json. O terminal compara
 * $/ponto (dinheiro do BloxUltra) com a mediana para detetar pets
 * INFLACIONADOS (sobrevalorizados) ou SUBVALORIZADOS (oportunidades).
 *
 * Uso:
 *   node scripts/elvebredd-scrape.mjs
 *
 * Nota: o ElveBredd é uma app JS-pesada; se o HTML não contiver os valores
 * (renderização no cliente), usa --playwright (requer `npm i playwright`):
 *   node scripts/elvebredd-scrape.mjs --playwright
 *
 * Se falhar, o terminal cruza os pontos do próprio catálogo (fallback).
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(ROOT, "public/data/points.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Nome no ElveBredd -> id interno.
const NAME_TO_ID = {
  "bat dragon": "bat-dragon",
  "shadow dragon": "shadow-dragon",
  "giraffe": "giraffe",
  "frost dragon": "frost-dragon",
  "owl": "owl",
  "parrot": "parrot",
  "crow": "crow",
  "evil unicorn": "evil-unicorn",
  "arctic reindeer": "arctic-reindeer",
  "african wild dog": "african-wild-dog",
  "turtle": "turtle",
  "kangaroo": "kangaroo",
  "albino monkey": "albino-monkey",
  "hedgehog": "hedgehog",
  "flamingo": "flamingo",
  "queen bee": "queen-bee",
  "king bee": "king-bee",
  "dragon": "dragon",
  "unicorn": "unicorn",
  "frost fury": "frost-fury",
  "griffin": "griffin",
  "lion": "lion",
  "dalmatian": "dalmatian",
};

const TARGETS = [
  "https://elvebredd.com/values",
  "https://www.elvebredd.com/values",
  "https://elvebredd.com",
];

async function getHtml() {
  for (const url of TARGETS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        console.log(`Fonte: ${url}`);
        return await res.text();
      }
    } catch {
      /* tenta a próxima */
    }
  }
  return null;
}

/**
 * Tenta extrair pares "Nome ... <número de pontos>" do HTML/JSON embutido.
 * O ElveBredd embute dados em __NEXT_DATA__ ou similar.
 */
function parsePoints(text) {
  const out = {};
  // Procura blocos JSON com name/value (Next.js data).
  const jsonBlobs = text.match(/\{[^{}]*"name"[^{}]*"value"[^{}]*\}/g) || [];
  for (const blob of jsonBlobs) {
    try {
      const obj = JSON.parse(blob);
      const id = NAME_TO_ID[String(obj.name).toLowerCase().trim()];
      const val = Number(obj.value ?? obj.fr ?? obj.points);
      if (id && val > 0) out[id] = val;
    } catch {
      /* ignora */
    }
  }
  // Fallback: texto "Nome <número>" em tabelas.
  if (Object.keys(out).length === 0) {
    const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const re = /([A-Z][A-Za-z'\- ]{2,24}?)\s+FR?\s+([0-9]{2,5}(?:\.[0-9])?)/g;
    let m;
    while ((m = re.exec(plain))) {
      const id = NAME_TO_ID[m[1].toLowerCase().trim()];
      if (id && !out[id]) out[id] = Number(m[2]);
    }
  }
  return out;
}

async function main() {
  let html = await getHtml();

  if (!html && process.argv.includes("--playwright")) {
    console.log("Tentar com Playwright…");
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch();
      const page = await browser.newPage({ userAgent: UA });
      await page.goto(TARGETS[0], { waitUntil: "networkidle", timeout: 45000 });
      html = await page.content();
      await browser.close();
    } catch (err) {
      console.warn("Playwright falhou:", err.message);
    }
  }

  let points = {};
  if (html) {
    points = parsePoints(html);
    console.log(`Pontos extraídos: ${Object.keys(points).length} pets`);
  } else {
    console.warn("Não foi possível aceder ao ElveBredd (rede/bloqueio).");
  }

  // Mantém valores anteriores se o scraping não trouxer nada.
  let existing = {};
  try {
    existing = JSON.parse(await readFile(OUT, "utf8")).pets ?? {};
  } catch {
    /* sem ficheiro */
  }
  const merged = { ...existing, ...points };

  const result = {
    meta: {
      scrapedAt: new Date().toISOString(),
      unit: "elvebredd-points",
      source: "elvebredd",
      note: "Pontos comunitários para cruzar com valores em dinheiro e detetar inflação.",
    },
    pets: merged,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`Gravado em ${OUT.replace(ROOT + "/", "")} (${Object.keys(merged).length} pets)`);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
