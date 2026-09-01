import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, test } from "node:test";
import {
  busyMessage,
  isPortFree,
  lanUrl,
  openInBrowser,
  parseLauncherArgs,
  probeServer,
  resolveViteCli,
  run,
  urlsFor,
  waitForServer,
} from "./iniciar.mjs";

const fixtures = [];

/** Uma pasta temporária com um `node_modules/vite` falso lá dentro. */
function fakeProject({ binField } = {}) {
  const root = mkdtempSync(join(tmpdir(), "iniciar-"));
  fixtures.push(root);
  const viteDir = join(root, "node_modules", "vite");
  if (binField) {
    mkdirSync(viteDir, { recursive: true });
    writeFileSync(join(viteDir, "package.json"), JSON.stringify(binField));
  } else {
    mkdirSync(join(viteDir, "bin"), { recursive: true });
    writeFileSync(join(viteDir, "bin", "vite.js"), "// vite\n");
  }
  return root;
}

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- argumentos

test("parseLauncherArgs sem argumentos usa as predefinições", () => {
  assert.deepEqual(parseLauncherArgs([]), {
    host: "0.0.0.0",
    ports: null,
    openBrowser: true,
  });
});

test("parseLauncherArgs aceita --port, --host e --no-browser", () => {
  assert.deepEqual(parseLauncherArgs(["--port", "9000"]).ports, [9000]);
  assert.equal(parseLauncherArgs(["--host", "127.0.0.1"]).host, "127.0.0.1");
  assert.equal(parseLauncherArgs(["--no-browser"]).openBrowser, false);
  assert.deepEqual(parseLauncherArgs(["--port", "8123", "--no-browser"]), {
    host: "0.0.0.0",
    ports: [8123],
    openBrowser: false,
  });
});

test("parseLauncherArgs recusa portas inválidas sem lançar exceção", () => {
  for (const argv of [["--port", "abc"], ["--port", "0"], ["--port", "70000"], ["--port"]]) {
    assert.match(parseLauncherArgs(argv).error, /porta inválida/);
  }
});

test("parseLauncherArgs recusa opções desconhecidas e --host sem valor", () => {
  assert.match(parseLauncherArgs(["--turbo"]).error, /opção desconhecida/);
  assert.match(parseLauncherArgs(["--host"]).error, /--host/);
  assert.match(parseLauncherArgs(["--host", "--no-browser"]).error, /--host/);
});

// ------------------------------------------------------------ caminho do vite

test("resolveViteCli encontra o bin/vite.js do projeto", () => {
  const root = fakeProject();
  assert.equal(resolveViteCli(root), join(root, "node_modules", "vite", "bin", "vite.js"));
});

test("resolveViteCli cai para o campo bin do package.json", () => {
  const root = fakeProject({ binField: { bin: { vite: "./cli.js" } } });
  assert.equal(resolveViteCli(root), resolve(join(root, "node_modules", "vite"), "./cli.js"));
});

test("resolveViteCli devolve null quando o Vite não está instalado", () => {
  const root = mkdtempSync(join(tmpdir(), "iniciar-vazio-"));
  fixtures.push(root);
  assert.equal(resolveViteCli(root), null);
});

// -------------------------------------------------------------------- portas

test("isPortFree detecta uma porta ocupada e volta a libertá-la", async () => {
  const blocker = createServer();
  const port = await new Promise((done) => {
    blocker.listen({ port: 0, host: "127.0.0.1", exclusive: true }, () => {
      done(blocker.address().port);
    });
  });

  assert.equal(await isPortFree(port, "127.0.0.1"), false);

  await new Promise((done) => blocker.close(done));
  assert.equal(await isPortFree(port, "127.0.0.1"), true);
});

test("busyMessage concorda em número com as portas ocupadas", () => {
  assert.equal(busyMessage([]), null);
  assert.equal(
    busyMessage([8123]),
    "[i] A porta 8123 estava ocupada (Steam, Jenkins ou outro programa).",
  );
  assert.equal(
    busyMessage([8123, 8124]),
    "[i] As portas 8123, 8124 estavam ocupadas (Steam, Jenkins ou outro programa).",
  );
});

// ------------------------------------------------------------------ endereços

test("urlsFor mostra localhost mas sonda 127.0.0.1", () => {
  assert.deepEqual(urlsFor("0.0.0.0", 8123), {
    display: "http://localhost:8123",
    probe: "http://127.0.0.1:8123",
  });
  assert.deepEqual(urlsFor("127.0.0.1", 9000), {
    display: "http://127.0.0.1:9000",
    probe: "http://127.0.0.1:9000",
  });
});

test("lanUrl devolve o IPv4 da rede local e ignora o loopback", () => {
  const interfaces = () => ({
    lo: [{ family: "IPv4", internal: true, address: "127.0.0.1" }],
    eth0: [{ family: "IPv4", internal: false, address: "192.168.1.42" }],
  });
  assert.equal(lanUrl(8123, { interfaces }), "http://192.168.1.42:8123");
  assert.equal(
    lanUrl(8123, {
      interfaces: () => ({ lo: [{ family: "IPv4", internal: true, address: "127.0.0.1" }] }),
    }),
    null,
  );
  // 169.254.x é o "endereço automático" sem rede: existe mas ninguém lá chega.
  assert.equal(
    lanUrl(8123, {
      interfaces: () => ({ eth0: [{ family: "IPv4", internal: false, address: "169.254.0.21" }] }),
    }),
    null,
  );
});

// ----------------------------------------------------------- espera pelo vite

test("waitForServer não espera nada quando o servidor já responde", async () => {
  const sleeps = [];
  const ready = await waitForServer("http://127.0.0.1:8123", {
    probe: async () => true,
    sleep: async (ms) => sleeps.push(ms),
  });
  assert.equal(ready, true);
  assert.deepEqual(sleeps, []);
});

test("waitForServer continua a sondar até o servidor responder", async () => {
  const attempts = [];
  const sleeps = [];
  const ready = await waitForServer("http://127.0.0.1:8123", {
    intervalMs: 300,
    timeoutMs: 5000,
    probe: async (url) => {
      attempts.push(url);
      return attempts.length >= 3;
    },
    sleep: async (ms) => sleeps.push(ms),
  });
  assert.equal(ready, true);
  assert.equal(attempts.length, 3);
  assert.deepEqual(sleeps, [300, 300]);
});

test("waitForServer desiste no fim do tempo em vez de abrir um endereço morto", async () => {
  let now = 0;
  let probes = 0;
  const ready = await waitForServer("http://127.0.0.1:8123", {
    intervalMs: 300,
    timeoutMs: 1000,
    probe: async () => {
      probes += 1;
      return false;
    },
    sleep: async (ms) => {
      now += ms;
    },
    clock: () => now,
  });
  assert.equal(ready, false);
  // Sonda a 0, 300, 600, 900 e 1200 ms: a última já passou do limite.
  assert.equal(probes, 5);
});

test("waitForServer para de sondar quando o Vite morre", async () => {
  const controller = new AbortController();
  let probes = 0;
  const waiting = waitForServer("http://127.0.0.1:8123", {
    intervalMs: 50,
    timeoutMs: 10_000,
    probe: async () => {
      probes += 1;
      controller.abort(); // o Vite saiu a meio da primeira sonda
      return false;
    },
    sleep: async () => {},
    signal: controller.signal,
  });
  assert.equal(await waiting, false);
  assert.equal(probes, 1);
});

test("probeServer trata uma rede que falha como 'ainda não está pronto'", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("ECONNREFUSED");
  };
  try {
    assert.equal(await probeServer("http://127.0.0.1:8123"), false);
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(typeof original, "function");
});

// ------------------------------------------------------------------ navegador

test("openInBrowser sobrevive a um spawn que falha em silêncio", async () => {
  const errors = [];
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.unref = () => {};
    // O erro real do spawn chega no evento seguinte, fora de qualquer try.
    setImmediate(() => child.emit("error", new Error("spawn xdg-open ENOENT")));
    return child;
  };

  const opened = openInBrowser("http://localhost:8123", {
    platform: "linux",
    spawnImpl,
    onError: (error) => errors.push(error),
  });

  assert.equal(opened, true);
  await new Promise((done) => setImmediate(done));
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /ENOENT/);
});

test("openInBrowser não deixa o navegador prender o processo do Node", () => {
  let unref = false;
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.unref = () => {
      unref = true;
    };
    return child;
  };
  const calls = [];
  openInBrowser("http://localhost:8123", {
    platform: "linux",
    spawnImpl: (command, args, options) => {
      calls.push({ command, args, detached: options.detached });
      return spawnImpl();
    },
  });
  assert.equal(unref, true);
  assert.deepEqual(calls, [
    { command: "xdg-open", args: ["http://localhost:8123"], detached: true },
  ]);
});

test("openInBrowser usa `start` no Windows e `open` no Mac", () => {
  const calls = [];
  const spawnImpl = (command, args) => {
    const child = new EventEmitter();
    child.unref = () => {};
    calls.push({ command, args });
    return child;
  };
  openInBrowser("http://localhost:8123", { platform: "win32", spawnImpl });
  openInBrowser("http://localhost:8123", { platform: "darwin", spawnImpl });
  assert.deepEqual(calls, [
    { command: "cmd", args: ["/c", "start", "", "http://localhost:8123"] },
    { command: "open", args: ["http://localhost:8123"] },
  ]);
});

// ------------------------------------------------------------- lançador todo

function fakeSpawnServer({ calls }) {
  return ({ cliPath, root, port, host }) => {
    const child = new EventEmitter();
    child.kill = () => {};
    calls.push({ cliPath, root, port, host });
    // O Vite "arranca" e sai logo a seguir: é o que fecha o run() nos testes.
    setTimeout(() => child.emit("exit", 0, null), 10);
    return { child };
  };
}

test("run arranca na primeira porta livre e só abre o navegador quando o servidor responde", async () => {
  const root = fakeProject();
  const calls = [];
  const logs = [];
  const opened = [];
  const busy = new Set([8123]);

  const code = await run({
    root,
    log: (message) => logs.push(message),
    isFree: async (port) => !busy.has(port),
    spawnServer: fakeSpawnServer({ calls }),
    waitUntilReady: async () => true,
    openBrowser: (url) => opened.push(url),
    interfaces: () => ({}),
    env: {},
  });

  assert.equal(code, 0);
  assert.deepEqual(calls, [
    {
      cliPath: join(root, "node_modules", "vite", "bin", "vite.js"),
      root,
      port: 8124,
      host: "0.0.0.0",
    },
  ]);
  assert.ok(logs.some((line) => line.includes("A porta 8123 estava ocupada")));
  assert.ok(logs.some((line) => line.includes("http://localhost:8124")));
  assert.deepEqual(opened, ["http://localhost:8124"]);
});

test("run não abre o navegador quando o servidor nunca responde", async () => {
  const root = fakeProject();
  const calls = [];
  const opened = [];
  const logs = [];

  await run({
    root,
    log: (message) => logs.push(message),
    isFree: async () => true,
    spawnServer: fakeSpawnServer({ calls }),
    waitUntilReady: async () => false,
    openBrowser: (url) => opened.push(url),
    interfaces: () => ({}),
    env: {},
  });

  assert.deepEqual(opened, []);
  assert.equal(calls.length, 1);
  assert.ok(logs.some((line) => line.includes("ainda não responde")));
});

test("run obedece ao --no-browser e ao --port", async () => {
  const root = fakeProject();
  const calls = [];
  const opened = [];

  await run({
    argv: ["--port", "9000", "--no-browser"],
    root,
    log: () => {},
    isFree: async () => true,
    spawnServer: fakeSpawnServer({ calls }),
    waitUntilReady: async () => true,
    openBrowser: (url) => opened.push(url),
    interfaces: () => ({}),
    env: {},
  });

  assert.deepEqual(opened, []);
  assert.deepEqual(
    calls.map((call) => call.port),
    [9000],
  );
});

test("run diz que faltam as dependências em vez de morrer com ENOENT", async () => {
  const root = mkdtempSync(join(tmpdir(), "iniciar-sem-vite-"));
  fixtures.push(root);
  const calls = [];
  const logs = [];

  const code = await run({
    root,
    log: (message) => logs.push(message),
    spawnServer: fakeSpawnServer({ calls }),
    env: {},
  });

  assert.equal(code, 127);
  assert.equal(calls.length, 0);
  assert.ok(logs.some((line) => line.includes("npm install")));
});

test("run passa à porta seguinte quando o Vite morre antes de responder", async () => {
  const root = fakeProject();
  const calls = [];
  const logs = [];
  let attempt = 0;

  const code = await run({
    root,
    log: (message) => logs.push(message),
    isFree: async () => true,
    spawnServer: ({ cliPath, root: dir, port, host }) => {
      const child = new EventEmitter();
      child.kill = () => {};
      calls.push({ cliPath, root: dir, port, host });
      attempt += 1;
      if (attempt === 1) {
        // O Vite desiste logo (porta entretanto ocupada, config partida...).
        setImmediate(() => child.emit("exit", 1, null));
      } else {
        setTimeout(() => child.emit("exit", 0, null), 10);
      }
      return { child };
    },
    waitUntilReady: async (url, { signal } = {}) => {
      await new Promise((done) => setTimeout(done, 5));
      return !signal?.aborted;
    },
    openBrowser: () => {},
    interfaces: () => ({}),
    env: {},
  });

  assert.equal(code, 0);
  assert.deepEqual(
    calls.map((call) => call.port),
    [8123, 8124],
  );
  assert.ok(logs.some((line) => line.includes("A porta 8123 não deu")));
  assert.ok(logs.some((line) => line.includes("http://localhost:8124")));
});

test("run desiste com uma mensagem quando nenhuma porta serve", async () => {
  const root = fakeProject();
  const logs = [];
  const calls = [];

  const code = await run({
    root,
    log: (message) => logs.push(message),
    isFree: async () => false,
    spawnServer: fakeSpawnServer({ calls }),
    env: {},
  });

  assert.equal(code, 1);
  assert.equal(calls.length, 0);
  assert.ok(logs.some((line) => line.includes("As portas")));
  assert.ok(logs.some((line) => line.includes("--port 9000")));
});

test("run recusa argumentos errados sem tocar no Vite", async () => {
  const root = fakeProject();
  const calls = [];
  const logs = [];

  const code = await run({
    argv: ["--port", "muito-alta"],
    root,
    log: (message) => logs.push(message),
    spawnServer: fakeSpawnServer({ calls }),
    env: {},
  });

  assert.equal(code, 2);
  assert.equal(calls.length, 0);
  assert.ok(logs.some((line) => line.includes("[ERRO]")));
});
