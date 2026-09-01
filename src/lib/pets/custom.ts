/**
 * Pets personalizados — o utilizador pode registar qualquer pet que não
 * esteja no catálogo (o Adopt Me tem 730+ e o catálogo é manual). Ficam
 * guardados no localStorage e o getPet() do catálogo devolve-os como se
 * fizessem parte do jogo, por isso funcionam em trocas, inventário e craft.
 */
import { useSyncExternalStore } from "react";
import type {
  Glyph,
  Liquidity,
  Pet,
  Tier,
  Variant,
  VariantValue,
} from "./types";
import { FX } from "../format";

const KEY = "nexus-custom-pets-v1";

export interface CustomPetInput {
  name: string;
  /** Tier de raridade (S lendário topo … D comum). */
  tier: Tier;
  variant: Variant;
  /** Valor em EUR (o utilizador é PT; conversão feita na app). */
  eurValue: number;
  demand?: 1 | 2 | 3 | 4 | 5;
  liquidity?: Liquidity;
}

/** Raridades do Adopt Me mapeadas para o tier interno. */
export const RARITY_TIER: Record<string, Tier> = {
  Lendário: "A",
  "Ultra-raro": "B",
  Raro: "C",
  Incomum: "D",
  Comum: "D",
};

const TIER_GLYPH: Record<Tier, Glyph> = {
  S: "void",
  A: "sun",
  B: "frost",
  C: "teal",
  D: "moss",
};

const TIER_LIQ: Record<Tier, Liquidity> = {
  S: "high",
  A: "high",
  B: "medium",
  C: "low",
  D: "trash",
};

const TIER_DEMAND: Record<Tier, 1 | 2 | 3 | 4 | 5> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

// Multiplicadores de variante (iguais à lógica do catálogo).
const MUL: Record<Variant, number> = {
  regular: 0.86,
  fly: 0.92,
  ride: 0.95,
  fr: 1,
  nfr: 2.45,
  mfr: 6.15,
};

// €/$ — mesmo câmbio usado na app (FX.EUR: 1 $ = 0.86 € → EUR ÷ FX.EUR = USD).
const USD_PER_EUR = 1 / FX.EUR;

let cache: Pet[] | null = null;
const listeners = new Set<() => void>();

function slugify(name: string) {
  return (
    "custom-" +
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );
}

function roundMoney(n: number) {
  if (n >= 100) return Math.round(n);
  if (n >= 20) return Math.round(n * 2) / 2;
  if (n >= 5) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

function roundPts(n: number) {
  if (n >= 50) return Math.round(n);
  if (n >= 10) return Math.round(n * 2) / 2;
  return Math.round(n * 10) / 10;
}

function read(): Pet[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cache = [];
      return cache;
    }
    const parsed = JSON.parse(raw) as Pet[];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(pets: Pet[]) {
  cache = pets;
  try {
    localStorage.setItem(KEY, JSON.stringify(pets));
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((fn) => fn());
}

export function getCustomPets(): Pet[] {
  return read();
}

export function getCustomPet(id: string): Pet | undefined {
  return read().find((p) => p.id === id);
}

/** Procura pets personalizados por nome/alias. */
export function searchCustomPets(query: string, limit = 6): Pet[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return read()
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

export function addCustomPet(input: CustomPetInput): Pet {
  const pets = read();
  const id = slugify(input.name);
  const usdFr = roundMoney(input.eurValue * USD_PER_EUR);
  // Referência: ~$0.55 por ponto (ride potion ≈ 2.5 pts ≈ $1.2–1.4).
  const ptsFr = Math.max(0.5, roundPts(usdFr / 0.55));

  const values = {} as Record<Variant, VariantValue>;
  (Object.keys(MUL) as Variant[]).forEach((variant) => {
    values[variant] = {
      points: roundPts(ptsFr * MUL[variant]),
      usd: roundMoney(usdFr * MUL[variant]),
    };
  });

  // Substitui se já existir um pet personalizado com o mesmo id.
  const pet: Pet = {
    id,
    name: input.name.trim(),
    aliases: [input.name.trim().toLowerCase()],
    category: "pet",
    tier: input.tier,
    liquidity: input.liquidity ?? TIER_LIQ[input.tier],
    demand: input.demand ?? TIER_DEMAND[input.tier],
    hasVariants: true,
    glyph: TIER_GLYPH[input.tier],
    values,
  };

  const existing = pets.findIndex((p) => p.id === id);
  if (existing >= 0) pets[existing] = pet;
  else pets.push(pet);
  write(pets);
  return pet;
}

export function removeCustomPet(id: string) {
  write(read().filter((p) => p.id !== id));
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Hook: re-renderiza o componente quando os pets personalizados mudam. */
export function useCustomPetsVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => read().length,
    () => 0,
  );
}
