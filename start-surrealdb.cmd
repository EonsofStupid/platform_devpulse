@echo off
title SurrealDB - DevPulse
echo ============================================
echo   SurrealDB v2.6.0 - DevPulse Local Instance
echo ============================================
echo.
echo   Endpoint:  http://127.0.0.1:8000
echo   User:      root
echo   Storage:   data\devpulse.db (RocksDB)
echo.
echo   Press Ctrl+C to stop.
echo ============================================
echo.

cd /d "%~dp0"

surreal start --user root --pass root --bind 127.0.0.1:8000 rocksdb:data/devpulse.db

pause
