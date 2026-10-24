# Research: Config-Driven Foundation Reauthor

**Date**: 2026-03-14
**Status**: COMPLETE

## SSOT Map

### Configs that exist
| Config | Location | Format | What it controls |
|--------|----------|--------|-----------------|
| platform.default.toml | `systems/devpulse-engine/platform.default.toml` | TOML (embedded at compile time) | Store paths, enable/disable, retry, Moka, RRO, Windows hardening |
| platform.toml (override) | `.userdata/platform.toml` (runtime, user-created) | TOML | Full override of defaults |
| tauri.conf.json | `interfaces/desktop/src-tauri/tauri.conf.json` | JSON | Window config, build commands, devUrl port |
| vite.config.ts | `interfaces/desktop/vite.config.ts` | TS | Dev server port (1420), plugins |
| biome.json | `interfaces/desktop/biome.json` | JSON | Frontend linting rules |
| Cargo workspace lints | `Cargo.toml` [workspace.lints] | TOML | Clippy pedantic, deny unsafe, deny unwrap |

### Hardcoded values (NOT in any config)
| Value | Where hardcoded | Should be in config |
|-------|----------------|---------------------|
| Port 1420 | `xtask/src/net.rs:14`, `vite.config.ts:9`, `tauri.conf.json:8` | platform.default.toml [dev.ports] |
| Port 8822 | `server.rs:30`, `boot/graph.rs:5,128,129,133` | platform.default.toml [services.surreal_http] |
| Zombie process names | `xtask/src/zombie.rs:118-122` | platform.default.toml [process.zombie_names] |
| Zombie patterns | `xtask/src/zombie.rs:126-132` | platform.default.toml [process.zombie_patterns] |
| Shutdown timeout | `platform/mod.rs` (5s hardcoded in shutdown) | platform.default.toml [lifecycle.shutdown_timeout_secs] |
| SurrealDB consolidated path | `boot/graph.rs:49-52` ("surreal/devpulse" hardcoded) | Already partially in config but boot ignores it |
| Health poll interval | `platformState.svelte.ts:37` (15_000ms) | Should come from config via IPC |
| Tauri IPC timeout | `platformState.svelte.ts:39` (10_000ms) | Should come from config via IPC |

### What does NOT exist (must be created)
| Missing | Purpose |
|---------|---------|
| `[dev]` section in TOML | Dev server port, hot-reload behavior |
| `[services]` section in TOML | SurrealDB HTTP port, bind address |
| `[lifecycle]` section in TOML | Shutdown timeout, boot timeout, stale lock cleanup |
| `[process]` section in TOML | Zombie names, patterns, cleanup behavior |
| `[cleanup]` section in TOML | Stale lock file paths, cleanup on boot, cleanup on shutdown |
| Stale LOCK file cleanup in preflight | SurrealKV LOCK file persists after crash, blocks next boot |
| xtask config reader | xtask currently hardcodes everything, needs to read TOML |
| Config description/tooltip metadata | For DevForge devtool UI |

### Duplicates / conflicts
- **Port 1420**: defined in 3 places (xtask, vite, tauri). SSOT should be platform.default.toml, others should be documented as "must match".
- **Retry config**: old `[windows]` section has `file_lock_retries` and `file_lock_retry_delay_ms` — these overlap with new per-store `retry` fields. The old `[windows]` section is partially stale.

## Problem Statement

Every lifecycle value (ports, timeouts, retry, cleanup, process names) is hardcoded in different Rust files. There is no single config to control the platform's behavior. This means:

1. Changing a port requires editing 3 files in 3 languages
2. Adding a new cleanup rule requires editing Rust code and recompiling
3. No devtool can read/display/modify these values — they're buried in const declarations
4. Stale LOCK files from SurrealKV crash the boot and no code cleans them up
5. No shutdown timeout is configurable
6. Junior devs can't understand or tune the platform without reading Rust source

## Codebase Analysis (VERIFIED)

### Boot preflight (`preflight.rs`)
- Creates directories only. Does NOT clean stale files.
- Does NOT check for LOCK files.
- Does NOT check for WAL files that need recovery.

### SurrealDB LOCK file
- SurrealKV creates a `LOCK` file at `{data_dir}/surreal/devpulse/LOCK`
- On clean shutdown: SurrealKV deletes the LOCK file itself
- On crash/kill: LOCK file remains
- On next boot: SurrealKV sees LOCK, assumes another process has it, fails with "os error 33"
- The retry logic retries opening, but the LOCK file never goes away — retry is useless for this case
- **This is the root cause of the recurring SurrealDB boot failures**

### DuckDB lock
- DuckDB uses OS file locks (not a LOCK file)
- On Windows: OS holds the lock briefly after process death (1-5 seconds)
- Retry IS effective for DuckDB — just needs enough delay

### Shutdown code (just written, unverified)
- `Platform::shutdown()` calls `store.shutdown()` in reverse order
- Tauri `RunEvent::Exit` handler calls `Platform::shutdown()`
- Adapter `close()` methods acquire locks to drain queries
- **Problem**: None of this deletes the SurrealKV LOCK file on clean exit — SurrealKV's own Drop impl should do it, but only if Drop runs cleanly

### xtask
- 5 commands: preflight, deps, run-dev, verify, verify-ip-boundary
- All hardcode their values — no config reader
- Zombie cleanup knows about process names but not about stale files
- No `xtask lint` command (biome + clippy)
- No `xtask clean` command (kill zombies + clean stale files)

## Findings

1. **The SurrealDB LOCK file is the #1 boot blocker.** Retry won't fix it. Must be cleaned in preflight.
2. **platform.default.toml is the right SSOT** but it's missing sections for ports, services, lifecycle, process, cleanup.
3. **xtask doesn't read the TOML** — it hardcodes everything. It needs a config reader.
4. **The old `[windows]` section should be folded into `[lifecycle]`** — retry is cross-platform, not Windows-specific.
5. **Port 1420 can't easily be config-driven** because Vite reads it from vite.config.ts and Tauri reads devUrl from tauri.conf.json. These are different formats. The TOML can be the SSOT with a comment saying "must match vite.config.ts:port and tauri.conf.json:devUrl".

## Anti-Pattern Risks

1. **Over-engineering**: Making vite.config.ts read from TOML — adds a build dependency for no gain. Just document "must match".
2. **Bandaid**: Adding LOCK file deletion without checking if a process actually holds it — could corrupt an active database.
3. **Scope creep**: Building the full DevForge devtool UI in this sprint. This sprint establishes the config. DevForge reads it later.

## Recommendations

### Phase 1: Fix the immediate boot blocker
- Add stale LOCK file cleanup to boot preflight
- Check if the PID in the LOCK file is alive — if dead, delete the LOCK file
- If no PID info available, check if any devpulse process is running — if not, delete

### Phase 2: Expand platform.default.toml with all lifecycle config
- Add `[dev]`, `[services]`, `[lifecycle]`, `[cleanup]` sections
- Move all hardcoded values into the TOML with descriptions
- Keep `[windows]` for platform-specific settings, rename retry to `[lifecycle.retry]`

### Phase 3: Make xtask config-aware
- xtask reads platform.default.toml for ports, process names, cleanup paths
- Add `xtask lint` (biome + clippy), `xtask clean` (zombies + stale files)

### Phase 4: Config metadata for DevForge (FUTURE — not this sprint)
- Add description/tooltip fields to config schema
- DevForge devtool reads config and displays editable UI

## Files Referenced
- `systems/devpulse-engine/platform.default.toml`: Current config SSOT
- `systems/devpulse-engine/src/platform/config.rs`: Config types
- `systems/devpulse-engine/src/platform/boot/preflight.rs`: Directory creation only, no cleanup
- `systems/devpulse-engine/src/platform/boot/graph.rs`: SurrealDB boot
- `systems/devpulse-engine/src/platform/boot/retry.rs`: Retry utility
- `systems/devpulse-engine/src/platform/server.rs`: Hardcoded port 8822
- `systems/devpulse-engine/src/platform/mod.rs`: Platform facade + shutdown
- `interfaces/desktop/src-tauri/src/lib.rs`: Tauri app lifecycle
- `interfaces/desktop/src-tauri/tauri.conf.json`: Hardcoded port 1420
- `interfaces/desktop/vite.config.ts`: Hardcoded port 1420
- `xtask/src/net.rs`: Hardcoded DEV_PORT = 1420
- `xtask/src/zombie.rs`: Hardcoded zombie process names
- `xtask/src/main.rs`: 5 subcommands, no config reader
- `xtask/src/commands/dev.rs`: Dev pipeline, hardcoded values
- `interfaces/desktop/biome.json`: Frontend linting (already good)
- `Cargo.toml` [workspace.lints]: Rust linting (already strict)
