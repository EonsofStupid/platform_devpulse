# SPRINT: Platform Service Manager — IDE & AI as Managed Services

**Status**: PLANNED
**Priority**: P3 (after P0 foundation fixes, P1 visual fidelity, P2 VPB)
**Prerequisites**: SPRINT-FOUNDATION-V2 complete, SurrealDB fresh-install fix
**Category**: Platform Wiring

---

## Vision

DevPulse becomes the conductor. Cursor, VS Code (Antigravity), and Claude Code run as **real native processes** managed by the platform — same lifecycle pattern as SurrealDB, LibSQL, DuckDB, and RRO today. Your subscription, your tools, your rules.

```
DevPulse Platform (Service Manager)
├── Database Services (EXISTING — embedded)
│   ├── LibSQL, DuckDB, SurrealDB, Moka, RRO, Kokoros, Outlines
│   └── Lifecycle: Service trait → boot → ping → shutdown
├── Network Services (EXISTING — embedded)
│   └── SurrealDB HTTP API on :8822
├── Tool Services (NEW — external processes)
│   ├── Cursor        → real app, managed process
│   ├── Antigravity   → real app, managed process
│   ├── Claude Code   → real CLI, real subscription, PTY
│   └── (future tools you build)
└── Engine Services (EXISTING)
    └── Maestro → sees everything, orchestrates
```

---

## Architecture Decisions

### AD-1: Separate trait for external processes

The existing `Service` trait wraps embedded libraries (LibSQL, DuckDB, etc.). External processes have fundamentally different concerns: PID tracking, stdin/stdout/stderr, exit codes, restart policies, environment variables, working directories.

**Decision**: New `ProcessService` trait extends the lifecycle model. Does NOT replace `Service` — they coexist.

### AD-2: Windows Job Objects for child process guarantees

`xtask/src/zombie.rs` already implements Windows Job Objects with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. This kernel-enforced guarantee (children die when parent dies) MUST be used for all managed tool processes. No zombies.

**Decision**: Extract Job Object logic from xtask into a shared crate (`devpulse-process` or inline in engine) so runtime can use it too.

### AD-3: Config-driven, same as everything else

New `[services.tools.*]` section in `platform.default.toml`. Each tool service declares: executable path, args, env, working directory, restart policy, health check method.

### AD-4: PTY for Claude Code

Claude Code needs a real terminal (PTY), not just stdout piping. This enables interactive sessions, ANSI rendering, and proper terminal behavior. Use `portable-pty` or `conpty` on Windows.

### AD-5: Tauri shell capabilities expansion

Currently only `shell:allow-open`. Must enable `allow-execute`, `allow-spawn`, `allow-kill`, `allow-stdin-write` in capabilities config.

### AD-6: Maestro observability

Maestro already watches filesystem and databases. Tool services emit events on the same `platform:subsystem-status` channel. Maestro can observe what IDEs are running, what Claude Code is doing (via filesystem changes), and coordinate.

---

## What's Already In Place

| Component | Status | Location |
|-----------|--------|----------|
| Service trait | ✅ Exists | `systems/devpulse-engine/src/platform/services/mod.rs` |
| Boot pipeline with events | ✅ Exists | `systems/devpulse-engine/src/platform/boot/mod.rs` |
| Config system (TOML) | ✅ Exists | `systems/devpulse-engine/platform.default.toml` |
| Health monitoring | ✅ Exists | `systems/devpulse-engine/src/platform/health.rs` |
| BootStateTracker | ✅ Exists | `interfaces/desktop/src-tauri/src/state.rs` |
| Windows Job Objects | ✅ Exists (xtask) | `xtask/src/zombie.rs` |
| tauri-plugin-shell | ✅ Loaded | `src-tauri/src/lib.rs` line 38 |
| Shell capabilities | ⚠️ Only `allow-open` | `src-tauri/capabilities/default.json` |
| Process spawning | ❌ Not implemented | — |
| PTY integration | ❌ Not implemented | — |
| Tool service config | ❌ Not implemented | — |
| Frontend tool panel | ❌ Not implemented | — |

---

## Phases

### Phase 1: Process Service Foundation (Rust engine)

**Goal**: The engine can launch, monitor, and kill external processes with zombie protection.

#### Task 1.1: ProcessService trait
**File**: `systems/devpulse-engine/src/platform/services/process.rs` (NEW)

```rust
use anyhow::Result;
use std::path::PathBuf;

/// Restart behavior when a managed process exits.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RestartPolicy {
    /// Never restart — manual only.
    Never,
    /// Restart on non-zero exit code.
    OnFailure,
    /// Always restart (with backoff).
    Always,
}

/// Health check method for an external process.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum HealthCheck {
    /// Process is alive = healthy.
    ProcessAlive,
    /// HTTP GET returns 200.
    Http { url: String },
    /// TCP connect succeeds.
    TcpPort { port: u16 },
    /// Custom command exits 0.
    Command { cmd: String, args: Vec<String> },
}

/// Runtime state of a managed process.
#[derive(Debug)]
pub struct ProcessHandle {
    pub pid: u32,
    pub child: tokio::process::Child,
    pub started_at: std::time::Instant,
}

/// Configuration for a tool service (from TOML).
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ToolServiceConfig {
    pub enabled: bool,
    pub critical: bool,
    pub kind: String,
    pub executable: PathBuf,
    pub args: Vec<String>,
    #[serde(default)]
    pub env: Vec<(String, String)>,
    pub working_dir: Option<PathBuf>,
    pub restart: RestartPolicy,
    pub health: HealthCheck,
    /// Seconds to wait after spawn before first health check.
    #[serde(default = "default_grace")]
    pub grace_period_secs: u64,
}

fn default_grace() -> u64 { 5 }
```

#### Task 1.2: Process manager
**File**: `systems/devpulse-engine/src/platform/process_manager.rs` (NEW)

Responsibilities:
- Spawn processes with Job Object attachment (Windows) / process group (Unix)
- Track PIDs and handles
- Health check loop (configurable interval)
- Restart with exponential backoff per `RestartPolicy`
- Graceful shutdown: SIGTERM/TerminateProcess → wait → SIGKILL
- Event emission on state changes (started, healthy, unhealthy, stopped, restarting)

Extract Job Object logic from `xtask/src/zombie.rs` lines 58-74 into this module (or a shared utility).

#### Task 1.3: Integrate into boot pipeline
**File**: `systems/devpulse-engine/src/platform/boot/mod.rs` (MODIFY)

Add a new boot phase after database services:
```
Phase 1: Preflight (directories, lock cleanup)
Phase 2: Database services (existing)
Phase 3: Network services (existing)
Phase 4: Tool services (NEW) ← launches enabled tool processes
Phase 5: Validation (existing, extended)
```

Tool services are non-blocking — the UI renders while they start. Events stream to frontend like database services do today.

#### Task 1.4: Integrate into shutdown
**File**: `systems/devpulse-engine/src/platform/mod.rs` (MODIFY)

Shutdown order becomes:
```
1. Tool services (graceful SIGTERM, 10s deadline)
2. Graph services
3. Analytics services
4. Cache services
5. Relational services
6. File lock release
```

Tools shut down FIRST because they may be writing to databases.

**Verification**: `cargo check -p devpulse-engine`

---

### Phase 2: Configuration (TOML)

#### Task 2.1: Add tool service configs
**File**: `systems/devpulse-engine/platform.default.toml` (MODIFY)

```toml
# ── Tool services ───────────────────────────────────────────────
# IDE and AI tools managed as native processes.
# Each tool is a real executable launched by the platform.
# The platform manages lifecycle, health, and zombie prevention.

[services.tools.cursor]
enabled = false
critical = false
kind = "ide"
executable = "cursor"
args = ["--new-window", "."]
env = []
restart = "never"
health = { kind = "process_alive" }
grace_period_secs = 10

[services.tools.antigravity]
enabled = false
critical = false
kind = "ide"
executable = "code"
args = ["--new-window", "."]
env = []
restart = "never"
health = { kind = "process_alive" }
grace_period_secs = 10

[services.tools.claude]
enabled = false
critical = false
kind = "terminal"
executable = "claude"
args = []
env = []
restart = "on_failure"
health = { kind = "process_alive" }
grace_period_secs = 3
```

#### Task 2.2: Config types
**File**: `systems/devpulse-engine/src/platform/config.rs` (MODIFY)

Add `ToolServicesConfig` struct and wire it into the existing config hierarchy under `services.tools`.

**Verification**: `cargo check -p devpulse-engine` — config deserializes from TOML

---

### Phase 3: Tauri Integration

#### Task 3.1: Expand shell capabilities
**File**: `interfaces/desktop/src-tauri/capabilities/default.json` (MODIFY)

Add permissions:
```json
[
  "core:default",
  "shell:allow-open",
  "shell:allow-execute",
  "shell:allow-spawn",
  "shell:allow-kill",
  "shell:allow-stdin-write"
]
```

#### Task 3.2: Tauri commands for tool service management
**File**: `interfaces/desktop/src-tauri/src/commands/sys/tools.rs` (NEW)

Commands:
- `get_tool_services` → list all configured tools with status
- `start_tool_service(name)` → start a specific tool
- `stop_tool_service(name)` → stop a specific tool
- `restart_tool_service(name)` → restart
- `get_tool_health(name)` → health check result

Register in `commands/mod.rs`.

#### Task 3.3: Events
Emit on the existing `platform:subsystem-status` channel:
- `tool:starting`, `tool:healthy`, `tool:unhealthy`, `tool:stopped`, `tool:restarting`

Frontend StatusBar already listens to this channel — tool services appear alongside database services automatically.

**Verification**: `cargo check -p devpulse-desktop-app`

---

### Phase 4: PTY Integration (Claude Code)

#### Task 4.1: PTY crate
**File**: `systems/devpulse-engine/Cargo.toml` (MODIFY)

Add dependency: `portable-pty` (cross-platform PTY — uses ConPTY on Windows, openpty on Unix).

#### Task 4.2: Terminal session manager
**File**: `systems/devpulse-engine/src/platform/terminal.rs` (NEW)

Responsibilities:
- Create PTY pairs (master/slave)
- Spawn Claude Code (or any CLI) inside the PTY
- Read output from master fd, emit as events
- Write input to master fd from frontend
- Handle resize events (SIGWINCH / ConPTY resize)

#### Task 4.3: Tauri commands for terminal
**File**: `interfaces/desktop/src-tauri/src/commands/sys/terminal.rs` (NEW)

Commands:
- `create_terminal_session(tool_name)` → returns session ID
- `write_terminal(session_id, data)` → send keystrokes
- `resize_terminal(session_id, cols, rows)` → resize
- `close_terminal(session_id)` → teardown

Events:
- `terminal:output(session_id, data)` → raw ANSI output for frontend renderer

**Verification**: `cargo check -p devpulse-desktop-app`

---

### Phase 5: Frontend — Service Panel (ColdLight)

#### Task 5.1: Tool service status in StatusBar
**File**: `interfaces/desktop/src/lib/components/` (MODIFY existing StatusBar)

Tool services appear as status indicators alongside database services. Click to expand.

#### Task 5.2: Tool management panel
**File**: `interfaces/desktop/src/routes/` or panel component (NEW)

- List all tool services with status (running/stopped/error)
- Start/stop/restart buttons
- Health indicator (green/yellow/red)
- Log tail for each tool

#### Task 5.3: Terminal component (for Claude Code)
**File**: `interfaces/desktop/src/lib/components/` (NEW)

Integrate `xterm.js` (or `@nicco/term`) for terminal rendering:
- Receives `terminal:output` events
- Sends keystrokes via `write_terminal` command
- Handles resize
- ANSI color rendering
- ColdLight-styled chrome around the terminal

**Verification**: `pnpm svelte-check`

---

### Phase 6: Maestro Observability (Future)

Not part of this sprint but designed for:
- Maestro subscribes to tool service events
- Can observe which IDE is active
- Can observe Claude Code terminal output (opt-in)
- Can coordinate: "Claude Code just modified X, update the knowledge graph"
- Can route tasks: "send this to Cursor" vs "send this to Claude Code"

---

## Decision Gates (Owner Must Approve)

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 1 | PTY crate choice | `portable-pty` vs `conpty` + `openpty` directly | Phase 4 approach |
| 2 | Terminal frontend | `xterm.js` vs custom ANSI renderer | Phase 5 complexity |
| 3 | Tool auto-start | Should enabled tools launch on platform boot, or always manual? | UX behavior |
| 4 | Executable discovery | Hardcoded paths vs PATH lookup vs user config? | Setup complexity |
| 5 | Phase ordering | Build all of Phase 1-3 first, or interleave with frontend? | Sprint execution |

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Cursor/VS Code don't like being launched as child processes | They do — both support `--new-window` CLI. Tested pattern. |
| Windows Job Objects kill IDE when DevPulse closes | Expected behavior. Document it. Add "detach" option if user wants IDE to outlive platform. |
| PTY on Windows is historically painful | ConPTY (Windows 10+) is stable. `portable-pty` abstracts it. Windows 11 = no issues. |
| Claude Code auth | No issue — CLI uses user's existing auth (~/.claude/). Platform just spawns it. |
| Process zombies on crash | Job Objects handle this on Windows. Process groups + SIGKILL on Unix. Already proven in xtask. |

---

## Files Changed Summary

| File | Action | Phase |
|------|--------|-------|
| `systems/devpulse-engine/src/platform/services/process.rs` | NEW | 1 |
| `systems/devpulse-engine/src/platform/services/mod.rs` | MODIFY (add module) | 1 |
| `systems/devpulse-engine/src/platform/process_manager.rs` | NEW | 1 |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | MODIFY (Phase 4 boot) | 1 |
| `systems/devpulse-engine/src/platform/mod.rs` | MODIFY (shutdown order) | 1 |
| `systems/devpulse-engine/platform.default.toml` | MODIFY (tool configs) | 2 |
| `systems/devpulse-engine/src/platform/config.rs` | MODIFY (config types) | 2 |
| `interfaces/desktop/src-tauri/capabilities/default.json` | MODIFY (permissions) | 3 |
| `interfaces/desktop/src-tauri/src/commands/sys/tools.rs` | NEW | 3 |
| `interfaces/desktop/src-tauri/src/commands/sys/mod.rs` | MODIFY (register) | 3 |
| `interfaces/desktop/src-tauri/src/commands/mod.rs` | MODIFY (register) | 3 |
| `systems/devpulse-engine/Cargo.toml` | MODIFY (portable-pty) | 4 |
| `systems/devpulse-engine/src/platform/terminal.rs` | NEW | 4 |
| `interfaces/desktop/src-tauri/src/commands/sys/terminal.rs` | NEW | 4 |
| Frontend StatusBar | MODIFY | 5 |
| Frontend tool panel | NEW | 5 |
| Frontend terminal component | NEW | 5 |

---

## Sprint Boundary

**In scope**: Process lifecycle management, config, Tauri commands, PTY, basic frontend panel.
**Out of scope**: Maestro AI coordination with tools, VizWizi integration, custom DevPulse extensions for Cursor/VS Code, multi-workspace support.

Those are follow-on sprints once this foundation is solid.
