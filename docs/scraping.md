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

## Se um site mudar / bloquear

- O scraper **nunca apaga** dados: se uma fonte falha (Cloudflare, estrutura
  nova, timeout), mantém os valores anteriores dessa fonte e avisa.
- Para adicionar/alterar correspondências de nomes, edita `NAME_TO_ID` no
  `scripts/scrape-values.mjs`.

## Discord / TikTok (opcional, futura expansão)

A volatilidade real e o hype acontecem em Discord/TikTok LIVE. Um bot de
Discord (webhook) pode escrever linhas extra no `values.json`
(ex.: `sentiment`, `hype`) para o terminal ler — o formato do ficheiro já
suporta campos adicionais por pet sem quebrar o parser.
