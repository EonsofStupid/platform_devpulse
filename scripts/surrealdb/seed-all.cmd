@echo off
title SurrealDB — Seed All Schemas
echo ============================================
echo  Seeding SurrealDB schemas and data...
echo ============================================
echo.

set SURREAL_URL=ws://localhost:8000
set SCRIPT_DIR=%~dp0

echo [1/6] Schema: global namespace...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace global --database knowledge "%SCRIPT_DIR%schema-global.surql"
if %errorlevel% neq 0 echo FAILED: schema-global.surql & goto :error

echo [2/6] Schema: projects namespace (devpulse)...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace projects --database devpulse "%SCRIPT_DIR%schema-projects.surql"
if %errorlevel% neq 0 echo FAILED: schema-projects.surql & goto :error

echo [3/6] Schema: agents namespace (claude)...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace agents --database claude "%SCRIPT_DIR%schema-agents.surql"
if %errorlevel% neq 0 echo FAILED: schema-agents.surql & goto :error

echo [4/6] Access control...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace global --database knowledge "%SCRIPT_DIR%schema-access.surql"
if %errorlevel% neq 0 echo FAILED: schema-access.surql & goto :error

echo [5/6] Seed: global knowledge...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace global --database knowledge "%SCRIPT_DIR%seed-global.surql"
if %errorlevel% neq 0 echo FAILED: seed-global.surql & goto :error

echo [6/6] Seed: devpulse project...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace projects --database devpulse "%SCRIPT_DIR%seed-devpulse.surql"
if %errorlevel% neq 0 echo FAILED: seed-devpulse.surql & goto :error

echo.
echo ============================================
echo  All schemas and seeds applied successfully!
echo ============================================
pause
goto :eof

:error
echo.
echo ============================================
echo  SEED FAILED — check output above
echo ============================================
pause
