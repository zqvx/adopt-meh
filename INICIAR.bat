@echo off
chcp 65001 >nul
title Terminal Adopt Me
cd /d "%~dp0"

echo ============================================
echo    TERMINAL DE TRADING  -  ADOPT ME
echo ============================================
echo.

REM --- 1. Verificar se o Node.js existe ---
where node >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Node.js encontrado.
    goto atualizar
)

echo [!] Node.js nao encontrado neste PC.
where winget >nul 2>nul
if %errorlevel%==0 (
    echo [..] A tentar instalar o Node.js LTS automaticamente (winget)...
    winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    echo.
    echo ===================================================================
    echo  Instalacao concluida.
    echo  FECHA esta janela e faz duplo-clique outra vez no INICIAR.bat
    echo  (o Node precisa de reiniciar a linha de comandos para ficar ativo)
    echo ===================================================================
    echo.
    pause
    exit /b
) else (
    echo [!] O instalador automatico nao esta disponivel neste Windows.
    echo Vou abrir o site do Node.js: descarrega a versao LTS (botao verde)
    echo e instala com as opcoes de fabrica.
    start "" https://nodejs.org
    echo.
    echo Depois de instalar, volta a fazer duplo-clique no INICIAR.bat
    pause
    exit /b
)

:atualizar
REM --- 2. Atualizar o codigo, se foi clonado com Git (nao falha se nao houver rede) ---
if exist ".git" (
    echo [..] A procurar atualizacoes do codigo...
    git pull >nul 2>nul
    if %errorlevel%==0 (echo [OK] Codigo atualizado.) else (echo [i] Sem rede ou sem atualizacoes, sigo com a versao atual.)
    echo.
)

REM --- 3. Instalar dependencias so da primeira vez ---
if not exist node_modules (
    echo [..] A instalar dependencias (so da primeira vez, pode demorar 1-2 min)...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo [ERRO] A instalacao falhou. Copia a mensagem acima e pede ajuda.
        pause
        exit /b
    )
) else (
    echo [OK] Dependencias prontas.
)

REM --- 4. Arrancar e abrir o navegador ---
echo.
echo [..] A arrancar... o navegador abre sozinho em http://localhost:8080
echo.
echo     - Os PRECOS sao buscados em direto aos sites (atualizam sozinhos).
echo     - Para PARAR o terminal: prime Ctrl+C nesta janela.
echo     - Para ter a versao mais nova no futuro: e so abrir este ficheiro
echo       outra vez (ele atualiza-se sozinho se houver Git).
echo.
start "" cmd /c "timeout /t 8 >nul && start http://localhost:8080"
call npm run dev

echo.
echo O terminal parou. Prime qualquer tecla para fechar.
pause >nul
