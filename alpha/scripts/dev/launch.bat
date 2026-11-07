@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM DevPulse Development Environment Launcher
REM
REM Launches:
REM   1. Lab Backend (Axum API on :3001)
REM   2. Lab UI (SvelteKit on :5174)
REM   3. Desktop (Tauri + SvelteKit window)
REM
REM Models loaded:
REM   - Llm: Qwen3-VL-4B (default)
REM   - Embedder: Qwen3-Embed-0.6B
REM   - Reranker: Qwen3-Rerank-0.6B
REM
REM Models can be swapped via Lab UI (4B <-> 8B VL)
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ========================================
echo   DevPulse Development Environment
echo ========================================
echo.

REM 1. Set up MSVC x64 environment (required for native builds)
echo [1/4] Setting up MSVC x64 environment...
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to set up MSVC environment
    echo Make sure Visual Studio 2022 is installed with C++ tools
    exit /b 1
)
echo       MSVC x64: OK

REM 2. Add Git's Unix tools (cp, etc.) to PATH for crates that need them
set PATH=%PATH%;C:\Program Files\Git\usr\bin

REM 3. Set CC/CXX for native builds
set CC=cl
set CXX=cl

REM 4. Verify tools exist
echo [2/4] Verifying build tools...
where cl >nul 2>&1 || (echo ERROR: cl.exe not found & exit /b 1)
where cp >nul 2>&1 || (echo ERROR: cp not found - install Git for Windows & exit /b 1)
where cmake >nul 2>&1 || (echo ERROR: cmake not found & exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm not found - install Node.js & exit /b 1)
echo       cl.exe: OK
echo       cp: OK
echo       cmake: OK
echo       npm: OK

REM 5. Navigate to alpha directory
cd /d D:\localdev\alpha_devpulse\alpha
if errorlevel 1 (
    echo ERROR: Could not navigate to D:\localdev\alpha_devpulse\alpha
    exit /b 1
)

REM 6. Build xtask
echo [3/4] Building xtask...
cargo build -p xtask --quiet
if errorlevel 1 (
    echo.
    echo ERROR: xtask build failed
    echo Running verbose build for details:
    cargo build -p xtask
    exit /b 1
)
echo       xtask: OK

REM 7. Launch dev environment
echo [4/4] Launching services...
echo.
echo ========================================
echo   Starting DevPulse Stack
echo ========================================
echo.
echo   Lab Backend:  http://127.0.0.1:3001
echo   Lab UI:       http://127.0.0.1:5174
echo   Desktop:      Tauri window (Ctrl+G for chat)
echo.
echo   Models:
echo     Llm: Qwen3-VL-4B (D:\localdev\dp_alpha\models)
echo     Swap to 8B VL via Lab UI
echo.
echo   Press Ctrl+C to stop all services
echo ========================================
echo.

cargo xtask dev
