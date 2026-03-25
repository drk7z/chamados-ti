@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
cls

set "AUTO_FLOW=1"
set "START_SUCCESS=0"

if /i "%~1"=="menu" set "AUTO_FLOW=0"
if /i "%~1"=="manual" set "AUTO_FLOW=0"

if "%AUTO_FLOW%"=="1" goto :auto_start

:menu
echo.
echo ═══════════════════════════════════════════════════════════
echo     🎫 Sistema de Chamados TI
echo ═══════════════════════════════════════════════════════════
echo.
echo    1. ▶️  Iniciar Sistema (Rápido)
echo    2. 🔧 Iniciar com Diagnóstico Completo
echo    3. 🛑 Parar Servidores
echo    4. 🔍 Verificar PostgreSQL (Tudo em 1)
echo    5. ❌ Sair
echo.
echo ═══════════════════════════════════════════════════════════
set /p opcao="Escolha uma opção (1-5): "

if "%opcao%"=="1" (
    call :start_quick
    exit /b 0
)
if "%opcao%"=="2" (
    call :start_full
    exit /b 0
)
if "%opcao%"=="3" goto :stop
if "%opcao%"=="4" goto :diagnose
if "%opcao%"=="5" exit /b 0
cls
echo ❌ Opção inválida!
timeout /t 2 > nul
cls
goto :menu

REM ═══════════════════════════════════════════════════════════
REM  INICIALIZAÇÃO AUTOMÁTICA COM FALLBACK
REM ═══════════════════════════════════════════════════════════
:auto_start
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🤖 Inicialização Automática
echo ═══════════════════════════════════════════════════════════
echo.
echo    Tentando opção 1 ^(rápida^)...
echo.

call :start_quick
if "%START_SUCCESS%"=="1" exit /b 0

echo.
echo ⚠️  A opção 1 não concluiu a inicialização automaticamente.
echo    Tentando opção 2 ^(diagnóstico completo^)...
echo.

call :start_full
if "%START_SUCCESS%"=="1" exit /b 0

echo.
echo ❌ A inicialização automática falhou nos modos 1 e 2.
echo    Executando diagnóstico PostgreSQL e abrindo o menu manual...
echo.

call :diagnose
goto :menu

REM ═══════════════════════════════════════════════════════════
REM  OPÇÃO 1: INICIAR RÁPIDO
REM ═══════════════════════════════════════════════════════════
:start_quick
set "START_SUCCESS=0"
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🚀 Iniciando Sistema - Modo Rápido
echo ═══════════════════════════════════════════════════════════
echo.

call :check_node_version
if "%START_BLOCKED%"=="1" goto :start_quick_end

REM Instala dependências se necessário
if not exist "backend\node_modules" (
    echo 📦 Instalando backend...
    cd backend && call npm install --silent && cd ..
)
if not exist "frontend\node_modules" (
    echo 📦 Instalando frontend...
    cd frontend && call npm install --silent && cd ..
)
if not exist "frontend\node_modules\.bin\react-scripts.cmd" (
    echo 📦 Corrigindo dependências do frontend - react-scripts...
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
echo    Admin:    configure DEFAULT_ADMIN_EMAIL e DEFAULT_ADMIN_PASSWORD em backend\.env
echo.

call :is_backend_healthy
if "%BACKEND_READY%"=="1" (
    echo ℹ️  Backend já está em execução na porta 3001.
) else (
    call :free_port 3001 Backend
    start "Backend - Chamados TI" cmd /c "cd /d %~dp0backend && npm run dev"
    call :wait_backend_healthy
)

call :free_port 3000 Frontend
start "Frontend - Chamados TI" cmd /c "cd /d %~dp0frontend && npm start"
call :wait_frontend_healthy

if "%BACKEND_READY%"=="1" if "%FRONTEND_READY%"=="1" set "START_SUCCESS=1"

if "%START_SUCCESS%"=="1" (
    echo ✅ Sistema iniciado!
) else (
    echo ⚠️  A inicialização rápida não confirmou backend/frontend no tempo esperado.
)
echo.

:start_quick_end
timeout /t 3 > nul
exit /b 0

REM  OPÇÃO 2: INICIAR COM DIAGNÓSTICO
REM ═══════════════════════════════════════════════════════════
:start_full
set "START_SUCCESS=0"
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🔧 Iniciando Sistema - Modo Completo
echo ═══════════════════════════════════════════════════════════
echo.

call :check_node_version
if "%START_BLOCKED%"=="1" goto :start_full_end

REM Detecta PostgreSQL
echo [1/4] Verificando PostgreSQL...
set "PG_SERVICE="
set "PG_RUNNING=0"
set "PG_PROBE_PORT=5432"

if exist "backend\.env" (
    for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_PORT=" "backend\.env" 2^>nul') do set "PG_PROBE_PORT=%%B"
)

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

REM Fallback: detecta qualquer serviço com prefixo postgresql
if "%PG_SERVICE%"=="" (
    for /f "tokens=2 delims=:" %%s in ('sc query type^= service state^= all ^| findstr /I /R "SERVICE_NAME: postgresql"') do (
        set "PG_CANDIDATE=%%s"
        set "PG_CANDIDATE=!PG_CANDIDATE: =!"
        if "!PG_CANDIDATE!" NEQ "" (
            if "!PG_SERVICE!"=="" set "PG_SERVICE=!PG_CANDIDATE!"
            sc query "!PG_CANDIDATE!" | find /i "RUNNING" > nul 2>&1
            if not errorlevel 1 (
                set "PG_SERVICE=!PG_CANDIDATE!"
                set "PG_RUNNING=1"
                goto :pg_found
            )
        )
    )
)

:pg_found
if "%PG_SERVICE%"=="" (
    powershell -NoProfile -Command "$ok=$false; try { $r=Test-NetConnection -ComputerName 'localhost' -Port %PG_PROBE_PORT% -WarningAction SilentlyContinue; if($r -and $r.TcpTestSucceeded){$ok=$true} } catch {}; if($ok){exit 0}else{exit 1}" >nul 2>&1
    if not errorlevel 1 (
        echo ✅ PostgreSQL detectado via conexão TCP na porta %PG_PROBE_PORT%.
        echo    Nenhum serviço Windows encontrado - pode estar rodando via Laragon/contêiner.
    ) else (
        call :find_psql
        if defined PSQL_CMD (
            echo ⚠️  PostgreSQL instalado ^(psql encontrado^), mas sem serviço Windows e sem porta %PG_PROBE_PORT% aberta.
            echo    Tentando iniciar automaticamente via pg_ctl...

            call :try_start_postgres_local

            powershell -NoProfile -Command "$ok=$false; try { $r=Test-NetConnection -ComputerName 'localhost' -Port %PG_PROBE_PORT% -WarningAction SilentlyContinue; if($r -and $r.TcpTestSucceeded){$ok=$true} } catch {}; if($ok){exit 0}else{exit 1}" >nul 2>&1
            if not errorlevel 1 (
                echo ✅ PostgreSQL iniciado automaticamente via pg_ctl.
            ) else (
                echo ⚠️  Não foi possível iniciar automaticamente.
                echo    Verifique se o PostgreSQL foi iniciado ^(ex.: Laragon, pg_ctl, Docker^).
                if "%AUTO_FLOW%"=="1" (
                    set "continuar=S"
                    echo    Modo automático: seguindo para próxima verificação.
                ) else (
                    set /p continuar="Continuar mesmo assim? (S/N) [S]: "
                    if "%continuar%"=="" set "continuar=S"
                    if /i not "%continuar%"=="S" goto :start_full_end
                )
            )
        ) else (
            echo ⚠️  PostgreSQL não detectado como serviço
            if "%AUTO_FLOW%"=="1" (
                set "continuar=S"
                echo    Modo automático: seguindo para próxima verificação.
            ) else (
                set /p continuar="Continuar mesmo assim? (S/N) [S]: "
                if "%continuar%"=="" set "continuar=S"
                if /i not "%continuar%"=="S" goto :start_full_end
            )
        )
    )
) else (
    if "%PG_RUNNING%"=="1" (
        echo ✅ PostgreSQL rodando: %PG_SERVICE%
    ) else (
        echo ⚠️  PostgreSQL parado, tentando iniciar...
        net start %PG_SERVICE% > nul 2>&1
        if errorlevel 1 (
            echo ❌ Falha. Inicie manualmente: net start %PG_SERVICE%
            if "%AUTO_FLOW%"=="1" (
                set "continuar=S"
                echo    Modo automático: seguindo para próxima verificação.
            ) else (
                set /p continuar="Continuar? (S/N) [S]: "
                if "%continuar%"=="" set "continuar=S"
                if /i not "%continuar%"=="S" goto :start_full_end
            )
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

if not exist "frontend\node_modules\.bin\react-scripts.cmd" (
    echo 📦 react-scripts ausente, reinstalando dependências do frontend...
    cd frontend && call npm install && cd ..
) else (
    echo ✅ react-scripts OK
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
echo    Admin:    configure DEFAULT_ADMIN_EMAIL e DEFAULT_ADMIN_PASSWORD em backend\.env
echo ═══════════════════════════════════════════════════════════
echo.

call :is_backend_healthy
if "%BACKEND_READY%"=="1" (
    echo ℹ️  Backend já está em execução na porta 3001.
) else (
    call :free_port 3001 Backend
    start "Backend DEV" cmd /k "cd /d %~dp0backend && npm run dev"
    call :wait_backend_healthy
)

call :free_port 3000 Frontend
start "Frontend DEV" cmd /k "cd /d %~dp0frontend && npm start"
call :wait_frontend_healthy

if "%BACKEND_READY%"=="1" if "%FRONTEND_READY%"=="1" set "START_SUCCESS=1"

if "%START_SUCCESS%"=="1" (
    echo ✅ Sistema iniciado com diagnóstico completo!
) else (
    echo ⚠️  O modo completo terminou sem confirmar backend/frontend no tempo esperado.
)
echo.
if "%AUTO_FLOW%"=="1" (
    if "%START_SUCCESS%"=="1" start http://localhost:3000
) else (
    set /p abrir="Abrir navegador? (S/N): "
    if /i "%abrir%"=="S" start http://localhost:3000
)

:start_full_end
timeout /t 3 > nul
exit /b 0

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
REM  AUXILIAR: VERIFICAR SAÚDE BACKEND
REM ═══════════════════════════════════════════════════════════
:is_backend_healthy
set "BACKEND_READY=0"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 set "BACKEND_READY=1"
exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: AGUARDAR BACKEND SUBIR
REM ═══════════════════════════════════════════════════════════
:wait_backend_healthy
set "BACKEND_READY=0"
echo ⏳ Aguardando backend ficar disponível...

for /l %%I in (1,1,20) do (
    call :is_backend_healthy
    if "!BACKEND_READY!"=="1" (
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
)

:backend_ready
if "%BACKEND_READY%"=="1" (
    echo ✅ Backend pronto.
) else (
    echo ⚠️  Backend não respondeu no tempo esperado.
    echo    O frontend será iniciado mesmo assim.
)

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: VERIFICAR SAÚDE FRONTEND
REM ═══════════════════════════════════════════════════════════
:is_frontend_healthy
set "FRONTEND_READY=0"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 set "FRONTEND_READY=1"
exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: AGUARDAR FRONTEND SUBIR
REM ═══════════════════════════════════════════════════════════
:wait_frontend_healthy
set "FRONTEND_READY=0"
echo ⏳ Aguardando frontend ficar disponível...

for /l %%I in (1,1,40) do (
    call :is_frontend_healthy
    if "!FRONTEND_READY!"=="1" (
        goto :frontend_ready
    )
    timeout /t 1 /nobreak >nul
)

:frontend_ready
if "%FRONTEND_READY%"=="1" (
    echo ✅ Frontend pronto.
) else (
    echo ⚠️  Frontend não respondeu no tempo esperado.
)

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: CHECAR VERSÃO DO NODE
REM ═══════════════════════════════════════════════════════════
:check_node_version
set "START_BLOCKED=0"
set "NODE_MAJOR="
for /f %%V in ('node -p "process.versions.node.split(\".\")[0]" 2^>nul') do set "NODE_MAJOR=%%V"

if not defined NODE_MAJOR (
    echo ⚠️  Node.js não encontrado no PATH.
    echo    Instale o Node.js LTS para executar o sistema.
    set "START_BLOCKED=1"
    exit /b 0
)

if %NODE_MAJOR% GEQ 22 (
    echo ⚠️  Node.js %NODE_MAJOR% detectado.
    echo    Tentando alternar automaticamente para Node.js 20 LTS via nvm...

    call :find_nvm
    if not defined NVM_CMD (
        echo    nvm não encontrado no PATH.
        echo    Recomendado para o frontend com react-scripts: Node.js 20 LTS.
        echo    O sistema continua iniciando, mas pode exibir avisos de depreciação.
    ) else (
        "%NVM_CMD%" use 20 >nul 2>&1
        if errorlevel 1 (
            echo    Não foi possível ativar Node.js 20 com nvm.
            echo    Verifique: nvm install 20 ^&^& nvm use 20
            echo    O sistema continua iniciando, mas pode exibir avisos de depreciação.
        ) else (
            set "NODE_MAJOR="
            for /f %%V in ('node -p "process.versions.node.split(\".\")[0]" 2^>nul') do set "NODE_MAJOR=%%V"
            if "%NODE_MAJOR%"=="20" (
                echo ✅ Node.js 20 ativado automaticamente via nvm.
            ) else (
                echo ⚠️  nvm executado, mas a versão ativa permaneceu em Node.js %NODE_MAJOR%.
                echo    O sistema continua iniciando, mas pode exibir avisos de depreciação.
            )
        )
    )
) else (
    if %NODE_MAJOR% LSS 18 (
        echo ⚠️  Node.js %NODE_MAJOR% detectado.
        echo    Recomendado usar Node.js 20 LTS para melhor compatibilidade.
    ) else (
        echo ✅ Node.js %NODE_MAJOR% detectado.
    )
)

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: TENTAR INICIAR POSTGRESQL LOCAL VIA PG_CTL
REM ═══════════════════════════════════════════════════════════
:try_start_postgres_local
set "PG_LOCAL_STARTED=0"
set "PG_CTL_CMD="
set "PG_DATA_DIR="
set "PG_LOG_FILE="

call :find_psql
if not defined PSQL_CMD exit /b 0

if /i "%PSQL_CMD%"=="psql" exit /b 0

for %%F in ("%PSQL_CMD%") do set "PG_PSQL_DIR=%%~dpF"
if not defined PG_PSQL_DIR exit /b 0

set "PG_CTL_CMD=%PG_PSQL_DIR%pg_ctl.exe"
if not exist "%PG_CTL_CMD%" exit /b 0

if exist "%PG_PSQL_DIR%..\data\PG_VERSION" set "PG_DATA_DIR=%PG_PSQL_DIR%..\data"

if not defined PG_DATA_DIR (
    for %%D in ("C:\Program Files\PostgreSQL\18\data" "C:\Program Files\PostgreSQL\17\data" "C:\Program Files\PostgreSQL\16\data" "C:\Program Files\PostgreSQL\15\data" "C:\Program Files\PostgreSQL\14\data") do (
        if exist "%%~D\PG_VERSION" (
            set "PG_DATA_DIR=%%~D"
            goto :pg_data_found
        )
    )
)

:pg_data_found
if not defined PG_DATA_DIR exit /b 0

if not exist "%PG_DATA_DIR%\log" mkdir "%PG_DATA_DIR%\log" >nul 2>&1
set "PG_LOG_FILE=%PG_DATA_DIR%\log\startup.log"

"%PG_CTL_CMD%" status -D "%PG_DATA_DIR%" >nul 2>&1
if not errorlevel 1 (
    set "PG_LOCAL_STARTED=1"
    exit /b 0
)

"%PG_CTL_CMD%" start -D "%PG_DATA_DIR%" -l "%PG_LOG_FILE%" >nul 2>&1
if not errorlevel 1 set "PG_LOCAL_STARTED=1"

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: DETECTAR NVM (PATH OU INSTALAÇÃO PADRÃO WINDOWS)
REM ═══════════════════════════════════════════════════════════
:find_nvm
set "NVM_CMD="

where nvm >nul 2>&1
if not errorlevel 1 (
    set "NVM_CMD=nvm"
    exit /b 0
)

if defined NVM_HOME (
    if exist "%NVM_HOME%\nvm.exe" (
        set "NVM_CMD=%NVM_HOME%\nvm.exe"
        exit /b 0
    )
)

if exist "%AppData%\nvm\nvm.exe" (
    set "NVM_CMD=%AppData%\nvm\nvm.exe"
    exit /b 0
)

if exist "%ProgramFiles%\nvm\nvm.exe" (
    set "NVM_CMD=%ProgramFiles%\nvm\nvm.exe"
    exit /b 0
)

if exist "%ProgramFiles(x86)%\nvm\nvm.exe" (
    set "NVM_CMD=%ProgramFiles(x86)%\nvm\nvm.exe"
    exit /b 0
)

if defined ChocolateyInstall (
    if exist "%ChocolateyInstall%\bin\nvm.exe" (
        set "NVM_CMD=%ChocolateyInstall%\bin\nvm.exe"
        exit /b 0
    )
)

if exist "%ProgramData%\chocolatey\bin\nvm.exe" (
    set "NVM_CMD=%ProgramData%\chocolatey\bin\nvm.exe"
    exit /b 0
)

if exist "%USERPROFILE%\scoop\apps\nvm\current\nvm.exe" (
    set "NVM_CMD=%USERPROFILE%\scoop\apps\nvm\current\nvm.exe"
    exit /b 0
)

for /f "delims=" %%P in ('powershell -NoProfile -Command "$cmd = Get-Command nvm -ErrorAction SilentlyContinue; if($cmd){ $cmd.Source }" 2^>nul') do (
    if exist "%%P" (
        set "NVM_CMD=%%P"
        exit /b 0
    )
)

exit /b 0

REM ═══════════════════════════════════════════════════════════
REM  AUXILIAR: BOOTSTRAP BACKEND (MIGRATE + SEED)
REM ═══════════════════════════════════════════════════════════
:run_backend_bootstrap
set "RUN_BOOTSTRAP=true"

for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^START_RUN_BOOTSTRAP=" "backend\.env" 2^>nul') do set "RUN_BOOTSTRAP=%%B"

if /i not "%RUN_BOOTSTRAP%"=="true" (
    echo ℹ️  Bootstrap backend desabilitado - START_RUN_BOOTSTRAP=%RUN_BOOTSTRAP%
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
REM  OPÇÃO 4: VERIFICAÇÃO COMPLETA POSTGRESQL
REM ═══════════════════════════════════════════════════════════
:diagnose
cls
echo.
echo ═══════════════════════════════════════════════════════════
echo    🔍 Verificação PostgreSQL (Tudo em 1)
echo ═══════════════════════════════════════════════════════════
echo.

set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=chamados_ti"
set "DB_USER=postgres"
set "DB_PASSWORD="

if exist "backend\.env" (
    for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_HOST=" "backend\.env" 2^>nul') do set "DB_HOST=%%B"
    for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_PORT=" "backend\.env" 2^>nul') do set "DB_PORT=%%B"
    for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_NAME=" "backend\.env" 2^>nul') do set "DB_NAME=%%B"
    for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_USER=" "backend\.env" 2^>nul') do set "DB_USER=%%B"
    for /f "tokens=1,* delims==" %%A in ('findstr /R /C:"^DB_PASSWORD=" "backend\.env" 2^>nul') do set "DB_PASSWORD=%%B"
)

echo [1/5] Detectando serviço PostgreSQL...
set "FOUND=0"
set "RUNNING=0"
for /f "tokens=2 delims=:" %%s in ('sc query type^= service state^= all ^| findstr /I /R "SERVICE_NAME: postgresql"') do (
    set "FOUND=1"
    set "SVC=%%s"
    set "SVC=!SVC: =!"
    echo    Serviço encontrado: !SVC!
    sc query "!SVC!" | find /i "RUNNING" >nul 2>&1
    if not errorlevel 1 (
        set "RUNNING=1"
    )
)

if "!FOUND!"=="0" (
    echo ⚠️  Nenhum serviço PostgreSQL registrado no Windows.
) else (
    if "!RUNNING!"=="1" (
        echo ✅ Serviço PostgreSQL em execução.
    ) else (
        echo ⚠️  Serviço encontrado, mas não está rodando.
    )
)

echo.
echo [2/5] Testando porta %DB_PORT% em %DB_HOST%...
powershell -NoProfile -Command "$ok=$false; try { $r=Test-NetConnection -ComputerName '%DB_HOST%' -Port %DB_PORT% -WarningAction SilentlyContinue; if($r -and $r.TcpTestSucceeded){$ok=$true} } catch {}; if($ok){exit 0}else{exit 1}" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Porta %DB_PORT% fechada.
    echo    Tentando iniciar PostgreSQL local via pg_ctl...
    call :try_start_postgres_local

    powershell -NoProfile -Command "$ok=$false; try { $r=Test-NetConnection -ComputerName '%DB_HOST%' -Port %DB_PORT% -WarningAction SilentlyContinue; if($r -and $r.TcpTestSucceeded){$ok=$true} } catch {}; if($ok){exit 0}else{exit 1}" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Porta %DB_PORT% continua fechada após tentativa de inicialização.
    ) else (
        echo ✅ Porta %DB_PORT% aberta após auto-start.
    )
) else (
    echo ✅ Porta %DB_PORT% está acessível.
)

echo.
echo [3/5] Verificando executável psql...
call :find_psql
if defined PSQL_CMD (
    echo ✅ psql encontrado: %PSQL_CMD%
    "%PSQL_CMD%" --version
) else (
    echo ❌ psql não encontrado no PATH/Laragon/PostgreSQL.
)

echo.
echo [4/5] Testando autenticação no PostgreSQL...
if not defined PSQL_CMD (
    echo ❌ Não foi possível testar autenticação sem psql.
) else (
    if defined DB_PASSWORD (
        set "PGPASSWORD=%DB_PASSWORD%"
    ) else (
        set "PGPASSWORD="
    )

    "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d postgres -tAc "SELECT 1;" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Falha na conexão/auth com o usuário '%DB_USER%'.
        echo    Verifique DB_HOST/DB_PORT/DB_USER/DB_PASSWORD no backend\.env.
    ) else (
        echo ✅ Conexão e autenticação OK.
    )
)

echo.
echo [5/5] Verificando banco da aplicação...
if not defined PSQL_CMD (
    echo ⚠️  Banco '%DB_NAME%' não verificado (psql indisponível).
) else (
    "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" > "%temp%\chamados_ti_diag_db_check.txt" 2>nul
    set "DIAG_DB_EXISTS="
    set /p DIAG_DB_EXISTS=<"%temp%\chamados_ti_diag_db_check.txt"
    del "%temp%\chamados_ti_diag_db_check.txt" >nul 2>&1

    if "%DIAG_DB_EXISTS%"=="1" (
        echo ✅ Banco '%DB_NAME%' existe.
    ) else (
        echo ⚠️  Banco '%DB_NAME%' não existe.
        echo    Para criar: "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d postgres -c "CREATE DATABASE \"%DB_NAME%\";"
    )
)

set "PGPASSWORD="

echo.
echo ═══════════════════════════════════════════════════════════
if "%AUTO_FLOW%"=="1" (
    exit /b 0
) else (
    pause
    cls
    goto :menu
)
