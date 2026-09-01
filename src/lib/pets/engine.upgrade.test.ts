import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateTrade, liquidityScore } from "./engine.ts";
import type { TradeLine } from "./types.ts";

const line = (petId: string, qty = 1): TradeLine => ({
  id: Math.random().toString(36).slice(2),
  petId,
  variant: "fr",
  qty,
});

test("liquidez: trash tem nota muito baixa, high tier alta", () => {
  const trash = liquidityScore("trash", 1, "D");
  const god = liquidityScore("high", 5, "S");
  assert.ok(trash <= 2, `trash devia ser <=2, deu ${trash}`);
  assert.ok(god >= 8, `S/high devia ser >=8, deu ${god}`);
});

test("upgrade (vários médios por 1 forte) pede overpay", () => {
  // TU dás vários pets médios, ELE dá 1 Shadow
  const you = [
    line("kangaroo", 4),
    line("turtle", 3),
    line("hedgehog", 3),
  ];
  const them = [line("shadow-dragon")];
  const v = evaluateTrade(you, them);
  assert.equal(v.upgrade, true, "devia detetar upgrade");
  assert.ok(v.overpayDetail.includes("overpay"));
});

test("não confunde downgrade com upgrade no lado errado", () => {
  // TU dás 1 Shadow, ELE dá médios = downgrade, NÃO upgrade
  const you = [line("shadow-dragon")];
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
  assert.equal(v.downgrade, true);
  assert.equal(v.upgrade, false);
});
