/**
 * Gera scripts/pet-names.mjs (mapa nome -> id) a partir do catálogo.
 * Correr: node --import ./scripts/test-register.mjs --experimental-strip-types scripts/gen-pet-names.mjs
 */
import { writeFileSync } from "node:fs";
import { PETS } from "../src/lib/pets/catalog.ts";

const rows = [];
const seen = new Set();
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
for (const p of PETS) {
  const add = (name) => {
    const key = name.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(`  "${esc(key)}": "${p.id}",`);
  };
  add(p.name);
  for (const a of p.aliases) add(a);
}
const header = `/**
 * MAPA NOME -> ID gerado automaticamente a partir do catálogo
 * (src/lib/pets/catalog.ts): nome + alcunhas de todos os pets.
 *
 * NÃO EDITAR À MÃO — regenerar com:
 *   node --import ./scripts/test-register.mjs --experimental-strip-types scripts/gen-pet-names.mjs
 */
export const NAME_TO_ID = {
${rows.join("\n")}
};
`;
writeFileSync(new URL("./pet-names.mjs", import.meta.url), header);
console.log("gerado:", rows.length, "nomes para", PETS.length, "pets");
