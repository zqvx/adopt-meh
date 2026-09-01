@echo off
chcp 65001 >nul
title Terminal Adopt Me - Iniciar
cd /d "%~dp0"

echo ============================================
echo    TERMINAL DE TRADING  -  ADOPT ME
echo ============================================
echo.

REM --- 1. Verificar se o Node.js existe ---
where node >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Node.js encontrado.
    goto instalar
)

echo [!] Node.js nao encontrado neste PC.
echo.
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

:instalar
REM --- 2. Instalar dependencias so da primeira vez ---
if not exist node_modules (
    echo.
    echo [..] A instalar dependencias (so da primeira vez, pode demorar 1-2 min)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] A instalacao falhou. Copia a mensagem acima e pede ajuda.
        pause
        exit /b
    )
) else (
    echo [OK] Dependencias ja instaladas.
)

REM --- 3. Arrancar e abrir o navegador ---
echo.
echo [..] A arrancar... o navegador abre sozinho em http://localhost:8080
echo     Para parar o terminal: prime Ctrl+C nesta janela.
echo.
start "" cmd /c "timeout /t 8 >nul && start http://localhost:8080"
call npm run dev

echo.
echo O terminal parou. Prime qualquer tecla para fechar.
pause >nul
