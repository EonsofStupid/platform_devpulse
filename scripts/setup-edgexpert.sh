#!/usr/bin/env bash
#
# setup-edgexpert.sh — install Claude Code on a DGX OS EdgeXpert (GB10 / Grace, aarch64)
#
# RUN THIS ON THE EDGEXPERT ITSELF (locally or over SSH) — NOT in a cloud
# session. Claude Code is an API-backed agent CLI; installing it does not run a
# model locally. Local inference on the GB10 is DevPulse's own job
# (kernel/devpulse-clyffy + kernel/model-loader), not this installer.
#
# Usage:
#   bash scripts/setup-edgexpert.sh          # install + verify
#   bash scripts/setup-edgexpert.sh --check  # verify only, install nothing
#
set -euo pipefail

log()  { printf '\033[1;36m[edgexpert]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[edgexpert]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[edgexpert]\033[0m %s\n' "$*" >&2; exit 1; }

CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

# --- Sanity: are we actually on aarch64 Linux? --------------------------------
arch="$(uname -m)"
os="$(uname -s)"
log "host: ${os} ${arch} ($(hostname))"

if [[ "$os" != "Linux" ]]; then
  die "This script targets Linux (DGX OS). Detected: ${os}."
fi

case "$arch" in
  aarch64|arm64) log "aarch64 detected — matches the Grace CPU. Good." ;;
  x86_64)        warn "x86_64 detected — this is NOT the GB10 Grace box. If you are in a cloud session, stop: install on the EdgeXpert instead." ;;
  *)             warn "Unexpected arch '${arch}'. The native installer supports x64 and arm64 only." ;;
esac

# --- GPU visibility (informational) -------------------------------------------
if command -v nvidia-smi >/dev/null 2>&1; then
  log "GPU present:"
  nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || true
else
  warn "nvidia-smi not found — expected on the GB10. Not fatal for the CLI, but a red flag if you think you're on the EdgeXpert."
fi

# --- Verify path --------------------------------------------------------------
verify() {
  if command -v claude >/dev/null 2>&1; then
    log "claude found at: $(command -v claude)"
    claude --version || true
    log "running 'claude doctor' ..."
    claude doctor || true
  else
    warn "claude not on PATH. Ensure ~/.local/bin is on PATH:"
    warn "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc && source ~/.bashrc"
    return 1
  fi
}

if [[ "$CHECK_ONLY" == "1" ]]; then
  log "--check: verifying existing install only."
  verify
  exit $?
fi

# --- Install (native installer: auto-detects aarch64, bundles ripgrep) --------
if command -v claude >/dev/null 2>&1; then
  log "claude already installed — skipping install, going straight to verify."
else
  log "installing Claude Code via native installer ..."
  curl -fsSL https://claude.ai/install.sh | bash
fi

# --- Ensure launcher is on PATH ----------------------------------------------
if ! command -v claude >/dev/null 2>&1; then
  if [[ -x "$HOME/.local/bin/claude" ]]; then
    if ! grep -qs '\.local/bin' "$HOME/.bashrc" 2>/dev/null; then
      log "adding ~/.local/bin to PATH in ~/.bashrc"
      echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

# --- Verify -------------------------------------------------------------------
verify || true

cat <<'EOF'

------------------------------------------------------------------------------
Next steps (on the EdgeXpert):
  1. Run `claude` once — it opens browser auth.
     Requires a PAID plan (Pro / Max / Team / Enterprise / Console).
     Free Claude.ai does NOT include Claude Code.
  2. Reminder: this CLI is API-backed. It is not local inference.
     Loading a model onto the GB10's 128 GB is DevPulse's own pipeline
     (kernel/devpulse-clyffy + kernel/model-loader), run via `cargo xtask run-dev`.
------------------------------------------------------------------------------
EOF
