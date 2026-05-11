# Install NVIDIA CUDA Toolkit 12.x -- the NVIDIA-only acceleration foundation
# for `gpu-nvidia` (Burn CUDA, Candle CUDA, llama.cpp CUDA).
#
# Build-time + runtime dependency. The compiled binary links against
# cudart/cublas DLLs; release bundles must ship those DLLs (~100 MB).
# Without the Toolkit installed, `cargo build --features gpu-nvidia`
# fails at the linker step.
#
# Idempotent: if `CUDA_PATH` is set and points at a valid install, exits
# without re-downloading.

$ErrorActionPreference = "Stop"

# --- 0. Already installed? ---
$existing = [System.Environment]::GetEnvironmentVariable("CUDA_PATH", "Machine")
if (-not $existing) {
    $existing = $env:CUDA_PATH
}
if ($existing -and (Test-Path (Join-Path $existing "bin\nvcc.exe"))) {
    Write-Output "CUDA Toolkit already installed at: $existing"
    & (Join-Path $existing "bin\nvcc.exe") --version
    exit 0
}

# Also detect any version under the default install root.
$candidate = Get-ChildItem -Path "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
if ($candidate -and (Test-Path (Join-Path $candidate.FullName "bin\nvcc.exe"))) {
    Write-Output "Found existing install at: $($candidate.FullName)"
    [System.Environment]::SetEnvironmentVariable("CUDA_PATH", $candidate.FullName, "Machine")
    $env:CUDA_PATH = $candidate.FullName
    Write-Output "Set CUDA_PATH machine env var. Open a new shell to propagate."
    exit 0
}

# --- 1. Admin check (with auto-relaunch) ---
$current = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($current)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Output "CUDA Toolkit install requires admin. Re-launching elevated..."
    $relaunch = Start-Process powershell -Verb RunAs -PassThru -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $PSCommandPath
    )
    $relaunch.WaitForExit()
    exit $relaunch.ExitCode
}

# --- 2. Download ---
# Pinned to CUDA 12.6.3 (Q4 2025 stable). Bumping requires retesting against
# llama-cpp-2 / candle / burn build scripts -- they may break on new CUDA
# major.minor combinations. The "network" installer is small (~30 MB) and
# downloads components on demand during install (~3 GB total).
$installerUrl = "https://developer.download.nvidia.com/compute/cuda/12.6.3/network_installers/cuda_12.6.3_windows_network.exe"
$installerPath = Join-Path $env:TEMP "cuda-toolkit-installer.exe"

Write-Output "Downloading CUDA Toolkit network installer..."
Write-Output "  source: $installerUrl"
Write-Output "  dest:   $installerPath"
Write-Output "  (~30 MB bootstrap; fetches ~3 GB during install)"

$prevProgress = $ProgressPreference
$ProgressPreference = "SilentlyContinue"
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
}
finally {
    $ProgressPreference = $prevProgress
}

# --- 3. Silent install ---
# Minimal subcomponent set: compiler + runtime + cuBLAS. Skip docs, samples,
# Nsight, Visual Studio integration. Saves ~5 GB and ~10 minutes.
Write-Output ""
Write-Output "Running silent CUDA install (5-15 minutes; downloads as it goes)..."
$installArgs = @(
    "-s",
    "nvcc_12.6",
    "cudart_12.6",
    "cublas_12.6",
    "cublas_dev_12.6",
    "thrust_12.6",
    "cuda_profiler_api_12.6"
)
$proc = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "Installer exited with code $($proc.ExitCode). Try running interactively:"
    Write-Error "  $installerPath"
    exit $proc.ExitCode
}

# --- 4. Verify ---
$installed = Get-ChildItem -Path "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
if (-not $installed) {
    Write-Error "Install completed but CUDA folder not found."
    exit 1
}

[System.Environment]::SetEnvironmentVariable("CUDA_PATH", $installed.FullName, "Machine")
$env:CUDA_PATH = $installed.FullName

Write-Output ""
Write-Output "CUDA Toolkit installed at: $($installed.FullName)"
& (Join-Path $installed.FullName "bin\nvcc.exe") --version
Write-Output ""
Write-Output "CUDA_PATH = $($installed.FullName)"
Write-Output "Open a fresh shell, then `cargo xtask run-dev` will auto-pick gpu-nvidia."
