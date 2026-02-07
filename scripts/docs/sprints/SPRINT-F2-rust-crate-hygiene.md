# SPRINT F2: Rust Crate Hygiene

> **Status**: READY FOR REVIEW
> **Scope**: All Rust crates (`xtask/`, `systems/devpulse-engine/`, `kernel/devpulse-maestro/`, `interfaces/desktop/src-tauri/`)
> **Depends On**: SPRINT-F1 (foundation infrastructure)
> **Tasks**: 29 tasks across 5 phases
> **Compact Checkpoint**: After Phase 3 (task 19)

---

## Goal

Fix all 104 clippy errors and 1 security advisory blocking `git push origin main:main`. Every fix is mechanical — no architecture changes, no new features, no refactors. After this sprint, `cargo clippy --workspace -- -D warnings` and `cargo deny check advisories` both pass clean.

---

## Current State (Audit: 2026-02-04)

### Security Advisory
- **RUSTSEC-2026-0007**: Integer overflow in `BytesMut::reserve` (bytes v1.11.0)
- **Status**: ALREADY FIXED — `cargo update -p bytes` applied (1.11.0 → 1.11.1)
- **Verification needed**: `cargo deny check advisories` must pass

### Clippy Errors by Crate

| Crate | Errors | Categories |
|-------|--------|------------|
| `xtask` | 1 | doc_markdown |
| `devpulse_desktop_backend` (build.rs) | 2 | semicolon_if_nothing_returned, missing_docs |
| `devpulse-engine` | 22 | doc_markdown (8), missing_panics_doc (2), cast_possible_truncation (2), unwrap_used (2), wildcard_imports (1), missing_docs (7) |
| `devpulse-maestro` | 79 | doc_markdown (~40), missing_errors_doc (6), needless_raw_string_hashes (3), redundant_closure (1), inefficient_to_string (2), missing_docs (~27) |
| **Total** | **104** | |

---

## Phase 1: xtask + desktop backend (3 errors)

### Task 1.1 — xtask: backtick `DevPulse` in crate doc
**File**: `xtask/src/main.rs:1`
**Error**: `doc_markdown` — `DevPulse` needs backticks
**Fix**:
```rust
// Before:
//! DevPulse task runner for development orchestration.
// After:
//! `DevPulse` task runner for development orchestration.
```

### Task 1.2 — build.rs: add trailing semicolon
**File**: `interfaces/desktop/src-tauri/build.rs:2`
**Error**: `semicolon_if_nothing_returned`
**Fix**:
```rust
// Before:
fn main() {
    tauri_build::build()
}
// After:
fn main() {
    tauri_build::build();
}
```

### Task 1.3 — build.rs: add crate doc
**File**: `interfaces/desktop/src-tauri/build.rs`
**Error**: `missing_docs`
**Fix**: Add `//! Tauri build script for desktop backend.` at top

**Verify**: `cargo clippy -p xtask -p devpulse_desktop_backend -- -D warnings` passes

---

## Phase 2: devpulse-engine (22 errors)

### Task 2.1 — lib.rs: add crate doc
**File**: `systems/devpulse-engine/src/lib.rs`
**Error**: `missing_docs` on crate
**Fix**: Add `//! `DevPulse` signal engine — broadcast routing and typed payloads.`

### Task 2.2 — header.rs: fix doc backticks
**File**: `systems/devpulse-engine/src/signals/header.rs:26`
**Error**: `doc_markdown` — `correlation_id` needs backticks
**Fix**: `` /// - Tracing: Follow any output back to its input via `correlation_id` ``

### Task 2.3 — header.rs: fix `unwrap()` + truncation in `new()`
**File**: `systems/devpulse-engine/src/signals/header.rs:44-51`
**Errors**: `unwrap_used`, `cast_possible_truncation`, `missing_panics_doc`
**Fix**: Replace `.unwrap().as_millis() as u64` with safe timestamp helper:
```rust
/// Returns current epoch milliseconds.
///
/// Uses `u64::try_from` to avoid truncation. Falls back to `u64::MAX`
/// if the timestamp exceeds u64 range (year ~584 million).
fn epoch_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .try_into()
        .unwrap_or(u64::MAX)
}
```
Use in both `new()` and `child_of()`.

### Task 2.4 — header.rs: fix `unwrap()` + truncation in `child_of()`
**File**: `systems/devpulse-engine/src/signals/header.rs:57-64`
**Errors**: `unwrap_used`, `cast_possible_truncation`, `missing_panics_doc`
**Fix**: Use same `epoch_millis()` helper from Task 2.3

### Task 2.5 — kinds.rs: backtick `DuckDB`
**File**: `systems/devpulse-engine/src/signals/kinds.rs:20`
**Error**: `doc_markdown`
**Fix**: `` /// Analytics pipeline (`DuckDB`) ``

### Task 2.6 — payloads.rs: fix all doc backticks
**File**: `systems/devpulse-engine/src/signals/payloads.rs`
**Errors**: `doc_markdown` (4 instances)
**Fix**:
- Line 1: `` `SignalVariant` ``
- Line 43: `` `page_view` ``, `` `feature_used` ``
- Line 79: `` `duration_ms` ``

### Task 2.7 — payloads.rs: add docs to `ChatRole` variants
**File**: `systems/devpulse-engine/src/signals/payloads.rs:30-32`
**Errors**: `missing_docs` (3 variants)
**Fix**:
```rust
/// Human user message.
User,
/// AI assistant response.
Assistant,
/// System instruction or context.
System,
```

### Task 2.8 — router.rs: fix doc backticks
**File**: `systems/devpulse-engine/src/signals/router.rs:1,3`
**Errors**: `doc_markdown` (2 instances)
**Fix**:
- Line 1: `` `SignalRouter` ``
- Line 3: `` `tokio::broadcast` ``

### Task 2.9 — signal.rs: fix doc backticks
**File**: `systems/devpulse-engine/src/signals/signal.rs:3,68`
**Errors**: `doc_markdown` (2 instances)
**Fix**:
- Line 3: `` `SignalHeader` ``
- Line 68: `` `correlation_id` ``

### Task 2.10 — variants.rs: fix doc backtick + wildcard import
**File**: `systems/devpulse-engine/src/signals/variants.rs:1,9`
**Errors**: `doc_markdown`, `wildcard_imports`
**Fix**:
- Line 1: `` `SignalVariant` ``
- Line 9: Replace `use super::payloads::*` with explicit:
  ```rust
  use super::payloads::{ChatPayload, AnalyticsPayload, ContextPayload, InferencePayload, SystemPayload};
  ```

**Verify**: `cargo clippy -p devpulse-engine -- -D warnings` passes

---

## Phase 3: devpulse-maestro — doc_markdown + missing_errors_doc (46 errors)

### Task 3.1 — persistence/mod.rs: fix backticks (4) + missing `# Errors` (1)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/mod.rs`
**Errors**: `doc_markdown` (lines 4, 5, 6, 8, 73, 78, 83), `missing_errors_doc` (line 51)
**Fix**:
- Backtick: `LibSQL`, `DuckDB`, `SurrealDB`, `PersistenceAdapter`
- Add `# Errors` section to `init()`:
  ```rust
  /// # Errors
  /// Returns error if any database adapter fails to initialize its schema.
  ```

### Task 3.2 — persistence/config.rs: fix backticks (7) + missing `# Errors` (1)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/config.rs`
**Errors**: `doc_markdown` (lines 3, 11, 13, 15, 42, 82, 97), `missing_errors_doc` (line 67)
**Fix**:
- Backtick: `StoreKind`, `LibSQL`, `DuckDB`, `SurrealDB`, `app_root`, `SurrealDB` (x2)
- Add `# Errors` to `ensure_dirs()`:
  ```rust
  /// # Errors
  /// Returns error if directory creation fails.
  ```

### Task 3.3 — persistence/config.rs: add missing docs (6)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/config.rs`
**Errors**: `missing_docs` (lines 85, 86, 101-104)
**Fix**:
```rust
/// Namespace name.
pub namespace: &'static str,
/// Database name within namespace.
pub database: &'static str,
```
```rust
/// Table name for reasoning graph nodes.
pub const NODES: &'static str = "reasoning:nodes";
/// Table name for reasoning graph edges.
pub const EDGES: &'static str = "reasoning:edges";
/// Table name for reasoning graph states.
pub const STATES: &'static str = "reasoning:states";
/// Table name for reasoning graph state transitions.
pub const TRANSITIONS: &'static str = "reasoning:transitions";
```

### Task 3.4 — persistence/traits.rs: fix backticks (4)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/traits.rs`
**Errors**: `doc_markdown` (lines 47 x2, 60, 87)
**Fix**: Backtick `LibSQL`, `DuckDB`, `SurrealDB`

### Task 3.5 — persistence/duckdb.rs: fix backticks (4) + `# Errors` (2) + raw string (1) + redundant closure (1)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs`
**Errors**: `doc_markdown` (lines 1, 12, 50, 194), `missing_errors_doc` (lines 19, 38), `needless_raw_string_hashes` (line 195), `redundant_closure_for_method_calls` (line 162)
**Fix**:
- Backtick all `DuckDB` references
- Add `# Errors` to `open()` and `open_in_memory()`
- Change `r#"..."#` → `r"..."`
- Change `|k| k.as_str()` → `std::string::String::as_str`

### Task 3.6 — persistence/libsql.rs: fix backticks (3) + `# Errors` (1) + raw string (1) + inefficient_to_string (2)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs`
**Errors**: `doc_markdown` (lines 1, 12, 168), `missing_errors_doc` (line 21), `needless_raw_string_hashes` (line 170), `inefficient_to_string` (lines 121, 149)
**Fix**:
- Backtick all `LibSQL` references
- Add `# Errors` to `open()`
- Change `r#"..."#` → `r"..."`
- Change `s.to_string()` → `(*s).to_string()` on both lines

### Task 3.7 — persistence/surreal.rs: fix backticks (3) + `# Errors` (2) + raw string (1)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs`
**Errors**: `doc_markdown` (lines 1, 18, 24), `missing_errors_doc` (lines 25, 52), `needless_raw_string_hashes` (line 274)
**Fix**:
- Backtick `SurrealDB`, `RocksDB`
- Add `# Errors` to `open()` and `open_in_memory()`
- Change `r#"..."#` → `r"..."`

**COMPACT CHECKPOINT** — Verify `cargo clippy -p devpulse-maestro -- -D warnings` error count drops from 79 to ~33 (only missing_docs remain)

---

## Phase 4: devpulse-maestro — missing_docs (27 errors)

### Task 4.1 — lib.rs: add crate doc + struct doc + fn doc
**File**: `kernel/devpulse-maestro/src/lib.rs`
**Errors**: `missing_docs` (lines 1, 4, 9)
**Fix**:
```rust
//! `DevPulse` Maestro — AI orchestrator kernel.

pub mod cortex;

/// Top-level orchestrator facade.
#[derive(Default)]
pub struct Cortex {}

impl Cortex {
    /// Create a new orchestrator instance.
    pub fn new() -> Self {
        Self::default()
    }
}
```

### Task 4.2 — cortex/mod.rs: add module + struct + fn docs
**File**: `kernel/devpulse-maestro/src/cortex/mod.rs`
**Errors**: `missing_docs` (lines 1, 2, 4, 7, 12)
**Fix**:
```rust
/// KV cache tier for attention optimization.
pub mod kv_cache;
/// Minion task workers.
pub mod minions;
/// Persistence adapters (databases).
pub mod persistence;
/// Reasoning pipeline (chains, HMM).
pub mod reasoning;
```
Add doc to struct and fn.

### Task 4.3 — cortex/kv_cache/mod.rs: add module docs
**File**: `kernel/devpulse-maestro/src/cortex/kv_cache/mod.rs`
**Errors**: `missing_docs` (lines 1, 2)
**Fix**:
```rust
/// Attention sink strategy for KV eviction.
pub mod attention_sink;
/// Sliding window strategy for KV eviction.
pub mod sliding_window;
```

### Task 4.4 — cortex/minions/mod.rs: add module docs
**File**: `kernel/devpulse-maestro/src/cortex/minions/mod.rs`
**Errors**: `missing_docs` (lines 1, 2, 3, 5)
**Fix**:
```rust
/// Diary minion — persistent memory journal.
pub mod diary;
/// Factory — minion creation and lifecycle.
pub mod factory;
/// Guardian minion — safety and policy enforcement.
pub mod guardian;
/// Core minion types and traits.
#[allow(clippy::module_inception)]
pub mod minions;
```

### Task 4.5 — cortex/minions/diary/mod.rs: add module doc
**File**: `kernel/devpulse-maestro/src/cortex/minions/diary/mod.rs`
**Errors**: `missing_docs` (line 2)
**Fix**: `/// Diary implementation.`

### Task 4.6 — cortex/minions/guardian/mod.rs: add module doc
**File**: `kernel/devpulse-maestro/src/cortex/minions/guardian/mod.rs`
**Errors**: `missing_docs` (line 3)
**Fix**: `/// Guardian implementation.`

### Task 4.7 — cortex/reasoning/mod.rs: add module docs
**File**: `kernel/devpulse-maestro/src/cortex/reasoning/mod.rs`
**Errors**: `missing_docs` (lines 1, 2)
**Fix**:
```rust
/// Chain-of-thought reasoning pipeline.
pub mod chains;
/// Hidden Markov Model for state inference.
pub mod hmm;
```

### Task 4.8 — persistence/surreal.rs: add field docs (13 fields)
**File**: `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs`
**Errors**: `missing_docs` (lines 248-270)
**Fix**: Add doc comments to all fields on `KnowledgeNode`, `HmmState`, `Transition` structs.

**Verify**: `cargo clippy -p devpulse-maestro -- -D warnings` passes

---

## Phase 5: Full workspace verification

### Task 5.1 — Run full workspace clippy
```bash
cargo clippy --workspace -- -D warnings
```
**Expected**: 0 errors

### Task 5.2 — Run cargo deny
```bash
cargo deny check advisories
```
**Expected**: `advisories ok`

### Task 5.3 — Run cargo check
```bash
cargo check --workspace
```
**Expected**: Compiles clean

---

## File Inventory

### Modified Files (15)

```
xtask/src/main.rs                                          — 1 fix (backtick)
interfaces/desktop/src-tauri/build.rs                      — 2 fixes (semicolon + crate doc)
systems/devpulse-engine/src/lib.rs                         — 1 fix (crate doc)
systems/devpulse-engine/src/signals/header.rs              — 7 fixes (backtick, unwrap, truncation, panics doc)
systems/devpulse-engine/src/signals/kinds.rs               — 1 fix (backtick)
systems/devpulse-engine/src/signals/payloads.rs            — 7 fixes (backticks + variant docs)
systems/devpulse-engine/src/signals/router.rs              — 2 fixes (backticks)
systems/devpulse-engine/src/signals/signal.rs              — 2 fixes (backticks)
systems/devpulse-engine/src/signals/variants.rs            — 2 fixes (backtick + wildcard import)
kernel/devpulse-maestro/src/lib.rs                         — 3 fixes (crate doc + struct + fn)
kernel/devpulse-maestro/src/cortex/mod.rs                  — 7 fixes (module + struct + fn docs)
kernel/devpulse-maestro/src/cortex/kv_cache/mod.rs         — 2 fixes (module docs)
kernel/devpulse-maestro/src/cortex/minions/mod.rs          — 4 fixes (module docs)
kernel/devpulse-maestro/src/cortex/minions/diary/mod.rs    — 1 fix (module doc)
kernel/devpulse-maestro/src/cortex/minions/guardian/mod.rs — 1 fix (module doc)
kernel/devpulse-maestro/src/cortex/reasoning/mod.rs        — 2 fixes (module docs)
kernel/devpulse-maestro/src/cortex/persistence/mod.rs      — 8 fixes (backticks + errors doc)
kernel/devpulse-maestro/src/cortex/persistence/config.rs   — 14 fixes (backticks + errors doc + field docs + const docs)
kernel/devpulse-maestro/src/cortex/persistence/traits.rs   — 4 fixes (backticks)
kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs   — 8 fixes (backticks + errors + raw string + closure)
kernel/devpulse-maestro/src/cortex/persistence/libsql.rs   — 7 fixes (backticks + errors + raw string + to_string)
kernel/devpulse-maestro/src/cortex/persistence/surreal.rs  — 19 fixes (backticks + errors + raw string + field docs)
```

### New Files (0)
### Deleted Files (0)
### Already Applied (1)
```
Cargo.lock — bytes 1.11.0 → 1.11.1 (already done)
```

---

## Backlog Items (NOT this sprint)

These emerged from the current conversation and need their own sprints. Tracked here for visibility — they are architectural, not hygiene.

### BACKLOG-1: Recipe Architecture — Contract-Driven CSS
**Problem**: Recipes currently output raw Tailwind `cn()` utility strings. The original design vision is schema/contract-driven CSS generation where TypeScript contracts enforce CSS output, and Tailwind + custom CSS coexist seamlessly (like Ark UI, Park UI pattern).
**Impact**: Current approach locks the design system to Tailwind. If Tailwind is dropped, every recipe breaks.
**Action**: Design the contract → CSS generation pipeline. The `registerRecipe()` registry shape is fine — the output format needs to evolve from Tailwind strings to framework-agnostic CSS (data-* selectors, CSS custom properties, etc.).
**Scope**: Recipe `classes()` functions, possibly recipe types, blueprint output format.

### BACKLOG-2: Lefthook Structural Enforcement
**Problem**: Lefthook has zero enforcement for the recipe/blueprint folder pattern. Nothing validates that each kind folder has `types.ts + index.ts + {kind}.default.ts`, that no empty folders exist, or that no flat files leak to root.
**Action**: Add a lefthook pre-commit script that validates folder structure invariants.
**Scope**: `lefthook.yml`, new validation script.

### BACKLOG-3: ARIA Ownership + Keyboard Controls
**Problem**: Components should own their ARIA directly (not delegate via dsAdapter). Need keyboard controls, global shortcuts, user-remappable keybindings.
**Action**: Design keyboard control system — component-level + global + user remapping.
**Scope**: Primitive components, global keyboard handler, settings system.

### BACKLOG-4: Schema Registry
**Problem**: The design system was intended to be schema-registry driven from the start. The current implementation doesn't fully realize this.
**Action**: Audit current registry vs the original schema-driven vision. Identify gaps.
**Scope**: Recipe registry, blueprint registry, contract definitions.

---

## Execution Rules

1. Read every file before editing it
2. Fix one file at a time, verify compiles before moving to next
3. Compact checkpoint after Phase 3
4. No architecture changes — this sprint is mechanical hygiene only
5. No new features, no refactors, no "improvements"
6. If a fix is ambiguous, stop and ask
