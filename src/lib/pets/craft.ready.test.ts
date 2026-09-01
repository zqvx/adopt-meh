import { test } from "node:test";
import assert from "node:assert/strict";
import { readyFromInventory } from "./craft.ts";
import type { InventoryItem } from "../store.ts";

const inv = (rows: Array<[string, number, string?]>): InventoryItem[] =>
  rows.map(([petId, qty, variant], i) => ({
    id: String(i),
    petId,
    variant: (variant ?? "regular") as InventoryItem["variant"],
    qty,
  }));

test("4 cópias = dá 1 néon", () => {
  const out = readyFromInventory(inv([["turtle", 4]]));
  assert.equal(out.length, 1);
  assert.equal(out[0].canNeon, true);
  assert.equal(out[0].neons, 1);
  assert.equal(out[0].canMega, false);
});

test("16 cópias = dá 1 mega", () => {
  const out = readyFromInventory(inv([["kangaroo", 16]]));
  assert.equal(out[0].canMega, true);
  assert.equal(out[0].megas, 1);
});

test("3 cópias aparece como 'quase lá' mas não pronto", () => {
  const out = readyFromInventory(inv([["turtle", 3]]));
  assert.equal(out.length, 1);
  assert.equal(out[0].canNeon, false);
});

test("poções/ovos são ignorados", () => {
  const out = readyFromInventory(inv([["ride-potion", 10]]));
  assert.equal(out.length, 0);
});

test("craftar consome 4 bases e junta o néon", () => {
  let itens = inv([["turtle", 4, "regular"], ["kangaroo", 2, "fr"]]);
  // Simula a ação craftPet do store sobre a lista (lógica idêntica).
  const craftPet = (
    list: InventoryItem[],
    petId: string,
    kind: "nfr" | "mfr",
  ): InventoryItem[] => {
    const need = kind === "mfr" ? 16 : 4;
    const bases = ["regular", "fly", "ride", "fr"] as const;
    const lines = list
      .filter((l) => l.petId === petId && bases.includes(l.variant as never))
      .sort((a, b) => a.qty - b.qty);
    let remaining = need;
    const take = new Map<string, number>();
    for (const l of lines) {
      if (remaining <= 0) break;
      const t = Math.min(l.qty, remaining);
      take.set(l.id, t);
      remaining -= t;
    }
    if (remaining > 0) return list;
    let next = list
      .map((l) => ({ ...l, qty: l.qty - (take.get(l.id) ?? 0) }))
      .filter((l) => l.qty > 0);
    const ex = next.find((l) => l.petId === petId && l.variant === kind);
    if (ex) next = next.map((l) => (l.id === ex.id ? { ...l, qty: l.qty + 1 } : l));
    else next = [...next, { id: "n", petId, variant: kind, qty: 1 }];
    return next;
  };

  itens = craftPet(itens, "turtle", "nfr");
  // As 4 turtles base desaparecem...
  assert.equal(itens.filter((i) => i.petId === "turtle").length, 1);
  const result = itens.find((i) => i.petId === "turtle")!;
  assert.equal(result.variant, "nfr");
  assert.equal(result.qty, 1);
  // As outras cópias ficam intactas.
  assert.equal(itens.find((i) => i.petId === "kangaroo")!.qty, 2);
});
