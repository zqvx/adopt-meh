/**
 * Regista o `test-resolver.mjs` antes de os testes correrem.
 *
 * É um ficheiro à parte porque o `--import` do Node carrega o módulo como está,
 * sem lhe poder passar argumentos — o `register()` tem de acontecer no corpo.
 */
import { register } from "node:module";

register("./test-resolver.mjs", import.meta.url);
