# DevPulse Platform — Verification & Release Guide

Operational notes for building, running, and verifying DevPulse. Lives next to the
sprint docs because it changes with them, not with the code.

---

## Running the dev environment

```
cargo xtask run-dev
```

Starts the full orchestrated dev loop — Vite, Tauri backend, all 7 platform
services. Reads ports + env from `config/platform/*`. Job-object enforced: Ctrl+C
kills the whole tree.

The `target/debug/devpulse-desktop.exe` produced alongside `run-dev` is a **dev
build**. It loads `http://localhost:1420` at startup, so launching it without
`run-dev` running shows a blank webview. That is correct Tauri dev behavior, not
a bug. For a standalone `.exe`, use the release build below.

---

## Building the portable release bundle

```
cargo xtask build-release
```

Runs `pnpm tauri build` inside `interfaces/desktop/` with the same hardened env
that `run-dev` uses (NASM, PYO3, CMake, sccache, llama.cpp + CUDA DLLs from
`[build.deps.*]` SSOT). No port binding, no Vite, no dev server.

Outputs:

- **Standalone executable**
  `interfaces/desktop/src-tauri/target/release/devpulse-desktop.exe`
  — loads the compiled-static frontend from bundled resources; needs no dev
  server.
- **Windows installers**
  `interfaces/desktop/src-tauri/target/release/bundle/msi/*.msi`
  `interfaces/desktop/src-tauri/target/release/bundle/nsis/*.exe`

Expect 10–40 min cold, 2–8 min warm.

### Smoke test the release build

1. Close ALL dev processes. No `run-dev`. No Vite.
2. Double-click the standalone `.exe`, OR run one of the installers and launch
   the installed app.
3. Confirm:
   - Wizard opens with the animated background visible.
   - `curl http://127.0.0.1:8822/health` → `{"status":"healthy","engine":"surrealkv"}`
   - `.userdata/libsql/platform.db` is written after first boot.
   - `.userdata/duckdb/analytics.duckdb` + its WAL are written.
   - `.userdata/logs/session-*.jsonl` is written and rotates (keeps last 3).
4. Click-through every devtool under `/devtools/*` — no crashes, no placeholder
   buttons that look functional.

### Common build failures

| Symptom | Cause | Fix |
|---|---|---|
| `ggml-cuda.dll` missing | CUDA DLLs not staged under `interfaces/desktop/src-tauri/binaries/` | `cargo xtask deps` re-stages; verify `tauri.conf.json` `bundle.resources` |
| `LINK : fatal error LNK1120` | sccache object cache drift | `cargo clean && sccache --zero-stats` then retry |
| `error[E0425]` in a `#[cfg(feature = …)]` block | Feature flag set in `run-dev` but not in `build-release` | Compare `tauri.conf.json` `build.features` against the dev command's features |
| `pnpm tauri build` exits with code 1, no Rust error | Frontend build (`pnpm build`) failed — run it directly to surface the SvelteKit error | `cd interfaces/desktop && pnpm build` |

---

## Live verification (for sprint execution)

Once the release `.exe` is running, these checks give ground truth during sprint
phases — preferred over inferring state from code.

### SurrealDB — graph store

```
curl -s http://127.0.0.1:8822/health
```

Query pattern (NS + DB in headers, Basic Auth `devpulse_engine:dp_sys_2026!`):

```
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" \
  -H "NS: system" -H "DB: engine" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "INFO FOR DB;"
```

### libSQL — SSOT platform store

`.userdata/libsql/platform.db` and `.userdata/libsql/user.db`. Open with any
SQLite browser. Do NOT use the `surreal sql` CLI against libSQL.

### DuckDB — analytics OLAP

`.userdata/duckdb/analytics.duckdb`. Open with `duckdb` CLI or any DuckDB client.
Live WAL file next to it means an analytics pipeline is actively writing.

### Session logs

`.userdata/logs/session-*.jsonl` — one file per run. Parse with `jq`:

```
Get-Content .userdata/logs/session-*.jsonl | ConvertFrom-Json | Where-Object { $_.component -like 'devtools.*' }
```

(Or `jq 'select(.component | startswith("devtools."))' session-*.jsonl` on
Unix-like shells.)

---

## What lives where

| Concern | Path |
|---|---|
| Active sprints | `scripts/docs/sprints/SPRINT-*.md` |
| Canonical setup overlay POAM | `scripts/docs/POAM-SETUP-OVERLAY-CANONICAL.md` |
| IP protection (engine / kernel boundary) | `.claude/rules/ip-protection.md` |
| Design system | `interfaces/desktop/src/lib/design/` (see `MASTER-PLAN.md`) |
| Orchestrator | `xtask/src/commands/*.rs` (one file per `cargo xtask <cmd>`) |
| Platform config SSOT | `config/platform/*.toml`, especially `config/platform/services/system/*` |

---

## Archived sprint MDs

Historical wizard MDs merged into the POAM and archived at
`scripts/docs/sprints/_archive/2026-04-21-wizard-consolidation/`. Do not follow
anything in the archive — check the POAM instead.
