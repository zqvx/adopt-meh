# Pseudo-API de valores reais (scraping)

Não existe API oficial de preços do Adopt Me. Esta pasta descreve a pipeline
que transforma sites de valores em dinheiro na "fonte da verdade" do terminal.

## Fluxo

```
Sites de referência  ──(scraper)──>  public/data/values.json  ──(fetch)──>  terminal
BloxUltra (preços $)                                  ▲
Eldorado (intervalos)                                 │
                                            scripts/scrape-values.mjs
                                            (cron de 6 em 6 horas)
```

1. **`scripts/scrape-values.mjs`** faz HTTP às páginas, extrai os preços com
   expressões regulares (sem dependências — usa o `fetch` do Node 18+) e grava
   em **`public/data/values.json`**.
2. O terminal faz `fetch('/data/values.json')` no arranque e a cada 30 min
   (`src/lib/market-data.ts`). Se o fetch falhar, usa os valores do catálogo.
3. O feed "Ao Vivo" ancora os preços aos valores reais e só simula a
   volatilidade de curto prazo em volta deles.

## Correr o scraper

```bash
npm run scrape:values        # pesquisa e grava public/data/values.json
npm run scrape:values -- --check   # só mostra o que encontrou, não grava
```

Atualizar automaticamente (Linux/macOS, `crontab -e`), de 6 em 6 horas:

```
0 0,6,12,18 * * * cd /caminho/adopt-meh && npm run scrape:values >> scrape.log 2>&1
```

## Atualização automática na nuvem (sem PC ligado)

O workflow vem pronto em `scripts/setup/scrape.yml.txt`. Para o ativar (uma
vez, 30 segundos): no GitHub cria `.github/workflows/scrape.yml` (Add file →
Create new file), cola o conteúdo do `.txt` e faz commit.

A partir daí corre de 6 em 6 horas nos servidores do GitHub (grátis):

1. Faz checkout do repo e corre `node scripts/scrape-values.mjs`, depois
   `node scripts/price-history.mjs` (acumula um snapshot de preços para o
   histórico real dos gráficos; ignora recolhas falhadas) e o
   `discord-hype.mjs` se existirem secrets `DISCORD_TOKEN` /
   `DISCORD_CHANNELS`.
2. Se houver preços novos, faz commit de `public/data/values.json`,
   `price-history.json` (e `hype.json`) direto na branch.
3. O deploy (Vercel/Netlify, ligado ao repo) publica o site atualizado
   automaticamente.

**Histórico real de preços:** cada recolha bem-sucedida junta um ponto ao
`public/data/price-history.json` (máx. 1 ano, ~140 KB). O gráfico de 30 dias
da app usa esses pontos reais a partir do momento em que existem ≥2; antes
disso mostra uma série simulada. Ao fim de semanas/meses dá para ver padrões
reais de subida/descida por pet.

Também podes disparar a recolha à mão: GitHub → separador **Actions** →
*Scrape de preços* → **Run workflow**.

No site, o selo do separador Ao Vivo mostra **PREÇOS ATUALIZADOS** quando a
última recolha foi nas últimas 12 horas, **PREÇOS ANTIGOS** se as fontes
falharam nesse período, e **VALORES BASE** sem dados de scraping.

## Deploy

O projeto usa o preset Vercel do TanStack Start:

1. Em <https://vercel.com> → **Add New → Project** → importa o repo
   `adopt-meh`.
2. Sem variáveis nem configuração extra — o Vercel deteta o build
   (`npm run build`) e publica.
3. Cada push (incluindo os commits do scraper) gera um deploy novo. Os
   preços ficam sempre frescos porque o cron acima atualiza o ficheiro que o
   site serve.

Não é preciso `vercel.json`; o Vercel deteta o preset. Em alternativa,
Netlify funciona pelo mesmo princípio.

## Estado do scraper na app

O separador **Ao Vivo** mostra um selo:
- 🟢 **PREÇOS AO VIVO** — o endpoint local buscou os sites com sucesso (cache 10 min);
- 🟡 **PREÇOS EM CACHE** — os sites falharam (Cloudflare/mudança de layout); a app
  usa os valores guardados em `public/data/values.json` (fallback do dia anterior);
- ⚪ **VALORES BASE** — sem dados de scraping, usa o catálogo.

Cada fonte é independente (`Promise.allSettled`): se BloxUltra cair mas Eldorado
responder, a app fica com o que conseguiu e nunca avaria.

## Mais plataformas = melhor arbitragem

A matriz de arbitragem (separador **Margem**) compara preços entre plataformas.
Já cruza BloxUltra, Eldorado e as faixas low/high. Para adicionar Gameflip ou
Starpets, basta o scraper escrever `src: { <fonte>: <preço> }` em cada pet de
`public/data/values.json` (ver `scripts/scrape-lib.mjs` — o merge já guarda o
campo `src` por fonte). A matriz deteta automaticamente as fontes novas.

## Se um site mudar / bloquear

- O scraper **nunca apaga** dados: se uma fonte falha (Cloudflare, estrutura
  nova, timeout), mantém os valores anteriores dessa fonte e avisa.
- Para adicionar/alterar correspondências de nomes, edita `NAME_TO_ID` no
  `scripts/scrape-values.mjs`.

## Cruzamento de fontes (detetar inflação)

`npm run scrape:points` extrai os **pontos comunitários** do Elvebredd para
`public/data/points.json`. O terminal compara o $/ponto (dinheiro do
BloxUltra) com a mediana: um pet cujo rácio desvia +28% aparece como
**INFLACIONADO** (cuidado a comprar), −22% como **BARATO** (oportunidade).
Se o scraper não correr, usa os pontos do próprio catálogo como fallback.

## Hype em tempo real via Discord (ponto #2)

`public/data/hype.json` guarda um score de procura 0–100 por pet. O terminal
mostra-o como 🔥 no feed Ao Vivo. Para o alimentar a sério:

```bash
export DISCORD_TOKEN="token-do-bot"
export DISCORD_CHANNELS="id_canal1,id_canal2"
npm run hype:discord -- --once     # lê histórico recente e grava
npm run hype:discord -- --watch    # fica a escutar e atualiza de 5 em 5 min
npm run hype:discord -- --webhook  # recetor HTTP (PORT=8090) p/ reencaminhador
```

O bot conta menções de cada pet nas mensagens dos canais de trading e
normaliza com escala logarítmica (um pet popular não esmaga os outros). Sem
token, usa-se a semente `hype.json`. O TikTok LIVE não tem API de chat
pública — a alternativa é um reencaminhador teu que faça POST de mensagens
para o modo `--webhook`.

## Alerta de downgrade

No simulador de trocas, `evaluateTrade` deteta quando dás poucos itens
**fortes** (alta procura/concentrados) e recebes muitos itens **fracos**:
mesmo que os pontos deem "justo", marca **Downgrade · armadilha de
liquidez**, porque ficas com ativos difíceis de voltar a trocar.
