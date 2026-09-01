import assert from "node:assert/strict";
import { test } from "node:test";
import { getPet } from "./pets/catalog.ts";
import {
  inflationFor,
  medianUsdPerPoint,
  type MarketData,
} from "./market-data.ts";

/** Dez pets reais do catálogo — ids inventados não têm pontos e não contam. */
const IDS = [
  "shadow-dragon",
  "frost-dragon",
  "bat-dragon",
  "owl",
  "crow",
  "parrot",
  "evil-unicorn",
  "giraffe",
  "turtle",
  "kangaroo",
];

function pointsOf(id: string) {
  const pet = getPet(id);
  assert.ok(pet, `esperava o pet ${id} no catálogo`);
  return pet!.values.fr.points;
}

/**
 * Mercado de brincadeira: cada pet vale `ratio` USD por ponto. Com `ratio` a 1
 * para toda a gente, a mediana do $/ponto é 1 — fácil de raciocinar.
 */
function fakeMarket(ratioById: Record<string, number> = {}): MarketData {
  const pets: MarketData["pets"] = {};
  for (const id of IDS) {
    pets[id] = {
      frUsd: Math.round(pointsOf(id) * (ratioById[id] ?? 1) * 100) / 100,
    };
  }
  return { pets };
}

test("medianUsdPerPoint devolve a mediana do rácio $/ponto", () => {
  // Nove pets a 1 $/ponto e um a 3: a mediana continua a ser 1.
  const data = fakeMarket({ kangaroo: 3 });
  assert.equal(medianUsdPerPoint(data), 1);
});

test("medianUsdPerPoint devolve 0 com dados a menos ou inexistentes", () => {
  assert.equal(medianUsdPerPoint(null), 0);
  // Menos de 5 pets com as duas fontes: não há mediana com que comparar.
  assert.equal(
    medianUsdPerPoint({ pets: { "shadow-dragon": { frUsd: 10 } } }),
    0,
  );
  // Preço sem pontos conhecidos (id fora do catálogo) também não conta.
  assert.equal(medianUsdPerPoint({ pets: { "nao-existe": { frUsd: 10 } } }), 0);
});

test("medianUsdPerPoint é estável entre chamadas (é o que a UI precisa)", () => {
  const data = fakeMarket();
  const runs = Array.from({ length: 50 }, () => medianUsdPerPoint(data));
  assert.equal(new Set(runs).size, 1);
});

test("inflationFor classifica os desvios face à mediana", () => {
  const data = fakeMarket();
  const pet = "shadow-dragon";

  const fair = inflationFor(pet, data, pointsOf(pet));
  assert.equal(fair?.medianRatio, 1);
  assert.equal(fair?.inflation, "fair");

  // 40% acima da mediana do $/ponto → inflacionado.
  assert.equal(
    inflationFor(pet, data, pointsOf(pet) / 1.4)?.inflation,
    "overhyped",
  );
  // 40% abaixo → barato.
  assert.equal(
    inflationFor(pet, data, pointsOf(pet) / 0.6)?.inflation,
    "undervalued",
  );
});

test("inflationFor desiste sem dados suficientes", () => {
  assert.equal(inflationFor("shadow-dragon", null, 10), null);
  assert.equal(
    inflationFor(
      "shadow-dragon",
      { pets: { "shadow-dragon": { frUsd: 1 } } },
      10,
    ),
    null,
  );
});
