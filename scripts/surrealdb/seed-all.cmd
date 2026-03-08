@echo off
title SurrealDB — Seed All Schemas
echo ============================================
echo  Seeding SurrealDB schemas and data...
echo ============================================
echo.

set SURREAL_URL=http://127.0.0.1:8822
set SCRIPT_DIR=%~dp0

echo [1/8] Schema: global namespace...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace global --database knowledge "%SCRIPT_DIR%schema-global.surql"
if %errorlevel% neq 0 echo FAILED: schema-global.surql & goto :error

echo [2/8] Schema: projects namespace (devpulse)...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace projects --database devpulse "%SCRIPT_DIR%schema-projects.surql"
if %errorlevel% neq 0 echo FAILED: schema-projects.surql & goto :error

echo [3/8] Schema: agents namespace (claude)...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace agents --database claude "%SCRIPT_DIR%schema-agents.surql"
if %errorlevel% neq 0 echo FAILED: schema-agents (claude) & goto :error

echo [4/8] Schema: agents namespace (cursor)...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace agents --database cursor "%SCRIPT_DIR%schema-agents.surql"
if %errorlevel% neq 0 echo FAILED: schema-agents (cursor) & goto :error

echo [5/8] Schema: lessons (projects/devpulse)...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace projects --database devpulse "%SCRIPT_DIR%schema-lessons.surql"
if %errorlevel% neq 0 echo FAILED: schema-lessons.surql & goto :error

echo [6/8] Access control...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace global --database knowledge "%SCRIPT_DIR%schema-access.surql"
if %errorlevel% neq 0 echo FAILED: schema-access.surql & goto :error

echo [7/8] Seed: global knowledge...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace global --database knowledge "%SCRIPT_DIR%seed-global.surql"
if %errorlevel% neq 0 echo FAILED: seed-global.surql & goto :error

echo [8/8] Seed: devpulse project...
surreal import --endpoint %SURREAL_URL% --username root --password root --namespace projects --database devpulse "%SCRIPT_DIR%seed-devpulse.surql"
if %errorlevel% neq 0 echo FAILED: seed-devpulse.surql & goto :error

echo.
echo ============================================
echo  All schemas and seeds applied successfully!
echo  Agents provisioned: claude, cursor
echo ============================================
pause
goto :eof

:error
echo.
echo ============================================
echo  SEED FAILED — check output above
echo ============================================
pause
