# ENGINE BUILD FIXES - SPRINT CHECKLIST

**Created:** 2026-01-11
**Errors:** 32 compilation errors
**Root Cause:** Engine imports from old orchestrator paths that were reorganized

---

## PATH MAPPING (OLD → NEW)

| Old Path | New Path |
|----------|----------|
| `orchestrator::infra::discovery` | `orchestrator::infra::catalog::discovery` |
| `orchestrator::infra::adapters` | `orchestrator::infra::catalog::adapters` |
| `orchestrator::infra::models` | `orchestrator::infra::catalog::models` |
| `orchestrator::infra::libsql` | `orchestrator::infra::persistence::sql` |
| `orchestrator::infra::duckdb` | `orchestrator::infra::persistence::analytics` |
| `orchestrator::infra::fjall` | `orchestrator::infra::persistence::audit` |
| `orchestrator::infra::moka` | `orchestrator::infra::persistence::memory` |
| `orchestrator::infra::rro` | `orchestrator::infra::persistence::vector` |
| `orchestrator::infra::embedder` | `orchestrator::infra::embedding::embedder` |
| `orchestrator::infra::reranker` | `orchestrator::infra::embedding::reranker` |
| `orchestrator::infra::vl` | `orchestrator::infra::vision::vl` |
| `orchestrator::infra::voice` | `orchestrator::infra::audio::voice` |
| `orchestrator::infra::voice_discovery` | `orchestrator::infra::audio::voice::voice_discovery` |

---

## ERROR CHECKLIST (32 ERRORS)

### 1. engine/src/lib.rs (9 errors)

- [ ] **E0583 Line 51**: `pub mod tools;` - file doesn't exist
  - **Fix**: Remove the module declaration OR create `engine/src/tools.rs` stub

- [ ] **E0432 Line 60**: `orchestrator::infra::adapters`
  - **Fix**: → `orchestrator::infra::catalog::adapters`

- [ ] **E0432 Line 62**: `orchestrator::infra::libsql::ConfigEntry`
  - **Fix**: → `orchestrator::infra::persistence::sql::ConfigEntry`

- [ ] **E0432 Line 76**: `orchestrator::infra::duckdb::Analytics`
  - **Fix**: → `orchestrator::infra::persistence::analytics::Analytics`

- [ ] **E0432 Line 77**: `orchestrator::infra::fjall::FjallStores`
  - **Fix**: → `orchestrator::infra::persistence::audit::FjallStores`

- [ ] **E0432 Line 78**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

- [ ] **E0432 Line 79**: `orchestrator::infra::models::ModelRegistry`
  - **Fix**: → `orchestrator::infra::catalog::models::ModelRegistry`

- [ ] **E0432 Line 80**: `orchestrator::infra::moka::HotCache`
  - **Fix**: → `orchestrator::infra::persistence::memory::HotCache`

- [ ] **E0433 Line 279**: `orchestrator::infra::voice::ModelPaths`
  - **Fix**: → `orchestrator::infra::audio::voice::ModelPaths`

### 2. engine/src/facade/discovery.rs (3 errors)

- [ ] **E0432 Line 9**: `orchestrator::infra::discovery::{discover_models, DiscoveredModel}`
  - **Fix**: → `orchestrator::infra::catalog::discovery::{discover_models, DiscoveredModel}`

- [ ] **E0432 Line 10**: `orchestrator::infra::adapters::{ModelInfo, AdapterConfig, AdapterKind, AdapterManager}`
  - **Fix**: → `orchestrator::infra::catalog::adapters::{ModelInfo, AdapterConfig, AdapterKind, AdapterManager}`

- [ ] **E0433 Line 62**: `orchestrator::infra::discovery::has_models`
  - **Fix**: → `orchestrator::infra::catalog::discovery::has_models`

### 3. engine/src/facade/models.rs (3 errors)

- [ ] **E0432 Line 15**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

- [ ] **E0432 Line 16**: `orchestrator::infra::models::{ModelFamily, ModelRegistry}`
  - **Fix**: → `orchestrator::infra::catalog::models::{ModelFamily as OrcModelFamily, ModelRegistry}`

- [ ] **E0432 Line 17**: `orchestrator::infra::vl::VLBackend`
  - **Fix**: → `orchestrator::VLBackend` (re-exported) OR `orchestrator::infra::vision::vl::VLBackend`

### 4. engine/src/facade/persona.rs (1 error)

- [ ] **E0432 Line 10**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

### 5. engine/src/facade/reasoning.rs (4 errors)

- [ ] **E0432 Line 22**: `orchestrator::infra::embedder::EmbedderBackend`
  - **Fix**: → `orchestrator::infra::embedding::embedder::EmbedderBackend`

- [ ] **E0432 Line 23**: `orchestrator::infra::rro::VectorStore`
  - **Fix**: → `orchestrator::infra::persistence::vector::VectorStore`

- [ ] **E0432 Line 24**: `orchestrator::infra::reranker::RerankerBackend`
  - **Fix**: → `orchestrator::infra::embedding::reranker::RerankerBackend`

- [ ] **E0432 Line 142**: `orchestrator::infra::models::ModelPaths`
  - **Fix**: → `orchestrator::infra::catalog::models::ModelPaths`

### 6. engine/src/facade/voice.rs (1 error)

- [ ] **E0432 Line 15**: `orchestrator::infra::voice::{ModelPaths, ModelStatus, VoiceBackend}`
  - **Fix**: → `orchestrator::infra::audio::voice::{ModelPaths, ModelStatus, VoiceBackend}`

### 7. engine/src/facade/voice_discovery.rs (1 error)

- [ ] **E0432 Line 11**: `orchestrator::infra::voice_discovery::{...}`
  - **Fix**: → `orchestrator::infra::audio::voice::voice_discovery::{...}`

### 8. engine/src/indexer/mod.rs (4 errors)

- [ ] **E0432 Line 18**: `orchestrator::infra::duckdb::Analytics`
  - **Fix**: → `orchestrator::infra::persistence::analytics::Analytics`

- [ ] **E0432 Line 19**: `orchestrator::infra::embedder::EmbedderBackend`
  - **Fix**: → `orchestrator::infra::embedding::embedder::EmbedderBackend`

- [ ] **E0432 Line 20**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

- [ ] **E0432 Line 21**: `orchestrator::infra::rro::{collections, VectorPoint, VectorStore}`
  - **Fix**: → `orchestrator::infra::persistence::vector::{collections, VectorPoint, VectorStore}`

### 9. engine/src/registry/projects.rs (1 error)

- [ ] **E0432 Line 9**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

### 10. engine/src/registry/sessions.rs (1 error)

- [ ] **E0432 Line 9**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

### 11. engine/src/signals/processor.rs (4 errors)

- [ ] **E0432 Line 26**: `orchestrator::infra::duckdb::Analytics`
  - **Fix**: → `orchestrator::infra::persistence::analytics::Analytics`

- [ ] **E0432 Line 27**: `orchestrator::infra::fjall::FjallStores`
  - **Fix**: → `orchestrator::infra::persistence::audit::FjallStores`

- [ ] **E0432 Line 28**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

- [ ] **E0432 Line 29**: `orchestrator::infra::moka::HotCache`
  - **Fix**: → `orchestrator::infra::persistence::memory::HotCache`

### 12. engine/src/signals/sinks/analytics.rs (1 error)

- [ ] **E0432 Line 11**: `orchestrator::infra::duckdb::Analytics`
  - **Fix**: → `orchestrator::infra::persistence::analytics::Analytics`

### 13. engine/src/signals/sinks/cache.rs (1 error)

- [ ] **E0432 Line 9**: `orchestrator::infra::moka::HotCache`
  - **Fix**: → `orchestrator::infra::persistence::memory::HotCache`

### 14. engine/src/signals/sinks/durable.rs (1 error)

- [ ] **E0432 Line 10**: `orchestrator::infra::libsql::Database`
  - **Fix**: → `orchestrator::infra::persistence::sql::Database`

### 15. engine/src/signals/sinks/parking.rs (1 error)

- [ ] **E0432 Line 9**: `orchestrator::infra::fjall::{FjallStores, SignalReplayEntry}`
  - **Fix**: → `orchestrator::infra::persistence::audit::{FjallStores, SignalReplayEntry}`

### 16. Cascading Error (1 error)

- [ ] **E0282 Line 148** in reasoning.rs: Type annotation needed
  - **Fix**: Will resolve once imports are fixed

---

## IMPLEMENTATION ORDER

1. Fix `engine/src/lib.rs` (includes tools module issue)
2. Fix `engine/src/facade/*.rs` (8 files)
3. Fix `engine/src/indexer/mod.rs`
4. Fix `engine/src/registry/*.rs` (2 files)
5. Fix `engine/src/signals/processor.rs`
6. Fix `engine/src/signals/sinks/*.rs` (4 files)
7. Build and verify

---

## COMPLETION CRITERIA

- [ ] `cargo build -p engine` succeeds
- [ ] `cargo build -p engine --features db` succeeds
- [ ] All 32 errors resolved
- [ ] No new errors introduced
- [ ] Delete this file when done

---

## FILES TO MODIFY (16 files)

1. `engine/src/lib.rs`
2. `engine/src/facade/discovery.rs`
3. `engine/src/facade/models.rs`
4. `engine/src/facade/persona.rs`
5. `engine/src/facade/reasoning.rs`
6. `engine/src/facade/voice.rs`
7. `engine/src/facade/voice_discovery.rs`
8. `engine/src/indexer/mod.rs`
9. `engine/src/registry/projects.rs`
10. `engine/src/registry/sessions.rs`
11. `engine/src/signals/processor.rs`
12. `engine/src/signals/sinks/analytics.rs`
13. `engine/src/signals/sinks/cache.rs`
14. `engine/src/signals/sinks/durable.rs`
15. `engine/src/signals/sinks/parking.rs`
16. `engine/src/tools.rs` (create stub OR remove declaration)
