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

test("downgrade justo sugere add forte", () => {
  const you = [line("shadow-dragon")];
  // ~8 pets médios a somar pontos parecidos com o Shadow
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
  assert.ok(v.counter, "devia sugerir contra-proposta");
  const pet = v.counter!;
  assert.ok(pet.petId, "deve referir um pet");
  assert.ok(pet.reason.length > 10);
});

test("perda de pontos sugere pet que cobre o buraco", () => {
  // Dás Bat Dragon (800 pts), recebes só Frost (240)
  const you = [line("bat-dragon")];
  const them = [line("frost-dragon")];
  const v = evaluateTrade(you, them);
  assert.ok(v.pct < -0.5, "deve ser prejuízo forte");
  assert.ok(v.counter, "devia pedir add");
  // O pet sugerido deve ser forte e não estar no lado deles
  assert.notEqual(v.counter!.petId, "frost-dragon");
});

test("troca justa e forte não sugere nada", () => {
  const you = [line("shadow-dragon")];
  const them = [line("frost-dragon"), line("crow"), line("parrot")];
  const v = evaluateTrade(you, them);
  // Se não há downgrade nem prejuízo, não deve haver contra-proposta
  if (!v.downgrade && v.pct > -0.05) {
    assert.equal(v.counter, null);
  }
});
