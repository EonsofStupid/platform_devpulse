# Exemplar Anatomy — `kernel/devpulse-clyffy/`

> This is the canonical reference for "well-organized crate / subsystem" on
> the DevPulse platform. ALL extracted subsystems must conform to this
> shape unless a documented deviation is signed off by the user.

## Why this specific crate

- Carries SENSITIVE IP per CLAUDE.md kernel marker — strict discipline applied
- Was reauthored under the senior-dev pre-release constraint (no shims, no backcompat)
- Combines multi-backend features (Burn CPU/CUDA/wgpu, Candle, llama.cpp FFI) cleanly via feature gates
- Top-level structure has stayed stable across the GB10 pivot

## Shape

```
kernel/devpulse-clyffy/
├── Cargo.toml                  # crate manifest (NO bin entry — lib only)
├── src/
│   ├── lib.rs                  # public surface; module declarations + re-exports
│   ├── config/                 # SSOT-shaped configuration (TOML loaders, slot defs)
│   ├── cortex/                 # the brain (reasoning, persistence, intelligence)
│   └── interactions/           # IO surfaces (templates, dispatcher, routing)
```

The three top-level modules form the **anatomy invariant**:

| Module | Purpose | Pattern |
|---|---|---|
| `config/` | Read-side. Loads SSOT TOML, exposes typed config structs. NO runtime state. | Pure-fn loaders, `#[serde]` types, embedded-default + override pattern |
| `cortex/` | The "brain" — domain logic, persistence, intelligence | Layered submodules (e.g. `cortex/persistence/surreal/intelligence.rs`); each layer owned end-to-end |
| `interactions/` | IO with the outside world — templates, routing, MCP verbs | Verb-shaped (`dispatch`, `route`, `template`); no domain logic embedded |

## Cargo.toml discipline

Read [kernel/devpulse-clyffy/Cargo.toml](kernel/devpulse-clyffy/Cargo.toml) to absorb these patterns:

### Feature flag hierarchy

Features form a TREE rooted at `default = []`:

```toml
[features]
default = []
# Authorship target — pick ONE backend per build
burn-cpu = ["dep:burn", "burn/flex", "dep:arc-swap", ...]
burn-cuda = ["dep:burn", "burn/cuda", "dep:arc-swap", ...]
burn-wgpu = ["dep:burn", "burn/wgpu", "dep:arc-swap", ...]
# Consumer aliases — backends route through here
model-loader = ["dep:model-loader", "model-loader/specta", ...]
model-loader-cuda = ["model-loader", "model-loader/cuda"]
# Tauri IPC — orthogonal axis
specta = ["dep:specta"]
```

Rules every extracted crate must honor:

1. `default = []` — never opinionated; consumer composes
2. Feature names mirror what they DO (`burn-cpu`, `specta`, `guardian`) — never `feature1`, `enable-x`, `with-y`
3. Mutually-exclusive backends ALL listed (no "the obvious one is default")
4. Optional deps marked `optional = true` + feature-gated as `dep:<crate>`
5. Sub-feature chaining one level deep (Cargo limit) — go through an alias if you need two

### Dependency ordering

Within `[dependencies]`:

1. Workspace inheritance first (`= { workspace = true }`)
2. Direct version pins second
3. Optional / feature-gated last
4. Comment blocks explain WHY a non-obvious dep is included (see lines 84–94 around `rkyv`, lines 109–129 around `arc-swap`/`static_assertions`/`safetensors` justifying their gates)

### `[lints]` block

```toml
[lints]
workspace = true
```

Inherit from workspace. Never override locally unless documented with reason. Workspace `clippy.toml` is the SSOT.

## Source file discipline

### `lib.rs` shape

```rust
//! Crate-level docstring. WHAT this crate does in one paragraph,
//! WHY the structure exists, links to anchor docs.

#![warn(missing_docs)]

pub mod config;
pub mod cortex;
pub mod interactions;

// Optional thin re-exports for the most-used types
pub use cortex::CortexHandle;
pub use interactions::Dispatcher;
```

Rules:

- Crate docstring is mandatory
- `pub mod` declarations only — NO logic in `lib.rs`
- Re-exports limited to types consumers reach for daily — never re-export everything
- `#![warn(missing_docs)]` mandatory (workspace already deny-checks `unsafe_code`)

### Module organization

Every module folder has a `mod.rs` (or 2024-edition equivalent) with:

```rust
//! Module-level docstring — what this module owns + invariants.

pub mod submodule_a;
pub mod submodule_b;

// re-exports
pub use submodule_a::PublicType;
```

Rules:

- Module docstring states the boundary
- Submodules are `pub mod` UNLESS the type system needs them sealed
- Internal-only helpers go in `pub(crate) mod`
- File depth ≤ 4 — if you need deeper, split into a new module

### File size band

| LOC | Disposition |
|---|---|
| < 200 | ideal |
| 200–500 | acceptable |
| 500–800 | review for split |
| > 800 | hard violation — must be split before extract |

Exception: a `mod.rs` re-exporting many submodules can exceed if it's purely glue.

## Doc citations within code

Code comments cite design docs for non-obvious invariants:

```rust
// HOT_UPDATE_PATTERN.md §4.1, H1 — encoder hot-update via ArcSwap.
let encoder = ArcSwap::from(Arc::new(initial_burn_embedder));
```

Rules:

- Cite the file + section for any invariant the reader can't infer from types alone
- NEVER comment "what" the code does (well-named identifiers do that — per CLAUDE.md "Don't add comments")
- Always cite WHY, never WHAT

## What NOT to copy from this exemplar

The exemplar has historical artifacts that are NOT canonical:

- The `setup-wizard` tree under `kernel/model-loader/src/wizard/` is "soon-to-be-deleted" per workspace Cargo.toml comment lines 184–193. Do NOT use as a template.
- `[patch.crates-io]` entries are global workspace concerns, not per-crate (won't survive extraction)
- `LLAMA_CPP_PREBUILT_LIB_DIR` env handling is being retired under the GB10 pivot per [[devpulse-data-collector-gb10-inference]]

## Conformance scoring (used by fork-survey manifest)

A folder's `exemplar_conformance_score` (0.0–1.0) is computed as:

| Component | Weight |
|---|---|
| Has 3-module anatomy (config/domain/interactions equivalent) | 0.25 |
| Cargo.toml feature flag discipline matches above | 0.20 |
| lib.rs is pure declarations + re-exports | 0.15 |
| `#![warn(missing_docs)]` present | 0.10 |
| No files > 800 LOC | 0.10 |
| `[lints] workspace = true` | 0.05 |
| No hardcoded constants in lib files (all from config SSOT) | 0.10 |
| No stub / TODO markers | 0.05 |

A score < 0.80 surfaces as a drift indicator and the folder gets a fix-first phase before move.
