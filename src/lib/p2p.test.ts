import assert from "node:assert/strict";
import { test } from "node:test";
import {
  daysListed,
  decayPrice,
  defaultCostEur,
  goldenSpread,
  multiCurrency,
  quickSell,
  siteNetEur,
} from "./p2p-pricing.ts";

const DAY = 24 * 60 * 60 * 1000;

test("golden spread: 50 € mercado → 44 € no site → 47 € de venda direta", () => {
  assert.equal(siteNetEur(50), 44);
  assert.equal(goldenSpread(50), 47);
});

test("venda rápida iguala o líquido do site (charm price)", () => {
  assert.equal(quickSell(50), 44.99);
  assert.ok(quickSell(50) < goldenSpread(50));
  assert.ok(quickSell(50) >= siteNetEur(50));
});

test("golden fica sempre entre o líquido do site e o preço de mercado", () => {
  for (const market of [5, 12.5, 30, 87, 240]) {
    const g = goldenSpread(market);
    assert.ok(g > siteNetEur(market), `golden > site (${market})`);
    assert.ok(g < market, `golden < mercado (${market})`);
  }
});

test("decay: dia 0 golden, dia 5 venda rápida, dia 9 break-even", () => {
  const now = Date.now();
  const base = { marketEur: 50, costEur: defaultCostEur(50) };

  const d0 = decayPrice({ ...base, ts: now }, now);
  assert.equal(d0.stage, "golden");
  assert.equal(d0.eur, 47);

  const d5 = decayPrice({ ...base, ts: now - 5 * DAY }, now);
  assert.equal(d5.stage, "quick");
  assert.equal(d5.eur, 44.99);

  const d9 = decayPrice({ ...base, ts: now - 9 * DAY }, now);
  assert.equal(d9.stage, "breakeven");
  assert.equal(d9.eur, base.costEur);
});

test("fronteiras da janela: dia 3 ainda golden, dia 4 já é rápida", () => {
  const now = Date.now();
  const base = { marketEur: 50, costEur: 27.5 };
  assert.equal(decayPrice({ ...base, ts: now - 3 * DAY }, now).stage, "golden");
  assert.equal(decayPrice({ ...base, ts: now - 4 * DAY }, now).stage, "quick");
  assert.equal(decayPrice({ ...base, ts: now - 7 * DAY }, now).stage, "breakeven");
});

test("break-even nunca pede mais do que a venda rápida", () => {
  const now = Date.now();
  const caro = decayPrice({ ts: now - 10 * DAY, marketEur: 50, costEur: 90 }, now);
  assert.equal(caro.stage, "breakeven");
  assert.equal(caro.eur, quickSell(50));
});

test("daysListed conta dias inteiros e nunca é negativo", () => {
  const now = Date.now();
  assert.equal(daysListed({ ts: now }, now), 0);
  assert.equal(daysListed({ ts: now - 2.9 * DAY }, now), 2);
  assert.equal(daysListed({ ts: now + 5 * DAY }, now), 0);
});

test("valores inválidos não rebentam os preços", () => {
  assert.equal(goldenSpread(0), 0);
  assert.equal(quickSell(-10), 0);
});

test("câmbio do anúncio: 47 € → $52 | £40", () => {
  const m = multiCurrency(47);
  assert.equal(m.usd, 52);
  assert.equal(m.gbp, 40);
  assert.equal(m.tag, "47€ | $52 | £40");
});

test("câmbio mantém cêntimos no euro e arredonda as outras moedas", () => {
  const m = multiCurrency(44.99);
  assert.equal(m.tag, "44,99€ | $49 | £38");
});
