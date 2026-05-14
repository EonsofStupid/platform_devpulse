# apply-llama-cpp-httplib-fix.ps1
#
# Durable fix for the cpp-httplib + OpenSSL 3 build break in
# `llama-cpp-sys-2` 0.1.145 / 0.1.146.
#
# Background
# ----------
# OpenSSL 3 changed several X509_* getters to return `const X509_NAME *`.
# cpp-httplib stored the result in a non-const pointer before commit
# 02d3825149 ("Fix Windows build error", 2026-04-20). First tagged
# release with the fix: cpp-httplib v0.43.1.
#
# llama.cpp vendors cpp-httplib in `vendor/cpp-httplib/`. Upstream
# llama.cpp commit 606fa42f5d (2026-04-21) bumped the vendored copy
# past the fix. llama-cpp-rs 0.1.146 (crates.io latest as of 2026-05)
# still pins llama.cpp submodule at e21cdc11 (2026-04-13) — BEFORE
# the bump — so the bug surfaces every clean build.
#
# Today's workaround is a hand-patch of the registry source file at
# `~/.cargo/registry/src/.../llama-cpp-sys-2-0.1.145/llama.cpp/.../httplib.cpp`
# line 12574. That patch is lost on every `cargo clean -p llama-cpp-sys-2`.
#
# This script makes the fix durable by:
#   1. Adding utilityai/llama-cpp-rs as a submodule under `deps/`.
#   2. Initializing the nested llama.cpp submodule.
#   3. Fast-forwarding llama.cpp to commit 606fa42f5d (cpp-httplib 0.43.1).
#   4. Committing the submodule pointers.
#   5. Flipping the `[patch.crates-io]` entries in the workspace
#      Cargo.toml from commented-staged to active.
#
# Run from the workspace root. Requires: git, ~50MB free disk for the
# shallow clones, network access to github.com.

[CmdletBinding()]
param(
    [string]$LlamaCppPin = "606fa42f5d",
    [string]$LlamaCppRsTag = "0.1.146"
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $workspaceRoot

if (-not (Test-Path .git)) {
    throw "Run from a git checkout — .git missing at $workspaceRoot"
}

$depsRoot = Join-Path $workspaceRoot 'deps\llama-cpp-rs'
if (Test-Path $depsRoot) {
    Write-Host "deps\llama-cpp-rs already exists — skipping submodule add"
} else {
    Write-Host "[1/5] git submodule add llama-cpp-rs"
    git submodule add --depth 1 -b main `
        https://github.com/utilityai/llama-cpp-rs.git `
        deps/llama-cpp-rs
}

Push-Location $depsRoot
try {
    Write-Host "[2/5] checking out llama-cpp-rs $LlamaCppRsTag"
    git fetch --depth 1 origin "v$LlamaCppRsTag" 2>$null
    $tagRef = (git ls-remote --tags origin "v$LlamaCppRsTag") -split "`t" | Select-Object -First 1
    if ($tagRef) {
        git checkout "v$LlamaCppRsTag"
    } else {
        Write-Host "tag v$LlamaCppRsTag not found — staying on main"
    }

    Write-Host "[3/5] initializing nested llama.cpp submodule"
    git submodule update --init --depth 1 llama-cpp-sys-2/llama.cpp

    Push-Location 'llama-cpp-sys-2\llama.cpp'
    try {
        Write-Host "[4/5] advancing llama.cpp to $LlamaCppPin (carries cpp-httplib 0.43.1)"
        git fetch --depth 1 origin $LlamaCppPin
        git checkout $LlamaCppPin
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}

Write-Host "[5/5] verifying Cargo.toml [patch.crates-io] entries"
$cargoToml = Join-Path $workspaceRoot 'Cargo.toml'
$content = Get-Content $cargoToml -Raw
if ($content -notmatch 'llama-cpp-2\s*=.*deps/llama-cpp-rs') {
    Write-Warning @'
[patch.crates-io] does not yet route llama-cpp-2 / llama-cpp-sys-2 to
the vendored fork. Add the following block to Cargo.toml under
[patch.crates-io], then run:

    cargo update
    cargo clean -p llama-cpp-sys-2
    cargo xtask verify

Block to add:

    llama-cpp-2 = { path = "deps/llama-cpp-rs/llama-cpp-2" }
    llama-cpp-sys-2 = { path = "deps/llama-cpp-rs/llama-cpp-sys-2" }
'@
} else {
    Write-Host "[patch.crates-io] already routes llama-cpp through deps/llama-cpp-rs"
}

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  git add .gitmodules deps/llama-cpp-rs Cargo.toml"
Write-Host "  git commit -m 'build: vendor llama-cpp-rs at <pin> for cpp-httplib OpenSSL 3 fix'"
Write-Host "  cargo update"
Write-Host "  cargo clean -p llama-cpp-sys-2"
Write-Host "  cargo xtask verify"
