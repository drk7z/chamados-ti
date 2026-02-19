@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo.
echo ===========================================================
echo   Instalador de Dependencias - Sistema de Chamados TI
echo ===========================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado no PATH.
    echo        Instale o Node.js LTS e tente novamente.
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado no PATH.
    echo        Reinstale o Node.js (com npm) e tente novamente.
    exit /b 1
)

for /f %%V in ('node -v 2^>nul') do set "NODE_VERSION=%%V"
echo [INFO] Node detectado: %NODE_VERSION%
echo.

if not exist "backend\package.json" (
    echo [ERRO] backend\package.json nao encontrado.
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERRO] frontend\package.json nao encontrado.
    exit /b 1
)

echo [1/2] Instalando dependencias do backend...
cd /d "%ROOT_DIR%backend"
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do backend.
    cd /d "%ROOT_DIR%"
    exit /b 1
)
echo [OK] Backend finalizado.
echo.

echo [2/2] Instalando dependencias do frontend...
cd /d "%ROOT_DIR%frontend"
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do frontend.
    cd /d "%ROOT_DIR%"
    exit /b 1
)
echo [OK] Frontend finalizado.
echo.

if not exist "%ROOT_DIR%frontend\node_modules\.bin\react-scripts.cmd" (
    echo [WARN] react-scripts nao encontrado apos a instalacao.
    echo        Execute novamente: cd frontend ^&^& npm install
    cd /d "%ROOT_DIR%"
    exit /b 1
)

cd /d "%ROOT_DIR%"
echo ===========================================================
echo   Dependencias instaladas com sucesso.
echo ===========================================================
echo.
exit /b 0
