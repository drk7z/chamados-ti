@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
cls

:menu
echo.
echo ═══════════════════════════════════════════════════════════
echo     🎫 Sistema de Chamados TI
echo ═══════════════════════════════════════════════════════════
echo.
echo    1. ▶️  Iniciar Sistema (Rápido)
echo    2. 🔧 Iniciar com Diagnóstico Completo
echo    3. 🛑 Parar Servidores
echo    4. 🔍 Diagnosticar PostgreSQL
echo    5. ❌ Sair
echo.
echo ═══════════════════════════════════════════════════════════
set /p opcao="Escolha uma opção (1-5): "

if "%opcao%"=="1" goto :start_quick
if "%opcao%"=="2" goto :start_full
if "%opcao%"=="3" goto :stop
if "%opcao%"=="4" goto :diagnose
if "%opcao%"=="5" exit
cls
echo ❌ Opção inválida!
timeout /t 2 > nul
cls
goto :menu

REM ═══════════════════════════════════════════════════════════
REM  OPÇÃO 1: INICIAR RÁPIDO
REM ═══════════════════════════════════════════════════════════
:start_quick
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🚀 Iniciando Sistema - Modo Rápido
echo ═══════════════════════════════════════════════════════════
echo.

REM Instala dependências se necessário
if not exist "backend\node_modules" (
    echo 📦 Instalando backend...
    cd backend && call npm install --silent && cd ..
)
if not exist "frontend\node_modules" (
    echo 📦 Instalando frontend...
    cd frontend && call npm install --silent && cd ..
)

REM Cria .env se não existir
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" > nul
    echo ⚠️  Configure backend\.env antes de usar!
)

call :prepare_database
call :run_backend_bootstrap

echo.
echo ✅ Iniciando servidores...
echo.
echo    Backend:  http://localhost:3001
echo    Frontend: http://localhost:3000
echo    Login:    admin / admin
echo.

call :free_port 3001 Backend
call :free_port 3000 Frontend

start "Backend - Chamados TI" cmd /c "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend - Chamados TI" cmd /c "cd /d %~dp0frontend && npm start"

echo ✅ Sistema iniciado!
echo.
timeout /t 3 > nul
exit

REM ═══════════════════════════════════════════════════════════
REM  OPÇÃO 2: INICIAR COM DIAGNÓSTICO
REM ═══════════════════════════════════════════════════════════
:start_full
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🔧 Iniciando Sistema - Modo Completo
echo ═══════════════════════════════════════════════════════════
echo.

REM Detecta PostgreSQL
echo [1/4] Verificando PostgreSQL...
set "PG_SERVICE="
set "PG_RUNNING=0"

REM Prioriza serviço em execução; se não houver, usa a maior versão instalada
for %%s in (postgresql-x64-18 postgresql-x64-17 postgresql-x64-16 postgresql-x64-15 postgresql-x64-14 postgresql-x64-13 postgresql) do (
    sc query %%s > nul 2>&1
    if not errorlevel 1 (
        if "!PG_SERVICE!"=="" set "PG_SERVICE=%%s"
        sc query %%s | find /i "RUNNING" > nul 2>&1
        if not errorlevel 1 (
            set "PG_SERVICE=%%s"
            set "PG_RUNNING=1"
            goto :pg_found
        )
    )
)

:pg_found
if "%PG_SERVICE%"=="" (
    echo ⚠️  PostgreSQL não detectado como serviço
    set /p continuar="Continuar mesmo assim? (S/N): "
    if /i not "%continuar%"=="S" goto :menu
) else (
    if "%PG_RUNNING%"=="1" (
        echo ✅ PostgreSQL rodando: %PG_SERVICE%
    ) else (
        echo ⚠️  PostgreSQL parado, tentando iniciar...
        net start %PG_SERVICE% > nul 2>&1
        if errorlevel 1 (
            echo ❌ Falha. Inicie manualmente: net start %PG_SERVICE%
            set /p continuar="Continuar? (S/N): "
            if /i not "%continuar%"=="S" goto :menu
        ) else (
            echo ✅ PostgreSQL iniciado: %PG_SERVICE%
        )
    )
)

echo.
echo [2/4] Verificando dependências...
if not exist "backend\node_modules" (
    echo 📦 Instalando backend...
    cd backend && call npm install && cd ..
) else (
    echo ✅ Backend OK
)

if not exist "frontend\node_modules" (
    echo 📦 Instalando frontend...
    cd frontend && call npm install && cd ..
) else (
    echo ✅ Frontend OK
)

echo.
echo [3/4] Verificando configuração...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" > nul
    echo ⚠️  Arquivo .env criado. Configure:
    echo    - DB_PASSWORD
    echo    - JWT_SECRET
    notepad "backend\.env"
)
echo ✅ Configuração OK

call :prepare_database
call :run_backend_bootstrap

echo.
echo [4/4] Iniciando servidores...
echo.
echo ═══════════════════════════════════════════════════════════
echo    Backend:  http://localhost:3001
echo    Frontend: http://localhost:3000
echo    Login:    admin / admin
echo ═══════════════════════════════════════════════════════════
echo.

call :free_port 3001 Backend
call :free_port 3000 Frontend

start "Backend DEV" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 5 /nobreak > nul
start "Frontend DEV" cmd /k "cd /d %~dp0frontend && npm start"

echo ✅ Sistema iniciado com diagnóstico completo!
echo.
set /p abrir="Abrir navegador? (S/N): "
if /i "%abrir%"=="S" start http://localhost:3000

timeout /t 3 > nul
exit

REM ═══════════════════════════════════════════════════════════
REM  OPÇÃO 3: PARAR SERVIDORES
REM ═══════════════════════════════════════════════════════════
:stop
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🛑 Parando Servidores
echo ═══════════════════════════════════════════════════════════
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Parando Backend [PID: %%a]...
    taskkill /PID %%a /F > nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Parando Frontend [PID: %%a]...
    taskkill /PID %%a /F > nul 2>&1
)

echo.
echo ✅ Servidores parados!
echo.
timeout /t 3 > nul
cls
goto :menu

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: BOOTSTRAP BACKEND (MIGRATE + SEED)
REM ═══════════════════════════════════════════════════════════
:run_backend_bootstrap
set "RUN_BOOTSTRAP=true"

for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^START_RUN_BOOTSTRAP=" "backend\.env" 2^>nul') do set "RUN_BOOTSTRAP=%%B"

if /i not "%RUN_BOOTSTRAP%"=="true" (
    echo ℹ️  Bootstrap backend desabilitado (START_RUN_BOOTSTRAP=%RUN_BOOTSTRAP%)
    exit /b 0
)

if not exist "backend\src\database\migrate.js" (
    echo ℹ️  Script de migrate não encontrado, pulando bootstrap
    exit /b 0
)

if not exist "backend\src\database\seed.js" (
    echo ℹ️  Script de seed não encontrado, pulando bootstrap
    exit /b 0
)

echo.
echo 🔄 Executando bootstrap do backend (migrate + seed)...
cd backend
call npm run migrate > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Falha no migrate automático. Continuando inicialização...
) else (
    echo ✅ Migrate concluído
)

call npm run seed > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Falha no seed automático. Continuando inicialização...
) else (
    echo ✅ Seed concluído
)
cd ..

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: LIBERAR PORTA
REM ═══════════════════════════════════════════════════════════
:free_port
set "TARGET_PORT=%~1"
set "TARGET_NAME=%~2"

for /f "tokens=5" %%a in ('netstat -aon ^| find ":%TARGET_PORT%" ^| find "LISTENING"') do (
    echo ⚠️  Porta %TARGET_PORT% em uso. Encerrando %TARGET_NAME% [PID: %%a]...
    taskkill /PID %%a /F > nul 2>&1
)

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: PREPARAR BANCO (LARAGON/POSTGRES)
REM ═══════════════════════════════════════════════════════════
:prepare_database
echo.
echo 🔎 Verificando banco de dados...

set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=chamados_ti"
set "DB_USER=postgres"
set "DB_PASSWORD="

for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_HOST=" "backend\.env" 2^>nul') do set "DB_HOST=%%B"
for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_PORT=" "backend\.env" 2^>nul') do set "DB_PORT=%%B"
for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_NAME=" "backend\.env" 2^>nul') do set "DB_NAME=%%B"
for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_USER=" "backend\.env" 2^>nul') do set "DB_USER=%%B"
for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_PASSWORD=" "backend\.env" 2^>nul') do set "DB_PASSWORD=%%B"

call :find_psql
if not defined PSQL_CMD (
    echo ⚠️  psql não encontrado no PATH nem no Laragon.
    echo    Inicie o Laragon e tente novamente.
    exit /b 0
)

if defined DB_PASSWORD (
    set "PGPASSWORD=%DB_PASSWORD%"
) else (
    set "PGPASSWORD="
)

"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" > "%temp%\chamados_ti_db_check.txt" 2>nul
set "DB_EXISTS="
set /p DB_EXISTS=<"%temp%\chamados_ti_db_check.txt"
del "%temp%\chamados_ti_db_check.txt" >nul 2>&1

if "%DB_EXISTS%"=="1" (
    echo ✅ Banco '%DB_NAME%' já existe
) else (
    echo ⚠️  Banco '%DB_NAME%' não existe. Criando...
    "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d postgres -c "CREATE DATABASE \"%DB_NAME%\";" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Falha ao criar banco '%DB_NAME%'.
        echo    Verifique usuário/senha no backend\.env e se o PostgreSQL do Laragon está iniciado.
        set "PGPASSWORD="
        exit /b 0
    ) else (
        echo ✅ Banco '%DB_NAME%' criado
        if exist "database\schema.sql" (
            echo 📥 Importando schema inicial...
            "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -f "database\schema.sql" >nul 2>&1
            if errorlevel 1 (
                echo ⚠️  Não foi possível importar schema automaticamente.
                echo    Execute manualmente: psql -U %DB_USER% -d %DB_NAME% -f database\schema.sql
            ) else (
                echo ✅ Schema importado com sucesso
            )
        )
    )
)

set "PGPASSWORD="
exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: DETECTAR PSQL (PATH OU LARAGON)
REM ═══════════════════════════════════════════════════════════
:find_psql
set "PSQL_CMD="

where psql > nul 2>&1
if not errorlevel 1 (
    set "PSQL_CMD=psql"
    exit /b 0
)

for /f "delims=" %%D in ('dir /b /ad-h /o-n "C:\laragon\bin\postgresql" 2^>nul') do (
    if exist "C:\laragon\bin\postgresql\%%D\bin\psql.exe" (
        set "PSQL_CMD=C:\laragon\bin\postgresql\%%D\bin\psql.exe"
        exit /b 0
    )
)

for /f "delims=" %%D in ('dir /b /ad-h /o-n "C:\Program Files\PostgreSQL" 2^>nul') do (
    if exist "C:\Program Files\PostgreSQL\%%D\bin\psql.exe" (
        set "PSQL_CMD=C:\Program Files\PostgreSQL\%%D\bin\psql.exe"
        exit /b 0
    )
)

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  OPÇÃO 4: DIAGNÓSTICO POSTGRESQL
REM ═══════════════════════════════════════════════════════════
:diagnose
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🔍 Diagnóstico PostgreSQL
echo ═══════════════════════════════════════════════════════════
echo.

echo [1] Procurando serviços PostgreSQL...
echo.
set "FOUND=0"
for /f "tokens=2" %%s in ('sc query type^= service state^= all ^| findstr /i "postgres"') do (
    set "FOUND=1"
    echo ✅ Serviço: %%s
    sc query "%%s" | findstr "STATE"
    echo.
)

if "!FOUND!"=="0" (
    echo ❌ Nenhum serviço PostgreSQL encontrado!
    echo.
    echo 💡 Verifique se PostgreSQL está instalado:
    echo    - Download: https://www.postgresql.org/download/windows/
    echo.
)

echo [2] Verificando executável...
echo.
call :find_psql
if defined PSQL_CMD (
    echo ✅ psql encontrado
    "%PSQL_CMD%" --version
) else (
    echo ❌ psql não encontrado no PATH
    echo.
    echo 💡 Se você usa Laragon, inicie o Laragon e tente novamente.
)

echo.
echo [3] Testando conexão...
echo.
if not defined PSQL_CMD (
    echo ❌ Não foi possível testar: psql indisponível
) else (
    "%PSQL_CMD%" -U postgres -d postgres -c "SELECT version();" 2>nul
    if errorlevel 1 (
        echo ❌ Falha na conexão
        echo.
        echo 💡 Verifique:
        echo    1. PostgreSQL/Laragon está rodando?
        echo    2. Senha do usuário 'postgres' está correta?
    ) else (
        echo.
        echo ✅ Conexão OK!
        "%PSQL_CMD%" -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='chamados_ti';" > "%temp%\chamados_ti_diag_db_check.txt" 2>nul
        set "DIAG_DB_EXISTS="
        set /p DIAG_DB_EXISTS=<"%temp%\chamados_ti_diag_db_check.txt"
        del "%temp%\chamados_ti_diag_db_check.txt" >nul 2>&1

        if "!DIAG_DB_EXISTS!"=="1" (
            echo ✅ Banco 'chamados_ti' existe
        ) else (
            echo ⚠️  Banco 'chamados_ti' não existe
            echo.
            echo Para criar:
            echo    "%PSQL_CMD%" -U postgres -d postgres -c "CREATE DATABASE chamados_ti;"
            echo    "%PSQL_CMD%" -U postgres -d chamados_ti -f database\schema.sql
        )
    )
)

echo.
echo ═══════════════════════════════════════════════════════════
pause
cls
goto :menu
