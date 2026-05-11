# Windows Defender exclusions for Rust + Tauri dev.
#
# Defender real-time-scans every .rlib, .pdb, .exe, and dependency artifact
# the moment cargo writes it. On a 30+ crate workspace with native deps
# (candle, llama-cpp, ort, duckdb) the scan cost compounds into 20-60% of
# total wall-clock build time.
#
# This script adds path + process exclusions covering:
#   - repo root                (workspace target dir, source tree)
#   - cargo home               (~/.cargo, registry cache, sccache binary)
#   - rustup home              (toolchain installs)
#   - sccache cache            (%LOCALAPPDATA%\Mozilla\sccache)
#   - cargo / rustc / sccache  (process exclusions)
#   - link.exe / rust-lld.exe  (linker process exclusions)
#
# Requires admin. Run once per dev box. Re-run is idempotent.
#
# Usage (from an elevated PowerShell):
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\build-tuning\setup-defender-exclusions.ps1

# --- precondition: admin ---
$current = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($current)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must run from an elevated PowerShell session (Run as Administrator)."
    exit 1
}

# --- precondition: Defender available ---
if (-not (Get-Command Add-MpPreference -ErrorAction SilentlyContinue)) {
    Write-Error "Windows Defender cmdlets not available. Either Defender is disabled or this is not Windows."
    exit 1
}

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$cargoHome = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { Join-Path $env:USERPROFILE ".cargo" }
$rustupHome = if ($env:RUSTUP_HOME) { $env:RUSTUP_HOME } else { Join-Path $env:USERPROFILE ".rustup" }
$sccacheDir = Join-Path $env:LOCALAPPDATA "Mozilla\sccache"

$pathExclusions = @(
    $repoRoot,
    $cargoHome,
    $rustupHome,
    $sccacheDir
)

$processExclusions = @(
    "cargo.exe",
    "rustc.exe",
    "rustup.exe",
    "rust-lld.exe",
    "link.exe",
    "sccache.exe",
    "cc.exe",
    "cmake.exe",
    "ninja.exe",
    "node.exe",
    "pnpm.cmd"
)

Write-Output "Adding path exclusions..."
foreach ($p in $pathExclusions) {
    if (Test-Path $p) {
        Add-MpPreference -ExclusionPath $p -ErrorAction SilentlyContinue
        Write-Output "  + $p"
    } else {
        Write-Output "  - $p (skipped: path does not exist)"
    }
}

Write-Output ""
Write-Output "Adding process exclusions..."
foreach ($proc in $processExclusions) {
    Add-MpPreference -ExclusionProcess $proc -ErrorAction SilentlyContinue
    Write-Output "  + $proc"
}

Write-Output ""
Write-Output "Verifying current exclusions..."
$prefs = Get-MpPreference
Write-Output "  Path exclusions:"
$prefs.ExclusionPath | Where-Object { $_ -match "localdev|cargo|rustup|sccache" } | ForEach-Object {
    Write-Output "    $_"
}
Write-Output "  Process exclusions:"
$prefs.ExclusionProcess | Where-Object { $processExclusions -contains $_ } | ForEach-Object {
    Write-Output "    $_"
}

Write-Output ""
Write-Output "Done. Expected build-time reduction: 20-60% depending on workload."
