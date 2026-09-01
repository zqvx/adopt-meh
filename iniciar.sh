#!/usr/bin/env bash
# Lançador de um clique para Mac / Linux.
# Uso: clica duas vezes no ficheiro, ou num terminal:  ./iniciar.sh
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "   TERMINAL DE TRADING  -  ADOPT ME"
echo "============================================"
echo

# 1. Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "[!] Node.js não encontrado."
  echo "A instalar no macOS via Homebrew (se disponível)..."
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    echo "Vou abrir https://nodejs.org — descarrega a versão LTS e instala."
    (command -v xdg-open >/dev/null && xdg-open https://nodejs.org) || \
      (command -v open >/dev/null && open https://nodejs.org) || true
    echo "Depois de instalar, volta a correr: ./iniciar.sh"
    read -r -p "Pressiona Enter para sair." _
    exit 1
  fi
fi
echo "[OK] Node.js $(node -v)"

# 2. Dependências (só da primeira vez)
if [ ! -d node_modules ]; then
  echo
  echo "[..] A instalar dependências (1-2 min)..."
  npm install
else
  echo "[OK] Dependências já instaladas."
fi

# 3. Abrir o navegador e arrancar
echo
echo "[..] A arrancar em http://localhost:8080 (Ctrl+C para parar)..."
( sleep 6; (command -v xdg-open >/dev/null && xdg-open http://localhost:8080) || \
  (command -v open >/dev/null && open http://localhost:8080) || true ) &

npm run dev
