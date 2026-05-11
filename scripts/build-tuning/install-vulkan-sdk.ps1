# Install the LunarG Vulkan SDK -- the build-time foundation for the
# cross-vendor GPU backend (`gpu-vulkan` feature).
#
# This is a build-time dependency only. The resulting binary loads the
# runtime `vulkan-1.dll` from the user's GPU driver -- every modern NVIDIA /
# AMD / Intel driver ships one -- so customers never need to install
# anything.
#
# Idempotent: if `VULKAN_SDK` is already set and points at a real install,
# the script exits without re-downloading.
#
# The Vulkan SDK installer is Qt-Installer-Framework based and supports
# silent install via `--accept-licenses --default-answer --confirm-command
# install`. Requires admin because the default install path is
# `C:\VulkanSDK\<version>\`.

$ErrorActionPreference = "Stop"

# --- 0. Is it already installed? ---
$existing = [System.Environment]::GetEnvironmentVariable("VULKAN_SDK", "Machine")
if (-not $existing) {
    $existing = $env:VULKAN_SDK
}
if ($existing -and (Test-Path $existing)) {
    Write-Output "Vulkan SDK already installed at: $existing"
    Write-Output "Skipping install. Delete that directory if you want to reinstall."
    exit 0
}

# Also detect if any version is installed under C:\VulkanSDK\
$candidate = Get-ChildItem -Path "C:\VulkanSDK\" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
if ($candidate) {
    Write-Output "Found existing install at: $($candidate.FullName)"
    Write-Output "Setting VULKAN_SDK machine env var to match..."
    [System.Environment]::SetEnvironmentVariable("VULKAN_SDK", $candidate.FullName, "Machine")
    $env:VULKAN_SDK = $candidate.FullName
    Write-Output "Done. Open a new shell so the variable propagates."
    exit 0
}

# --- 1. Admin check ---
$current = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($current)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Output "Vulkan SDK install requires admin. Re-launching elevated..."
    $relaunch = Start-Process powershell -Verb RunAs -PassThru -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $PSCommandPath
    )
    $relaunch.WaitForExit()
    exit $relaunch.ExitCode
}

# --- 2. Download ---
$installerUrl = "https://sdk.lunarg.com/sdk/download/latest/windows/vulkan-sdk.exe"
$installerPath = Join-Path $env:TEMP "vulkan-sdk-installer.exe"

Write-Output "Downloading Vulkan SDK installer..."
Write-Output "  source: $installerUrl"
Write-Output "  dest:   $installerPath"
Write-Output "  (~1 GB; this takes a few minutes)"

# Suppress IE-engine progress bar -- Invoke-WebRequest is ~10x faster with it off.
$prevProgress = $ProgressPreference
$ProgressPreference = "SilentlyContinue"
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
}
finally {
    $ProgressPreference = $prevProgress
}

if (-not (Test-Path $installerPath)) {
    Write-Error "Download failed -- installer not at $installerPath"
    exit 1
}
$size = (Get-Item $installerPath).Length / 1MB
Write-Output ("Downloaded {0:N1} MB" -f $size)

# --- 3. Silent install ---
Write-Output ""
Write-Output "Running silent install (this is the slow step -- ~3-5 minutes)..."
$installArgs = @(
    "--accept-licenses",
    "--default-answer",
    "--confirm-command",
    "install"
)
$proc = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "Installer exited with code $($proc.ExitCode). Try running it manually:"
    Write-Error "  $installerPath"
    exit $proc.ExitCode
}

# --- 4. Verify + set env ---
$installed = Get-ChildItem -Path "C:\VulkanSDK\" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
if (-not $installed) {
    Write-Error "Install completed but C:\VulkanSDK\<version>\ not found."
    exit 1
}

Write-Output ""
Write-Output "Vulkan SDK installed at: $($installed.FullName)"

# The installer sets VULKAN_SDK + adds bin to PATH, but only at the System
# scope and only for shells launched AFTER the install. Set it for this
# session too so a follow-on `cargo xtask run-dev` sees it without a shell
# restart.
[System.Environment]::SetEnvironmentVariable("VULKAN_SDK", $installed.FullName, "Machine")
$env:VULKAN_SDK = $installed.FullName

Write-Output ""
Write-Output "VULKAN_SDK = $($installed.FullName)"
Write-Output ""
Write-Output "Done. Open a fresh shell (or restart your IDE) so the env var"
Write-Output "propagates to child cargo / pnpm processes, then run:"
Write-Output "  cargo xtask run-dev"
Write-Output "xtask will auto-detect Vulkan and pass --features gpu-vulkan."
