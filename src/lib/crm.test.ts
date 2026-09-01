import assert from "node:assert/strict";
import { test } from "node:test";
import {
  daysSince,
  isWhale,
  matchCustomers,
  normalizeHandle,
  topSpendEur,
  withPurchase,
  type Customer,
} from "./crm-match.ts";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 1);

function customer(
  handle: string,
  purchases: { petId: string; eur: number; daysAgo: number }[],
): Customer {
  const rows = purchases.map((p) => ({
    ts: NOW - p.daysAgo * DAY,
    petId: p.petId,
    variant: "fr" as const,
    eur: p.eur,
  }));
  return {
    id: handle,
    handle,
    platform: "discord",
    purchases: rows,
    totalEur: rows.reduce((s, p) => s + p.eur, 0),
    firstTs: Math.min(...rows.map((r) => r.ts)),
    lastTs: Math.max(...rows.map((r) => r.ts)),
  };
}

test("normalizeHandle tira o @, espaços e maiúsculas", () => {
  assert.equal(normalizeHandle(" @SniperBoy2012 "), "sniperboy2012");
  assert.equal(normalizeHandle("@@dup"), "dup");
  assert.equal(normalizeHandle("   "), "");
});

test("baleia = gastou 40 € ou repetiu compra", () => {
  assert.equal(isWhale(customer("a", [{ petId: "owl", eur: 50, daysAgo: 5 }])), true);
  assert.equal(
    isWhale(
      customer("b", [
        { petId: "owl", eur: 10, daysAgo: 5 },
        { petId: "crow", eur: 12, daysAgo: 30 },
      ]),
    ),
    true,
  );
  assert.equal(isWhale(customer("c", [{ petId: "owl", eur: 8, daysAgo: 5 }])), false);
});

test("quem já comprou o mesmo pet vem primeiro", () => {
  const same = customer("sniperboy2012", [{ petId: "turtle", eur: 12, daysAgo: 20 }]);
  const band = customer("randomguy", [{ petId: "owl", eur: 11, daysAgo: 15 }]);
  const matches = matchCustomers({ petId: "turtle", priceEur: 10 }, [band, same], NOW);
  assert.equal(matches[0].customer.handle, "sniperboy2012");
  assert.equal(matches[0].reason, "same-pet");
  assert.ok(matches[0].score > matches[1].score);
});

test("faixa de preço: item caro demais não é sugerido a cliente pequeno", () => {
  const small = customer("smallfish", [{ petId: "owl", eur: 5, daysAgo: 10 }]);
  const matches = matchCustomers({ petId: "shadow-dragon", priceEur: 90 }, [small], NOW);
  assert.equal(matches.length, 0);
});

test("cliente inativo há muito tempo perde peso", () => {
  const fresh = customer("fresh", [{ petId: "owl", eur: 40, daysAgo: 3 }]);
  const cold = customer("cold", [{ petId: "owl", eur: 40, daysAgo: 200 }]);
  const matches = matchCustomers({ petId: "crow", priceEur: 40 }, [cold, fresh], NOW);
  assert.equal(matches[0].customer.handle, "fresh");
  assert.ok(matches[0].score > matches[1].score);
});

test("clientes sem compras nunca entram nas sugestões", () => {
  const empty: Customer = {
    id: "x",
    handle: "novato",
    platform: "discord",
    purchases: [],
    totalEur: 0,
    firstTs: NOW,
    lastTs: NOW,
  };
  assert.deepEqual(matchCustomers({ petId: "owl", priceEur: 10 }, [empty], NOW), []);
});

test("withPurchase soma o total e atualiza a última compra", () => {
  const base = customer("bob", [{ petId: "owl", eur: 10, daysAgo: 30 }]);
  const next = withPurchase(base, {
    ts: NOW,
    petId: "crow",
    variant: "fr",
    eur: 15.5,
  });
  assert.equal(next.purchases.length, 2);
  assert.equal(next.totalEur, 25.5);
  assert.equal(next.lastTs, NOW);
  assert.equal(topSpendEur(next), 15.5);
  // Não muta o original.
  assert.equal(base.purchases.length, 1);
});

test("daysSince conta dias inteiros", () => {
  assert.equal(daysSince(NOW, NOW), 0);
  assert.equal(daysSince(NOW - 3.5 * DAY, NOW), 3);
});
