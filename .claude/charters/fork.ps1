#!/usr/bin/env pwsh
# fork.ps1 — Windows charter launcher.
#
# Activates a charter and starts a NEW interactive Claude Code session seeded
# with it. Run this in a PLAIN terminal — NOT inside an existing Claude
# session (no nesting). See README.md.
#
#   pwsh .claude/charters/fork.ps1 <slug>

param([Parameter(Mandatory = $true)][string]$Slug, [switch]$Spawn)
$ErrorActionPreference = "Stop"

$here = $PSScriptRoot
$workspace = (Resolve-Path (Join-Path $here "..\..")).Path

node (Join-Path $here "activate.mjs") $Slug
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$seed = "Read .claude/charters/$Slug.md and begin per its instructions; first verify it against the current repository, then work with me phase by phase."

if ($Spawn) {
    # Open the seeded session in a NEW terminal window. This is the path Claude
    # uses to TRIGGER a fork itself (run `fork.ps1 <slug> -Spawn` from the Bash
    # tool) — a fresh interactive Claude session opens on the operator's desktop.
    Start-Process pwsh -ArgumentList '-NoExit', '-Command', "Set-Location '$workspace'; claude '$seed'"
    Write-Host "Spawned a new Claude session window for charter '$Slug'."
}
else {
    Push-Location $workspace
    try { claude $seed } finally { Pop-Location }
}
