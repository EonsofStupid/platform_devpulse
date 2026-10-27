@echo off
REM DevPulse Development Environment Launcher
REM This sets up MSVC x64 + Git tools and runs cargo xtask dev

echo ============================================
echo DevPulse Development Environment
echo ============================================
echo.

REM 1. Set up MSVC x64 environment
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to set up MSVC environment
    exit /b 1
)

REM 2. Add Git's Unix tools (cp, etc.) to PATH for crates that need them
set PATH=%PATH%;C:\Program Files\Git\usr\bin

REM 3. Set CC/CXX for native builds
set CC=cl
set CXX=cl

REM 4. Set up protoc (required by RRO/prost)
set PROTOC_DIR=%LOCALAPPDATA%\protoc
set PROTOC=%PROTOC_DIR%\bin\protoc.exe
if not exist "%PROTOC%" (
    echo Downloading protoc...
    mkdir "%PROTOC_DIR%" 2>nul
    curl -sL "https://github.com/protocolbuffers/protobuf/releases/download/v25.1/protoc-25.1-win64.zip" -o "%TEMP%\protoc.zip"
    powershell -Command "Expand-Archive -Force '%TEMP%\protoc.zip' '%PROTOC_DIR%'"
    del "%TEMP%\protoc.zip"
)
set PATH=%PROTOC_DIR%\bin;%PATH%

REM 5. Verify tools
echo Checking build tools...
where cl >nul 2>&1 || (echo ERROR: cl.exe not found & exit /b 1)
where cp >nul 2>&1 || (echo ERROR: cp not found & exit /b 1)
where cmake >nul 2>&1 || (echo ERROR: cmake not found & exit /b 1)
where protoc >nul 2>&1 || (echo ERROR: protoc not found & exit /b 1)
echo   cl.exe: OK
echo   cp: OK
echo   cmake: OK
echo   protoc: OK
echo.

REM 6. Clean stale cmake caches (VS version mismatch fix)
cd /d D:\localdev\alpha_devpulse\alpha
echo Cleaning stale cmake caches...
for /r target\debug\build %%f in (CMakeCache.txt) do (
    if exist "%%f" del /q "%%f" 2>nul
)
for /d /r target\debug\build %%d in (CMakeFiles) do (
    if exist "%%d" rmdir /s /q "%%d" 2>nul
)
echo   Done.
echo.

REM 7. Build and run
echo Building xtask...
cargo build -p xtask
if errorlevel 1 (
    echo.
    echo ERROR: Build failed
    exit /b 1
)

echo.
echo Build successful! Launching dev environment...
echo.
cargo xtask dev
