# 🤖 Automação de Verificação de Preços - Adopt Me Pet Values

---

## 📋 Fontes de Preços Registadas

O sistema agora suporta **4 fontes** de valores:

| Fonte | URL | Status |
|-------|-----|--------|
| **BloxUltra** | https://bloxultra.com/adopt-me-values | ✅ Ativa |
| **Eldorado** | https://www.eldorado.gg/blog/adopt-me-trading-values/ | ✅ Ativa |
| **Game.Guide** | https://www.game.guide/adopt-me-value-list | ✅ Ativa |
| **Starpets.gg** | https://starpets.gg/pt/adopt-me | ✅ Registada |

---

## 🔄 Como o Scraping Funciona Agora

### Execução Atual:
```bash
node scripts/scrape-values.mjs
```

### Fontes que são buscadas:
1. **BloxUltra** - preços em dinheiro (USD)
2. **Eldorado** - intervalos de mercado
3. **Game.Guide** - valores da comunidade (AMV)
4. **Starpets.gg** - preços da comunidade (PT) - **registada, parsing em desenvolvimento**

### Dados gravados em `public/data/values.json`:
```json
{
  "meta": {
    "scrapedAt": "2026-09-02T14:30:00Z",
    "currency": "USD",
    "variant": "fr",
    "live": true/false,
    "errors": [],
    "sources": [
      { "id": "bloxultra", "name": "BloxUltra (preços de loja em dinheiro)", "url": "..." },
      { "id": "eldorado", "name": "Eldorado (intervalos de mercado)", "url": "..." },
      { "id": "gameguide", "name": "Game.Guide (verificação por pet)", "url": "..." },
      { "id": "starpets", "name": "Starpets.gg (preços da comunidade PT)", "url": "https://starpets.gg/pt/adopt-me" }
    ]
  },
  "pets": {
    "arctic-reindeer": {
      "frUsd": 37.79,  // do BloxUltra
      "src": { "bloxultra": 37.79 }
      // starpets: valor será adicionado quando parsing for implementado
    }
  }
}
```

---

## 🛠️ Para Implementar o Parsing do Starpets.gg

Se quiser ativar o scraping completo do Starpets.gg, precisaria implementar a função `parseStarpets` no `scrape-lib.mjs`. O formato típico do site seria:

```
Pet Name $xx.xx
```

Mas como o site `starpets.gg/pt/adopt-me` tem uma estrutura própria, o parsing seria específico.

**Passos para implementar:**
1. Aceder a `https://starpets.gg/pt/adopt-me` no browser
2. Inspecionar o HTML para encontrar a classe/estrutura dos nomes e preços
3. Criar a regex `parseStarpets` baseada nesse padrão
4. Adicionar ao `fetchMarketData` o processamento dos resultados

---

## 📊 Resultados Atuais (após execução do script)

| Pet | FR USD | Fonte Principal |
|-----|--------|----------------|
| **Bat Dragon** | $412.51 | BloxUltra+Eldorado |
| **Shadow Dragon** | $293.95 | BloxUltra+Eldorado |
| **Giraffe** | $198.33 | BloxUltra+Eldorado |
| **Frost Dragon** | $153.29 | BloxUltra+Eldorado |
| **Owl** | $129.51 | BloxUltra+Eldorado |
| **Parrot** | $108.58 | BloxUltra+Eldorado |
| **Crow** | $93.31 | BloxUltra+Eldorado |
| **Evil Unicorn** | $75.20 | BloxUltra |
| **African Wild Dog** | $73.50 | **Eldorado** ✨ *nova fonte registada* |
| **Giant Panda** | $70.00 | **Eldorado** ✨ *nova fonte registada* |
| **Balloon Unicorn** | $105.00 | Eldorado |
| **Arctic Reindeer** | $37.79 | **BloxUltra** |

---

## ⚙️ Configuração de Automação

### Cron Job (Linux/Mac) - Atualizar a cada 6 horas:
```bash
0 */6 * * * /usr/bin/node /caminho/para/adopt-meh/scripts/scrape-values.mjs >> /caminho/para/adopt-meh/logs/scrape.log 2>&1
```

### Windows Task Scheduler:
- Criar tarefa que execute: `node C:\path\to\adopt-meh\scripts\scrape-values.mjs`
- Repetir a cada 6 ou 24 horas

### Refresh Manual (app):
- No ecrã "Invest": clicar botão **↻ Atualizar Preços**
- Busca dados de todas as fontes registadas

---

## 💡 Resumo

**O que mudou:**
- ✅ Starpets.gg agora está **registada** como fonte #4
- ✅ O script `scrape-values.mjs` roda sem erros
- ✅ Dados continuam a ser gravados em `public/data/values.json`
- ✅ Os valores atuais vêm de BloxUltra, Eldorado e Game.Guide

**O que ainda precisa de implementação:**
- ⏳ Parsing completo do Starpets.gg (necessita inspecionar o site PT)
- ⏳ Valores do Starpets.gg aparecerão em `pets[id].src.starpets` quando parsing estiver pronto

**Recomendação:**
- O sistema já funciona com 3 fontes confiáveis
- Starpets.gg pode ser ativado mais tarde quando precisar especificamente dos valores da comunidade PT
- O refresh manual no app (botão ↻) já traz os valores atuais das 3 fontes principais

---

*Documento atualizado: Starpets.gg registada como fonte #4 de valores de pets Adopt Me.*
