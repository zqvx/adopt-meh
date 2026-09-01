import type { Pet } from "./types";

/**
 * Classificação temática dos pets por origem/evento. Serve para medir o
 * RISCO DE BOLHA: se muito do capital estiver num só tema (ex.: Halloween),
 * um evento novo ou uma reedição pode derreter o valor de um dia para o
 * outro. É uma heurística — os pets não têm tema oficial na base; os ícones
 * de evento conhecidos são mapeados aqui e o resto cai em "loja/comum".
 */
export type ThemeKey =
  | "halloween"
  | "christmas"
  | "safari"
  | "jungle"
  | "farm"
  | "aussie"
  | "fossil"
  | "ocean"
  | "mythic"
  | "lunar"
  | "robux"
  | "misc"
  | "eggs"
  | "potions";

export const THEME_LABEL: Record<ThemeKey, string> = {
  halloween: "pets de Halloween",
  christmas: "pets de Natal / Inverno",
  safari: "pets do Ovo Safari",
  jungle: "pets do Ovo Jungle",
  farm: "pets do Ovo da Quinta",
  aussie: "pets do Ovo Aussie",
  fossil: "pets do Ovo Fóssil",
  ocean: "pets do Ovo Oceano",
  mythic: "pets do Ovo Mítico",
  lunar: "pets do Ano Novo Lunar",
  robux: "pets Robux / permanentes",
  misc: "pets de loja / comuns",
  eggs: "ovos",
  potions: "poções",
};

const PET_THEME: Record<string, ThemeKey> = {
  // Halloween
  "bat-dragon": "halloween",
  "shadow-dragon": "halloween",
  "evil-unicorn": "halloween",
  "vampire-dragon": "halloween",
  "ghost-dragon": "halloween",
  "skele-rex": "halloween",
  "zombie-buffalo": "halloween",
  "zombie-wolf": "halloween",
  "undead-elk": "halloween",
  "black-panther": "halloween",
  cerberus: "halloween",
  // Natal / Inverno
  "frost-dragon": "christmas",
  "frost-fury": "christmas",
  "arctic-reindeer": "christmas",
  "snow-owl": "christmas",
  "polar-bear": "christmas",
  snowman: "christmas",
  dalmatian: "christmas",
  // Ovo Safari
  giraffe: "safari",
  lion: "safari",
  flamingo: "safari",
  elephant: "safari",
  hyena: "safari",
  // Ovo Jungle
  parrot: "jungle",
  capybara: "jungle",
  crocodile: "jungle",
  "fennec-fox": "jungle",
  // Ovo da Quinta (Farm)
  crow: "farm",
  owl: "farm",
  pig: "farm",
  cow: "farm",
  chicken: "farm",
  "silly-duck": "farm",
  // Ovo Aussie
  turtle: "aussie",
  kangaroo: "aussie",
  koala: "aussie",
  bandicoot: "aussie",
  // Ovo Fóssil
  "t-rex": "fossil",
  dodo: "fossil",
  "ground-sloth": "fossil",
  // Ovo Oceano
  shark: "ocean",
  octopus: "ocean",
  narwhal: "ocean",
  dolphin: "ocean",
  squid: "ocean",
  crab: "ocean",
  stingray: "ocean",
  // Ovo Mítico
  phoenix: "mythic",
  // Ano Novo Lunar
  "albino-monkey": "lunar",
  "lunar-ox": "lunar",
  ox: "lunar",
  "metal-ox": "lunar",
  "maneki-neko": "lunar",
  // Robux / permanente
  griffin: "robux",
  kitsune: "robux",
  "queen-bee": "robux",
  "king-bee": "robux",
  "ninja-monkey": "robux",
  hedgehog: "robux",
  peacock: "robux",
  axolotl: "robux",
  "diamond-butterfly": "robux",
  "diamond-ladybug": "robux",
  "balloon-unicorn": "robux",
  "giant-panda": "robux",
  hawk: "robux",
  "red-panda": "robux",
  "shiba-inu": "robux",
  husky: "robux",
  sloth: "robux",
  "sugar-glider": "robux",
  "tree-kangaroo": "robux",
  chimera: "robux",
  galah: "robux",
  albatross: "robux",
  "abyssinian-cat": "robux",
  "sandbox-turtle": "robux",
  tweetheart: "robux",
  "cheerful-otter": "robux",
  "african-wild-dog": "robux",
};

export function petTheme(pet: Pet): ThemeKey {
  if (pet.category === "egg") return "eggs";
  if (pet.category === "potion") return "potions";
  if (pet.category === "item") return "misc";
  return PET_THEME[pet.id] ?? "misc";
}
