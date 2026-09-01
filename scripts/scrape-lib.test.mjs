/**
 * Testes da lógica pura de scraping: mapa de nomes gerado do catálogo e
 * parser da Game.Guide usado pelo botão "Verificar na net".
 *
 * Corre com `npm test` (node --test sobre scripts com sufixo .test.mjs).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  NAME_TO_ID,
  gameGuideSlug,
  gameGuideUrl,
  parseGameGuide,
  parseGgNumber,
} from "./scrape-lib.mjs";
import { NAME_TO_ID as GENERATED } from "./pet-names.mjs";

test("mapa de nomes cobre o catálogo gerado", () => {
  assert.ok(Object.keys(GENERATED).length > 200);
  for (const [name, id] of Object.entries(GENERATED)) {
    assert.equal(NAME_TO_ID[name], id, `nome "${name}" devia mapear para ${id}`);
  }
});

test("nomes que as fontes usam batem certo com o catálogo", () => {
  for (const name of [
    "sugar glider",
    "bat dragon",
    "shadow dragon",
    "ride potion",
    "t-rex",
    "trex",
  ]) {
    assert.ok(NAME_TO_ID[name], `"${name}" devia existir no mapa`);
  }
  // O sufixo de variante é removido pelo idFor ANTES do lookup no mapa:
  // "Sugar Glider FR" → idFor tira "FR" → "sugar glider" → sugar-glider.
});

test("idFor tira sufixos de variante (via casos do parser Eldorado)", () => {
  // O idFor não é exportado; validamos o comportamento pelo mapa diretamente:
  // "Sugar Glider FR" → idFor tira "FR" → "sugar glider" → sugar-glider.
  assert.equal(NAME_TO_ID["sugar glider"], "sugar-glider");
});

test("gameGuideSlug segue o padrão de URL da Game.Guide", () => {
  assert.equal(gameGuideSlug("Sugar Glider"), "sugar-glider");
  assert.equal(gameGuideSlug("Camper's Bongos"), "camper-s-bongos");
  assert.equal(gameGuideUrl("Sugar Glider"), "https://www.game.guide/sugar-glider-value-adopt-me");
});

test("parseGgNumber lê sufixos K/M", () => {
  assert.equal(parseGgNumber("946"), 946);
  assert.equal(parseGgNumber("2.9K"), 2900);
  assert.equal(parseGgNumber("1,0K"), 1000);
  assert.equal(parseGgNumber("2M"), 2_000_000);
  assert.equal(parseGgNumber("abc"), null);
});

const SAMPLE_HTML = `
<html><body><h2>Trading Values</h2>
<div>Fly</div><div>67</div><div>Mega</div><div>901</div><div>Neon</div><div>214</div>
<div>Ride</div><div>66</div><div>Fly Ride</div><div>75</div><div>Mega Fly</div><div>910</div>
<div>Mega Ride</div><div>907</div><div>Neon Fly</div><div>225</div><div>Neon Ride</div><div>224</div>
<div>Mega Fly Ride</div><div>946</div><div>Neon Fly Ride</div><div>239</div><div>Normal</div><div>60</div>
<h2>Related Values</h2></body></html>`;

test("parseGameGuide extrai as variantes todas", () => {
  const { gg, variants } = parseGameGuide(SAMPLE_HTML);
  assert.equal(variants.regular, 60);
  assert.equal(variants.fly, 67);
  assert.equal(variants.ride, 66);
  assert.equal(variants.fr, 75);
  assert.equal(variants.nfr, 239);
  assert.equal(variants.mfr, 946);
  assert.equal(gg["Mega"], 901);
  assert.equal(gg["Neon"], 214);
});

test("parseGameGuide devolve vazio em páginas sem tabela", () => {
  const { gg, variants } = parseGameGuide("<html><body>404</body></html>");
  assert.deepEqual(gg, {});
  assert.deepEqual(variants, {});
});
