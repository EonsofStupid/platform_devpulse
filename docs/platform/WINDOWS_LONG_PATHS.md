# Windows Long Paths — One-Time Setup

DevPulse builds compile entirely **inside the workspace** — `target/`
sits at the repo root so the project stays portable (matches the
`.userdata/` discipline that ships with the Windows portable
distribution). Some sub-builds, particularly `llama-cpp-sys-2`'s
`vulkan-shaders-gen` `ExternalProject`, generate deeply nested
intermediate paths during CMake `TryCompile` probes — easily 240+
characters before any `.obj` filename is appended.

Two operator-level toggles flip Windows + git into long-path mode so
`cl.exe` can write to those paths. **Both are one-time setup**;
xtask verifies them on every build and refuses to proceed silently
with a known-broken precondition.

## 1. Registry flag (admin, one-time)

Open an **Administrator PowerShell** and run:

```powershell
New-ItemProperty `
  -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

This sets `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`,
removing Windows' legacy 260-character MAX_PATH ceiling for any
process that opts in (which MSVC 2019 16.3+ does via its manifest).

Verification:

```powershell
Get-ItemProperty `
  -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name LongPathsEnabled
```

Expected: `LongPathsEnabled : 1`.

## 2. Git config (per-user, one-time)

Any shell:

```powershell
git config --global core.longpaths true
```

Verification:

```powershell
git config --get core.longpaths
```

Expected: `true`.

## 3. What xtask does

`BuildConfig::apply_env` calls `apply_long_paths_env` on every
build, which:

1. Sets `CMAKE_OBJECT_PATH_MAX=32767` unconditionally (overrides
   CMake's internal 250-character ceiling on object-file paths so
   nested `ExternalProject` configures stop tripping the warning
   that escalates to a hard `cl.exe` failure).
2. On Windows, probes the registry flag and `git config
   core.longpaths`. Both ON → prints `[long-paths] OK`; either OFF
   → prints the exact fix command and exits non-zero so the build
   refuses to proceed.

No global toggles are mutated by xtask itself — admin-required
mutations stay an explicit operator decision. The verifier is the
sentinel.

## Why not shorten `CARGO_TARGET_DIR` outside the workspace?

Considered and rejected. Re-rooting `target/` to e.g.
`D:\.dpx-target` works around the path-length issue but breaks
project portability: build artifacts live somewhere other than
"next to the project," and every developer + CI machine has to
agree on where that somewhere is. The portable-distribution
discipline (`.userdata/` ships inside the `devpulse/` folder)
extends to dev-time tooling: build outputs stay with the project.
