@echo off
title SurrealDB v3 — AI Agent Memory Server
echo ============================================
echo  SurrealDB v3 Standalone — DevPulse Platform
echo ============================================
echo.
echo  Data:  D:\localdev\deps\surrealdb\data
echo  Bind:  127.0.0.1:8000
echo  Auth:  root / root
echo.
echo  Namespaces:
echo    global   — shared knowledge (read-only for agents)
echo    projects — per-project data (devpulse, etc.)
echo    agents   — per-agent sessions (claude, cursor, etc.)
echo.
echo  Connect: ws://localhost:8000/rpc
echo ============================================
echo.

if not exist "D:\localdev\deps\surrealdb\data" (
    echo Creating data directory...
    mkdir "D:\localdev\deps\surrealdb\data"
)

surreal start --user root --pass root --bind 127.0.0.1:8000 --log info "surrealkv://D:/localdev/deps/surrealdb/data"
