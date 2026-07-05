# Module Charter — DevPulse Platform Foundation

**Status**: DRAFT — awaiting owner approval section by section
**Created**: 2026-04-21
**Parent**: `SPRINT-FOUNDATIONAL-REBUILD-MASTER.md`
**Purpose**: every module (capability, store, runtime, integration, runtime-primitive) must satisfy this charter to exist in the codebase. Build validators enforce. No exceptions.

---

## Why a charter

Owner: *"take the time to ensure all our services etc are consistent in naming, structure, building a cohesive consistent framework."*

Without a charter, each module grows its own shape. Devtools drift. Commands diverge. State is named by whoever wrote it first. The charter is the enforceable contract: every module looks the same on the outside, regardless of what it wraps.

---

## Scope

The charter governs every **bounded context** under `config/platform/{axis}/{module}/`, where **axis** is one of:

| Axis | Purpose | Examples |
|---|---|---|
| `runtime/` | platform primitives — boot, config, telemetry, network, OS adapters | portable, boot, windows, telemetry, network |
| `stores/` | persistent state backends | libsql, duckdb, surrealdb, cache, project_db |
| `runtimes/` | process / model execution backends | candle, ollama_sidecar, ollama_embedded, devforge |
| `capabilities/` | product-facing user verbs | chat, reasoning, rosetta_stone, translator, voice, model_runtime |
| `integrations/` | external providers | claude |

A **module** = one bounded context = one folder everywhere (TOML, Rust, TS, devtool).

---

## The 8 Required Artifacts per Module

Every module MUST produce all 8. Missing any = preflight fail = build fail.

### 1. Config TOML (authoring surface)

**Path**: `config/platform/{axis}/{module}.toml`

**Required sections** (every module declares all five):

```toml
[identity]
id = "chat"                        # snake_case, matches folder + struct + module everywhere
title = "Chat"                     # display name
description = "..."                # one line
version = "0.1.0"                  # module schema version (bumped on breaking change)
stability = "experimental"         # experimental | beta | stable (matches signals.registry.yaml tiers)

[lifecycle]
enabled = true                     # feature flag
start_mode = "lazy"                # eager (boot-pipeline) | lazy (first-use) | on_demand (explicit start only)
health_check_interval_secs = 30
dependencies = ["libsql", "reasoning"]   # other module IDs this one needs running

[signals]
emits = ["chat.turn.started", "chat.turn.completed"]  # IDs declared in signals.registry.yaml
consumes = ["reasoning.rro.ready"]

[observability]
log_level = "info"                 # trace | debug | info | warn | error
metrics_enabled = true
trace_enabled = true

[config]
# module-specific body — this is where each module's unique fields go
# everything above is universal; this is what makes chat different from translator
```

**Rule**: `[identity]`, `[lifecycle]`, `[signals]`, `[observability]` are schema-fixed and validated by build. `[config]` is module-owned and validated by the module's own Rust struct.

### 2. Rust struct + service

**Paths**:
- `systems/devpulse-engine/src/platform/config/{axis}/{module}.rs` — `{Module}Config` struct (serde)
- `systems/devpulse-engine/src/platform/modules/{axis}/{module}.rs` — `{Module}Service` impl

**Required**:
```rust
// config/{axis}/{module}.rs
#[derive(Debug, Clone, Serialize, Deserialize, Type)]    // Type = specta
#[serde(deny_unknown_fields)]
pub struct {Module}Config {
    pub identity: ModuleIdentity,
    pub lifecycle: ModuleLifecycle,
    pub signals: ModuleSignals,
    pub observability: ModuleObservability,
    pub config: {Module}Settings,    // body, module-owned
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct {Module}Settings { /* module-specific */ }

// modules/{axis}/{module}.rs
pub struct {Module}Service { /* state */ }

#[async_trait]
impl ManagedModule for {Module}Service {
    fn identity(&self) -> ModuleIdentity { ... }
    async fn start(&self) -> Result<(), ModuleError>;
    async fn stop(&self) -> Result<(), ModuleError>;
    async fn restart(&self) -> Result<(), ModuleError>;
    async fn health(&self) -> ModuleHealth;
    async fn export_logs(&self, dest: &Path) -> Result<PathBuf, ModuleError>;
    fn dependencies(&self) -> &[ModuleId];
}
```

### 3. The `ManagedModule` trait (defined ONCE at platform root)

**Path**: `systems/devpulse-engine/src/platform/module.rs`

Single source of truth for the lifecycle contract. Every service implements it. Trait is:

```rust
#[async_trait]
pub trait ManagedModule: Send + Sync + 'static {
    fn identity(&self) -> &ModuleIdentity;
    fn config_version(&self) -> u32;
    async fn start(&self) -> Result<(), ModuleError>;
    async fn stop(&self) -> Result<(), ModuleError>;
    async fn restart(&self) -> Result<(), ModuleError>;
    async fn health(&self) -> ModuleHealth;
    async fn export_logs(&self, dest: &Path) -> Result<PathBuf, ModuleError>;
    fn dependencies(&self) -> &[ModuleId];
}

// Supporting types
pub struct ModuleIdentity { id: ModuleId, title, description, version, stability, axis }
pub enum ModuleAxis { Runtime, Store, Runtime_, Capability, Integration }
pub enum StartMode { Eager, Lazy, OnDemand }
pub enum ModuleHealth { Up, Degraded { reason }, Down { reason }, Starting, Stopped }
pub enum ModuleError { /* unified error type */ }
```

### 4. Signal registry entry

**Path**: `systems/devpulse-engine/ip/signals.registry.yaml`

Every signal the module emits or consumes MUST be declared here. Module TOML's `[signals].emits` / `[signals].consumes` arrays are cross-validated against the registry at build. Nothing emits an undeclared signal — `ip_term!` macro fails at compile time.

### 5. Tauri commands (uniform naming)

**Path**: `interfaces/desktop/src-tauri/src/commands/platform/{axis}/{module}.rs`

Required commands per module (these are the SAME across every module — generic dispatch):

| Command | Purpose |
|---|---|
| `{module}_start` | call `ManagedModule::start` |
| `{module}_stop` | call `ManagedModule::stop` |
| `{module}_restart` | call `ManagedModule::restart` |
| `{module}_health` | call `ManagedModule::health` |
| `{module}_export_logs` | returns path to exported bundle |
| `{module}_get_config` | returns `{Module}Config` (typed) |
| `{module}_save_config` | accepts partial config, writes overlay, returns validated full config |

**Alternative (preferred)**: a single generic `platform_service_invoke(module_id, action, payload)` with typed dispatch. Reduces surface area but needs STOP decision.

**All `#[tauri::command]` handlers are `pub async fn`** — NO sync commands. Root cause of the stderr backpressure hang was sync commands on the dispatch thread. Charter bans them.

### 6. Svelte 5 rune domain (barrel pattern)

**Path**: `interfaces/desktop/src/lib/domains/platform/{axis}/{module}/`

Required:
```
{module}/
├── index.ts                              # barrel — ONLY public surface
├── util/
│   ├── {module}.contract.ts              # tauri-specta types re-exported
│   └── {module}.types.ts                 # pure TS additions
├── data-access/
│   ├── {module}.state.svelte.ts          # $state rune module
│   ├── {module}.service.ts               # typed invoke() wrappers
│   └── {module}.events.ts                # typed Tauri event subscriptions
├── ui/                                   # only if shared dumb components exist
└── feature/
    └── devtool/
        ├── {Module}DevtoolShell.svelte   # Status / Config / Logs / Actions tabs
        ├── {Module}ConfigForm.svelte     # form bound to overlay
        └── {Module}LogViewer.svelte      # live tail + export
```

`index.ts` re-exports ONLY:
- the `$state` rune(s)
- the service class
- the devtool feature components (for route use)
- the `{Module}Config` type

Routes + other domains import through `platform/index.ts` → `{axis}/index.ts` → `{module}/index.ts`. **No reaching into internals.** Enforced by preflight.

### 7. Devtool route

**Path**: `interfaces/desktop/src/routes/(devtools)/devtools/{axis}/{module}/+page.svelte`

Required shape: imports `{Module}DevtoolShell` from the module's domain. Four tabs (Status / Config / Logs / Actions) are non-negotiable. ColdLight token-based UI, XY fluid clamp preserved, no inline styles. Friendly layman error messages.

### 8. Preflight + tests

**Paths**:
- `scripts/docs/preflight/checks/check.module-charter.ts` — AST check that every module has all 8 artifacts
- `systems/devpulse-engine/tests/modules/{module}_charter.rs` — unit tests for the module's `ManagedModule` impl (start → health → stop → restart cycle)

**Preflight enforces**:
- Every folder under `config/platform/{axis}/` has a `{module}.toml`
- Every TOML has an `[identity]` matching the folder name
- Every module ID appears in Rust `config/`, `modules/`, `commands/`, Svelte domain, and devtool route — or build fails
- Every `[signals].emits` ID is declared in `signals.registry.yaml`
- No sync `#[tauri::command]` handlers

---

## Naming Conventions (strict, enforced)

| Surface | Pattern | Example |
|---|---|---|
| Module ID | `snake_case`, matches folder name | `rosetta_stone` |
| TOML file | `{module}.toml` | `rosetta_stone.toml` |
| Rust struct | `{PascalCase}Config`, `{PascalCase}Service` | `RosettaStoneConfig` |
| Rust module file | `{snake_case}.rs` | `rosetta_stone.rs` |
| Tauri command | `{module}_{verb}` | `rosetta_stone_start` |
| TS state file | `{module}.state.svelte.ts` | `rosetta_stone.state.svelte.ts` |
| TS service file | `{module}.service.ts` | `rosetta_stone.service.ts` |
| TS contract file | `{module}.contract.ts` | `rosetta_stone.contract.ts` |
| Svelte component | `{PascalCase}DevtoolShell.svelte` | `RosettaStoneDevtoolShell.svelte` |
| Route | `/devtools/{axis}/{module}` | `/devtools/capabilities/rosetta_stone` |
| Signal ID | `{module}.{domain}.{verb}` | `rosetta_stone.translation.completed` |
| Log target | `platform.{axis}.{module}` | `platform.capabilities.rosetta_stone` |

No deviations. Charter validator fails the build on any mismatch.

---

## Sync vs Async Doctrine (root cause of the boot hang)

**All `#[tauri::command]` handlers are `pub async fn`.** Period.

Why: Tauri dispatches sync commands on a single IPC thread. Any sync command that blocks (stderr write, file lock, mutex) stalls every subsequent IPC call. The `log` command hang that cost us days was exactly this.

Async commands are spawned on tokio's multi-thread runtime — a blocking write on one task doesn't block others.

**Rule**: even commands that "just return a value" are `pub async fn`. Uniformity beats micro-optimization.

**Exception (the only one)**: commands that MUST be sync for ordering guarantees the Tauri runtime provides (window lifecycle, menu events). These are documented case by case and require a comment block justifying the sync choice.

---

## Unified Signal System (owner's explicit ask)

Every module emits through **one signal bus**. No ad-hoc `tracing::info!(target: "x", ...)` outside the registry. No direct Tauri emit calls bypassing the bus.

**Bus shape** (STOP for confirmation):
```rust
pub struct SignalBus {
    inner: tokio::sync::broadcast::Sender<Signal>,
}

pub struct Signal {
    pub id: SignalId,           // from signals.registry.yaml
    pub timestamp: DateTime<Utc>,
    pub source: ModuleId,
    pub severity: Severity,
    pub payload: serde_json::Value,
    pub trace_context: Option<TraceContext>,   // OTel span ID
}
```

Channel type: `tokio::sync::broadcast` — every subscriber sees every signal. Rationale: devtools, telemetry writer, frontend bridge, DuckDB span writer all consume in parallel.

Signal capacity, lag behavior on slow consumer, and fan-out to Tauri events — **pending research agent findings before I lock**.

---

## Unified Logging / Breadcrumb Doctrine (owner's explicit ask)

**Failure mode coverage matrix** (no gaps):

| Failure mode | Artifact produced | Path |
|---|---|---|
| Rust panic (main thread) | `crash-{ts}.json` synchronous + session JSONL | `{data_dir}/logs/` |
| Rust panic (tokio task) | same — custom tokio panic catcher |  |
| Rust panic (spawn_blocking) | same |  |
| Child process death (REH, ollama sidecar) | `child-crash-{ts}.json` with child stderr tail |  |
| Webview crash | `webview-crash-{ts}.json` via `on_webview_event` |  |
| JS pre-module error | queued in `__DEVPULSE_EARLY_ERRORS__`, flushed to disk on IPC ready |  |
| JS post-mount error | `installGlobalHandlers` → IPC log command |  |
| IPC deadlock | watchdog thread: if any async command > 10s, snapshot all tracing spans + stack to `ipc-stall-{ts}.json` |  |
| Process kill | best-effort: async appenders flushed in `Drop` + shutdown hook |  |
| Disk full / perm denied | fall back to stderr with loud banner |  |
| OTel span loss | BufferingProcessor flushes on `data_dir` resolution; span count persisted |  |
| DuckDB channel overflow | metric emitted; capacity bumped at config |  |

All artifacts are JSONL or structured JSON for grep/jq ingestion. Rotation: 10 most recent per category.

**Pending research agent findings before I lock specifics.**

---

## Consistency Invariants (cross-module)

1. **One lifecycle trait, one bus, one error type, one health type** — defined once, used everywhere.
2. **Every module is start/stop/restart-able** — no exceptions. Even if "restart" means "do nothing" for a stateless module, the command exists.
3. **Every module has a devtool route** — even system-internal modules. This is how we debug them.
4. **Every module has tests** — minimum: start → health check → stop cycle.
5. **Every module's config can be edited from its devtool** — the same overlay path is authoritative.
6. **Every module emits signals through the bus** — no tracing calls that bypass it.
7. **Every module is async** — no sync locks held across `.await`, no sync Tauri commands.
8. **Every module documents its dependencies** — TOML `[lifecycle].dependencies` is the authoritative list; boot order derives from it.

---

## STOP Points Before Charter Locks

| # | Question | Options |
|---|---|---|
| C1 | Tauri command style — per-module (`chat_start`, `libsql_start`, ...) OR single generic (`platform_service_invoke(id, verb, payload)`)? | per-module is verbose but typed; generic is DRY but payload is `Value` |
| C2 | Signal bus capacity — what's the bound? What happens on slow consumer lag? | 1024 default w/ `recv().await` drop-on-lag, or unbounded w/ backpressure |
| C3 | `[identity].axis` vs deriving axis from folder path | explicit is self-documenting; derived is DRY |
| C4 | Module config overlay granularity — per-module file OR unified overlay file | per-module matches source layout; unified is simpler to atomically swap |
| C5 | Devtool shell — shared Svelte component parameterized by module OR one-per-module | shared wins consistency; per-module wins customization |
| C6 | `ModuleError` shape — single enum with variants per axis OR per-module errors that impl a common trait | enum is tidy at small scale; trait scales |
| C7 | Signal registry validation — compile-time proc macro OR runtime validation | proc macro = zero runtime cost, harder to write; runtime = easy |
| C8 | Stability tiers in `[identity].stability` — do we gate devtool visibility on stability (experimental hidden behind a flag)? | yes means safer UI; no means all modules visible to devs |

Owner answers these → charter locks → S0 phase plan can be written with exact files and line ranges.

---

## What This Enables (once locked)

- **Copy-paste bootstrap**: adding the 13th module = copy a template folder, rename, fill in the TOML config body and Rust service — all other shape is mechanical.
- **Devtool discoverability**: the devtool index page enumerates every module by scanning the registry — no hardcoded nav.
- **No silent failures**: charter failure mode matrix guarantees every crash writes to disk.
- **Signal replay**: every module's signal stream is replayable from the DuckDB span log for debugging.
- **Boot order**: derived from `[lifecycle].dependencies` — no more hand-ordered boot pipeline.
- **`.exe` standalone**: because every module is self-contained with its own config overlay, shipping a second instance is just a second `.userdata/` directory.

---

## Next

1. Owner reviews and answers STOPs C1–C8.
2. Research agents (config monolith / signal system / logging) complete — their findings may add STOPs.
3. Charter locks.
4. S0 phase plan written with exact files, line ranges, verification gates.
5. S0 execution begins — one phase at a time, max 5 files per phase, owner approval between phases.
