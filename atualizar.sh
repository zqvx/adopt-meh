#!/usr/bin/env bash
# Atualiza código + preços e arranca (Mac/Linux).  Uso: ./atualizar.sh
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "   ATUALIZAR TERMINAL (código + preços)"
echo "============================================"
echo

if [ -d ".git" ]; then
  echo "[..] A procurar atualizações do código..."
  git pull || echo "[!] git pull falhou (sem rede?) — sigo com a versão atual."
  echo
else
  echo "[i] Versão ZIP (sem Git). Para o código mais recente, volta a"
  echo "    descarregar o ZIP no GitHub. Os preços atualizam-se na mesma."
  echo
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[!] Node.js não encontrado. Corre primeiro ./iniciar.sh uma vez."
  read -r -p "Enter para sair." _
  exit 1
fi

echo "[..] A garantir dependências..."
npm install

echo
echo "[..] A descarregar preços atuais (BloxUltra/Eldorado)..."
npm run scrape:values || true
npm run scrape:points || true
echo

echo "[OK] Tudo atualizado. A arrancar em http://localhost:8080 ..."
( sleep 6; (command -v xdg-open >/dev/null && xdg-open http://localhost:8080) || \
  (command -v open >/dev/null && open http://localhost:8080) || true ) &
npm run dev
