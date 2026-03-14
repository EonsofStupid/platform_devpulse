# SPRINT: Config-Driven Platform Foundation

**Date**: 2026-03-14
**Research**: [SPRINT-CONFIG-DRIVEN-FOUNDATION.research.md](SPRINT-CONFIG-DRIVEN-FOUNDATION.research.md)
**Priority**: CRITICAL — platform cannot boot, nothing is config-driven, no industry standards
**Scope**: Cross-platform (Windows, Linux, macOS)
**Supersedes**: SPRINT-BOOT-LIFECYCLE (absorbed — incomplete)
**Standards**: STIG App Security, OWASP, NIST SP 800-53 (least privilege, audit, config mgmt)

---

## MANDATORY: Senior Dev Gate Checklist

**Every file edit MUST pass ALL gates before moving to the next file.**
**No exceptions. No batching. No "I'll check later."**

### Per-File Gate (run after EVERY file save)

```
[ ] HARDCODE CHECK — grep the file for magic numbers, string literals,
    hardcoded ports, hardcoded paths, hardcoded timeouts.
    If found: move to config TOML + read from config struct.
    ZERO hardcoded values allowed.

[ ] CONFIG DRIVEN — every behavioral value (port, timeout, retry count,
    path, process name, interval) comes from PlatformConfig.
    The code reads config. It never defines its own defaults inline.

[ ] COMPILE CHECK — cargo check -p {crate} passes with 0 errors.
    If it fails, fix it NOW. Do not touch another file.

[ ] STRUCT COMPLETENESS — if you added a field to a struct, grep for
    every constructor/default impl of that struct. Update ALL of them.
    No "missing field" errors.

[ ] DEPENDENCY CHECK — if you used a crate (tracing, serde, etc.),
    verify it's in Cargo.toml BEFORE writing the code.

[ ] CROSS-PLATFORM — no Windows-only code without #[cfg(windows)].
    No unwrap on paths. No backslash literals. Use std::path::Path.

[ ] STIG V-222596 — no secrets in code (keys, passwords, tokens).
    No hardcoded credentials. Config values only.

[ ] STIG V-222607 — errors are logged with tracing, never swallowed.
    No silent empty catch blocks. No ignored Results.

[ ] STIG V-222609 — lifecycle events are logged: init, ready, error,
    shutdown. Every service transition produces a log line.
```

### Per-Phase Gate (run after completing a phase)

```
[ ] FULL COMPILE — cargo check -p devpulse_desktop_backend (0 errors)
[ ] CLIPPY — cargo clippy -p devpulse_desktop_backend (0 errors)
[ ] FRONTEND — pnpm svelte-check (0 errors)
[ ] BIOME — pnpm biome check src/ (0 errors)
[ ] BOOT TEST — cargo xtask run-dev → app boots → overlay shows → stores green
[ ] SHUTDOWN TEST — Ctrl+C → clean exit → no stale LOCK files → restart boots clean
```

---

## Root Cause

The platform was built piecemeal with hardcoded values scattered across Rust, TypeScript, JSON, and TOML.
No single-instance guard. No graceful shutdown. No stale file cleanup. No config-driven lifecycle.
Two windows auto-open before the backend is ready. Zombie processes hold file locks.
The app has never successfully booted and rendered for the owner.

---

## STIG / Industry Alignment

| STIG Requirement | Current State | Target |
|-----------------|---------------|--------|
| **V-222602** Single-instance enforcement | NONE — multiple instances corrupt databases | `tauri-plugin-single-instance` — kernel-level mutex |
| **V-222596** Config management | Hardcoded across 10+ files in 3 languages | Single SSOT TOML with layered override (default → user → env) |
| **V-222593** Graceful shutdown | NONE — process killed, locks persist | `RunEvent::Exit` → ordered store close → LOCK cleanup |
| **V-222609** Audit logging | Partial — boot.log exists but no shutdown log | Full lifecycle logging: boot, health, shutdown, errors |
| **V-222604** Least privilege | CSP is null, all IPC open | Scoped Tauri capabilities per window |
| **V-222607** Error handling | Crashes silently, blank screen | Boot overlay with real-time status, error display, elapsed timer |
| **V-222611** Resource cleanup | Stale LOCK files, zombie processes, port leaks | Preflight cleanup, shutdown cleanup, xtask clean |
| **Industry** Lazy window loading | 2 windows auto-open before backend ready | Main window hidden → boot → show. Chat on-demand only. |
| **Industry** Port conflict resolution | Hardcoded 1420/8822, crash on conflict | Config-driven defaults, detect + resolve conflicts |
| **Industry** Health checks | Health poll only after boot | Continuous health + degraded mode UI |

---

## SSOT Map

| Concern | SSOT Location |
|---------|---------------|
| ALL platform config | `systems/devpulse-engine/platform.default.toml` |
| Override config | `.userdata/platform.toml` (runtime, user-created) |
| Env override | `DEVPULSE_*` prefix (highest priority) |
| Tauri window defs | `tauri.conf.json` (Tauri-owned, minimal) |
| Vite config | `vite.config.ts` (must match TOML services.vite.port) |
| Frontend lint | `biome.json` (already good) |
| Rust lint | `Cargo.toml` [workspace.lints] (already strict) |

Config layering:
```
platform.default.toml (compile-time embed, SSOT)
  → .userdata/platform.toml (runtime override, optional)
    → DEVPULSE_* env vars (highest priority, CI/deploy)
```

### Architecture: Uniform Service Contract

Every managed service — database, cache, server, AI engine — follows one contract:

```
┌─────────────────────────────────────────────────┐
│  Service Contract (uniform for ALL services)    │
├─────────────────────────────────────────────────┤
│  enabled: bool                                  │
│  kind: embedded | external | managed | in-memory│
│  init_order: u32         (boot sequence)        │
│  critical: bool          (boot fails if down)   │
│  retry: { max, delay }   (startup retry)        │
│  health_check: ping | http | tcp | none         │
│  scopes: [system, user, global, project]        │
│                                                 │
│  Lifecycle:                                     │
│  init → health_check → run → shutdown → cleanup │
│                                                 │
│  Logging:                                       │
│  [init: OK 12ms] [health: OK] [shutdown: OK 3ms]│
└─────────────────────────────────────────────────┘
```

This replaces `[stores.*]`. Every future service (Kokoros TTS, embedding models, local LLM inference) plugs into the same pattern. DevForge renders a uniform status card per service.

---

## Phase 1: Single-Instance + LOCK Cleanup (Boot Blocker Fix)

The app MUST prevent two instances. This eliminates zombie LOCK files at the root.

### 1.1 Add tauri-plugin-single-instance
- [ ] Add `tauri-plugin-single-instance` to Cargo.toml and tauri.conf.json
- [ ] On duplicate launch: focus existing window, log attempt, exit
- [ ] cargo check

### 1.2 Stale LOCK file cleanup in boot preflight
- [ ] In `preflight.rs`: scan all SurrealDB data paths for `LOCK` files
- [ ] Check if any `devpulse-desktop-app` process is alive (cross-platform)
- [ ] If no process alive → delete LOCK file, log it
- [ ] If process alive → skip (single-instance plugin should have caught this, but safety net)
- [ ] cargo check

### 1.3 Remove chat window auto-open
- [ ] Remove the `"chat"` entry from `tauri.conf.json` windows array
- [ ] Chat window created on-demand via `open_chat_window` command (already exists)
- [ ] Main window: set `"visible": false` — shown after boot completes
- [ ] In `lib.rs` boot_task: after "ready" phase, call `window.show()` on main window
- [ ] cargo check

### STOP — Owner Decision Required
**Question**: When the user launches a second instance, what should happen?
**Options**:
  A) Focus the existing window + show a system notification "DevPulse is already running"
  B) Focus the existing window silently (what VS Code does)
  C) Focus + pass any CLI args to the existing instance (what Electron apps do)
**Impact**: Affects UX and whether we need arg forwarding.

---

## Phase 2: Config-Driven TOML (SSOT for Everything)

Every hardcoded value moves into the TOML with descriptions.

### 2.1 New TOML structure (EXACT — this is what gets written to disk)

```toml
# ═══════════════════════════════════════════════════════════════
# DevPulse Platform Configuration
# SSOT — all lifecycle values live here
# Override: .userdata/platform.toml or DEVPULSE_* env vars
#
# Convention: noun.qualifier (Rust ecosystem standard)
# Services: uniform contract — every service has the same fields
# ═══════════════════════════════════════════════════════════════

# ── App Identity ─────────────────────────────────────────────
[app]
version = "0.1.0"
product_name = "DevPulse"

[app.data]
# "local"    = .userdata/ relative to binary/project root (portable, USB-safe)
# "roaming"  = OS roaming app data (AppData/Roaming, ~/.config)
# "standard" = OS local app data (AppData/Local, ~/.local/share)
strategy = "local"

# ═══════════════════════════════════════════════════════════════
# SERVICES — Uniform Contract
#
# Every service follows the same schema:
#   enabled        bool     Service is active
#   kind           string   embedded | external | managed | in-memory
#   init_order     u32      Boot sequence position (lower = first)
#   critical       bool     Boot aborts if this service fails
#   health_check   string   ping | http | tcp | none
#   retry.max_retries   u32      Startup retry attempts
#   retry.base_delay_ms u64      Base delay between retries (exponential backoff)
#
# Network services add:
#   bind           string   Bind address
#   port           u16      Default port
#   auto_resolve   bool     Increment port on conflict
#   max_attempts   u32      Port attempts before failing
#
# Data services add:
#   scopes.{name}.path  string   Relative path from data dir per scope
# ═══════════════════════════════════════════════════════════════

[services.libsql]
enabled = true
kind = "embedded"
init_order = 1
critical = true
health_check = "ping"
retry = { max_retries = 5, base_delay_ms = 500 }

[services.libsql.scopes.system]
path = "system/libsql/platform.db"

[services.libsql.scopes.user]
path = "user/libsql/user.db"

# ─────────────────────────────────────────────────────────────

[services.duckdb]
enabled = true
kind = "embedded"
init_order = 2
critical = false
health_check = "ping"
retry = { max_retries = 5, base_delay_ms = 500 }

[services.duckdb.scopes.system]
path = "system/duckdb/analytics.duckdb"

# ─────────────────────────────────────────────────────────────

[services.surreal]
enabled = true
kind = "embedded"
init_order = 3
critical = true
health_check = "ping"
retry = { max_retries = 5, base_delay_ms = 750 }
# SurrealDB also exposes an HTTP server for external tools
bind = "127.0.0.1"
port = 8822
auto_resolve = true
max_attempts = 5

[services.surreal.scopes.system]
path = "surreal/devpulse"
namespace = "system"
database = "engine"

[services.surreal.scopes.user]
path = "surreal/devpulse"
namespace = "user"
database = "profile"

[services.surreal.scopes.global]
path = "surreal/devpulse"
namespace = "global"
database = "knowledge"

# ─────────────────────────────────────────────────────────────

[services.moka]
enabled = true
kind = "in-memory"
init_order = 4
critical = false
health_check = "none"
max_capacity = 10_000
time_to_live_secs = 300
time_to_idle_secs = 60

# ─────────────────────────────────────────────────────────────

[services.rro]
enabled = false
kind = "embedded"
init_order = 5
critical = false
health_check = "ping"
retry = { max_retries = 3, base_delay_ms = 1000 }

[services.rro.scopes.system]
path = "system/rro/storage"

# ─────────────────────────────────────────────────────────────

[services.vite]
enabled = true
kind = "managed"
init_order = 0
critical = true
health_check = "tcp"
port = 1420
auto_resolve = true
max_attempts = 10

# ═══════════════════════════════════════════════════════════════
# RUNTIME
# ═══════════════════════════════════════════════════════════════

[runtime.boot]
warning_secs = 30
timeout_secs = 120

[runtime.shutdown]
timeout_secs = 5

[runtime.cleanup]
clean_stale_locks = true
guard_process_names = ["devpulse-desktop-app"]
zombie_names = [
    "devpulse-desktop-app",
    "devpulse_desktop_backend",
    "devpulse-desktop-backend",
    "cargo-tauri",
]
zombie_patterns = [
    "tauri dev",
    "vite --port 1420",
    "vite.bin.js --port 1420",
    "node_modules/.bin/tauri",
    "node_modules\\.bin\\tauri",
]

[runtime.health]
poll_interval_secs = 15
failure_threshold = 3

# ═══════════════════════════════════════════════════════════════
# OBSERVABILITY
# ═══════════════════════════════════════════════════════════════

[observability.logging]
level = "info"
max_files = 10
boot_log = true
shutdown_log = true

[observability.tracing]
# Future: OpenTelemetry
# enabled = false
# endpoint = ""

# ═══════════════════════════════════════════════════════════════
# SECURITY
# ═══════════════════════════════════════════════════════════════

[security]
single_instance = true
# csp = "default-src 'self'; script-src 'self'"

# ═══════════════════════════════════════════════════════════════
# PLATFORM-SPECIFIC
# ═══════════════════════════════════════════════════════════════

[platform.windows]
skip_canonicalize = true
max_path_depth = 200

[platform.linux]
# Future: fd limits, inotify watches

[platform.macos]
# Future: App Sandbox, notarization
```

### DECIDED — Owner Decision (2026-03-14)
**Decision**: Uniform service contract. `[stores.*]` is DEAD — replaced by `[services.*]`.
Every managed unit (database, cache, server, AI engine) follows one contract:
`enabled`, `kind`, `init_order`, `critical`, `retry`, `health_check`, `scopes`.

Sections follow Rust ecosystem `noun.qualifier` convention:
`[app]`, `[app.data]`, `[services.*]` (uniform contract),
`[runtime.boot]`, `[runtime.shutdown]`, `[runtime.cleanup]`, `[runtime.health]`,
`[observability.logging]`, `[observability.tracing]`,
`[security]`, `[platform.windows]`, `[platform.linux]`, `[platform.macos]`

Second instance behavior: **(A) focus existing window + system notification.**
`xtask clean` scope: **(A) processes + locks + ports** (logs and build caches are separate concerns).

### 2.2 Rust config types (match TOML 1:1)
- [ ] `AppConfig` + `AppDataConfig` → `[app]`, `[app.data]`
- [ ] `ServiceConfig` — uniform contract struct: enabled, kind, init_order, critical, retry, health_check, scopes, bind, port, auto_resolve, max_attempts, path fields (all optional with defaults)
- [ ] `ServicesConfig` — contains named `ServiceConfig` entries: surreal, libsql, duckdb, moka, rro, vite
- [ ] Scope paths nested: `ServiceScopeConfig` { path: String } under each service
- [ ] `RuntimeBootConfig` → `[runtime.boot]`
- [ ] `RuntimeShutdownConfig` → `[runtime.shutdown]`
- [ ] `RuntimeCleanupConfig` → `[runtime.cleanup]`
- [ ] `RuntimeHealthConfig` → `[runtime.health]`
- [ ] `ObservabilityLoggingConfig` → `[observability.logging]`
- [ ] `SecurityConfig` → `[security]`
- [ ] `PlatformWindowsConfig` (rename existing `WindowsConfig`) → `[platform.windows]`
- [ ] Root struct: `PlatformConfig` { app, services, runtime, observability, security, platform }
- [ ] All `#[serde(default)]` with defaults matching the TOML
- [ ] cargo check after EACH struct

### 2.3 Migrate existing store boot code to service contract
- [ ] `boot/mod.rs`: iterate `services` by `init_order`, boot each enabled service
- [ ] Each service uses its own `retry` config
- [ ] `critical` flag determines whether failure = boot abort or degraded mode
- [ ] `health_check` field determines how `ping()` works
- [ ] Remove old `boot_relational`, `boot_analytics`, `boot_cache` — replaced by uniform `boot_service`
- [ ] cargo check after EACH change

### 2.4 Migrate Platform facade
- [ ] `Platform` struct: holds `HashMap<String, Arc<dyn Service>>` instead of named Option fields
- [ ] `Platform::service(&self, name: &str) -> Option<&Arc<dyn Service>>`
- [ ] Typed accessors for convenience: `.libsql_system()`, `.surreal()`, `.duckdb()`, `.moka()`
- [ ] `Platform::shutdown()` iterates services in reverse `init_order`
- [ ] cargo check

### 2.5 Config layering
- [ ] `PlatformConfig::load()`: default TOML (embedded) → `.userdata/platform.toml` (override) → `DEVPULSE_*` env vars
- [ ] cargo check

### 2.6 Delete old config
- [ ] Remove `[windows].file_lock_retries` and `file_lock_retry_delay_ms` (replaced by per-service retry)
- [ ] Remove `[stores.*]` sections entirely (replaced by `[services.*]`)
- [ ] Remove old `ScopedStoresConfig`, `SystemStoresConfig`, `UserStoresConfig`, `GlobalStoresConfig`, `ProjectStoresConfig` structs
- [ ] Remove old `StoreEntry`, `GraphStoreEntry` structs (replaced by `ServiceConfig`)
- [ ] cargo check

---

## Phase 3: Proper Window Lifecycle

The UI loads lazily AFTER the backend signals ready.

### 3.1 Main window hidden until boot complete
- [ ] `tauri.conf.json`: main window `"visible": false`
- [ ] `lib.rs` setup: window starts hidden
- [ ] `boot_task()`: on "ready" phase → `main_window.show()`
- [ ] On boot failure → show window with error overlay
- [ ] cargo check

### 3.2 Boot overlay shows real status
- [ ] Already implemented: pulsing dot, step label, elapsed timer, subsystem rows
- [ ] Verify it renders when window becomes visible
- [ ] Add: if boot takes > `boot_warning_secs` → show "This is taking longer than expected"
- [ ] Add: if boot exceeds `boot_timeout_secs` → show error with retry button

### 3.3 Chat window on-demand only
- [ ] Remove from `tauri.conf.json` windows array
- [ ] `open_chat_window` command already exists — it creates the window
- [ ] Verify it works after removing the static definition
- [ ] cargo check

---

## Phase 4: Port Conflict Resolution

No hardcoded ports. Config defaults + auto-resolve.

### 4.1 SurrealDB HTTP port auto-resolve
- [ ] In `server.rs`: try `config.port`, if taken try `port+1`, up to `max_port_attempts`
- [ ] Log the actual port used
- [ ] Emit the actual port to frontend via event (so UI can display it)
- [ ] cargo check

### 4.2 Dev port documentation
- [ ] Vite port (1420) stays in vite.config.ts — Vite owns its config
- [ ] Tauri devUrl stays in tauri.conf.json — Tauri owns its config
- [ ] TOML `[dev].vite_port` is documentation + xtask reference — not consumed by Vite/Tauri directly
- [ ] Add comment: "Must match vite.config.ts:port and tauri.conf.json:build.devUrl"
- [ ] xtask reads this value for port checks

---

## Phase 5: xtask Expansion

### 5.1 xtask reads TOML config
- [ ] Embed `platform.default.toml` in xtask via `include_str!`
- [ ] Parse for zombie names, patterns, ports
- [ ] Replace all hardcoded consts
- [ ] cargo check

### 5.2 Add `xtask lint`
- [ ] `pnpm biome check src/` (frontend)
- [ ] `cargo clippy --workspace -- -D warnings` (Rust)
- [ ] Report both, fail if either fails
- [ ] cargo check

### 5.3 Add `xtask clean`
- [ ] Kill zombie processes (existing)
- [ ] Delete stale LOCK files (new)
- [ ] Clear occupied ports (existing)
- [ ] Report what was cleaned
- [ ] cargo check

### 5.4 Add `xtask check`
- [ ] `cargo check -p devpulse_desktop_backend` (Rust)
- [ ] `pnpm svelte-check` (TypeScript)
- [ ] Run in parallel, report both
- [ ] cargo check

### DECIDED — Owner Decision (2026-03-14)
**Decision**: A — processes + locks + ports. Logs and build caches are separate concerns.

---

## Phase 6: Shutdown Lifecycle (Complete)

### 6.1 Ordered store shutdown
- [ ] Verify `Platform::shutdown()` compiles and runs
- [ ] Reverse boot order: graph → analytics → cache → relational
- [ ] Each store logs: "Shutting down {name}..." and "Shut down {name} ({ms}ms)"
- [ ] 5-second deadline from `[lifecycle.shutdown_timeout_secs]`
- [ ] cargo check

### 6.2 LOCK file cleanup on shutdown
- [ ] After SurrealDB store shutdown, verify LOCK file is gone (SurrealKV Drop should delete it)
- [ ] If LOCK file persists after Drop → explicitly delete it
- [ ] Log: "Cleaned stale LOCK file at {path}"
- [ ] cargo check

### 6.3 Shutdown logging
- [ ] Write shutdown summary to `.userdata/logs/shutdown.log`
- [ ] Format matches boot.log: timestamps, per-store status, total duration
- [ ] cargo check

### 6.4 Tauri exit handler
- [ ] `RunEvent::Exit` → `Platform::shutdown()`
- [ ] `RunEvent::ExitRequested` → allow (don't block close)
- [ ] Verify with: start app → Ctrl+C → check shutdown.log exists → restart → boots clean
- [ ] cargo check

---

## Verification Checklist

After all phases:
- [ ] `cargo check -p devpulse_desktop_backend` passes with 0 errors
- [ ] `cargo clippy --workspace` passes with 0 errors
- [ ] `pnpm svelte-check` passes with 0 errors
- [ ] `pnpm biome check src/` passes with 0 errors
- [ ] App boots: boot overlay shows, all stores green, overlay fades
- [ ] Only ONE window opens (main). Chat opens on demand.
- [ ] Ctrl+C → clean shutdown → restart → boots immediately (no lock errors)
- [ ] Kill -9 → stale LOCK cleaned on next boot → boots
- [ ] Second instance launch → focuses existing window, does NOT start
- [ ] `cargo xtask lint` passes
- [ ] `cargo xtask clean` cleans stale state
- [ ] boot.log shows full boot trace
- [ ] shutdown.log shows full shutdown trace

---

## Files Modified

### Phase 1 (Boot Blocker Fix)
| File | What Changes |
|------|-------------|
| `interfaces/desktop/src-tauri/Cargo.toml` | Add `tauri-plugin-single-instance` |
| `interfaces/desktop/src-tauri/src/lib.rs` | Single-instance plugin + window hidden→show lifecycle + exit handler |
| `interfaces/desktop/src-tauri/tauri.conf.json` | Remove chat window, main `visible: false`, add single-instance plugin |
| `interfaces/desktop/src-tauri/capabilities/default.json` | Scoped permissions per window |
| `systems/devpulse-engine/src/platform/boot/preflight.rs` | Add stale LOCK file cleanup |

### Phase 2 (Config-Driven TOML + Service Contract)
| File | What Changes |
|------|-------------|
| `systems/devpulse-engine/platform.default.toml` | REWRITE — `[app]`, `[services.*]`, `[runtime.*]`, `[observability.*]`, `[security]`, `[platform.*]` |
| `systems/devpulse-engine/src/platform/config.rs` | REWRITE — `PlatformConfig` root, `ServiceConfig` uniform contract, delete old store types |
| `systems/devpulse-engine/src/platform/mod.rs` | Refactor `Platform` to use `HashMap<String, Arc<dyn Service>>`, config-driven shutdown |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | Refactor to boot services by `init_order`, uniform `boot_service()` |
| `systems/devpulse-engine/src/platform/boot/graph.rs` | Config-driven SurrealDB HTTP port + bind |
| `systems/devpulse-engine/src/platform/boot/retry.rs` | Already done — reads per-service retry config |
| `systems/devpulse-engine/src/platform/server.rs` | Config-driven port + auto-resolve |
| `systems/devpulse-engine/src/platform/stores/mod.rs` | Rename `Store` trait to `Service` trait, add uniform lifecycle methods |

### Phase 3-5 (Window Lifecycle + Ports + xtask)
| File | What Changes |
|------|-------------|
| `systems/devpulse-engine/src/platform/server.rs` | Auto port resolution with fallback |
| `xtask/src/main.rs` | Add lint, clean, check subcommands |
| `xtask/src/commands/lint.rs` | NEW — biome + clippy |
| `xtask/src/commands/clean.rs` | NEW — zombies + locks + ports |
| `xtask/src/commands/check.rs` | NEW — cargo check + svelte-check parallel |
| `xtask/src/net.rs` | Config-driven port from TOML |
| `xtask/src/zombie.rs` | Config-driven names/patterns from TOML |

### Adapter Layer (close methods — already written, needs compile verify)
| File | What Changes |
|------|-------------|
| `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs` | `close()` method |
| `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs` | `close()` method |
| `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs` | `close()` method |

## NOT Touched
- biome.json (already correct)
- Cargo.toml [workspace.lints] (already strict)
- ColdLight, tokens, recipes, design system
- DevForge UI (separate sprint — reads this config)
- Glossary/lesson system (separate sprint — uses this config structure)
