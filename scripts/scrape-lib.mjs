/**
 * Lógica pura de scraping (sem escrita de ficheiros), reutilizada por
 * scripts/scrape-values.mjs e pelo endpoint de atualização em tempo real do
 * servidor de desenvolvimento (vite). Permite à app, quando corre no PC do
 * utilizador (que tem internet), ir buscar preços frescos diretamente.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

import { NAME_TO_ID as CATALOG_NAMES } from "./pet-names.mjs";

/**
 * Mapa manual (override) para nomes que as fontes usam e que não batem certo
 * com o catálogo gerado. Tem prioridade sobre scripts/pet-names.mjs.
 */
const NAME_TO_ID_OVERRIDES = {
  trex: "t-rex",
};

/** Nome no site da fonte -> id interno do catálogo (273 nomes gerados + overrides). */
export const NAME_TO_ID = { ...CATALOG_NAMES, ...NAME_TO_ID_OVERRIDES };

export const SOURCES = {
  bloxultra: {
    name: "BloxUltra (preços de loja em dinheiro)",
    url: "https://bloxultra.com/adopt-me-values",
  },
  eldorado: {
    name: "Eldorado (intervalos de mercado)",
    url: "https://www.eldorado.gg/blog/adopt-me-trading-values/",
  },
  gameguide: {
    name: "Game.Guide (verificação por pet)",
    url: "https://www.game.guide/adopt-me-value-list",
  },
};

export const money = (n) => Math.round(n * 100) / 100;

async function fetchHtml(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function idFor(rawName) {
  const n = rawName
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*(fr|nfr|mfr|fly ride|mega)\s*.*$/i, "");
  return NAME_TO_ID[n] ?? null;
}

function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

export function parseBloxUltra(html) {
  const out = {};
  const text = toText(html);
  const re = /([A-Z][A-Za-z'\- ]{2,30}?)\s*\$([0-9]{1,4}(?:\.[0-9]{2})?)/g;
  let m;
  while ((m = re.exec(text))) {
    const id = idFor(m[1]);
    if (!id) continue;
    const price = money(Number(m[2]));
    if (!out[id]) out[id] = { frUsd: price, source: "bloxultra" };
  }
  return out;
}

export function parseEldorado(html) {
  const out = {};
  const text = toText(html).replace(/[–—]/g, "-");
  const re =
    /([A-Z][A-Za-z'\- ]{2,30}?)\s+FR\s.*?\$([0-9,]+(?:\.[0-9]{2})?)\s*-\s*\$([0-9,]+(?:\.[0-9]{2})?)/g;
  let m;
  while ((m = re.exec(text))) {
    const id = idFor(m[1]);
    if (!id) continue;
    const low = money(Number(m[2].replace(/,/g, "")));
    const high = money(Number(m[3].replace(/,/g, "")));
    if (!out[id]) {
      out[id] = {
        frUsd: money((low + high) / 2),
        lowUsd: low,
        highUsd: high,
        source: "eldorado",
      };
    }
  }
  return out;
}

/**
 * Vai buscar as fontes e devolve o objeto market data. Cada fonte é
 * independente: se uma falhar, usa-se a outra (e nunca se lança).
 * existingMeta preserva o scrapedAt da recolha anterior quando TODAS as
 * fontes falham — assim a app não mostra "atualizado" com dados velhos.
 */
export async function fetchMarketData(existingPets = {}, existingMeta = {}) {
  const pets = { ...existingPets };
  const errors = [];

  const [bloxRes, eldoRes] = await Promise.allSettled([
    fetchHtml(SOURCES.bloxultra.url).then(parseBloxUltra),
    fetchHtml(SOURCES.eldorado.url).then(parseEldorado),
  ]);
  let blox = {};
  let eldo = {};
  if (bloxRes.status === "fulfilled") blox = bloxRes.value;
  else errors.push(`bloxultra: ${bloxRes.reason?.message ?? "falhou"}`);
  if (eldoRes.status === "fulfilled") eldo = eldoRes.value;
  else errors.push(`eldorado: ${eldoRes.reason?.message ?? "falhou"}`);

  for (const [id, row] of Object.entries(eldo)) {
    pets[id] = { ...pets[id], ...row, ...(pets[id]?.frUsd ? { frUsd: pets[id].frUsd } : {}) };
    // Guarda o preço por plataforma para a matriz de arbitragem.
    if (typeof row.frUsd === "number") {
      pets[id].src = { ...(pets[id].src ?? {}), eldorado: row.frUsd };
    }
  }
  for (const [id, row] of Object.entries(blox)) {
    pets[id] = { ...pets[id], frUsd: row.frUsd, source: "bloxultra" };
    if (typeof row.frUsd === "number") {
      pets[id].src = { ...(pets[id].src ?? {}), bloxultra: row.frUsd };
    }
  }

  const live = errors.length < 2;
  return {
    meta: {
      // Só atualizamos o carimbo de tempo se pelo menos uma fonte respondeu.
      scrapedAt: live
        ? new Date().toISOString()
        : (existingMeta.scrapedAt ?? new Date().toISOString()),
      currency: "USD",
      variant: "fr",
      live,
      errors,
      sources: Object.entries(SOURCES).map(([id, s]) => ({ id, name: s.name, url: s.url })),
    },
    pets,
  };
}

// ---------------------------------------------------------------------------
// Verificação por pet na Game.Guide (valores de todas as variantes, unidade
// "AMV" da comunidade). É a fonte que a app usa no botão "Verificar na net"
// para o utilizador conferir um pet específico contra a app.
// ---------------------------------------------------------------------------

/** "Sugar Glider" -> "sugar-glider" (padrão de URL da Game.Guide). */
export function gameGuideSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** URL da página de valores da Game.Guide para um pet. */
export function gameGuideUrl(name) {
  return `https://www.game.guide/${gameGuideSlug(name)}-value-adopt-me`;
}

const GG_LABELS = [
  "Mega Fly Ride",
  "Neon Fly Ride",
  "Mega Ride",
  "Mega Fly",
  "Neon Fly",
  "Neon Ride",
  "Fly Ride",
  "Normal",
  "Mega",
  "Neon",
  "Fly",
  "Ride",
];

/** "2.9K" -> 2900 · "1,0K" -> 1000 · "946" -> 946 */
export function parseGgNumber(raw) {
  const m = /^([0-9]+(?:[.,][0-9]+)?)\s*([KM])?$/i.exec(raw.trim());
  if (!m) return null;
  let n = Number(m[1].replace(",", "."));
  const suffix = m[2]?.toUpperCase();
  if (suffix === "K") n *= 1000;
  if (suffix === "M") n *= 1_000_000;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
}

/**
 * Extrai a tabela "Trading Values" (todas as variantes) do HTML da página de
 * um pet na Game.Guide. É tolerante: se uma variante faltar no HTML, simples-
 * mente não aparece no resultado.
 */
export function parseGameGuide(html) {
  const text = toText(html).replace(/[–—]/g, "-");
  const start = text.indexOf("Trading Values");
  if (start === -1) return { gg: {}, variants: {} };
  const endIdx = ["Related Values", "Contents", "Frequently Asked"].map((s) =>
    text.indexOf(s, start),
  );
  const stop = Math.min(...endIdx.filter((i) => i !== -1), text.length);
  const section = text.slice(start, stop);

  const gg = {};
  let cursor = 0;
  while (cursor < section.length) {
    let hit = null;
    for (const label of GG_LABELS) {
      const at = section.indexOf(label, cursor);
      if (at !== -1 && (hit === null || at < hit.at)) hit = { label, at };
    }
    if (!hit) break;
    const rest = section.slice(hit.at + hit.label.length, hit.at + hit.label.length + 12);
    // Número colado ao sufixo (67M), nunca separado por espaço — "67 Mega" é o
    // valor 67 seguido do rótulo "Mega", não 67 milhões.
    const num = /^\s+([\d.,]+)([KM]\b)?/i.exec(rest);
    if (num) {
      const value = parseGgNumber(num[1] + (num[2] ?? ""));
      if (value !== null && gg[hit.label] === undefined) gg[hit.label] = value;
      cursor = hit.at + hit.label.length + num[0].length;
    } else {
      cursor = hit.at + hit.label.length;
    }
  }

  const MAP = {
    Normal: "regular",
    Fly: "fly",
    Ride: "ride",
    "Fly Ride": "fr",
    "Neon Fly Ride": "nfr",
    "Mega Fly Ride": "mfr",
  };
  const variants = {};
  for (const [label, variant] of Object.entries(MAP)) {
    if (gg[label] !== undefined) variants[variant] = gg[label];
  }
  return { gg, variants };
}

/**
 * Vai à Game.Guide buscar os valores atuais de UM pet (todas as variantes).
 * Lança se a página não existir ou a rede falhar — o chamador decide como
 * degradar (a app mostra as ligações de verificação na mesma).
 */
export async function verifyPetOnWeb(name) {
  const url = gameGuideUrl(name);
  const html = await fetchHtml(url);
  const { gg, variants } = parseGameGuide(html);
  if (Object.keys(variants).length === 0) {
    throw new Error(`sem valores na página da Game.Guide para "${name}"`);
  }
  const updated =
    /Values updated (.+?)\s+(?:About|Related|Contents|Frequently|$)/
      .exec(toText(html))?.[1]
      ?.trim() ?? null;
  return {
    name,
    url,
    source: "gameguide",
    sourceName: SOURCES.gameguide.name,
    checkedAt: new Date().toISOString(),
    updatedLabel: updated,
    /** Tabela completa na unidade da comunidade ("AMV"). */
    gg,
    /** Só as variantes que a app usa: regular/fly/ride/fr/nfr/mfr. */
    variants,
  };
}
