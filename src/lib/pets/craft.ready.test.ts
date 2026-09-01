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
