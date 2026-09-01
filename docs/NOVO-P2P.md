# Máquina de Revolut (Modo P2P)

Reconstrução da funcionalidade descrita em `NOVO-P2P` na branch
`arena/01a05c5f-adopt-meh`. O trabalho original da sessão anterior ficou
apenas no sandbox (nunca chegou ao GitHub); isto é a implementação
equivalente, verificada e já publicada.

## A ideia em duas linhas

Os marketplaces (Eldorado, Gameflip, Starpets) cobram ~12% ao vendedor. Quem
vende lá recebe o líquido; quem compra lá paga o preço cheio. Vender direto a
uma pessoa e receber por **Revolut** deixa esse spread inteiro na mesa — e o
comprador ainda paga menos do que no site.

```
mercado 50 €  →  o site paga-te 44 €  →  tu vendes a 47 €
                 (comprador poupa 3 €, tu ganhas +3 €)
```

## Novos ficheiros

| Ficheiro | O que faz |
| --- | --- |
| `src/lib/p2p-pricing.ts` | Matemática pura (sem dependências, testada): `siteNetEur`, `goldenSpread`, `quickSell`, `decayPrice`, `defaultCostEur`, `listingProfitEur`, tipo `Listing`. |
| `src/lib/p2p.ts` | Store zustand `nexus-p2p-v1` (localStorage): listagens, `markSold` (+caixa +vouch), `addVouch`, caixa Revolut. Reexporta toda a matemática de preços. |
| `src/lib/p2p-ad.ts` | `generateAd()` (texto copy-paste para Discord/FB com emojis, preço com decay, valor de mercado e nº de vouches), `stockLinks()` (deep links Eldorado/Gameflip/Starpets/PlayerAuctions ordenados por preço asc), `buyTargetEur()`, `marketEurFor()`, `priceLadder()`. |
| `src/lib/p2p-receipt.ts` | `generateP2PReceipt()` — PNG 1080×1080 “SUCCESSFUL TRADE · PET ENTREGUE · PAGO VIA REVOLUT” com valor €, data e carimbo `VOUCH #NNN`. |
| `src/components/panels/P2PCentral.tsx` | Separador **Central P2P**: caixa/reputação/pipeline, criar anúncio, cartões com anúncio pronto a copiar e botão “Vendido · recibo”. |
| `src/components/panels/MorningBriefing.tsx` | Separador de arranque **Missão do Dia**: stock parado a despachar, alerta de pets a cair ≥3%, capital livre. |
| `src/components/panels/StockSniper.tsx` | Cartões de deep links + teto de compra (usado no briefing e no separador Margem). |
| `src/lib/p2p.test.ts` | 8 testes da tabela de preços e do decay. |

## Ficheiros alterados

- `src/lib/store.ts` — tipo de tab alargado com `"mission"` e `"p2p"`; tab
  inicial passou a `"mission"`.
- `src/components/layout/AppShell.tsx` — 2 tabs novas (Missão do Dia ☕,
  Central P2P 💶), `<StockSniper/>` no separador Margem, nav do telemóvel
  limitada a 5 separadores.
- `src/components/panels/HistoryPanel.tsx` — botão de vouch por entrada
  (regista venda P2P, +1 vouch, descarrega o recibo).
- `package.json` — `npm test` passou a incluir `src/lib/p2p.test.ts`.

## Tabela de preços

| Momento | Preço (mercado 50 €) | Regra |
| --- | --- | --- |
| Valor de mercado | 50,00 € | catálogo / `values.json` |
| Líquido do site | 44,00 € | `market × 0,88` (comissão 12%) |
| **Golden spread** (dias 0–3) | **47,00 €** | ponto médio site↔mercado |
| **Venda rápida** (dias 4–6) | **44,99 €** | iguala o líquido do site (charm price) |
| **Break-even** (dia 7+) | preço de custo | liberta capital congelado |
| Teto de compra | 27,50 € | `market × 0,55` |

## Verificação feita

- `tsc --noEmit` limpo.
- `eslint src` sem erros novos (mantêm-se 1 erro + 1 aviso pré-existentes em
  `src/lib/app-data/`).
- `vite build` OK.
- `node --test src/lib/p2p.test.ts` → **8/8**. Restante suite: as 8 falhas em
  `scripts/grok-pwa-plugin.test.mjs` já existiam antes desta branch.
- SSR verificado no dev server: o briefing matinal renderiza no arranque.

## Follow-ups opcionais

- O custo por defeito de uma listagem é `0,55 × valor de mercado`; o campo
  “Quanto te custou” já permite indicar o valor exato para um break-even real.
- Os valores de mercado vêm de `values.json`; com o scraper ativo (cron 6h)
  ficam mais precisos, e os preços por plataforma passam a ordenar os deep
  links do Stock Sniper.
- Aviso permanente: cross-trading por dinheiro viola os ToS da Roblox/Uplift —
  a app é uma ferramenta de referência.
