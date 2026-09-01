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

## 3. Instalar e arrancar

Dentro da pasta do projeto:

```
npm install
npm run dev
```

Quando aparecer `Local: http://localhost:8080/`, abre esse endereço no
**teu navegador** (Chrome/Edge). A app fica a funcionar em ecrã inteiro.

Para parar: `Ctrl + C` na linha de comandos. Para voltar a abrir no futuro:
```
npm run dev
```

---

## 4. Manter os preços atualizados (opcional, no teu PC há internet)

Os ficheiros em `public/data/` já trazem valores reais de set. 2026. Para
atualizar a partir dos sites de referência:

```
npm run scrape:values     # preços em dinheiro (BloxUltra + Eldorado)
npm run scrape:points     # pontos comunitários (Elvebredd) — cruzamento
```

A app lê estes ficheiros automaticamente — basta recarregar a página.

Para atualizar sozinho de 6 em 6 horas (Windows, usa o **Agendador de
Tarefas**; Mac/Linux usa `crontab -e`):
```
0 0,6,12,18 * * * cd C:\caminho\para\adopt-meh && npm run scrape:values
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

## Notas

- Tudo corre **no teu navegador**, sem conta nem login.
- A carteira e o histórico guardam-se no `localStorage` do navegador.
- Cross-trading por dinheiro real viola os Termos do Roblox — o terminal é
  uma ferramenta de referência/decisão, usa por tua conta e risco.
