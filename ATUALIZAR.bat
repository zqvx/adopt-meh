@echo off
chcp 65001 >nul
title Terminal Adopt Me - Atualizar
cd /d "%~dp0"

echo ============================================
echo    ATUALIZAR TERMINAL (codigo + precos)
echo ============================================
echo.

REM --- Atualizar codigo (se foi clonado com Git) ---
if exist ".git" (
    echo [..] A procurar atualizacoes do codigo...
    git pull
    echo.
) else (
    echo [i] Versao ZIP (sem Git). O codigo nao se atualiza sozinho:
    echo     para teres a versao mais recente, volta ao GitHub e
    echo     faz Code ^> Download ZIP de novo.
    echo     Os PRECOS atualizam-se na mesma (ver abaixo).
    echo.
)

REM --- Garantir dependencias ---
where node >nul 2>nul
if errorlevel 1 (
    echo [!] Node.js nao encontrado. Corre primeiro o INICIAR.bat uma vez.
    pause
    exit /b
)
if not exist node_modules (
    echo [..] A instalar dependencias...
    call npm install
) else (
    call npm install >nul 2>nul
)

REM --- Atualizar precos reais (precisa de internet) ---
echo.
echo [..] A descarregar precos atuais (BloxUltra/Eldorado)...
call npm run scrape:values
call npm run scrape:points
echo.

REM --- Arrancar ---
echo [OK] Tudo atualizado. A arrancar...
start "" cmd /c "timeout /t 8 >nul && start http://localhost:8080"
call npm run dev
pause
