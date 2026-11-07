@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM DevPulse Lab Only - Quick Launch
REM
REM Launches:
REM   1. Lab Backend (Axum API on :3001)
REM   2. Lab UI (SvelteKit on :5174)
REM
REM No Desktop, just Lab dashboard
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ========================================
echo   DevPulse Lab Only
echo ========================================
echo.

REM Set up paths
cd /d D:\localdev\alpha_devpulse\alpha

REM Check if Lab UI has node_modules
if not exist "lab\ui\node_modules" (
    echo Installing Lab UI dependencies...
    cd lab\ui
    call npm install
    cd ..\..
)

echo Starting Lab Backend on :3001...
start "Lab Backend" cmd /c "cargo run -p lab"

echo Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

echo Starting Lab UI on :5174...
cd lab\ui
start "Lab UI" cmd /c "npm run dev"

echo.
echo ========================================
echo   Lab Running!
echo ========================================
echo.
echo   Lab API:  http://127.0.0.1:3001/api/health
echo   Lab UI:   http://127.0.0.1:5174
echo.
echo   Close both windows to stop Lab
echo ========================================

REM Open browser
start http://127.0.0.1:5174
