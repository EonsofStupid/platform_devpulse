# Install Intel oneAPI Base Toolkit (which bundles MKL) -- the CPU
# acceleration foundation. Candle's `mkl` feature consumes Intel MKL for
# BLAS/LAPACK-heavy ops on CPU (matmul, attention math). Yields a real
# perf boost on Intel + AMD x86 CPUs versus the default Rust-native math.
#
# Build-time + runtime. The build links against `mkl_intel_lp64.dll` etc.;
# release bundles must ship the matching MKL runtime DLLs (~150 MB).
#
# Idempotent: if `MKLROOT` is set + points at a valid install, exits.

$ErrorActionPreference = "Stop"

# --- 0. Already installed? ---
$existing = [System.Environment]::GetEnvironmentVariable("MKLROOT", "Machine")
if (-not $existing) {
    $existing = $env:MKLROOT
}
if ($existing -and (Test-Path $existing)) {
    Write-Output "Intel MKL already installed at: $existing"
    exit 0
}

# Also detect a typical oneAPI install layout
$oneapiRoot = "C:\Program Files (x86)\Intel\oneAPI"
$candidate = $null
if (Test-Path (Join-Path $oneapiRoot "mkl")) {
    $candidate = Get-ChildItem -Path (Join-Path $oneapiRoot "mkl") -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "^\d" } |
        Sort-Object Name -Descending |
        Select-Object -First 1
}
if ($candidate) {
    Write-Output "Found existing MKL install at: $($candidate.FullName)"
    [System.Environment]::SetEnvironmentVariable("MKLROOT", $candidate.FullName, "Machine")
    $env:MKLROOT = $candidate.FullName
    Write-Output "Set MKLROOT machine env var. Open a new shell to propagate."
    exit 0
}

# --- 1. Admin check ---
$current = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($current)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Output "Intel oneAPI install requires admin. Re-launching elevated..."
    $relaunch = Start-Process powershell -Verb RunAs -PassThru -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $PSCommandPath
    )
    $relaunch.WaitForExit()
    exit $relaunch.ExitCode
}

# --- 2. Download ---
# Intel oneAPI Base Toolkit -- "Base" tier bundles MKL plus the icx compiler
# we don't use. Standalone MKL is the same files but distributed only via
# the Base Toolkit installer on Windows since the 2024.x line.
# Online installer is small (~30 MB) and fetches components on demand.
$installerUrl = "https://registrationcenter-download.intel.com/akdlm/IRC_NAS/b380d914-366b-4b77-a74a-05e3c38b3514/intel-oneapi-base-toolkit-2025.0.1.47_offline.exe"
$installerPath = Join-Path $env:TEMP "intel-oneapi-base.exe"

Write-Output "Downloading Intel oneAPI Base Toolkit (offline installer)..."
Write-Output "  source: $installerUrl"
Write-Output "  dest:   $installerPath"
Write-Output "  (~3 GB download -- takes 5-15 minutes on a typical connection)"

$prevProgress = $ProgressPreference
$ProgressPreference = "SilentlyContinue"
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
}
finally {
    $ProgressPreference = $prevProgress
}

# --- 3. Silent install -- MKL component only ---
# The Base Toolkit installer supports component selection. We want MKL only;
# the compiler, DPC++, MPI, and TBB are not part of our build chain.
Write-Output ""
Write-Output "Running silent install (MKL-only, 3-8 minutes)..."
$installArgs = @(
    "-s",
    "-a",
    "--silent",
    "--eula", "accept",
    "--components", "intel.oneapi.win.mkl.devel"
)
$proc = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "Installer exited with code $($proc.ExitCode). Try running interactively:"
    Write-Error "  $installerPath"
    exit $proc.ExitCode
}

# --- 4. Verify ---
$installed = $null
if (Test-Path (Join-Path $oneapiRoot "mkl")) {
    $installed = Get-ChildItem -Path (Join-Path $oneapiRoot "mkl") -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "^\d" } |
        Sort-Object Name -Descending |
        Select-Object -First 1
}
if (-not $installed) {
    Write-Error "Install completed but MKL folder not found under $oneapiRoot\mkl\."
    exit 1
}

[System.Environment]::SetEnvironmentVariable("MKLROOT", $installed.FullName, "Machine")
$env:MKLROOT = $installed.FullName

Write-Output ""
Write-Output "Intel MKL installed at: $($installed.FullName)"
Write-Output "MKLROOT = $($installed.FullName)"
Write-Output ""
Write-Output "Open a fresh shell. Candle's `mkl` feature can now be enabled via"
Write-Output "the `cpu-mkl` proxy on the desktop backend (xtask wires it when"
Write-Output "no GPU SDK is detected)."
