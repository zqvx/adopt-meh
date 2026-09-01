# Como instalar e correr o terminal no teu PC

O terminal é uma aplicação web (React + Vite). Funciona em **Windows, Mac ou Linux**.
Só precisas do **Node.js** (grátis).

---

## 1. Instalar o Node.js (só uma vez)

1. Vai a https://nodejs.org e descarrega a versão **LTS** (botão verde).
2. Instala com as opções de fábrica (Next → Next → Finish).
3. Confirma que ficou instalado — abre uma **linha de comandos**:
   - **Windows:** tecla Windows → escreve `cmd` → Enter
   - **Mac:** abre a app **Terminal**
   
   E escreve:
   ```
   node -v
   ```
   Se aparecer um número (ex.: `v22.x`), está pronto.

---

## 2. Obter o projeto

**Opção A — com Git (recomendado, para receberes atualizações):**
```
git clone https://github.com/zqvx/adopt-meh.git
cd adopt-meh
git checkout arena/01a05af2-adopt-meh
```

**Opção B — sem Git (transferir ZIP):**
1. No GitHub, botão verde **Code → Download ZIP**.
2. Extrai o ZIP para uma pasta (ex.: `C:\adopt-meh`).
3. Na linha de comandos, entra na pasta:
   ```
   cd C:\caminho\para\adopt-meh
   ```

---

## 3. Instalar e arrancar — um clique (faz tudo)

Depois de extrair o ZIP, há **um só ficheiro** que trata de tudo:

- **Windows:** faz **duplo-clique em `INICIAR.bat`**.
- **Mac / Linux:** num terminal dentro da pasta:
  ```
  ./iniciar.sh
  ```

O lançador, por esta ordem:
1. Verifica o **Node.js** — se faltar, instala sozinho (winget) ou abre o site;
2. Se o projeto foi clonado com **Git**, procura atualizações do código (`git pull`,
   sem falhar se estiveres offline);
3. Instala as dependências só da primeira vez;
4. Arranca e abre o navegador **no endereço que ele próprio escreve** na janela
   preta.

### Que endereço é esse? (importante)

Esquece o `8080`. O lançador procura a primeira porta livre — experimenta a
**8123**, e se ela estiver ocupada (Steam, Jenkins, outro terminal já aberto)
passa à **8124**, **8125**, **8321**… — e **escreve sempre o endereço certo na
janela**:

```
[i] A porta 8123 estava ocupada (Steam, Jenkins ou outro programa).
[..] A arrancar em http://localhost:8124
  VITE v8.2.2  ready in 735 ms
[OK] Pronto: http://localhost:8124
```

É esse `http://localhost:8124` que conta. O navegador abre sozinho assim que o
servidor responde de facto (não "adormece 8 segundos e reza"), por isso nunca
aparece aquele erro de *ligação recusada* em PCs mais lentos.

Se quiseres escolher a porta à mão: `node scripts/iniciar.mjs --port 9000`.
Para arrancar sem abrir o navegador: `node scripts/iniciar.mjs --no-browser`.

Os **preços são buscados em direto aos sites** enquanto a app corre (atualizam
sozinhos), por isso não precisas de fazer nada para ter valores frescos.

Para parar: foca a janela e prime `Ctrl + C`. No futuro é só abrir o mesmo
`INICIAR.bat` — ele atualiza-se sozinho.

> Se usaste a versão **ZIP (sem Git)**, o código não se atualiza sozinho: para
> teres a versão mais nova volta ao GitHub e faz *Download ZIP* outra vez. Os
> preços continuam a atualizar-se na mesma.

---

## 3b. Modo manual (se preferires)

Dentro da pasta do projeto:

```
npm install
npm run dev
```

Quando aparecer `Local: http://localhost:8080/` (o modo manual usa sempre a
8080), abre esse endereço no **teu navegador** (Chrome/Edge). A app fica a
funcionar em ecrã inteiro.

Para parar: `Ctrl + C`. Para voltar a abrir: `npm run dev`.

---

## 4. Manter os preços atualizados

Não precisas de fazer nada: enquanto a app corre (`npm run dev`), o servidor
local busca os preços em direto aos sites de referência (cache de 10 min) e a
app mostra-os automaticamente.

Se quiseres atualizar à mão o ficheiro base (`public/data/values.json`), por
exemplo para usar offline:

```
npm run scrape:values     # preços em dinheiro (BloxUltra + Eldorado)
npm run scrape:points     # pontos comunitários (Elvebredd) — cruzamento
```

---

## 5. Hype em tempo real via Discord (opcional, avançado)

Cria um bot de Discord (Developer Portal) e:
```
set DISCORD_TOKEN=o_teu_token
set DISCORD_CHANNELS=id_canal1,id_canal2
npm run hype:discord -- --watch
```
(No Mac/Linux usa `export` em vez de `set`.) Isto gera `public/data/hype.json`
com o score de procura 🔥 que o feed mostra.

---

## Resolução de problemas — o INICIAR.bat abre e fecha logo

Se a janela preta pisca e desaparece sem escrever nada, é quase sempre uma
destas três coisas:

1. **O ficheiro veio com as mudanças de linha erradas (a causa mais comum).**
   Um `.bat` gravado no formato Unix (LF) não é lido pelo `cmd.exe`: ele não
   percebe os blocos `if (...)` nem os `goto`, e fecha na hora. Já está
   corrigido no repositório (`.gitattributes` força CRLF nos `.bat`), mas se
   tens uma **cópia antiga**, volta a descarregar o ZIP ou faz `git pull`.
   Para confirmar: abre o `INICIAR.bat` no **Bloco de Notas** — se todo o
   texto aparecer numa só linha gigante, é esse o problema.

2. **O INICIAR.bat está fora da pasta do projeto.** Ele tem de estar ao lado
   do `package.json`. A versão nova já avisa em vez de fechar.

3. **Queres ver a mensagem de erro à força.** Abre o `cmd`, arrasta o
   `INICIAR.bat` para dentro da janela e prime Enter — assim a janela nunca
   se fecha. A versão nova também escreve um `iniciar-log.txt` na pasta.

Em último caso, arranca à mão (funciona sempre):

```
cd C:\caminho\para\adopt-meh
npm install
npm run dev
```

E abre http://localhost:8080 no navegador (à mão é sempre a 8080).

---

## O navegador abriu uma página que não carrega

O endereço que conta é **o que está escrito na janela preta**, não o 8080 e não
o da última vez: se a 8123 estava ocupada, o lançador salta para a 8124 e diz
qual escolheu. Se fechares a janela e abrires outra vez, o endereço pode mudar
— é normal.`node scripts/iniciar.mjs --port 9000` fixa a porta à força.

---

## Notas

- Tudo corre **no teu navegador**, sem conta nem login.
- A carteira e o histórico guardam-se no `localStorage` do navegador.
- Cross-trading por dinheiro real viola os Termos do Roblox — o terminal é
  uma ferramenta de referência/decisão, usa por tua conta e risco.
