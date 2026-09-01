@echo off
setlocal
chcp 65001 >nul 2>nul
title Terminal Adopt Me
cd /d "%~dp0"

set "LOG=%~dp0iniciar-log.txt"
echo ==== %date% %time% ==== > "%LOG%"

echo ============================================
echo    TERMINAL DE TRADING  -  ADOPT ME
echo ============================================
echo.

REM --- 0. Confirmar que estamos na pasta certa ---
if not exist "package.json" (
    echo [ERRO] Nao encontrei o package.json nesta pasta:
    echo        %cd%
    echo.
    echo Isto acontece quando o INICIAR.bat foi copiado sozinho para outro
    echo sitio, ou quando o ZIP foi extraido para dentro de outra pasta.
    echo Poe o INICIAR.bat na pasta do projeto ^(a que tem o package.json^).
    echo.
    goto fim
)

REM --- 1. Verificar se o Node.js existe ---
where node >nul 2>nul
if errorlevel 1 goto semnode
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODEV=%%v"
echo [OK] Node.js %NODEV% encontrado.
goto atualizar

:semnode
echo [!] Node.js nao encontrado neste PC.
where winget >nul 2>nul
if errorlevel 1 goto semwinget
echo [..] A tentar instalar o Node.js LTS automaticamente ^(winget^)...
winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
echo.
echo ===================================================================
echo  Instalacao concluida.
echo  FECHA esta janela e faz duplo-clique outra vez no INICIAR.bat
echo  ^(o Node precisa de reiniciar a linha de comandos para ficar ativo^)
echo ===================================================================
goto fim

:semwinget
echo [!] O instalador automatico nao esta disponivel neste Windows.
echo Vou abrir o site do Node.js: descarrega a versao LTS ^(botao verde^)
echo e instala com as opcoes de fabrica.
start "" https://nodejs.org
echo.
echo Depois de instalar, volta a fazer duplo-clique no INICIAR.bat
goto fim

:atualizar
REM --- 2. Atualizar o codigo, se foi clonado com Git ---
if not exist ".git" goto deps
where git >nul 2>nul
if errorlevel 1 goto deps
echo [..] A procurar atualizacoes do codigo...
git pull >>"%LOG%" 2>&1
if errorlevel 1 (
    echo [i] Sem rede ou sem atualizacoes, sigo com a versao atual.
) else (
    echo [OK] Codigo atualizado.
)
echo.

:deps
REM --- 3. Instalar dependencias so da primeira vez ---
if exist "node_modules" goto arrancar
echo [..] A instalar dependencias ^(so da primeira vez, pode demorar 1-2 min^)...
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo [ERRO] A instalacao das dependencias falhou.
    echo Ve a mensagem acima, ou o ficheiro iniciar-log.txt nesta pasta.
    goto fim
)
goto arrancar

:arrancar
echo [OK] Dependencias prontas.
echo.
echo [..] A arrancar... o navegador abre sozinho em http://localhost:8080
echo.
echo     - Os PRECOS sao buscados em direto aos sites ^(atualizam sozinhos^).
echo     - Para PARAR o terminal: prime Ctrl+C nesta janela.
echo     - Para ter a versao mais nova no futuro: e so abrir este ficheiro
echo       outra vez ^(ele atualiza-se sozinho se houver Git^).
echo.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:8080"
call npm run dev
if errorlevel 1 (
    echo.
    echo [ERRO] O servidor terminou com erro. A mensagem esta acima.
)

:fim
echo.
echo Prime qualquer tecla para fechar esta janela.
pause >nul
endlocal
