import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateTrade } from "./engine.ts";
import type { TradeLine } from "./types.ts";

const line = (petId: string, qty = 1): TradeLine => ({
  id: Math.random().toString(36).slice(2),
  petId,
  variant: "fr",
  qty,
});

test("8 pets médios/fracos por 1 Shadow FR é detetado como downgrade", () => {
  // TU dás 1 Shadow FR (forte, alta procura)
  const you = [line("shadow-dragon")];
  // ELE enche a janela com pets de procura média/baixa (tier B, liq. média)
  const them = [
    line("vampire-dragon"),
    line("lavender-dragon"),
    line("ghost-dragon"),
    line("lion"),
    line("queen-bee"),
    line("hawk"),
    line("ninja-monkey"),
    line("skele-rex"),
  ];
  const v = evaluateTrade(you, them);
  assert.equal(v.downgrade, true, "devia marcar downgrade");
  assert.match(v.downgradeDetail, /downgrade/i);
});

test("4 Kangaroos (pets líquidos) por 1 Shadow NÃO é downgrade", () => {
  const you = [line("shadow-dragon")];
  const them = [line("kangaroo", 4)];
  const v = evaluateTrade(you, them);
  assert.equal(v.downgrade, false, "kangaroo é líquido, não é downgrade");
});

test("1 Shadow FR por Frost + Crow (pets fortes) NÃO é downgrade", () => {
  const you = [line("shadow-dragon")];
  const them = [line("frost-dragon"), line("crow", 2)];
  const v = evaluateTrade(you, them);
  assert.equal(v.downgrade, false, "não devia marcar downgrade");
});

test("downgrade não dispara quando o teu lado também é lixo variado", () => {
  const you = [line("kangaroo", 4), line("hedgehog", 4)];
  const them = [line("turtle", 5), line("flamingo", 3)];
  const v = evaluateTrade(you, them);
  assert.equal(v.downgrade, false);
});
