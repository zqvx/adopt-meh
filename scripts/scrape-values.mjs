#!/usr/bin/env node
/**
 * Pseudo-API de valores reais — scraping dos sites de referência.
 * Grava em public/data/values.json, que o terminal consome.
 *
 * Uso:
 *   node scripts/scrape-values.mjs          # pesquisa e grava
 *   node scripts/scrape-values.mjs --check  # só mostra o que encontrou
 *
 * A lógica está em scripts/scrape-lib.mjs, partilhada com o endpoint de
 * atualização em tempo real do servidor de desenvolvimento.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchMarketData } from "./scrape-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(ROOT, "public/data/values.json");

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
  console.log("A pesquisar fontes de valores reais...");
  const result = await fetchMarketData(existing.pets ?? {}, existing.meta ?? {});

  console.log(`Pets no ficheiro: ${Object.keys(result.pets).length}`);
  for (const [id, row] of Object.entries(result.pets).slice(0, 12)) {
    console.log(
      `  ${id.padEnd(20)} $${row.frUsd ?? "?"}${
        row.lowUsd ? ` ($${row.lowUsd}-$${row.highUsd})` : ""
      }  [${row.source ?? "?"}]`,
    );
  }
  if (result.meta.errors.length) {
    console.warn("\nAvisos:", result.meta.errors.join("; "));
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
