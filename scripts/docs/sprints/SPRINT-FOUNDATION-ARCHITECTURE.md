# SPRINT: Foundation Architecture — Config-Driven Service Platform

**Date**: 2026-04-01
**Status**: PLAN — Owner approval required before execution
**Replaces**: SPRINT-FOUNDATION-REPAIR.md (that was manual patching, this is engineering)

---

## WHY THE PREVIOUS PLAN WAS WRONG

The old plan listed 25 individual line-fixes across 3 micro-sprints. That's patching symptoms. The real problem: **there's no contract between config and code**. Fix one drift today, another appears tomorrow. The system has no immune system.

What smart people do: **invest upfront in a manifest + derive pattern** so the system self-enforces. One declaration per service. Everything else reads from it. The compiler and boot pipeline are the enforcement layer.

---

## THE CORE PROBLEM (3 sentences)

`platform.default.toml` is the SSOT — good, it's embedded via `include_str!()`. But then 30+ `impl Default` functions **duplicate those same values in Rust**. And `Platform` has 11+ hand-wired `Option<Arc<...>>` fields where health checks, validation, and shutdown are copy-pasted per-field. Adding or changing a service means touching 10+ files. Drift is guaranteed.

---

## THE FIX (3 concepts)

### Concept 1: ServiceMeta — The Compile-Time Manifest

One `const` array declares every service's identity. Boot order, public name, scope, feature gate — all in one place. Everything that needs "what services exist?" reads this array.

```rust
// services/manifest.rs — THE authority on what services exist
pub struct ServiceMeta {
    pub role: ServiceRole,
    pub scope: DataScope,
    pub stage: u8,
    pub public_name: &'static str,
    pub feature_gate: Option<&'static str>,
}

pub const SERVICE_MANIFEST: &[ServiceMeta] = &[
    ServiceMeta { role: ServiceRole::Relational, scope: DataScope::System, stage: 2,  public_name: "System Database",    feature_gate: None },
    ServiceMeta { role: ServiceRole::Analytics,  scope: DataScope::System, stage: 3,  public_name: "Analytics Engine",    feature_gate: None },
    ServiceMeta { role: ServiceRole::Graph,      scope: DataScope::System, stage: 4,  public_name: "Knowledge Graph",     feature_gate: None },
    ServiceMeta { role: ServiceRole::Cache,      scope: DataScope::System, stage: 5,  public_name: "System Cache",        feature_gate: None },
    ServiceMeta { role: ServiceRole::Relational, scope: DataScope::User,   stage: 6,  public_name: "User Database",       feature_gate: None },
    ServiceMeta { role: ServiceRole::Graph,      scope: DataScope::User,   stage: 6,  public_name: "User Knowledge",      feature_gate: None },
    ServiceMeta { role: ServiceRole::Graph,      scope: DataScope::Global, stage: 6,  public_name: "Shared Knowledge",    feature_gate: None },
    ServiceMeta { role: ServiceRole::Vector,     scope: DataScope::System, stage: 7,  public_name: "Vector Store",        feature_gate: Some("rro") },
    ServiceMeta { role: ServiceRole::Voice,      scope: DataScope::System, stage: 8,  public_name: "Voice Engine",        feature_gate: Some("kokoros") },
    ServiceMeta { role: ServiceRole::Grammar,    scope: DataScope::System, stage: 9,  public_name: "Grammar Engine",      feature_gate: None },
    ServiceMeta { role: ServiceRole::Embedder,   scope: DataScope::System, stage: 10, public_name: "Embedding Engine",    feature_gate: Some("candle") },
    ServiceMeta { role: ServiceRole::Whisper,    scope: DataScope::System, stage: 11, public_name: "Speech Recognition",  feature_gate: Some("candle") },
    ServiceMeta { role: ServiceRole::ModelLoader, scope: DataScope::System, stage: 12, public_name: "Model Manager",      feature_gate: Some("inference") },
    ServiceMeta { role: ServiceRole::DevForge,   scope: DataScope::System, stage: 13, public_name: "Code Editor",         feature_gate: None },
];
```

**Contract**: If a `ServiceRole` variant exists but has no `ServiceMeta` entry, the build fails (exhaustive match in boot). If a boot stage references a role not in the manifest, it won't compile.

### Concept 2: `active_services()` — One Method, Everything Derives

Instead of copy-pasting `if let Some(svc) = &self.field_name` in health, validation, and shutdown, Platform gets ONE method:

```rust
impl Platform {
    /// Collect all booted services. Health, validation, shutdown all call this.
    pub fn active_services(&self) -> Vec<&dyn Service> {
        let mut out = Vec::new();
        macro_rules! collect {
            ($field:expr) => { if let Some(s) = &$field { out.push(s.as_ref() as &dyn Service); } };
        }
        collect!(self.system_relational);
        collect!(self.system_analytics);
        collect!(self.system_graph);
        collect!(self.system_cache);
        collect!(self.user_relational);
        collect!(self.user_graph);
        collect!(self.global_graph);
        #[cfg(feature = "rro")]
        collect!(self.vector);
        #[cfg(feature = "kokoros")]
        collect!(self.voice);
        #[cfg(feature = "candle")]
        collect!(self.embedder);
        #[cfg(feature = "candle")]
        collect!(self.whisper);
        #[cfg(feature = "inference")]
        collect!(self.model_loader);
        collect!(self.devforge);
        out
    }
}
```

Then:
- **Health** = `for svc in self.active_services() { ping(svc) }` — 3 lines, not 40
- **Validate critical** = `for svc in self.active_services() { if manifest.critical(svc.role()) && svc.state() != Ready { bail! } }` — reads criticality from TOML config, not hardcoded
- **Shutdown** = `for svc in self.active_services().rev() { svc.shutdown() }` — reverse boot order

Adding a new service means: add one line to `active_services()`. Health, validation, shutdown work automatically.

### Concept 3: Kill Duplicate Defaults — TOML Is the Only Path

The 30+ `*_default()` functions in config.rs exist because `#[serde(default)]` needs them. But since `PlatformBootConfig` is ALWAYS created by parsing the embedded TOML (`include_str!`), these defaults are exercised only when a TOML field is **missing**. That's a config authoring bug, not something we should silently paper over.

**Fix**: Keep `#[serde(default)]` for forward compatibility (new TOML fields not in old user configs), but derive the defaults FROM the embedded TOML parse at compile time, not from hand-written functions.

For `DatabaseConfig::default()` specifically — this is the TS-exported type and its `impl Default` **contradicts TOML** (voice=true in code, voice=false in TOML). Delete `impl Default for DatabaseConfig`. It should ONLY be constructed via `PlatformBootConfig::to_database_config()`.

---

## PHASE PLAN

### Phase 1: Service Manifest + active_services() (2 files, ~80 lines)

**What**: Create `services/manifest.rs` with `ServiceMeta` array. Add `active_services()` to Platform.

| # | Task | File | Lines |
|---|------|------|-------|
| 1 | Create `ServiceMeta` struct + `SERVICE_MANIFEST` const | `services/manifest.rs` (NEW) | ~50 |
| 2 | Add `pub mod manifest;` to `services/mod.rs` | `services/mod.rs` | 1 |
| 3 | Add `active_services()` method to `Platform` | `platform/mod.rs` | ~25 |
| 4 | Add `meta()` lookup helper: `ServiceRole` → `&ServiceMeta` | `services/manifest.rs` | ~10 |

**Contract enforced**: Every `ServiceRole` variant MUST have a manifest entry. `meta()` uses exhaustive match — compiler fails if a role is missing.

**Gate**: `cargo check -p devpulse-engine` passes.

---

### Phase 2: Derive Health + Validation + Shutdown (3 files, ~-60 lines net)

**What**: Replace hand-wired health/validation/shutdown with `active_services()` iteration.

| # | Task | File | Change |
|---|------|------|--------|
| 1 | Rewrite `health()` to iterate `active_services()` | `platform/mod.rs` | -40 lines → +5 lines |
| 2 | Rewrite `validate_critical()` to read criticality from config | `boot/mod.rs` | -30 lines → +10 lines |
| 3 | Add `shutdown()` method that iterates in reverse | `platform/mod.rs` | +10 lines |

**Before** (health, 40 lines of copy-paste):
```rust
if let Some(svc) = &self.system_relational { subsystems.push(ping_service(svc.as_ref()).await); }
if let Some(svc) = &self.system_analytics { subsystems.push(ping_service(svc.as_ref()).await); }
// ... 11 more identical blocks with feature gates
```

**After** (health, 5 lines):
```rust
let mut subsystems = Vec::new();
for svc in self.active_services() {
    subsystems.push(ping_service(svc).await);
}
```

**validate_critical — before** (hardcoded list of what to validate):
```rust
// Manually checks system_relational, system_analytics, system_graph, system_cache, user_relational
// MISSES user_graph and global_graph despite them being critical=true in TOML
```

**validate_critical — after** (config-driven):
```rust
for svc in self.active_services() {
    let is_critical = self.boot_config.is_critical(svc.role());
    if is_critical && svc.state() != ServiceState::Ready {
        bail!("Critical service '{}' not ready: {:?}", svc.name(), svc.state());
    }
}
```

**Contract enforced**: If TOML says `critical = true`, validation checks it. Period. No manual list to forget.

**Gate**: `cargo check -p devpulse-engine` passes. Boot log shows all services validated.

---

### Phase 3: Kill Duplicate Defaults (1 file, ~-80 lines net)

**What**: Delete `impl Default for DatabaseConfig`. Clean up config.rs default functions that contradict TOML.

| # | Task | File | Change |
|---|------|------|--------|
| 1 | Delete `impl Default for DatabaseConfig` | `config.rs:68-86` | -18 lines |
| 2 | Add `#[derive(Default)]` removal note — `DatabaseConfig` MUST come from `to_database_config()` | `config.rs` | Comment |
| 3 | Fix `VoiceServiceEntry::default()` to match TOML (enabled=false, critical=false) | `config.rs` | 2 lines |
| 4 | Fix doc comments: "outlines-core" → "llguidance (future sprint)" | `config.rs:59,199` | 2 lines |
| 5 | Add `is_critical(&self, role: ServiceRole) -> bool` method to `PlatformBootConfig` | `config.rs` | ~15 lines |

**The `is_critical()` method** reads criticality from the PARSED TOML — not a hardcoded list:
```rust
impl PlatformBootConfig {
    pub fn is_critical(&self, role: ServiceRole, scope: DataScope) -> bool {
        match (role, scope) {
            (ServiceRole::Relational, DataScope::System) => self.services.system.relational.critical,
            (ServiceRole::Analytics, DataScope::System) => self.services.system.analytics.critical,
            (ServiceRole::Graph, DataScope::System) => self.services.system.graph.critical,
            (ServiceRole::Cache, DataScope::System) => self.services.system.cache.critical,
            (ServiceRole::Relational, DataScope::User) => self.services.user.relational.critical,
            (ServiceRole::Graph, DataScope::User) => self.services.user.graph.critical,
            (ServiceRole::Graph, DataScope::Global) => self.services.global.graph.critical,
            _ => false,
        }
    }
}
```

**Contract enforced**: `DatabaseConfig` cannot be created with wrong defaults because it has no `Default`. The only path is `to_database_config()` which reads real TOML values.

**Gate**: `cargo check -p devpulse-engine`. Any code that relied on `DatabaseConfig::default()` fails to compile — forces it through the correct path.

---

### Phase 4: xtask Config-Driven (3 files, ~30 lines changed)

**What**: Remove hardcoded counts/repos from xtask, read from config.

| # | Task | File | Change |
|---|------|------|--------|
| 1 | Replace hardcoded "all 4 embedded services" with config-derived count | `xtask/src/commands/dev.rs:164` | Read enabled service count from parsed config |
| 2 | Replace hardcoded `REPOS` const with config-driven list from `[build.repos.*]` | `xtask/src/commands/deps.rs:25-51` | Read repos from `platform_config().build.repos` |
| 3 | Delete dead `onnxruntime` field from `BuildDepsConfig` | `xtask/src/workspace.rs:250` | Delete field + remove from apply_env |
| 4 | Fix Python comment: "pyo3/outlines-core" → "pyo3 (llguidance if needed)" | `xtask/src/workspace.rs:246` | 1 line |

**Contract enforced**: xtask's service count comes from the same config that boot reads. If you add a service to TOML, xtask banner updates automatically.

**Gate**: `cargo check -p xtask`. `cargo xtask run-dev` banner shows accurate count.

---

### Phase 5: Workspace Dependency Pinning (1 file, ~10 lines)

**What**: Centralize scattered deps in `[workspace.dependencies]`.

| # | Dep | Current State | Fix |
|---|-----|--------------|-----|
| 1 | `sysinfo` | 0.33 in engine + model-loader, 0.38.4 in desktop | Pin `sysinfo = "0.33"` in workspace, desktop uses `workspace = true` (0.38→0.33 is non-breaking for what we use) |
| 2 | `flume` | Only model-loader | Add `flume = "0.11"` to workspace (CLAUDE.md says flume is canonical) |
| 3 | `hf-hub` | model-loader + clyffy, different features | Add `hf-hub = "0.4"` to workspace, crate-level feature override |
| 4 | `toml` | engine + xtask | Add `toml = "0.8"` to workspace |
| 5 | `tokenizers` | model-loader + clyffy (both optional) | Already in workspace as path dep — verify both use `workspace = true` |

**Contract enforced**: Cargo workspace deps are the compiler's contract. If a crate specifies a different version, `cargo check` warns.

**Gate**: `cargo check --workspace` with no version conflict warnings.

---

### Phase 6: Boot Pipeline Cleanup (1 file, ~20 lines)

**What**: Fix boot doc comment, stage numbering, and wire validation to use the new `is_critical()`.

| # | Task | File | Change |
|---|------|------|--------|
| 1 | Rewrite boot doc to list actual 14 stages from `SERVICE_MANIFEST` | `boot/mod.rs:13-23` | ~15 lines |
| 2 | Fix duplicate "Stage 13" labels | `boot/mod.rs:294,302` | 2 lines |
| 3 | Wire `validate_critical()` to call `self.boot_config.is_critical()` | `boot/mod.rs` | Already done in Phase 2 |

**Gate**: `cargo xtask run-dev` boots clean. boot.log shows sequential stage numbers.

---

## WHAT THIS ARCHITECTURE GIVES YOU

### Adding a new service (before — 10 files):
1. platform.default.toml ✓
2. config.rs — add struct, add `impl Default`, add serde default fn
3. boot/mod.rs — add stage
4. boot/new_service.rs — boot logic
5. services/mod.rs — add module
6. services/new_service/ — implement Service trait
7. platform/mod.rs — add field, add to health(), add to shutdown()
8. platform/mod.rs — add to config() mapping
9. xtask — update counts
10. Maybe validation

### Adding a new service (after — 5 files):
1. platform.default.toml ✓
2. config.rs — add entry type (serde handles defaults from TOML)
3. boot/new_service.rs — boot logic
4. services/new_service/ — implement Service trait
5. platform/mod.rs — add field + ONE line in `active_services()`

Health, validation, shutdown, xtask banner — all automatic. The manifest enforces completeness. Config drives criticality. The compiler catches missing pieces.

---

## WHAT IS NOT IN THIS SPRINT

| Item | Why Deferred |
|------|-------------|
| Dynamic service registry (HashMap) | Over-engineering — typed fields with feature gates are correct for Rust |
| Config-driven boot stage ORDER | Explicit sequential code is clearer and safer than config-driven ordering |
| build.rs TOML validation | Nice-to-have but runtime parse already catches this |
| Process name config for zombie cleanup | These are binary names, they change once per major version |
| Layer classification config for stage.rs | Cosmetic display, not worth the plumbing |

---

## EXECUTION ORDER

```
Phase 1 (manifest)     → Phase 2 (derive health/validation)
      ~1 hour                    ~1 hour
                    ↓
Phase 3 (kill defaults) → Phase 4 (xtask config) → Phase 5 (workspace deps) → Phase 6 (boot cleanup)
      ~30 min                ~30 min                    ~15 min                    ~30 min
```

Phases 1-2 are the structural investment. Phases 3-6 are the cleanup that the new structure enables.

**Total: ~4 hours. 10 files. ~150 lines changed (net negative — we're deleting more than we're adding). Zero new features. Pure architecture.**

---

## THE CONTRACT SUMMARY

| What | Enforcement Mechanism | Drift Detection |
|------|----------------------|-----------------|
| Every ServiceRole has metadata | Exhaustive match in `meta()` — compiler error if missing | Compile time |
| Critical services are validated | `is_critical()` reads TOML — config drives validation | Boot time |
| Health checks cover all services | `active_services()` collects all — no manual list | Boot time |
| DatabaseConfig matches TOML | No `impl Default` — only path is `to_database_config()` | Compile time |
| xtask service count matches reality | Reads from parsed config — no hardcoded number | Dev time |
| Workspace deps are pinned | Cargo workspace deps — compiler warns on mismatch | Compile time |

**If you add a service and forget the manifest entry: compiler error.**
**If TOML says critical=true but you skip validation: impossible — it iterates all.**
**If config defaults drift from TOML: impossible — TOML IS the defaults.**

---

## OWNER DECISION GATES

| # | Question | Impact |
|---|----------|--------|
| 1 | `sysinfo` — pin at 0.33 (match engine) or upgrade desktop from 0.38 to 0.33? | Desktop crate may use 0.38-specific API. Need to verify. |
| 2 | Python/pyo3 config — keep `[build.deps.python]` section for future llguidance or delete? | If delete: cleaner. If keep: ready for llguidance if it needs pyo3. |
| 3 | `DataScope` — does it already exist or do we need to create it? | Affects manifest design. |

---

*The difference between patching and engineering: patches fix what's broken today. Architecture prevents what would break tomorrow.*
