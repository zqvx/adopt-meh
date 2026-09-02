import assert from "node:assert/strict";
import { test } from "node:test";
import { getPet } from "./pets/catalog.ts";
import {
  inflationFor,
  medianUsdPerPoint,
  realPriceSeries,
  type MarketData,
  type PriceHistory,
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

const DAY = 86_400_000;
const HOUR = 3_600_000;

/**
 * Histórico de 4 dias, 2 pontos por dia (padrão das recolhas de 6h), com
 * preços distintos para validar que o último snapshot do dia é o que fica.
 * Os tempos são sempre no passado — estável a qualquer hora do dia.
 */
function fakeHistory(): PriceHistory {
  const now = Date.now();
  const snapshots = [];
  for (let d = 3; d >= 1; d--) {
    const dayStart = Math.floor((now - d * DAY) / DAY) * DAY;
    snapshots.push({ t: dayStart + 9 * HOUR, p: { "shadow-dragon": 100 + d } });
    snapshots.push({
      t: dayStart + 15 * HOUR,
      p: { "shadow-dragon": 100.5 + d },
    });
  }
  // Hoje: 09:00 e 15:00, aparados para o passado se ainda não chegarem.
  const dayStart = Math.floor(now / DAY) * DAY;
  const t1 = Math.min(dayStart + 9 * HOUR, now - 60_000);
  const t2 = Math.min(dayStart + 15 * HOUR, now - 30_000);
  snapshots.push({ t: t1, p: { "shadow-dragon": 100 } });
  snapshots.push({ t: t2, p: { "shadow-dragon": 100.5 } });
  return { snapshots };
}

test("realPriceSeries devolve um ponto por dia, do mais antigo para o mais recente", () => {
  const series = realPriceSeries(fakeHistory(), "shadow-dragon");
  assert.ok(series);
  assert.deepEqual(
    series.map((s) => s.daysAgo),
    [3, 2, 1, 0],
  );
  // No mesmo dia fica o último snapshot (o mais recente).
  assert.deepEqual(
    series.map((s) => s.price),
    [103.5, 102.5, 101.5, 100.5],
  );
});

test("realPriceSeries desiste sem histórico suficiente (a UI usa a série simulada)", () => {
  assert.equal(realPriceSeries(null, "shadow-dragon"), null);
  assert.equal(realPriceSeries({ snapshots: [] }, "shadow-dragon"), null);
  // Só 1 dia de dados (os 2 snapshots de há 1 dia) → sem série.
  const oneDay = fakeHistory();
  oneDay.snapshots = oneDay.snapshots.slice(4, 6);
  assert.equal(realPriceSeries(oneDay, "shadow-dragon"), null);
  // Pet que nunca apareceu nos snapshots → sem série.
  assert.equal(realPriceSeries(fakeHistory(), "nao-existe"), null);
});

test("realPriceSeries ignora snapshots corrompidos e fora da janela de 30 dias", () => {
  const hist = fakeHistory();
  hist.snapshots.push({ t: Math.floor(Date.now() / DAY) * DAY, p: {} });
  hist.snapshots.push({
    t: Date.now() - 60 * DAY,
    p: { "shadow-dragon": 1 },
  });
  hist.snapshots.push({
    t: Math.floor(Date.now() / DAY) * DAY - DAY,
    p: { "shadow-dragon": Number.NaN },
  });
  const series = realPriceSeries(hist, "shadow-dragon");
  assert.ok(series);
  assert.ok(series.every((s) => Number.isFinite(s.price) && s.price > 0));
  assert.ok(series.every((s) => s.daysAgo >= 0 && s.daysAgo <= 30));
});
