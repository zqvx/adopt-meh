#!/usr/bin/env node
/**
 * Bot de Discord para medir HYPE/PROCURA em tempo real (ponto #2).
 *
 * Liga-se a um servidor de Discord (precisa de um BOT TOKEN com permissão de
 * leitura de mensagens) e conta, nos canais de trading, quantas vezes cada
 * pet é mencionado num intervalo. Normaliza para um score 0..100 e grava em
 * public/data/hype.json, que o terminal consome (separadores Ao Vivo /
 * Investir).
 *
 * Configuração por variáveis de ambiente:
 *   DISCORD_TOKEN     = token do bot de Discord
 *   DISCORD_CHANNELS  = ids de canais separados por vírgula (ex.: "123,456")
 *   DISCORD_WINDOW_MS = janela a contar (default 6h)
 *
 * Modos:
 *   node scripts/discord-hype.mjs --once     lê o histórico recente e grava
 *   node scripts/discord-hype.mjs --watch     fica a escutar e atualiza a cada 5 min
 *   node scripts/discord-hype.mjs --webhook   inicia um recetor HTTP de webhook
 *
 * Sem token, o script não faz nada (o terminal usa a semente hype.json).
 *
 * Alternativa simples (sem bot): aponta um webhook do Discord para um servidor
 * teu que reencaminhe eventos para POST /api/hype — o terminal lê sempre do
 * hype.json, pelo que qualquer fonte que escreva esse ficheiro funciona.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = resolve(ROOT, "public/data/hype.json");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNELS = (process.env.DISCORD_CHANNELS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const WINDOW_MS = Number(process.env.DISCORD_WINDOW_MS ?? 6 * 60 * 60 * 1000);

// Palavras-chave (minúsculas) -> id do pet. Conta menções em mensagens.
const KEYWORDS = {
  "bat dragon": "bat-dragon", batdragon: "bat-dragon",
  "shadow dragon": "shadow-dragon", shadow: "shadow-dragon",
  "frost dragon": "frost-dragon", frost: "frost-dragon",
  giraffe: "giraffe", girafa: "giraffe",
  owl: "owl", coruja: "owl",
  parrot: "parrot", papagaio: "parrot",
  crow: "crow", corvo: "crow",
  "evil unicorn": "evil-unicorn", eviluni: "evil-unicorn",
  "arctic reindeer": "arctic-reindeer", arctic: "arctic-reindeer",
  "african wild dog": "african-wild-dog", awd: "african-wild-dog",
  "balloon unicorn": "balloon-unicorn", balloon: "balloon-unicorn",
  "giant panda": "giant-panda", panda: "giant-panda",
  turtle: "turtle", tartaruga: "turtle",
  kangaroo: "kangaroo", canguru: "kangaroo",
  "frost fury": "frost-fury",
  unicorn: "unicorn",
  dragon: "dragon",
  hedgehog: "hedgehog",
  flamingo: "flamingo",
  albino: "albino-monkey",
};

function countMentions(messages) {
  const counts = {};
  for (const text of messages) {
    const lower = text.toLowerCase();
    for (const [kw, id] of Object.entries(KEYWORDS)) {
      // Conta ocorrências da palavra-chave como palavra inteira.
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
      const hits = lower.match(re)?.length ?? 0;
      if (hits) counts[id] = (counts[id] ?? 0) + hits;
    }
  }
  return counts;
}

function toScores(counts) {
  const ids = Object.keys(counts);
  if (ids.length === 0) return { hype: {}, mentions: {} };
  const max = Math.max(...Object.values(counts));
  const hype = {};
  for (const id of ids) {
    // Score logarítmico para um único pet não esmagar os outros.
    hype[id] = Math.round(
      20 + 80 * (Math.log1p(counts[id]) / Math.log1p(max)),
    );
  }
  return { hype, mentions: counts };
}

async function writeHype(counts) {
  const { hype, mentions } = toScores(counts);
  const result = {
    meta: { updatedAt: new Date().toISOString(), source: "discord", windowMs: WINDOW_MS },
    hype,
    mentions,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(
    `hype.json atualizado: ${Object.keys(hype).length} pets · top: ${Object.entries(hype)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, s]) => `${id} ${s}`)
      .join(", ")}`,
  );
}

async function fetchRecent(channelId) {
  const after = Date.now() - WINDOW_MS;
  const url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bot ${TOKEN}` },
  });
  if (!res.ok) {
    console.warn(`Canal ${channelId}: HTTP ${res.status}`);
    return [];
  }
  const msgs = await res.json();
  return msgs
    .filter((m) => Date.parse(m.timestamp) >= after)
    .map((m) => m.content ?? "");
}

async function runOnce() {
  const all = [];
  for (const ch of CHANNELS) {
    all.push(...(await fetchRecent(ch)));
  }
  const counts = countMentions(all);
  await writeHype(counts);
}

function runWebhook() {
  // Recebe POSTs { content: "..." } de um reencaminhador e atualiza o hype.
  const tally = {};
  const server = createServer((req, res) => {
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const { content } = JSON.parse(body);
          if (content) Object.assign(tally, countMentions([content]));
          res.writeHead(200).end("ok");
        } catch {
          res.writeHead(400).end("bad");
        }
      });
    } else res.writeHead(200).end("hype webhook");
  });
  const port = Number(process.env.PORT ?? 8090);
  server.listen(port, () => console.log(`Webhook de hype à escuta em :${port}`));
  setInterval(() => writeHype(tally), 5 * 60 * 1000);
}

async function main() {
  if (process.argv.includes("--webhook")) return runWebhook();
  if (!TOKEN || CHANNELS.length === 0) {
    console.warn(
      "Sem DISCORD_TOKEN/DISCORD_CHANNELS — o terminal usa a semente hype.json.\n" +
        "Define as variáveis e corre: node scripts/discord-hype.mjs --once",
    );
    return;
  }
  if (process.argv.includes("--watch")) {
    await runOnce();
    setInterval(runOnce, 5 * 60 * 1000);
  } else {
    await runOnce();
  }
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
