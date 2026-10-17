# Sprint: Orchestrator Build Fixes

**Status**: IN PROGRESS
**Created**: 2026-01-11
**Goal**: Fix all 42 compilation errors to establish clean foundation (no shims/legacy)

---

## Summary of Issues

The orchestrator has module path inconsistencies after a reorganization. The code references old paths that no longer exist. This sprint establishes the correct canonical module structure.

---

## Checklist

### 1. Missing Files

- [ ] **E0583**: Remove `pub mod facade;` from `infra/core/mod.rs:7` (file doesn't exist, not needed)

### 2. Missing Crate Dependencies

- [ ] **E0433**: Add `serde_yaml` to `Cargo.toml` (used in `persistence/global.rs:156` and `persistence/project.rs:138,170`)

### 3. Fix Module Re-exports in `infra/mod.rs`

Current `infra/mod.rs` has broken re-exports:
```rust
pub use core::registry::Infra;           // Infra doesn't exist in registry.rs
pub use persistence::bus::{EventBus, InfraSignal};  // InfraSignal doesn't exist in bus.rs
```

- [ ] **E0432**: Remove `pub use core::registry::Infra;` from `infra/mod.rs:10` (no `Infra` struct exists)
- [ ] **E0432**: Remove `InfraSignal` from re-export in `infra/mod.rs:12` (not in bus.rs anymore)

### 4. Fix `chat/mod.rs` Imports (lines 20-27)

Current imports reference non-existent paths:
```rust
use crate::infra::duckdb::Analytics;     // should be persistence::analytics
use crate::infra::embedder::EmbedderBackend;  // should be embedding::embedder
use crate::infra::libsql::Database;      // should be persistence::sql
use crate::infra::models::ModelPaths;    // should be catalog::models
use crate::infra::rro::VectorStore;      // should be persistence::vector
use crate::infra::reranker::RerankerBackend; // should be embedding::reranker
use crate::infra::Infra;                 // doesn't exist - remove
```

- [ ] **E0432**: Fix `duckdb::Analytics` -> `persistence::analytics::Analytics`
- [ ] **E0432**: Fix `embedder::EmbedderBackend` -> `embedding::embedder::EmbedderBackend`
- [ ] **E0432**: Fix `libsql::Database` -> `persistence::sql::Database`
- [ ] **E0432**: Fix `models::ModelPaths` -> `catalog::models::ModelPaths`
- [ ] **E0432**: Fix `rro::VectorStore` -> `persistence::vector::VectorStore`
- [ ] **E0432**: Fix `reranker::RerankerBackend` -> `embedding::reranker::RerankerBackend`
- [ ] **E0432**: Remove `use crate::infra::Infra;` (struct doesn't exist)

### 5. Fix `cortex/cag.rs` Imports (lines 15-18)

- [ ] **E0432**: Fix `embedder::EmbedderBackend` -> `embedding::embedder::EmbedderBackend`
- [ ] **E0432**: Fix `rro::{SearchResult, VectorStore}` -> `persistence::vector::{SearchResult, VectorStore}`
- [ ] **E0432**: Fix `reranker::RerankerBackend` -> `embedding::reranker::RerankerBackend`

### 6. Fix `runtime/runtime.rs` Imports (lines 20-35)

- [ ] **E0432**: Fix `bus::EventBus` -> `persistence::bus::EventBus`
- [ ] **E0432**: Fix `embedder::EmbedderBackend` -> `embedding::embedder::EmbedderBackend`
- [ ] **E0432**: Fix `fjall::FjallStores` -> `persistence::memory::FjallStores` (or correct location)
- [ ] **E0432**: Fix `moka::HotCache` -> `persistence::memory::HotCache` (or correct location)
- [ ] **E0432**: Fix `models::{ModelPaths, ModelRegistry}` -> `catalog::models::{ModelPaths, ModelRegistry}`
- [ ] **E0432**: Fix `rro::VectorStore` -> `persistence::vector::VectorStore`
- [ ] **E0432**: Fix `reranker::RerankerBackend` -> `embedding::reranker::RerankerBackend`
- [ ] **E0432**: Fix `libsql::Database` -> `persistence::sql::Database`

### 7. Fix `infra/core/config.rs` Import (line 8)

- [ ] **E0433**: Fix `services::descriptors::{DeviceTarget, ModelRegistry}` -> `core::services::descriptors::{DeviceTarget, ModelRegistry}`

### 8. Fix `infra/catalog/models.rs` Import (line 26)

- [ ] **E0432**: Fix `super::libsql::Database` -> `crate::infra::persistence::sql::Database`

### 9. Fix `infra/core/services/loaders.rs` Imports and Errors

- [ ] **E0432**: Fix `crate::infra::config::ServicesConfig` -> `crate::infra::core::config::ServicesConfig`
- [ ] **E0433**: Fix `crate::infra::embedder::EmbedderBackend` -> `crate::infra::embedding::embedder::EmbedderBackend`
- [ ] **E0422**: Add `Qwen3EmbedderWrapper` struct definition (missing wrapper struct)
- [ ] **E0433**: Fix `crate::infra::reranker::RerankerBackend` -> `crate::infra::embedding::reranker::RerankerBackend`
- [ ] **E0422**: Add `Qwen3RerankerWrapper` struct definition (missing wrapper struct)
- [ ] **E0061**: Add third argument `bus: Option<EventBus>` to `LlmBackend::load()` call at line 112
- [ ] **E0609**: Remove `top_p: request.top_p` from `GenerateRequest` mapping at line 160 (field doesn't exist on traits::GenerateRequest)

### 10. Fix `infra/embedding/embedder.rs` Import (line 24)

- [ ] **E0432**: Fix `super::models` -> `crate::infra::catalog::models` (models module is in catalog, not embedding)

### 11. Fix `infra/embedding/reranker.rs` Import (line 24)

- [ ] **E0432**: Fix `super::models` -> `crate::infra::catalog::models`

### 12. Fix `infra/llm/mod.rs` Imports and Struct Issues

- [ ] **E0433**: Fix `crate::infra::inference::catalog::models::DeviceAllocation` -> `crate::infra::catalog::models::DeviceAllocation`
- [ ] **E0432**: Remove `InfraSignal` from import (doesn't exist in bus.rs)
- [ ] **E0560**: Remove `bus` field assignment from `LlmBackend` struct construction at line 115 (field doesn't exist)
- [ ] **E0609**: Remove all `self.bus` references at lines 156, 205, 216, 237, 256 (field doesn't exist in LlmBackend)

**Decision**: Either:
- **Option A**: Remove bus/event emission from LlmBackend entirely (simpler, recommended for pre-release)
- **Option B**: Add `bus: Option<EventBus>` field to LlmBackend struct and define `InfraSignal` enum

### 13. Fix `infra/vision/vl.rs` Import (line 17)

- [ ] **E0432**: Fix `super::models` -> `crate::infra::catalog::models`

### 14. Fix `lib.rs` Re-export (line 31)

- [ ] **E0432**: Fix `infra::vl::VLBackend` -> `infra::vision::vl::VLBackend`

### 15. Fix Type Errors in `infra/catalog/models.rs`

- [ ] **E0277**: Fix `for (family_str, model_id) in actives` at line 491 - change to `for (family_str, model_id) in actives.iter()` or ensure `actives` returns `(String, String)` not `(&str, &str)`

### 16. Fix Ownership Errors in `infra/core/config.rs`

- [ ] **E0507**: Add `.clone()` to `paths.models_dir` at line 43
- [ ] **E0507**: Add `.clone()` to `paths.models_dir` at line 61

### 17. Fix Function Argument Mismatch in `chat/mod.rs`

- [ ] **E0061**: Fix `LlmBackend::load(&paths.llm_gguf)` at line 126 - add `GrammarConfig` and `Option<EventBus>` arguments

### 18. Remove Unused Imports (Warnings)

- [ ] **Warning**: Remove unused `Deserialize, Serialize` from `persistence/global.rs:11`
- [ ] **Warning**: Remove unused `PathBuf` from `persistence/project.rs:13`
- [ ] **Warning**: Remove unused `Source` from `persistence/project.rs:15`

---

## Canonical Module Structure (Target State)

After fixes, the module structure should be:

```
orchestrator/src/infra/
├── mod.rs              # Re-exports: EventBus from persistence::bus
├── audio/
│   └── mod.rs
├── catalog/
│   ├── mod.rs
│   ├── discovery.rs
│   ├── models.rs       # ModelPaths, ModelRegistry, DeviceAllocation
│   └── adapters.rs
├── core/
│   ├── mod.rs          # NO facade module
│   ├── config.rs       # DevPulseConfig, ServicesConfig, GrammarConfig
│   ├── registry.rs     # Registry (project registry, NOT Infra)
│   ├── scope.rs
│   └── services/
│       ├── mod.rs
│       ├── descriptors.rs  # DeviceTarget, ModelFamily, ModelRegistry (descriptors)
│       ├── loaders.rs
│       └── traits.rs
├── embedding/
│   ├── mod.rs
│   ├── embedder.rs     # EmbedderBackend
│   └── reranker.rs     # RerankerBackend
├── llm/
│   ├── mod.rs          # LlmBackend (no bus field for now)
│   ├── llmestimator.rs
│   └── grammars/
│       └── mod.rs
├── persistence/
│   ├── mod.rs
│   ├── analytics.rs    # Analytics (DuckDB)
│   ├── audit.rs
│   ├── bus.rs          # EventBus (no InfraSignal)
│   ├── global.rs
│   ├── memory.rs       # FjallStores, HotCache
│   ├── project.rs
│   ├── sql.rs          # Database (libSQL)
│   └── vector.rs       # VectorStore, SearchResult
└── vision/
    ├── mod.rs
    └── vl.rs           # VLBackend
```

---

## Implementation Order

1. Fix Cargo.toml (add serde_yaml)
2. Fix infra/mod.rs re-exports
3. Fix infra/core/mod.rs (remove facade)
4. Fix all import paths in order of dependency
5. Fix struct/function signature mismatches
6. Fix type errors
7. Remove unused imports
8. Build and verify

---

## Notes

- This is a pre-release foundation fix - no backward compatibility shims
- `Infra` struct does not exist and was never implemented - remove all references
- `InfraSignal` enum was replaced with `Toon` type - bus now uses `Toon` directly
- LlmBackend bus integration deferred to future sprint

---

## Completion Criteria

- [ ] `cargo build` succeeds with 0 errors
- [ ] `cargo build --features db` succeeds
- [ ] `cargo test` passes
- [ ] No legacy shims or backward compatibility hacks
