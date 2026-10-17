# Dev Environment Fix Plan

**Date:** 2026-01-07
**Problem:** Dev environment is broken, half-assed, and doesn't handle real-world build issues

---

## Current Problems

1. **CMake cache conflicts** - VS version changes break builds, user has to manually delete cache
2. **Duplicate batch files** - 6 different launcher scripts scattered around
3. **No stale cache detection** - Build fails with cryptic cmake errors
4. **MSVC environment not set up** - Running from PowerShell fails because cl.exe not in PATH
5. **No single entry point** - User doesn't know which script to run

---

## What a Senior Dev Would Do

### 1. Single Entry Point
- ONE batch file at project root: `dev.bat`
- ONE location, no confusion

### 2. Auto-Clean Stale Caches
Before building, detect and clean:
- `target/debug/build/**/CMakeCache.txt` files with wrong VS version
- `target/debug/build/**/CMakeFiles/` directories when VS version changes

### 3. Environment Detection
- Detect current VS version from vcvarsall.bat
- Store it in a marker file
- If VS version changed since last build → clean cmake caches automatically

### 4. Clear Error Messages
When something fails, tell user EXACTLY what went wrong and how to fix it

---

## Implementation Plan

### Step 1: Create Single `dev.bat` at Project Root

Location: `d:\localdev\alpha_devpulse\dev.bat`

```batch
@echo off
REM DevPulse Dev Environment - Single Entry Point
REM
REM This script:
REM   1. Sets up MSVC environment
REM   2. Detects VS version changes and cleans stale caches
REM   3. Runs cargo xtask dev

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   DevPulse Dev Environment
echo ========================================
echo.

REM --- Step 1: Set up MSVC ---
echo [1/4] Setting up MSVC environment...
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul 2>&1
if errorlevel 1 (
    echo ERROR: MSVC setup failed
    echo Install Visual Studio 2022 with C++ tools
    exit /b 1
)

REM Get VS version
for /f "tokens=*" %%i in ('cl 2^>^&1 ^| findstr /i "Version"') do set VS_VERSION=%%i
echo       MSVC: OK

REM --- Step 2: Check for VS version change ---
set MARKER_FILE=d:\localdev\alpha_devpulse\alpha\target\.vs_version
set NEED_CLEAN=0

if exist "%MARKER_FILE%" (
    set /p OLD_VERSION=<"%MARKER_FILE%"
    if not "!OLD_VERSION!"=="!VS_VERSION!" (
        echo.
        echo [!] VS version changed - cleaning cmake caches...
        set NEED_CLEAN=1
    )
) else (
    set NEED_CLEAN=1
)

REM --- Step 3: Clean stale cmake caches if needed ---
if !NEED_CLEAN!==1 (
    echo [2/4] Cleaning stale cmake caches...

    REM Delete CMakeCache.txt files
    for /r "d:\localdev\alpha_devpulse\alpha\target\debug\build" %%f in (CMakeCache.txt) do (
        if exist "%%f" del /q "%%f" 2>nul
    )

    REM Delete CMakeFiles directories
    for /d /r "d:\localdev\alpha_devpulse\alpha\target\debug\build" %%d in (CMakeFiles) do (
        if exist "%%d" rd /s /q "%%d" 2>nul
    )

    echo       Caches cleaned

    REM Save current VS version
    echo !VS_VERSION!>"%MARKER_FILE%"
) else (
    echo [2/4] CMake caches OK (VS version unchanged)
)

REM --- Step 4: Add tools to PATH ---
set PATH=%PATH%;C:\Program Files\Git\usr\bin
set CC=cl
set CXX=cl

REM --- Step 5: Verify tools ---
echo [3/4] Verifying tools...
where cl >nul 2>&1 || (echo ERROR: cl.exe not found & exit /b 1)
where cmake >nul 2>&1 || (echo ERROR: cmake not found & exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm not found & exit /b 1)
echo       All tools OK

REM --- Step 6: Run xtask dev ---
echo [4/4] Starting dev environment...
echo.
cd /d d:\localdev\alpha_devpulse\alpha
cargo xtask dev
```

### Step 2: Delete All Other Batch Files

Remove these duplicates:
- `d:\localdev\alpha_devpulse\get_msvc_env.bat`
- `d:\localdev\alpha_devpulse\build_now.bat`
- `d:\localdev\alpha_devpulse\check_tools.bat`
- `d:\localdev\alpha_devpulse\alpha\scripts\dev\launch\rundev.bat`
- `d:\localdev\alpha_devpulse\alpha\scripts\dev\launch.bat`

**BUT FIRST:** Read each one to check if any has unique functionality to preserve.

### Step 3: Update xtask to Also Handle Cache Cleaning

Add to `main.rs`:

```rust
/// Clean stale cmake caches (VS version mismatch)
fn clean_cmake_caches(alpha_dir: &str) {
    let build_dir = format!("{}/target/debug/build", alpha_dir);
    if !std::path::Path::new(&build_dir).exists() {
        return;
    }

    // Walk and delete CMakeCache.txt and CMakeFiles/
    for entry in walkdir::WalkDir::new(&build_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.file_name() == Some("CMakeCache.txt".as_ref()) {
            let _ = std::fs::remove_file(path);
        }
        if path.file_name() == Some("CMakeFiles".as_ref()) && path.is_dir() {
            let _ = std::fs::remove_dir_all(path);
        }
    }
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `d:\localdev\alpha_devpulse\dev.bat` | CREATE - single entry point |
| `d:\localdev\alpha_devpulse\get_msvc_env.bat` | READ FIRST, then delete if redundant |
| `d:\localdev\alpha_devpulse\build_now.bat` | READ FIRST, then delete if redundant |
| `d:\localdev\alpha_devpulse\check_tools.bat` | READ FIRST, then delete if redundant |
| `alpha\scripts\dev\launch\rundev.bat` | READ FIRST, then delete if redundant |
| `alpha\scripts\dev\launch.bat` | READ FIRST, then delete if redundant |
| `alpha\xtask\src\main.rs` | ADD cmake cache cleaning |
| `alpha\xtask\Cargo.toml` | ADD walkdir dependency (if needed) |

---

## Verification Steps

1. Run `dev.bat` from project root
2. Should see cmake cache cleaning message
3. Should compile without VS version errors
4. Should launch all services
5. Change VS version, run again - should auto-clean

---

## What I Will NOT Do Without Permission

- Delete any files without reading them first and showing you the contents
- Make changes without explicit approval
- Assume anything works without testing

---

Ready to implement when approved. Which step do you want me to start with?
