/**
 * Resolve hook para correr os testes de `src/` com o `node --test` simples.
 *
 * Dois desajustes entre o Node e o Vite faziam com que metade dos testes de
 * `src/` não pudesse ser corrida por ninguém (e por isso não estava no
 * `npm test`):
 *
 *   1. o alias `@/lib/...` do tsconfig — o Vite resolve, o Node não;
 *   2. importações relativas sem extensão (`./catalog`) — obrigatório em ESM,
 *      mas o `moduleResolution: bundler` do TypeScript deixa passar.
 *
 * Este hook trata dos dois casos à frente do resolver do Node e deixa tudo o
 * resto seguir. Assim `npm test` corre os testes TODOS, sem tocar no código da
 * app nem exigir outra dependência.
 *
 */
// Uso (o comando completo está no `npm test` do package.json):
//   node --import ./scripts/test-register.mjs --test "src/**/*.test.ts"
//
// Nota para quem editar este ficheiro: um exemplo com `*/` lá dentro (como a
//quele glob) DENTRO de um comentário de bloco fecha o comentário e parte o
// ficheiro — daí estar aqui em comentário de linha.

import { existsSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_ROOT = resolvePath(fileURLToPath(new URL("../src/", import.meta.url)));

/** Extensões que uma importação sem extensão pode querer dizer. */
const CANDIDATE_EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];
const INDEX_FILES = CANDIDATE_EXTENSIONS.map((ext) => `index${ext}`);

function isRelative(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

/** `@/lib/pets/engine` → caminho absoluto em `src/`. */
function fromAlias(specifier) {
  if (!specifier.startsWith("@/")) return null;
  return resolvePath(SRC_ROOT, specifier.slice(2));
}

/**
 * Primeiro ficheiro que existe: `./x`, `./x.ts`, `./x/index.ts`, … — ou null.
 * Segue as barras do specifier para não confundir um `.` num nome de pasta.
 */
function resolveWithExtensions(basePath) {
  if (existsSync(basePath) && statSync(basePath).isFile()) return basePath;
  for (const ext of CANDIDATE_EXTENSIONS) {
    const withExt = `${basePath}${ext}`;
    if (existsSync(withExt) && statSync(withExt).isFile()) return withExt;
  }
  for (const indexFile of INDEX_FILES) {
    const asIndex = resolvePath(basePath, indexFile);
    if (existsSync(asIndex)) return asIndex;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (process.env.HOOK_DEBUG) console.error(`[resolver] ${specifier}`);
  // Deixa o resolver do Node tentar primeiro: é ele que conhece `node:*`,
  // pacotes do node_modules e tudo o que já está bem.
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const aliasPath = fromAlias(specifier);
    if (aliasPath) {
      const hit = resolveWithExtensions(aliasPath);
      // Sem `format`: o Node decide, e é assim que o `--experimental-strip-types`
      // entra (se aqui forçássemos "module", o ficheiro .ts era lido como ESM
      // cru e rebentava no primeiro tipo).
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
    }

    if (isRelative(specifier) && context.parentURL?.startsWith("file:")) {
      const parentDir = dirname(fileURLToPath(context.parentURL));
      const hit = resolveWithExtensions(resolvePath(parentDir, specifier));
      // Sem `format`: o Node decide, e é assim que o `--experimental-strip-types`
      // entra (se aqui forçássemos "module", o ficheiro .ts era lido como ESM
      // cru e rebentava no primeiro tipo).
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
    }

    throw error;
  }
}
