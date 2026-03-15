# Sprint: Services Rename + Config-Driven Ports

> **Status:** PLANNING — awaiting owner approval before execution
> **Scope:** Rename `stores` → `services` across entire Rust codebase, add network service config, config-driven ports
> **Risk:** High — touches config parser, boot pipeline, all store wrappers, xtask, Tauri backend
> **Verification:** `cargo check` after EVERY file change. No batching.

---

## Naming Convention (Senior → Junior)

| Old Name | New Name | Why |
|----------|----------|-----|
| `Store` trait | `Service` trait | Everything the platform boots is a service |
| `StoreRole` | `ServiceRole` | Aligns with trait rename |
| `RelationalStore` | `RelationalService` | Consistent |
| `AnalyticsStore` | `AnalyticsService` | Consistent |
| `GraphStore` | `GraphService` | Consistent |
| `CacheStore` | `CacheService` | Consistent |
| `VectorStore` | `VectorService` | Consistent |
| `StoreEntry` | `ServiceEntry` | Config type matches domain |
| `StoreRetryConfig` | `ServiceRetryConfig` | Consistent |
| `GraphStoreEntry` | `GraphServiceEntry` | Consistent |
| `CacheStoreEntry` | `CacheServiceEntry` | Consistent |
| `VectorStoreEntry` | `VectorServiceEntry` | Consistent |
| `ProjectGraphEntry` | `ProjectGraphServiceEntry` | Consistent |
| `ScopedStoresConfig` | `ScopedServicesConfig` | Consistent |
| `SystemStoresConfig` | `SystemServicesConfig` | Consistent |
| `UserStoresConfig` | `UserServicesConfig` | Consistent |
| `GlobalStoresConfig` | `GlobalServicesConfig` | Consistent |
| `ProjectStoresConfig` | `ProjectServicesConfig` | Consistent |
| `BootedStores` | `BootedServices` | Consistent |
| `stores/` directory | `services/` directory | Matches terminology |
| `ping_store()` | `ping_service()` | Consistent |
| `shutdown_store_with_deadline()` | `shutdown_service_with_deadline()` | Consistent |
| `boot_relational()` | (moves to `boot/relational.rs`) | Per-phase file |
| `boot_analytics()` | (moves to `boot/analytics.rs`) | Per-phase file |
| `boot_cache()` | (moves to `boot/cache.rs`) | Per-phase file |
| `boot_vector()` | (moves to `boot/vector.rs`) | Per-phase file |

---

## TOML Changes

**File:** `systems/devpulse-engine/platform.default.toml`
**Status:** DONE — `[stores.*]` → `[services.*]`, added `[services.network.*]` + `[boot]`

---

## Phase 1: Directory Rename — `stores/` → `services/`

### 1.1 Rename directory
```
systems/devpulse-engine/src/platform/stores/ → services/
```
Files inside (no content changes yet):
- `mod.rs`
- `relational.rs`
- `analytics.rs`
- `graph.rs`
- `cache.rs`
- `vector.rs` (feature-gated)

### 1.2 Update `platform/mod.rs` module declaration
```rust
// OLD
pub mod stores;
// NEW
pub mod services;
```

### 1.3 Update all `use stores::` imports in `platform/mod.rs`
```rust
// OLD
pub use stores::{Store, StoreRole};
use stores::analytics::AnalyticsStore;
use stores::cache::CacheStore;
use stores::graph::GraphStore;
use stores::relational::RelationalStore;
use stores::vector::VectorStore;

// NEW
pub use services::{Service, ServiceRole};
use services::analytics::AnalyticsService;
use services::cache::CacheService;
use services::graph::GraphService;
use services::relational::RelationalService;
use services::vector::VectorService;
```

### 1.4 Verify
```bash
cargo check -p devpulse-engine
```

---

## Phase 2: Rename Service Trait + Role Enum

### 2.1 `services/mod.rs` (was `stores/mod.rs`)
```rust
// OLD
pub enum StoreRole { Relational, Analytics, Graph, Cache, Vector }
pub trait Store: Send + Sync {
    fn name(&self) -> &'static str;
    fn role(&self) -> StoreRole;
    async fn ping(&self) -> Result<()>;
    fn is_ready(&self) -> bool;
    async fn shutdown(&self) -> Result<()> { Ok(()) }
}

// NEW
pub enum ServiceRole { Relational, Analytics, Graph, Cache, Vector }
pub trait Service: Send + Sync {
    fn name(&self) -> &'static str;
    fn role(&self) -> ServiceRole;
    async fn ping(&self) -> Result<()>;
    fn is_ready(&self) -> bool;
    async fn shutdown(&self) -> Result<()> { Ok(()) }
}
```

### 2.2 Each service wrapper file — rename struct + trait impl
Files: `services/relational.rs`, `services/analytics.rs`, `services/graph.rs`, `services/cache.rs`, `services/vector.rs`

Pattern for each:
```rust
// OLD
pub struct RelationalStore { ... }
impl Store for RelationalStore { fn role(&self) -> StoreRole { StoreRole::Relational } ... }

// NEW
pub struct RelationalService { ... }
impl Service for RelationalService { fn role(&self) -> ServiceRole { ServiceRole::Relational } ... }
```

### 2.3 Update re-exports in `services/mod.rs`
Module declarations stay the same (`pub mod relational;` etc.) — the files inside just rename their structs.

### 2.4 Update `platform/mod.rs` struct fields
```rust
// OLD
pub struct Platform {
    system_relational: Option<Arc<RelationalStore>>,
    system_analytics: Option<Arc<AnalyticsStore>>,
    system_graph: Option<Arc<GraphStore>>,
    system_cache: Option<Arc<CacheStore>>,
    user_relational: Option<Arc<RelationalStore>>,
    user_graph: Option<Arc<GraphStore>>,
    global_graph: Option<Arc<GraphStore>>,
    vector: Option<Arc<VectorStore>>,
    ...
}

// NEW
pub struct Platform {
    system_relational: Option<Arc<RelationalService>>,
    system_analytics: Option<Arc<AnalyticsService>>,
    system_graph: Option<Arc<GraphService>>,
    system_cache: Option<Arc<CacheService>>,
    user_relational: Option<Arc<RelationalService>>,
    user_graph: Option<Arc<GraphService>>,
    global_graph: Option<Arc<GraphService>>,
    vector: Option<Arc<VectorService>>,
    ...
}
```

### 2.5 Update accessor return types in `platform/mod.rs`
```rust
pub fn relational(&self) -> Option<&Arc<RelationalService>> { ... }
pub fn analytics(&self) -> Option<&Arc<AnalyticsService>> { ... }
// etc.
```

### 2.6 Update `ping_store()` → `ping_service()` in `platform/mod.rs`
```rust
// OLD
async fn ping_store<S: Store>(store: &S) -> SubsystemHealth { ... }
// NEW
async fn ping_service<S: Service>(service: &S) -> SubsystemHealth { ... }
```

### 2.7 Update `shutdown_store_with_deadline()` → `shutdown_service_with_deadline()`

### 2.8 Verify
```bash
cargo check -p devpulse-engine
```

---

## Phase 3: Config Types Rename

### 3.1 `config.rs` — Rename all config types
Every `Store` in a type name → `Service`:
- `StoreEntry` → `ServiceEntry`
- `StoreRetryConfig` → `ServiceRetryConfig`
- `GraphStoreEntry` → `GraphServiceEntry`
- `CacheStoreEntry` → `CacheServiceEntry`
- `VectorStoreEntry` → `VectorServiceEntry`
- `ProjectGraphEntry` → `ProjectGraphServiceEntry`
- `ScopedStoresConfig` → `ScopedServicesConfig`
- `SystemStoresConfig` → `SystemServicesConfig`
- `UserStoresConfig` → `UserServicesConfig`
- `GlobalStoresConfig` → `GlobalServicesConfig`
- `ProjectStoresConfig` → `ProjectServicesConfig`
- Field `pub stores:` → `pub services:` on `PlatformBootConfig`

### 3.2 Add new network + boot config types
```rust
/// Network services configuration.
#[derive(Debug, Clone, Deserialize)]
#[derive(Default)]
pub struct NetworkServicesConfig {
    #[serde(default)]
    pub dev_server: DevServerConfig,
    #[serde(default)]
    pub graph_api: GraphApiConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DevServerConfig {
    #[serde(default = "default_dev_port")]
    pub port: u16,
    #[serde(default = "default_bind")]
    pub bind: String,
    #[serde(default = "default_true")]
    pub strict_port: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GraphApiConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_graph_api_port")]
    pub port: u16,
    #[serde(default = "default_bind")]
    pub bind: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BootGateConfig {
    #[serde(default = "default_true")]
    pub require_all_critical: bool,
    #[serde(default = "default_boot_timeout")]
    pub timeout_secs: u64,
}
```

### 3.3 Add `network` field to `ScopedServicesConfig`
```rust
pub struct ScopedServicesConfig {
    pub system: SystemServicesConfig,
    pub user: UserServicesConfig,
    pub global: GlobalServicesConfig,
    pub project: ProjectServicesConfig,
    pub network: NetworkServicesConfig,  // NEW
}
```

### 3.4 Add `boot` field to `PlatformBootConfig`
```rust
pub struct PlatformBootConfig {
    pub portable: PortableConfig,
    pub services: ScopedServicesConfig,  // was `stores`
    pub boot: BootGateConfig,            // NEW
    pub windows: WindowsConfig,
}
```

### 3.5 Add `critical` field to `ServiceEntry` and `GraphServiceEntry`
```rust
pub struct ServiceEntry {
    pub enabled: bool,
    pub critical: bool,  // NEW — from TOML
    pub kind: String,
    pub path: String,
    pub retry: ServiceRetryConfig,
}
```

### 3.6 Add serde default functions
```rust
fn default_dev_port() -> u16 { 1420 }
fn default_graph_api_port() -> u16 { 8822 }
fn default_bind() -> String { "127.0.0.1".to_string() }
fn default_boot_timeout() -> u64 { 60 }
```

### 3.7 Verify
```bash
cargo check -p devpulse-engine
```

---

## Phase 4: Boot Pipeline Updates

### 4.1 `boot/mod.rs` — Rename `BootedStores` → `BootedServices`
Update all field types to use `*Service` instead of `*Store`.
Update all `boot_config.stores.` → `boot_config.services.`.

### 4.2 Extract boot phases into individual files
**Current state:** `boot/mod.rs` contains `boot_relational()`, `boot_analytics()`, `boot_cache()`, `boot_vector()` inline.
**Target:**
- `boot/relational.rs` — `pub async fn boot(...)` for relational services
- `boot/analytics.rs` — `pub async fn boot(...)` for analytics services
- `boot/cache.rs` — `pub fn boot(...)` for cache services
- `boot/vector.rs` — `pub fn boot(...)` for vector services
- `boot/graph.rs` — already exists, rename internals
- `boot/preflight.rs` — already exists, update config refs
- `boot/retry.rs` — stays as-is
- `boot/mod.rs` — orchestrator only, calls each phase file

### 4.3 Update `boot/preflight.rs`
All `config.stores.` → `config.services.`

### 4.4 Update `boot/graph.rs`
All `boot_config.stores.` → `boot_config.services.`, type renames.

### 4.5 Verify
```bash
cargo check -p devpulse-engine
```

---

## Phase 5: Server Port from Config

### 5.1 `server.rs`
Delete `const DEFAULT_PORT: u16 = 8822`.
Change `pub async fn start(adapter, port)` — port already comes from caller.
The caller (`boot/graph.rs`) will pass `boot_config.services.network.graph_api.port`.

### 5.2 Update `boot/graph.rs` to pass port from config
```rust
server::start(adapter, boot_config.services.network.graph_api.port).await?;
```

### 5.3 Verify
```bash
cargo check -p devpulse-engine
```

---

## Phase 6: Tauri Backend Updates

### 6.1 `lib.rs` — Dev server port from config
```rust
// OLD
let dev_url = "http://localhost:1420";
// ...
"127.0.0.1:1420".parse().expect("valid addr"),

// NEW — load config and read port
let boot_config = PlatformBootConfig::load(&data_dir)?;
let dev_port = boot_config.services.network.dev_server.port;
let dev_url = format!("http://localhost:{dev_port}");
// ...
format!("127.0.0.1:{dev_port}").parse().expect("valid addr"),
```

### 6.2 `commands/devpulse/mod.rs`
Update any `boot_config.stores` references if present.

### 6.3 Verify
```bash
cargo check -p devpulse_desktop_backend
```

---

## Phase 7: xtask Config-Driven Ports

### 7.1 `xtask/Cargo.toml` — Add dependencies
```toml
toml = "0.8"
serde = { version = "1", features = ["derive"] }
```

### 7.2 `xtask/src/workspace.rs` — Add config loader
Add a minimal struct that deserializes only what xtask needs from the TOML:
```rust
#[derive(Deserialize)]
pub struct PlatformConfig {
    pub services: ServicesConfig,
}

#[derive(Deserialize)]
pub struct ServicesConfig {
    pub network: NetworkConfig,
}

#[derive(Deserialize)]
pub struct NetworkConfig {
    pub dev_server: DevServerConfig,
    pub graph_api: GraphApiConfig,
}

#[derive(Deserialize)]
pub struct DevServerConfig {
    pub port: u16,
    pub bind: String,
}

#[derive(Deserialize)]
pub struct GraphApiConfig {
    pub port: u16,
    pub bind: String,
}
```

Add method:
```rust
impl Workspace {
    pub fn platform_config(&self) -> Result<PlatformConfig> {
        let toml_path = self.root
            .join("systems")
            .join("devpulse-engine")
            .join("platform.default.toml");
        let content = std::fs::read_to_string(&toml_path)?;
        let config: PlatformConfig = toml::from_str(&content)?;
        Ok(config)
    }
}
```

### 7.3 `xtask/src/net.rs` — Delete hardcoded port
```rust
// DELETE
pub const DEV_PORT: u16 = 1420;

// Change function signatures to accept port:
pub fn port_is_free(port: u16) -> bool { ... }  // already takes port
pub fn ensure_port_free(port: u16) -> Result<()> { ... }  // already takes port
```

Only change: delete the constant. Callers pass the config port.

### 7.4 `xtask/src/zombie.rs` — Dynamic patterns
```rust
// DELETE hardcoded
const ZOMBIE_PATTERNS: &[&str] = &[
    "tauri dev",
    "vite --port 1420",
    ...
];

// NEW — function that builds patterns from config port
pub fn zombie_patterns(dev_port: u16) -> Vec<String> {
    vec![
        "tauri dev".to_string(),
        format!("vite --port {dev_port}"),
        format!("vite.bin.js --port {dev_port}"),
        "node_modules/.bin/tauri".to_string(),
        "node_modules\\.bin\\tauri".to_string(),
    ]
}

// Update cleanup() to accept port parameter
pub fn cleanup(dev_port: u16) -> Result<u32> { ... }
```

### 7.5 `xtask/src/commands/dev.rs` — Wire it all together
```rust
fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
    let config = ws.platform_config()?;
    let dev_port = config.services.network.dev_server.port;

    // ... existing stages ...

    // Stage 3: Zombie cleanup — pass port
    zombie::cleanup(dev_port)?;

    // Stage 4: Port management — pass port
    net::ensure_port_free(dev_port)?;

    // Stage 7: Launch — set env var before spawning
    let mut tauri_child = ws.spawn_in_verbose_with_env(
        &ws.desktop_dir(),
        "pnpm",
        &["tauri", "dev"],
        &[("DEVPULSE_DEV_PORT", &dev_port.to_string())],
    )?;
}
```

### 7.6 Verify
```bash
cargo check -p xtask
```

---

## Phase 8: Frontend

### 8.1 `vite.config.ts`
```typescript
// OLD
server: {
    port: 1420,
    strictPort: true,
},

// NEW
server: {
    port: parseInt(process.env.DEVPULSE_DEV_PORT || '1420', 10),
    strictPort: true,
},
```

### 8.2 Verify
```bash
cd interfaces/desktop && pnpm svelte-check
```

---

## Phase 9: Final Verification

```bash
cargo clippy -p devpulse-engine -p devpulse_desktop_backend -p xtask
cd interfaces/desktop && pnpm svelte-check
```

---

## Files NOT touched (confirmed no changes needed)
- `tauri.conf.json` — devUrl stays `"http://localhost:1420"`, xtask preflight verifies match
- `BootOverlay.svelte` — already works, waits for `platform:boot-phase` events
- `platformState.svelte.ts` — already works, polls `__TAURI_INTERNALS__`
- `StatusBar.svelte` — already works
- ColdLight design system — not involved
- Frontend routes — not involved
