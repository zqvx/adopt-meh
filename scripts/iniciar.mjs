#!/usr/bin/env node
/**
 * Lançador do terminal para o PC do utilizador (Windows, Mac e Linux).
 *
 * Foi escrito para substituir o `npm run dev` direto no `INICIAR.bat` / no
 * `iniciar.sh`, que tinha quatro fraquezas:
 *
 * 1. **A porta fugia em silêncio.** Sem `--strictPort`, se a 8080 estivesse
 *    ocupada o Vite escolhia outra sozinho e o navegador abria um endereço
 *    morto. Aqui a porta é reservada *antes* de o Vite arrancar e passada com
 *    `--strictPort`: ou arranca nessa porta, ou falha com uma mensagem.
 * 2. **O navegador abria "à sorte".** O `.bat` esperava 8 segundos e rezava.
 *    Em PCs lentos o Vite ainda ia a meio e o Chrome mostrava "ligação
 *    recusada". Aqui o navegador só abre depois de o servidor responder de
 *    facto a um pedido HTTP.
 * 3. **Dependia do PATH e dos shims do Windows.** O `npm run dev` passa por
 *    `node_modules/.bin/vite.cmd`, que some com certas instalações do Node e
 *    obriga a `shell: true`. Aqui o `vite.js` é chamado **pelo caminho** com o
 *    `process.execPath` — o mesmo `node` que já está a correr.
 * 4. **Falhar a abrir o navegador derrubava o servidor.** O erro de `spawn`
 *    chega de forma assíncrona e escapava ao `try/catch`. Aqui vai sempre para
 *    um handler `error`, e antes disso a criança leva `unref()`.
 *
 * O ambiente (`VITE_*`) é mergido exatamente como o `scripts/with-app-env.mjs`
 * faz, para o `VITE_AUTH_ENABLED` não divergir entre este arranque, o `build` e
 * o `preview` (ver o comentário lá).
 *
 * Uso:
 *   node scripts/iniciar.mjs [--port 9000] [--host 127.0.0.1] [--no-browser]
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exitStatusFromChild, isMainModule, mergeAppEnv, readAppEnv } from "./with-app-env.mjs";

/**
 * Portas experimentadas por ordem. A 8123 é a preferida; as outras são a
 * "escada" para quando ela está ocupada (Steam, Jenkins, outro Vite...).
 */
export const DEFAULT_PORT_CANDIDATES = [8123, 8124, 8125, 8126, 8127, 8321, 8322, 8323, 8324, 8325];

/** Bind em todas as interfaces, como o `npm run dev` já fazia. */
export const DEFAULT_HOST = "0.0.0.0";

/** Quantas vezes o servidor é sondado antes de desistir dele. */
export const READY_TIMEOUT_MS = 120_000;
export const READY_INTERVAL_MS = 300;

const USAGE = "uso: node scripts/iniciar.mjs [--port PORTA] [--host ENDEREÇO] [--no-browser]";

function isPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

/**
 * Interpretar os argumentos da linha de comandos.
 *
 * Devolve sempre um objeto: com `error` (string, em vez de `host`/`ports`) ou
 * com as opções. Nunca lança — o lançador corre dentro de uma janela que fecha
 * ao primeiro erro não tratado, e aí o utilizador não lê nada.
 */
export function parseLauncherArgs(argv) {
  let host = DEFAULT_HOST;
  let ports = null;
  let openBrowser = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--port") {
      const value = Number(argv[i + 1]);
      if (!isPort(value)) return { error: `porta inválida: ${argv[i + 1] ?? "(em falta)"}` };
      ports = [value];
      i += 1;
    } else if (arg === "--host") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) return { error: "o --host precisa de um endereço" };
      host = value;
      i += 1;
    } else if (arg === "--no-browser") {
      openBrowser = false;
    } else {
      return { error: `opção desconhecida: ${arg}\n  ${USAGE}` };
    }
  }

  return { host, ports, openBrowser };
}

/**
 * Caminho absoluto do `vite.js` dentro de `node_modules`.
 *
 * Prefere o `bin/vite.js` (o ponto de entrada estável do Vite) e, se uma
 * versão futura o mover, cai para o campo `bin` do `package.json`. `null`
 * quando o Vite não está instalado — o chamador é que explica ao utilizador
 * que tem de correr `npm install`.
 */
export function resolveViteCli(root) {
  const viteDir = join(root, "node_modules", "vite");
  const direct = join(viteDir, "bin", "vite.js");
  if (existsSync(direct)) return direct;

  try {
    const pkg = JSON.parse(readFileSync(join(viteDir, "package.json"), "utf8"));
    const bin = pkg?.bin;
    const relative = typeof bin === "string" ? bin : bin?.vite;
    if (typeof relative === "string") return resolve(viteDir, relative);
  } catch {
    // Sem package.json legível: tratamos como "Vite não instalado".
  }
  return null;
}

/**
 * `true` quando consegue abrir a porta exclusivamente.
 *
 * Reservar (e fechar a seguir) é uma corrida por natureza, mas o intervalo até
 * o Vite arrancar é de milissegundos e, sobretudo, o `--strictPort` transforma
 * uma derrota nessa corrida numa **mensagem de erro** em vez de uma mudança de
 * porta silenciosa.
 */
export function isPortFree(port, host = DEFAULT_HOST) {
  return new Promise((done) => {
    const server = createServer();
    server.once("error", () => done(false));
    server.once("listening", () => {
      server.close(() => done(true));
    });
    server.listen({ port, host, exclusive: true });
  });
}

/**
 * Endereço mostrado ao utilizador e endereço sondado.
 *
 * Com `--host 0.0.0.0` o Vite não escuta em "0.0.0.0" como destino HTTP, e o
 * `localhost` pode resolver para `::1` num PC que só tem IPv4 — daí mostrar
 * `localhost` mas sondar `127.0.0.1`.
 */
export function urlsFor(host, port) {
  const isWildcard = host === "0.0.0.0" || host === "::";
  return {
    display: `http://${isWildcard ? "localhost" : host}:${port}`,
    probe: `http://${isWildcard ? "127.0.0.1" : host}:${port}`,
  };
}

/** `true` para endereços que existem mas não servem para ninguém ligar. */
function isUselessAddress(address) {
  // 169.254/16 é o "endereço automático" que o Windows e o Mac atribuem quando
  // não há rede: aparece nas interfaces mas não chega a lado nenhum.
  return address.startsWith("169.254.");
}

/** Primeiro endereço IPv4 da LAN, para abrir o terminal no telemóvel. */
export function lanUrl(port, { interfaces = networkInterfaces } = {}) {
  for (const list of Object.values(interfaces?.() ?? {})) {
    for (const entry of list ?? []) {
      if (!entry || entry.family !== "IPv4") continue;
      if (entry.internal || isUselessAddress(entry.address)) continue;
      return `http://${entry.address}:${port}`;
    }
  }
  return null;
}

/**
 * Tempo dado a cada sonda antes de se desistir dela.
 *
 * Generoso de propósito: na primeira visita à página o servidor ainda está a
 * compilar o SSR, e abortar esse pedido a meio faz o Vite escrever um erro de
 * `ECONNRESET` na janela — um susto por nada, mesmo ao lado do "[OK] Pronto".
 */
export const PROBE_TIMEOUT_MS = 30_000;

/** Sondar o servidor: qualquer resposta HTTP conta como "está de pé". */
export async function probeServer(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    // Lê-se o corpo até ao fim para o pedido fechar por bem (e não a meio, o
    // que daria novamente erro no servidor). Um 404 ou um 500 também servem:
    // o que interessa é haver alguém a responder.
    await response.arrayBuffer().catch(() => {});
    return response.status >= 200 && response.status < 600;
  } catch {
    return false;
  }
}

/**
 * Esperar que o servidor responda, sondando de `intervalMs` em `intervalMs`.
 *
 * Substitui o `timeout /t 8` do `.bat`: em vez de adivinhar quanto o Vite
 * demora, pergunta-lhe até ele responder.
 */
export async function waitForServer(
  url,
  {
    timeoutMs = READY_TIMEOUT_MS,
    intervalMs = READY_INTERVAL_MS,
    probe = probeServer,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
    clock = () => Date.now(),
    signal,
  } = {},
) {
  const deadline = clock() + timeoutMs;
  for (;;) {
    // `signal` é abortado quando o Vite morre: sem isto ficávamos a sondar um
    // servidor que já não existe — e a promessa pendente impedia o Node de sair.
    if (signal?.aborted) return false;
    if (await probe(url)) return true;
    if (clock() >= deadline || signal?.aborted) return false;
    await sleep(intervalMs);
  }
}

/**
 * Abrir o navegador sem pôr o servidor em risco.
 *
 * O `spawn` falha de forma **assíncrona** (`error`) quando o comando não
 * existe, e sem handler isso é uma exceção não tratada que mata o processo
 * todo — o servidor já a correr incluído. O `unref()` garante que, mesmo
 * depois de aberto, o navegador não impede o Node de sair.
 */
export function openInBrowser(
  url,
  { platform = process.platform, spawnImpl = spawn, onError = () => {} } = {},
) {
  const command = platform === "win32" ? "cmd" : platform === "darwin" ? "open" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawnImpl(command, args, {
      stdio: "ignore",
      // No Windows o `start` já devolve de imediato e desligar o filho
      // deixaria o `cmd` órfão; fora dele o `detached` evita que o Node
      // fique preso ao navegador.
      detached: platform !== "win32",
    });
    child.on("error", (error) => onError(error));
    child.unref();
    return true;
  } catch (error) {
    onError(error);
    return false;
  }
}

/**
 * Arrancar o Vite: pelo caminho do `vite.js`, com o Node que já está a correr.
 * Sem shell, sem `.CMD`, sem PATH.
 */
export function startVite({
  cliPath,
  root,
  port,
  host,
  env = process.env,
  spawnImpl = spawn,
  nodePath = process.execPath,
}) {
  const args = [cliPath, "dev", "--host", host, "--port", String(port), "--strictPort"];
  const child = spawnImpl(nodePath, args, {
    cwd: root,
    env: mergeAppEnv(readAppEnv(root), env),
    stdio: "inherit",
    shell: false,
  });
  return { child, args };
}

/** Mensagem quando as primeiras portas da lista estavam ocupadas. */
export function busyMessage(busyPorts) {
  if (busyPorts.length === 0) return null;
  const what = busyPorts.length === 1 ? "A porta" : "As portas";
  const which = busyPorts.join(", ");
  const verb = busyPorts.length === 1 ? "estava" : "estavam";
  return `[i] ${what} ${which} ${verb} ocupada${busyPorts.length === 1 ? "" : "s"} (Steam, Jenkins ou outro programa).`;
}

/** O Vite que está a correr agora, para os sinais terem quem matar. */
let liveChild = null;
let signalsForwarded = false;

/**
 * Fazer o Ctrl+C (ou o fecho da janela) chegar ao Vite.
 *
 * Sem isto o processo do Vite fica órfão e **a porta fica presa** — o sintoma
 * clássico de "da segunda vez já não arranca". Regista-se uma só vez: a cada
 * `process.on` extra o Node começa a queixar-se de listeners a mais.
 */
function forwardSignalsToChild() {
  if (signalsForwarded) return;
  signalsForwarded = true;
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => liveChild?.kill(signal));
  }
}

/**
 * O lançador completo.
 *
 * Todas as fronteiras com o sistema (portas, spawn, HTTP, navegador) chegam
 * por `options`, para os testes poderem correr isto sem rede nem Vite.
 */
export async function run({
  argv = [],
  root = null,
  log = (message) => console.log(message),
  isFree = isPortFree,
  spawnServer = startVite,
  waitUntilReady = waitForServer,
  openBrowser = openInBrowser,
  interfaces = networkInterfaces,
  env = process.env,
} = {}) {
  const projectDir = root ?? resolve(fileURLToPath(new URL("..", import.meta.url)));
  const args = parseLauncherArgs(argv);
  if (args.error) {
    log(`[ERRO] ${args.error}`);
    return 2;
  }

  const cliPath = resolveViteCli(projectDir);
  if (!cliPath) {
    log("[ERRO] Não encontrei o Vite nesta pasta.");
    log("       Ainda faltam as dependências. Abre o INICIAR.bat outra vez, ou corre:");
    log("         npm install");
    return 127;
  }

  const candidates = args.ports ?? DEFAULT_PORT_CANDIDATES;
  forwardSignalsToChild();

  const busy = [];
  for (const port of candidates) {
    if (!(await isFree(port, args.host))) {
      busy.push(port);
      continue;
    }

    // Só se diz que as outras estavam ocupadas quando há uma que serve: até lá
    // a mensagem não ajudava ninguém, o lançador ainda vai tentar as outras.
    if (busy.length > 0) {
      log(busyMessage(busy));
      busy.length = 0;
    }

    const { display, probe } = urlsFor(args.host, port);
    log(`[..] A arrancar em ${display}`);
    log("     (Ctrl+C nesta janela para parar)");

    const controller = new AbortController();
    const { child } = spawnServer({ cliPath, root: projectDir, port, host: args.host, env });
    liveChild = child;

    let exitInfo = null;
    const finished = new Promise((done) => {
      child.on("error", (error) => {
        log(`[ERRO] Não consegui arrancar o Vite: ${error?.message ?? error}`);
        done({ status: 127, error });
      });
      child.on("exit", (code, signal) => done({ status: exitStatusFromChild(code, signal) }));
    }).then((info) => {
      exitInfo = info;
      controller.abort();
      return info;
    });

    const ready = await waitUntilReady(probe, { signal: controller.signal });

    if (!ready && exitInfo) {
      // O Vite desistiu antes de responder (porta entretanto ocupada, ou erro
      // de configuração). Em vez de deixar a janela com um erro e a porta
      // presa, passa-se à porta seguinte.
      log(
        `[i] A porta ${port} não deu (o Vite saiu com o código ${exitInfo.status}). A tentar a seguinte.`,
      );
      continue;
    }

    if (!ready) {
      log("[i] O servidor ainda não responde. Se ele escreveu outro endereço acima, usa esse.");
    } else {
      log(`[OK] Pronto: ${display}`);
      const lan = lanUrl(port, { interfaces });
      if (lan) log(`[i] No telemóvel (mesmo Wi-Fi): ${lan}`);
      if (args.openBrowser) {
        openBrowser(display, {
          onError: (error) =>
            log(
              `[i] Não consegui abrir o navegador (${error?.code ?? error}). O servidor continua a correr em ${display}.`,
            ),
        });
      }
    }

    return (await finished).status;
  }

  if (busy.length > 0) log(busyMessage(busy));
  log("[ERRO] Não consegui arrancar em nenhuma das portas habituais.");
  log("       Fecha o programa que as estiver a usar, ou escolhe outra à mão:");
  log("         node scripts/iniciar.mjs --port 9000");
  return 1;
}

if (isMainModule(import.meta.url)) {
  const code = await run({ argv: process.argv.slice(2) });
  process.exit(code);
}
