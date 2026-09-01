/**
 * Lógica pura de scraping (sem escrita de ficheiros), reutilizada por
 * scripts/scrape-values.mjs e pelo endpoint de atualização em tempo real do
 * servidor de desenvolvimento (vite). Permite à app, quando corre no PC do
 * utilizador (que tem internet), ir buscar preços frescos diretamente.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export const NAME_TO_ID = {
  "bat dragon": "bat-dragon",
  "shadow dragon": "shadow-dragon",
  "giraffe": "giraffe",
  "frost dragon": "frost-dragon",
  "owl": "owl",
  "parrot": "parrot",
  "crow": "crow",
  "evil unicorn": "evil-unicorn",
  "african wild dog": "african-wild-dog",
  "giant panda": "giant-panda",
  "balloon unicorn": "balloon-unicorn",
  "arctic reindeer": "arctic-reindeer",
  "cow": "cow",
  "turtle": "turtle",
  "kangaroo": "kangaroo",
  "unicorn": "unicorn",
  "dragon": "dragon",
  "queen bee": "queen-bee",
  "king bee": "king-bee",
  "hedgehog": "hedgehog",
  "flamingo": "flamingo",
  "lion": "lion",
  "dalmatian": "dalmatian",
  "hawk": "hawk",
  "vampire dragon": "vampire-dragon",
  "lavender dragon": "lavender-dragon",
  "ghost dragon": "ghost-dragon",
  "phoenix": "phoenix",
  "t-rex": "t-rex",
  "trex": "t-rex",
  "dodo": "dodo",
  "griffin": "griffin",
  "shark": "shark",
  "sugar glider": "sugar-glider",
  "kitsune": "kitsune",
  "octopus": "octopus",
  "frost fury": "frost-fury",
};

export const SOURCES = {
  bloxultra: {
    name: "BloxUltra (preços de loja em dinheiro)",
    url: "https://bloxultra.com/adopt-me-values",
  },
  eldorado: {
    name: "Eldorado (intervalos de mercado)",
    url: "https://www.eldorado.gg/blog/adopt-me-trading-values/",
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
