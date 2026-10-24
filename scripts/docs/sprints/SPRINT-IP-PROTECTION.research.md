# Research: IP Protection Architecture — Kernel/Engine Boundary

**Date**: 2026-03-01
**Sprint**: SPRINT-IP-PROTECTION
**Status**: COMPLETE

## Question/Goal

Establish a production-grade IP protection system so DevPulse's competitive advantage (8 sub-agents, 4-layer rumination, COSTAR+, HMM context swapping, RRF fusion, CAG/RAG hybrid) is invisible in customer builds. Same quality, zero implementation leaks.

## Codebase Analysis

### What Exists (verified in code)

| Component | File | Status |
|-----------|------|--------|
| **kernel_terms.toml** | `systems/devpulse-engine/ip/kernel_terms.toml` | 47 terms, 5 categories, complete |
| **build.rs** | `systems/devpulse-engine/build.rs` | Generates `engine_vocabulary.rs` + `scanner_terms.json` |
| **ip_term!() macro** | `systems/devpulse-engine/src/ip/mod.rs` | kernel=passthrough, engine=HashMap lookup |
| **Feature gates** | `systems/devpulse-engine/Cargo.toml` + `src/lib.rs` | Mutually exclusive, `compile_error!` enforced |
| **ENGINE_VOCABULARY** | `src/ip/mod.rs` | `once_cell::Lazy<HashMap>`, `include!()` from build output |
| **dictionary_entries()** | `src/ip/mod.rs` | `#[cfg(feature = "kernel")]` only |
| **remap_text()** | `src/ip/mod.rs` | `#[cfg(feature = "kernel")]` only |
| **Signals layer** | `systems/devpulse-engine/src/signals/` | Complete (7 files), router works |
| **Maestro persistence** | `kernel/devpulse-maestro/src/cortex/persistence/` | LibSQL, DuckDB, SurrealDB adapters with ping() |
| **Tauri boundary** | `interfaces/desktop/src-tauri/Cargo.toml` | Depends on engine ONLY, never maestro |
| **CI pipeline** | `.github/workflows/ci.yml` | Rust 1.89.0, fmt + clippy + build + test + audit |

### What's Missing

| Component | Issue |
|-----------|-------|
| **platform/ module** | `lib.rs` declares `pub mod platform;` but directory is EMPTY — compilation fails |
| **ip/redaction.rs** | Not created — no detail redaction (TraceDetail::Full vs Summary) |
| **ip-scanner binary** | No `src/bin/` directory — scanner JSON generated but unused |
| **CI scanner job** | Not in `.github/workflows/ci.yml` |
| **Feature matrix CI** | Only builds with default features, never tests `--features engine` |

### Dead Code to Delete

| Path | Reason |
|------|--------|
| `systems/devpulse-engine/src/engine/` | Old facade stubs (SafeStore, PublicGuardian, PublicDiary, DecisionResult). NOT in module tree — `lib.rs` doesn't declare `mod engine`. |
| `systems/devpulse-engine/src/hyde/` | Stub. NOT in module tree. |

### Kernel Terms in Maestro (CORRECT — kernel uses raw terms)

Maestro IS the kernel layer. These are legitimate internal usage:
- `MinionRole::Guardian`, `MinionRole::Diary` in `cortex/minions/types.rs`
- `"Maestro Observer"` default persona name in `types.rs`
- `CortexWiring` struct in `config/wiring.rs`
- `HMM` references in `cortex/reasoning/hmm.rs` and `cortex/persistence/surreal.rs`
- `SurrealNamespace::REASONING` with `namespace: "maestro"` in `persistence/config.rs`

These are fine. The IP boundary is at the ENGINE, not within maestro. Maestro types that cross into engine get wrapped by the facade, and the facade uses `ip_term!()`.

## External Research: Six Improvements

### 1. `once_cell::Lazy` → `std::sync::LazyLock`

**Decision: ADOPT**

`LazyLock` stabilized in Rust 1.80 (July 2024). CI uses 1.89.0.
- Drop-in replacement: `Lazy::new` → `LazyLock::new`
- Removes `once_cell` dependency entirely
- `once_cell` author (matklad) recommends std now

```rust
// Before
use once_cell::sync::Lazy;
static VOCAB: Lazy<HashMap<...>> = Lazy::new(|| { ... });

// After
use std::sync::LazyLock;
static VOCAB: LazyLock<HashMap<...>> = LazyLock::new(|| { ... });
```

### 2. Enum with `#[cfg]`-gated `as_str()` vs String HashMap

**Decision: KEEP HashMap, with a critical fix**

The enum approach is theoretically superior (type-safe, zero-cost, kernel strings absent from engine binary). BUT:

**Why HashMap wins for THIS project:**
1. **47 terms with spaces and special chars** — `"Context-Augmented Generation"`, `"provider-specific frame"`, `"<50ms"` don't map cleanly to Rust enum variants
2. **build.rs would need to generate valid Rust identifiers** from arbitrary TOML strings — fragile mapping layer
3. **Dynamic usage** — maestro produces strings at runtime (log messages, error contexts). The facade wraps these with `ip_term!(runtime_string)`. An enum can't accept runtime strings.
4. **The TOML SSOT is the user's chosen interface** — adding an enum indirection layer contradicts "add a row to TOML, done"

**The critical fix:** The current HashMap leaks both kernel AND engine strings into the engine binary. Fix:

```rust
// In engine builds: HashMap only contains kernel→engine mappings
// In kernel builds: macro is passthrough, HashMap is ONLY for dev tool

// CURRENT (broken): ENGINE_VOCABULARY exists unconditionally
pub static ENGINE_VOCABULARY: Lazy<HashMap<...>> = ...;

// FIXED: feature-gate the static
#[cfg(feature = "engine")]
pub static ENGINE_VOCABULARY: LazyLock<HashMap<...>> = ...;

// For kernel dev tool, use a separate function
#[cfg(feature = "kernel")]
pub fn dev_tool_vocabulary() -> HashMap<&'static str, &'static str> {
    include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs"))
}
```

This means:
- **Engine binary**: contains HashMap with kernel→engine pairs (kernel strings ARE present as keys, but this is inherent to runtime lookup — a `strings` dump shows them)
- **Kernel binary**: HashMap only loaded on-demand for dev tool, not statically linked

**Binary strings mitigation**: For the engine binary, the kernel strings exist as HashMap keys. This is unavoidable with runtime lookup. To mitigate:
- The CI scanner catches leaks in source code
- The `strings` on the binary shows the dictionary, but without context (it's just a flat list of words)
- If binary inspection is a real threat model, use the enum approach in a future phase
- For now, the HashMap approach is pragmatic and matches the TOML SSOT workflow

### 3. Scanner: `syn` AST Visitor vs `walkdir` + regex

**Decision: Use `syn` for the binary, but DEFER scanner to a later sprint**

The scanner is important but not blocking. The compile-time macro is the primary defense. Scanner is defense-in-depth.

**Why defer:**
- No `ip_term!()` calls exist yet — nothing to scan
- The facade isn't built yet — no engine-facing code to leak
- Building a proper `syn`-based scanner is a focused task (200+ lines) that deserves its own sprint

**When to build it:**
- After the facade is complete and `ip_term!()` is actually being used
- Before the first `--features engine` release build

### 4. Scanner Terms Location

**Decision: Embed in scanner binary via its own build.rs**

The scanner binary's `build.rs` reads `kernel_terms.toml` directly. Terms are baked into the binary at compile time. No runtime file discovery.

Current `scanner_terms.json` generation in engine's `build.rs` → **KEEP** for potential future use (other tools, CI scripts), but the primary scanner doesn't depend on it.

### 5. Feature Gate Pattern

**Decision: `compile_error!` now, workspace separation later**

Current approach is standard Rust. The `compile_error!` mutual exclusion is used by `ring`, `rustls`, and embedded crates. It's correct.

**Future consideration:** Cargo feature unification can accidentally enable both features if a transitive dep pulls one in. In a workspace, if crate A depends on engine with `kernel` and crate B depends on engine with `engine`, Cargo merges features → both active → `compile_error!` fires → build fails. This is actually the DESIRED behavior — it catches the mistake. No action needed.

### 6. Workspace Separation (Physical IP Boundary)

**Decision: DEFER — current design is sufficient**

True workspace separation (kernel in a separate crate with trait boundary) is stronger but adds complexity. Current facade pattern with feature gates is adequate for:
- The kernel crate is already separate (`kernel/devpulse-maestro`)
- Tauri already can't import it directly (not in its Cargo.toml)
- The engine crate wraps maestro behind public types

If the threat model escalates (e.g., open-sourcing the engine), revisit.

## Findings

### Architecture Flow (Correct)

```
kernel_terms.toml (SSOT)
    │
    ├──→ build.rs → engine_vocabulary.rs (HashMap code)
    │                    │
    │                    └──→ ip/mod.rs → ENGINE_VOCABULARY static
    │                                         │
    │                                         ├── kernel build: passthrough macro
    │                                         └── engine build: HashMap lookup macro
    │
    ├──→ build.rs → scanner_terms.json (for CI, deferred)
    │
    └──→ Dev tool reads TOML directly (kernel builds only)
```

### Boundary Crossing Pattern

```
Maestro (kernel)                    Engine (facade)                     Tauri (public)
─────────────────                   ─────────────────                   ──────────────
MinionRole::Guardian    →    ip_term!("GUARDIAN")            →    "Quality Check"
CortexWiring            →    PlatformConfig (engine type)    →    JSON to frontend
PersistenceLayer        →    Platform (facade struct)        →    SystemHealth
hmm::State              →    ip_term!("HMM")                →    "context switching"
```

Key: Maestro types NEVER cross into Tauri. Engine defines its own public types that wrap maestro internals.

### What Blocks Compilation Right Now

1. `src/lib.rs` declares `pub mod platform;` but no `platform/mod.rs` exists
2. That's it — everything else compiles (with `--features kernel` default)

## Recommendations

### Execution Order

1. **Delete dead code** — `engine/` stubs, `hyde/` stub
2. **Fix ip/mod.rs** — `LazyLock`, feature-gate the static properly
3. **Create platform/mod.rs** — minimal stub to unblock compilation
4. **Build platform facade** — the real types (SystemHealth, InitEvent, PlatformConfig)
5. **Wire facade to maestro** — Platform::boot() initializes PersistenceLayer
6. **Add redaction module** — `ip/redaction.rs` with TraceDetail
7. **Wire Tauri** — AppState, setup() hook, real IPC commands
8. **CI: Feature matrix** — build both kernel and engine in CI
9. **CI: IP scanner** — `syn`-based binary (separate sprint)

### Critical Files to Create

| File | Purpose |
|------|---------|
| `systems/devpulse-engine/src/platform/mod.rs` | Platform facade struct |
| `systems/devpulse-engine/src/platform/health.rs` | SystemHealth, SubsystemHealth types |
| `systems/devpulse-engine/src/platform/init.rs` | InitEvent, InitStep types |
| `systems/devpulse-engine/src/platform/config.rs` | PlatformConfig (public settings API) |
| `systems/devpulse-engine/src/ip/redaction.rs` | TraceDetail redaction |

### Critical Files to Modify

| File | Change |
|------|--------|
| `systems/devpulse-engine/src/ip/mod.rs` | `LazyLock`, feature-gate static, add `mod redaction` |
| `systems/devpulse-engine/Cargo.toml` | Remove `once_cell` dep |
| `.github/workflows/ci.yml` | Add `cargo check --features engine` step |

### Critical Files to Delete

| File | Reason |
|------|--------|
| `systems/devpulse-engine/src/engine/` (entire dir) | Dead stubs, not in module tree |
| `systems/devpulse-engine/src/hyde/` (entire dir) | Dead stub, not in module tree |

## Files Referenced

- `systems/devpulse-engine/ip/kernel_terms.toml`: SSOT dictionary, 47 terms, 5 categories
- `systems/devpulse-engine/build.rs`: Generates HashMap code + scanner JSON
- `systems/devpulse-engine/src/ip/mod.rs`: ip_term!() macro, ENGINE_VOCABULARY, dev tool helpers
- `systems/devpulse-engine/src/lib.rs`: Feature gates, module declarations
- `systems/devpulse-engine/Cargo.toml`: Features, deps, build-deps
- `systems/devpulse-engine/src/engine/`: Dead stubs (not in module tree)
- `systems/devpulse-engine/src/hyde/`: Dead stub (not in module tree)
- `kernel/devpulse-maestro/src/cortex/minions/types.rs`: MinionRole enum (legitimate kernel terms)
- `kernel/devpulse-maestro/src/cortex/persistence/config.rs`: SurrealNamespace (kernel term "maestro")
- `kernel/devpulse-maestro/src/cortex/persistence/mod.rs`: PersistenceLayer with granular init + ping
- `interfaces/desktop/src-tauri/Cargo.toml`: Depends on engine only (boundary enforced)
- `interfaces/desktop/src-tauri/src/lib.rs`: IPC commands (stubs), no setup() hook
- `.github/workflows/ci.yml`: Rust 1.89.0, no feature matrix, no IP scanning
- `Cargo.toml` (workspace): once_cell not in workspace deps (only in engine)
