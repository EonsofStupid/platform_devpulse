# EdgeXpert (GB10 / Grace, aarch64) — Claude Code + clyffy runbook

Durable companion to [`setup-edgexpert.sh`](./setup-edgexpert.sh). Everything
here runs **on the EdgeXpert itself** (locally or over SSH). It cannot be done
from a cloud Claude Code session — that runs in a disposable x86 sandbox with no
route to your hardware.

## What this gets you

An AI agent running **on the GB10** with local access to configure the box,
read `nvidia-smi`, build the GPU model-loader, and load models. The `claude` CLI
is API-backed (it is not local inference), but it is the agent that drives the
local pipeline that *is* clyffy.

## Prerequisite (the one hard blocker)

A **paid Claude plan** — Pro, Max, Team, Enterprise, or Console. The free
Claude.ai plan does not include Claude Code. First `claude` launch opens browser
auth.

## 1. Install Claude Code on the box

```bash
bash scripts/setup-edgexpert.sh        # install + PATH + verify + clyffy preflight
# or the raw native installer:
curl -fsSL https://claude.ai/install.sh | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

Verify only (no install): `bash scripts/setup-edgexpert.sh --check`

## 2. Authenticate and start an on-box session

```bash
claude                                 # browser auth (paid plan required)
cd ~/platform_devpulse && claude       # agent on the GB10, in this repo
```

## 3. Confirm build-readiness for clyffy

The setup script's preflight reports this, or check by hand:

```bash
uname -m          # expect: aarch64
nvidia-smi        # GB10 Blackwell + driver
nvcc --version    # CUDA toolkit present (required to compile the cuda backends)
```

## 4. Build clyffy with GPU backends

The default `model-loader` build is **CPU-only**
(`default = ["candle-backend", "moshi-sts", "mode-dev"]`). To use the Blackwell:

```bash
cargo build -p model-loader --no-default-features \
  --features candle-backend,moshi-sts,cuda,nvml,llama-cpp-cuda
```

- `cuda` → `candle-core/cuda` (safetensors brains on GPU)
- `nvml` → GPU detection/metrics (`hardware/metrics.rs`)
- `llama-cpp-cuda` → `llama-cpp-2/cuda` (GGUF brains on GPU)

These compile against the **local** CUDA toolkit and link the driver, which is
why the build must run on the GB10.

## 5. Boot the platform

```bash
cargo xtask run-dev    # THE dev command — starts everything with GPU loading live
```

On 128 GB unified memory the loader auto-selects the **Ultra** tier (Preset 5:
Qwen3-VL-30B-A3B brain + PersonaPlex-7B voice). See
`systems/devpulse-engine/src/platform/hardware/auto_config.rs` for tier → preset mapping.
