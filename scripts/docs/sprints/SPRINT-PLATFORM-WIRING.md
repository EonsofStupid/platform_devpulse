# SPRINT: Platform Wiring — RRO + Seeding + All Git Deps + Real UI

**Date**: 2026-03-01
**Status**: READY FOR EXECUTION
**Research**: [SPRINT-PLATFORM-WIRING.research.md](./SPRINT-PLATFORM-WIRING.research.md)
**Depends On**: Platform facade (done), Health rune (done), IP protection (done)

---

## Goal

All databases embedded, running, seeded, with real health checks, real status icons, layman UI, guided messaging. The app boots and WORKS — databases initialize, health reports real status, UI shows real data, IP-protected labels everywhere.

---

## Phase 1: Wire RRO into Maestro Cortex

### 1.1 Add RRO dep to maestro
- [ ] `kernel/devpulse-maestro/Cargo.toml` — add `rro = { workspace = true }`
- [ ] `kernel/devpulse-maestro/Cargo.toml` — add `wal = { workspace = true }`
- [ ] `kernel/devpulse-maestro/Cargo.toml` — add `tar-rs = { workspace = true }`
- [ ] `kernel/devpulse-maestro/Cargo.toml` — add `kokoros = { workspace = true }`
- [ ] Verify: `cargo check -p devpulse-maestro`

### 1.2 Create VectorAdapter trait
- [ ] `cortex/persistence/traits.rs` — add `VectorAdapter` trait (FULL API):
  ```rust
  pub trait VectorAdapter: Send + Sync {
      // Collections
      async fn create_collection(&self, name: &str, dim: u32, distance: Distance) -> Result<()>;
      async fn delete_collection(&self, name: &str) -> Result<()>;
      async fn list_collections(&self) -> Result<Vec<String>>;
      async fn collection_exists(&self, name: &str) -> Result<bool>;
      // Points
      async fn upsert_points(&self, collection: &str, points: Vec<VectorPoint>) -> Result<()>;
      async fn search(&self, collection: &str, vector: Vec<f32>, limit: usize, filter: Option<VectorFilter>) -> Result<Vec<ScoredResult>>;
      async fn get_points(&self, collection: &str, ids: Vec<String>) -> Result<Vec<VectorPoint>>;
      async fn delete_points(&self, collection: &str, ids: Vec<String>) -> Result<()>;
      async fn count_points(&self, collection: &str) -> Result<u64>;
      // Advanced
      async fn recommend(&self, collection: &str, positive: Vec<String>, negative: Vec<String>, limit: usize) -> Result<Vec<ScoredResult>>;
      // Health
      async fn ping(&self) -> Result<()>;
  }
  ```
- [ ] `cortex/persistence/traits.rs` — add supporting types: `VectorPoint`, `ScoredResult`, `VectorFilter`, `Distance`

### 1.3 Create RRO adapter
- [ ] CREATE `cortex/persistence/rro.rs` — `RroAdapter` wrapping `Arc<QdrantClient>`
  - `async fn start(data_dir: &Path) -> Result<Self>` — calls `QdrantInstance::start()`, data under `data_dir/rro/`
  - Implement `VectorAdapter` — map trait types to RRO's native types
  - Implement `PersistenceAdapter` — key→vector point mapping for generic get/set
  - `ping()` — list_collections as health check
- [ ] Register in `cortex/persistence/mod.rs`:
  - Add `pub mod rro;` declaration
  - Add `RroAdapter` re-export
  - Add `vector: Option<Arc<RroAdapter>>` field to `PersistenceLayer`
  - Add `init_rro(&mut self, data_dir: &Path) -> Result<()>`
  - Add `ping_rro(&self) -> Result<()>`
  - Add `rro(&self) -> Option<&Arc<RroAdapter>>` accessor

### 1.4 Add Vector to StoreKind
- [ ] `cortex/persistence/config.rs` — add `Rro` variant to `StoreKind` enum
  - `subdir()` → `"rro"`
  - `default_filename()` → `"storage"` (RRO manages its own files under this dir)
  - `is_persistent()` → `true`

### 1.5 Verify Phase 1
- [ ] `cargo check -p devpulse-maestro`
- [ ] `cargo clippy -p devpulse-maestro -- -D warnings`

---

## Phase 2: Wire RRO into Engine Facade

### 2.1 Add Vector to StoreRole
- [ ] `platform/stores/mod.rs` — add `Vector` variant to `StoreRole` enum

### 2.2 Create VectorStore wrapper
- [ ] CREATE `platform/stores/vector.rs` — `VectorStore` wrapping maestro's `RroAdapter`
  - `async fn boot(data_dir: &Path) -> Result<Self>`
  - `fn adapter(&self) -> &Arc<RroAdapter>`
  - Implement `Store` trait:
    - `name()` → `ip_term!("RRO")` (resolves to "prepared context" in engine builds)
    - `role()` → `StoreRole::Vector`
    - `ping()` → delegates to adapter
    - `is_ready()` → `true` after boot
- [ ] `platform/stores/mod.rs` — add `pub mod vector;` + re-export

### 2.3 Add vector to Platform
- [ ] `platform/mod.rs` — add `vector: Option<Arc<VectorStore>>` field to `Platform`
- [ ] `platform/mod.rs` — add vector boot step in `Platform::boot()`:
  ```
  Step 6: Boot vector store (RRO) — async
  on_event(InitEvent::running(ip_term!("RRO"), "Starting vector engine"))
  let store = VectorStore::boot(&vector_path).await?
  on_event(InitEvent::ok_with_latency(ip_term!("RRO"), elapsed))
  ```
- [ ] `platform/mod.rs` — add `vector()` accessor
- [ ] `platform/mod.rs` — add vector ping in `health()` method

### 2.4 Add vector config
- [ ] `platform/config.rs` — add `VectorStoreEntry`:
  ```rust
  pub struct VectorStoreEntry {
      pub enabled: bool,          // default: true
      pub kind: String,           // default: "rro"
      pub path: String,           // default: "rro/storage"
  }
  ```
- [ ] `platform/config.rs` — add `vector: VectorStoreEntry` to `StoresConfig`
- [ ] `platform/config.rs` — add `vector_enabled: bool` to `DatabaseConfig` (TS-exported)
- [ ] `platform.default.toml` — add:
  ```toml
  [stores.vector]
  enabled = true
  kind = "rro"
  path = "rro/storage"
  ```

### 2.5 Update IP terms
- [ ] `ip/kernel_terms.toml` — add:
  ```toml
  [[terms]]
  kernel = "Qdrant"
  engine = "vector index"
  category = "algorithms"
  context = ["logs", "errors", "metrics"]
  severity = "hard"
  ```

### 2.6 Verify Phase 2
- [ ] `cargo check -p devpulse-engine --features kernel`
- [ ] `cargo check -p devpulse-engine --no-default-features --features engine`
- [ ] `cargo clippy --workspace -- -D warnings`

---

## Phase 3: Wire wal + tar-rs + kokoros

### 3.1 WAL integration (RRO durability)
- [ ] Verify `wal` crate compiles when imported by maestro (it's a transitive dep of RRO — may already be pulled in)
- [ ] If wal is NOT transitive: wire into `RroAdapter` for write-ahead log durability
- [ ] If wal IS transitive (RRO handles it internally): document this, no extra code needed

### 3.2 tar-rs integration (RRO snapshots)
- [ ] Verify `tar-rs` compiles when imported by maestro
- [ ] Add snapshot capability to `RroAdapter`:
  ```rust
  pub async fn create_snapshot(&self, output_path: &Path) -> Result<PathBuf>
  pub async fn restore_snapshot(&self, snapshot_path: &Path) -> Result<()>
  ```
- [ ] Use tar-rs to archive/compress RRO storage directory for snapshots

### 3.3 kokoros integration (voice synthesis)
- [ ] Verify `kokoros` compiles when imported by maestro
- [ ] CREATE `cortex/voice/mod.rs` — voice synthesis module
  - `VoiceEngine` struct wrapping kokoros
  - `async fn synthesize(&self, text: &str, voice: VoiceTone) -> Result<Vec<u8>>` (returns PCM audio)
  - Feature-gated: only active when voice is enabled
- [ ] `cortex/mod.rs` — add `pub mod voice;`
- [ ] Wire voice to persona system: `Persona.voice_tone` → kokoros voice selection

### 3.4 Verify Phase 3
- [ ] `cargo check -p devpulse-maestro`
- [ ] `cargo clippy --workspace -- -D warnings`

---

## Phase 4: Database Seeding System

### 4.1 Seed infrastructure
- [ ] CREATE `cortex/persistence/seed.rs` — seeding module
  ```rust
  pub struct SeedRunner<'a> {
      persistence: &'a PersistenceLayer,
  }

  impl SeedRunner {
      pub async fn run_if_empty(&self) -> Result<SeedReport>
      async fn seed_libsql(&self) -> Result<()>
      async fn seed_surreal(&self) -> Result<()>
      async fn seed_rro(&self) -> Result<()>
  }

  pub struct SeedReport {
      pub libsql_seeded: bool,
      pub surreal_seeded: bool,
      pub rro_seeded: bool,
      pub items_created: usize,
  }
  ```
- [ ] `cortex/persistence/mod.rs` — add `pub mod seed;`

### 4.2 LibSQL seeds
- [ ] Seed `platform_config` table with defaults:
  - `theme` = `"dark"` (category: `"appearance"`)
  - `language` = `"en"` (category: `"locale"`)
  - `voice_enabled` = `"false"` (category: `"ai"`)
  - `default_persona` = `"clyffy"` (category: `"ai"`)
  - `technical_persona` = `"architect"` (category: `"ai"`)
- [ ] Seed check: `SELECT COUNT(*) FROM platform_config` — skip if > 0

### 4.3 SurrealDB seeds (embedded instance)
- [ ] Seed default HMM states (reasoning bootstrap):
  ```
  state: "idle"       — probability: 0.4, emissions: ["waiting", "monitoring"]
  state: "observing"  — probability: 0.3, emissions: ["scanning", "collecting"]
  state: "reasoning"  — probability: 0.2, emissions: ["analyzing", "comparing"]
  state: "responding" — probability: 0.1, emissions: ["generating", "formatting"]
  ```
- [ ] Seed default state transitions:
  ```
  idle → observing       (trigger: "user_input", probability: 0.6)
  idle → reasoning       (trigger: "background_signal", probability: 0.3)
  observing → reasoning  (trigger: "context_ready", probability: 0.7)
  reasoning → responding (trigger: "conclusion_reached", probability: 0.8)
  responding → idle      (trigger: "response_sent", probability: 0.9)
  responding → reasoning (trigger: "follow_up", probability: 0.3)
  ```
- [ ] Seed Clyffy persona node:
  ```
  node_type: "persona"
  content: "Clyffy"
  metadata: { role: "general", voice_tone: "empathetic", instructions: "Friendly general assistant. Named for ColdLight + Wardenclyffe." }
  ```
- [ ] Seed Architect persona node:
  ```
  node_type: "persona"
  content: "Architect"
  metadata: { role: "technical", voice_tone: "objective", instructions: "Technical planning and architecture. Code generation. System design." }
  ```
- [ ] Seed check: `SELECT count() FROM states GROUP ALL` — skip if > 0

### 4.4 RRO seeds (default collections)
- [ ] Create default collections (dimensions configurable per model):
  ```
  "knowledge"  — dim: 384, distance: Cosine  (local model default, expandable)
  "context"    — dim: 384, distance: Cosine  (session context vectors)
  "memory"     — dim: 384, distance: Cosine  (long-term memory)
  ```
- [ ] Seed check: `list_collections()` — skip if collections already exist
- [ ] Default to 384 dimensions (all-MiniLM-L6 local model), configurable via TOML override

### 4.5 Wire seeding into Platform::boot()
- [ ] `platform/mod.rs` — after all stores boot, run seed check:
  ```
  Step 7: Seed databases (first boot)
  on_event(InitEvent::running(ip_term!("Trinity"), "Checking seed data"))
  let report = SeedRunner::new(&persistence).run_if_empty().await?
  if report.items_created > 0 {
      on_event(InitEvent::ok(ip_term!("Trinity"), format!("Seeded {} items", report.items_created)))
  } else {
      on_event(InitEvent::ok(ip_term!("Trinity"), "Data already present"))
  }
  ```

### 4.6 Verify Phase 4
- [ ] `cargo check --workspace`
- [ ] `cargo clippy --workspace -- -D warnings`
- [ ] Manual: delete data dir, boot app, verify seeds created

---

## Phase 5: Frontend — Real Health UI

### 5.1 Update generated health types
- [ ] `sys/generated/health.types.ts` — no changes needed (SubsystemHealth is generic, vector store reports as another subsystem)

### 5.2 StatusBar — real data
- [ ] `layouts/app/StatusBar.svelte` — replace ALL hardcoded values:
  - Connection status from `platformHealth.connectionStatus`
  - Uptime from `platformHealth.uptimeFormatted`
  - Show subsystem count: `{platformHealth.current?.subsystems.length ?? 0} stores`
  - Color-coded status dot: green (Healthy), yellow (Degraded), red (Down), gray (Unknown)

### 5.3 Chat Frame — health-aware dot
- [ ] `layouts/chat/components/shell/Frame.svelte` — replace hardcoded green dot:
  - Derive color from `platformHealth.status`
  - Show tooltip with subsystem breakdown on hover
  - Disable send when `!platformHealth.isHealthy`

### 5.4 Boot splash / init events
- [ ] CREATE `sys/runes/bootState.svelte.ts` — boot progress rune:
  ```typescript
  class BootState {
      steps = $state<InitEvent[]>([]);
      complete = $state(false);
      error = $state<string | null>(null);

      get currentStep(): string { /* last Running event */ }
      get progress(): number { /* completed / total */ }

      addEvent(event: InitEvent): void { ... }
      markComplete(): void { ... }
  }
  export const bootState = new BootState();
  ```
- [ ] Wire Tauri setup hook to emit init events to frontend (via `app.emit()` + Tauri event listener)

### 5.5 Subsystem health detail
- [ ] Add IPC command: `get_subsystem_detail` — returns per-store info (name, role, path, size on disk)
- [ ] StatusBar click → expand to show subsystem list with:
  - Store name (IP-safe: "Relational store", "Analytics store", "Vector index", etc.)
  - Status dot (green/yellow/red)
  - Latency (e.g., "2ms")
  - Message (e.g., "5 collections, 12,847 points")

### 5.6 Verify Phase 5
- [ ] `pnpm check` (svelte-check passes)
- [ ] Visual: boot app, StatusBar shows real health
- [ ] Visual: all 5 subsystems appear (relational, analytics, graph, cache, vector)

---

## Phase 6: CI + Feature Matrix

### 6.1 Feature matrix in CI
- [ ] `.github/workflows/ci.yml` — add step:
  ```yaml
  - name: Check engine build
    run: cargo check --no-default-features --features engine
  ```
- [ ] Ensure both kernel and engine features compile clean

### 6.2 Verify full build
- [ ] `cargo build --workspace`
- [ ] `cargo test --workspace`
- [ ] `cargo clippy --workspace -- -D warnings`
- [ ] `pnpm check`
- [ ] `pnpm build`

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `kernel/devpulse-maestro/Cargo.toml` | Add rro, wal, tar-rs, kokoros deps |
| MODIFY | `cortex/persistence/traits.rs` | Add VectorAdapter trait (12 methods) + types |
| CREATE | `cortex/persistence/rro.rs` | RRO adapter wrapping QdrantClient |
| MODIFY | `cortex/persistence/config.rs` | Add Rro to StoreKind |
| MODIFY | `cortex/persistence/mod.rs` | Add vector field, init, ping, re-exports |
| CREATE | `cortex/persistence/seed.rs` | Seeding system (LibSQL, SurrealDB, RRO) |
| CREATE | `cortex/voice/mod.rs` | Kokoros voice synthesis wrapper |
| MODIFY | `cortex/mod.rs` | Add pub mod voice |
| MODIFY | `platform/stores/mod.rs` | Add Vector to StoreRole |
| CREATE | `platform/stores/vector.rs` | VectorStore engine wrapper |
| MODIFY | `platform/mod.rs` | Add vector field, boot step, health, seed step |
| MODIFY | `platform/config.rs` | Add VectorStoreEntry, update DatabaseConfig |
| MODIFY | `platform.default.toml` | Add [stores.vector] section |
| MODIFY | `ip/kernel_terms.toml` | Add "Qdrant" → "vector index" |
| MODIFY | `layouts/app/StatusBar.svelte` | Real health data, status dots, subsystem count |
| MODIFY | `layouts/chat/components/shell/Frame.svelte` | Health-aware status dot |
| CREATE | `sys/runes/bootState.svelte.ts` | Boot progress rune singleton |
| MODIFY | `.github/workflows/ci.yml` | Add engine feature check |

---

## Execution Notes

- **Every phase must compile before moving to next**
- **ip_term!()** on ALL user-facing strings from vector store
- **Trait boundaries** — VectorAdapter is the escape hatch for future custom graph DB
- **Seed data is idempotent** — check before insert, never duplicate
- **384 dimensions default** — configurable, not hardcoded
- **Layman UI** — StatusBar shows "Vector index" not "RRO", "Data layer" not "Trinity"
