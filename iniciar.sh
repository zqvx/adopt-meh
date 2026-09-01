#!/usr/bin/env bash
# Lançador único para Mac / Linux — instala o que faltar, atualiza e arranca.
# Uso: clica duas vezes no ficheiro, ou num terminal:  ./iniciar.sh
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "   TERMINAL DE TRADING  -  ADOPT ME"
echo "============================================"
echo

# 1. Verificar Node.js (e tentar instalar)
if ! command -v node >/dev/null 2>&1; then
  echo "[!] Node.js não encontrado."
  if command -v brew >/dev/null 2>&1; then
    echo "A instalar via Homebrew..."
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

# 2. Atualizar o código se foi clonado com Git (não falha sem rede)
if [ -d ".git" ]; then
  echo "[..] A procurar atualizações do código..."
  git pull >/dev/null 2>&1 && echo "[OK] Código atualizado." || \
    echo "[i] Sem rede ou sem atualizações, sigo com a versão atual."
  echo
fi

# 3. Dependências (só da primeira vez)
if [ ! -d node_modules ]; then
  echo "[..] A instalar dependências (1-2 min)..."
  npm install --no-audit --no-fund
else
  echo "[OK] Dependências prontas."
fi

# 4. Arrancar. O lançador é que escolhe a porta e só abre o navegador quando o
#    servidor responder de facto (nada de "esperar 6 segundos à sorte").
echo
echo "[..] A arrancar... o navegador abre no endereço que aparecer abaixo."
echo "    Os preços são buscados em direto aos sites (atualizam sozinhos)."
echo

node scripts/iniciar.mjs
