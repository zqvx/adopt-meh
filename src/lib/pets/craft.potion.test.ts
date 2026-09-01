import assert from "node:assert/strict";
import { test } from "node:test";
import { craftEconomy, POTION_COST_USD } from "./craft.ts";

const NO_OVERRIDES: Record<
  string,
  { frUsd?: number; nfrUsd?: number; mfrUsd?: number }
> = {};

test("craftEconomy: um néon leva um par de poções", () => {
  const eco = craftEconomy("shadow-dragon", "nfr", 10, NO_OVERRIDES);
  assert.ok(eco);
  assert.equal(eco!.baseCount, 4);
  assert.equal(eco!.potionUsd, POTION_COST_USD);
});

test("craftEconomy: um mega leva QUATRO pares de poções (um por néon)", () => {
  const eco = craftEconomy("shadow-dragon", "mfr", 10, NO_OVERRIDES);
  assert.ok(eco);
  assert.equal(eco!.baseCount, 16);
  // 4 néons × (fly + ride). O mega não herda as poções do primeiro néon —
  // era isso que aqui se assumia e inflava o break-even do mega em ~6,60 USD.
  assert.equal(eco!.potionUsd, POTION_COST_USD * 4);
});

test("craftEconomy: mais poções no mega baixam o teto por pet base", () => {
  const nfr = craftEconomy("shadow-dragon", "nfr", 10, NO_OVERRIDES)!;
  const mfr = craftEconomy("shadow-dragon", "mfr", 10, NO_OVERRIDES)!;

  // Sem a correção, o break-even do mega vinha artificialmente alto e o flip
  // parecia melhor do que é.
  const netPerBase = mfr.netUsd / 16;
  const ceilingWithFourPotions = (mfr.netUsd - POTION_COST_USD * 4) / 16;
  assert.ok(ceilingWithFourPotions < netPerBase);
  assert.equal(mfr.breakEvenBaseUsd, Math.max(0, ceilingWithFourPotions));

  // E continua a ser um valor finito e não negativo.
  assert.ok(Number.isFinite(mfr.breakEvenBaseUsd));
  assert.ok(mfr.breakEvenBaseUsd >= 0);
  assert.ok(Number.isFinite(nfr.breakEvenBaseUsd));
});

test("craftEconomy: poções e lucro batem certo com o custo a mercado", () => {
  const eco = craftEconomy("shadow-dragon", "mfr", 0, NO_OVERRIDES)!;
  const costAtMarket = eco.baseMarketUsd * eco.baseCount + eco.potionUsd;
  // `profitAtMarketUsd` tem de ser exatamente a venda menos esse custo.
  assert.equal(
    Math.round(eco.profitAtMarketUsd * 100),
    Math.round((eco.netUsd - costAtMarket) * 100),
  );
});
