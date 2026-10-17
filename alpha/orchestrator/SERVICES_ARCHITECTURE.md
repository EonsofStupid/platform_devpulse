# DevPulse Services Architecture

## Overview

Three-tier configurable services system with global + per-project storage, like Claude/Cursor.

## Storage Model

```
~/.local/share/devpulse/           # GLOBAL (app-wide)
├── config.toml                    # Master config (services, paths, toggles)
├── registry.toml                  # Project UUID → path mapping
├── data/
│   ├── devpulse.db               # libSQL: user, global_decisions, global_chunks
│   ├── rro/                      # Global embeddings (general knowledge)
│   └── analytics.duckdb          # Metrics across all projects
│
{project}/.devpulse/              # PER-PROJECT
├── project.toml                  # UUID, name, collection_name
├── data/
│   ├── project.db                # libSQL: project_decisions, project_chunks
│   └── rro/                      # Project-specific embeddings
└── context.md                    # Project context (like CLAUDE.md)
```

## Service Kinds

Three toggleable AI services:

| Service   | Purpose                              | Default | Device |
|-----------|--------------------------------------|---------|--------|
| Embedder  | Text → 1024-dim vector               | ON      | CPU    |
| Reranker  | Query×Doc → relevance score          | OFF     | CPU    |
| LLM/Llm | Generation with grammar enforcement  | OFF     | GPU    |

## Config Schema (config.toml)

```toml
[services]
# Master toggles
embedder_enabled = true
reranker_enabled = false
llm_enabled = false

[services.embedder]
# Which embedder to use (enum variant name)
active = "Qwen3Embed0_6B"
device = "cpu"           # cpu | cuda:0 | metal

[services.reranker]
active = "Qwen3Rerank0_6B"
device = "cpu"

[services.llm]
active = "Qwen3VL4B_Q4KM"
device = "cuda:0"

# Model registry - add new models here
[models.embedders]
[models.embedders.Qwen3Embed0_6B]
family = "Qwen3Embed"
params_b = 0.6
dimension = 1024
path = "embedder"        # Relative to models_dir
format = "safetensors"

[models.embedders.Qwen3Embed4B]
family = "Qwen3Embed"
params_b = 4.0
dimension = 2560
path = "embedder-4b"
format = "safetensors"

[models.rerankers]
[models.rerankers.Qwen3Rerank0_6B]
family = "Qwen3Rerank"
params_b = 0.6
path = "reranker"
format = "gguf"
quant = "Q8_0"

[models.llms]
[models.llms.Qwen3VL4B_Q4KM]
family = "Qwen3VL"
params_b = 4.0
path = "llm/Qwen3-VL-4B-Instruct-Q4_K_M.gguf"
format = "gguf"
quant = "Q4_K_M"
vram_gb = 3.5

[models.llms.Qwen3VL8B_Q4KM]
family = "Qwen3VL"
params_b = 8.0
path = "8vlb/qwen3-vl-8b/model.gguf"
format = "gguf"
quant = "Q4_K_M"
vram_gb = 6.5

# Directory containing all models
[paths]
models_dir = "D:\\localdev\\dp_alpha\\models"
```

## Rust Types

### ServiceKind Enum

```rust
/// Top-level service categories
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ServiceKind {
    Embedder,
    Reranker,
    Llm,
}
```

### Service State

```rust
/// Service toggle state
#[derive(Debug, Clone, Copy, Default)]
pub struct ServiceState {
    pub enabled: bool,
    pub loaded: bool,
}

/// Runtime service registry
pub struct ServiceRegistry {
    states: HashMap<ServiceKind, ServiceState>,
    embedder: Option<Arc<dyn EmbedderService>>,
    reranker: Option<Arc<dyn RerankerService>>,
    llm: Option<Arc<dyn LlmService>>,
}
```

### Service Traits

```rust
/// Embedder trait - any model producing embeddings
#[async_trait]
pub trait EmbedderService: Send + Sync {
    /// Model identifier
    fn model_id(&self) -> &str;
    
    /// Output dimension
    fn dimension(&self) -> usize;
    
    /// Embed single text
    async fn embed(&self, text: &str) -> Result<Vec<f32>>;
    
    /// Embed batch
    async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>>;
}

/// Reranker trait - scoring query-document relevance
#[async_trait]
pub trait RerankerService: Send + Sync {
    fn model_id(&self) -> &str;
    
    /// Score single document
    async fn score(&self, query: &str, document: &str) -> Result<f32>;
    
    /// Score multiple documents
    async fn score_batch(&self, query: &str, documents: &[&str]) -> Result<Vec<f32>>;
}

/// LLM trait - text generation with optional grammar
#[async_trait]
pub trait LlmService: Send + Sync {
    fn model_id(&self) -> &str;
    
    /// Generate text
    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse>;
    
    /// Check if model supports vision
    fn supports_vision(&self) -> bool;
}
```

### Model Descriptors

```rust
/// Describes an embedder model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedderDescriptor {
    pub id: String,             // "Qwen3Embed0_6B"
    pub family: ModelFamily,    // Qwen3Embed
    pub params_b: f32,          // 0.6
    pub dimension: usize,       // 1024
    pub path: PathBuf,          // relative to models_dir
    pub format: ModelFormat,    // Safetensors
}

/// Describes a reranker model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RerankerDescriptor {
    pub id: String,
    pub family: ModelFamily,
    pub params_b: f32,
    pub path: PathBuf,
    pub format: ModelFormat,
    pub quant: Option<String>,
}

/// Describes an LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmDescriptor {
    pub id: String,
    pub family: ModelFamily,
    pub params_b: f32,
    pub path: PathBuf,
    pub format: ModelFormat,
    pub quant: Option<String>,
    pub vram_gb: f32,
    pub supports_vision: bool,
}

/// Model file format
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ModelFormat {
    Safetensors,
    Gguf,
    Ggml,
    Pytorch,
}
```

## Infra Update

```rust
pub struct Infra {
    // Storage (always on)
    pub bus: bus::EventBus,
    pub cache: moka::HotCache,
    #[cfg(feature = "db")]
    pub global_db: libsql::Database,       // Global storage
    pub analytics: duckdb::Analytics,
    pub rro: rro::VectorStore,             // Global vectors
    
    // Configurable services
    pub services: ServiceRegistry,
    
    // Config
    pub config: Arc<DevPulseConfig>,
}

impl Infra {
    pub async fn init() -> Result<Self> {
        let config = DevPulseConfig::load()?;
        let paths = get_paths();
        
        // Initialize storage (always)
        let bus = bus::EventBus::new();
        let cache = moka::HotCache::new();
        let analytics = duckdb::Analytics::open()?;
        let rro = rro::VectorStore::open(&paths.rro_dir)?;
        
        #[cfg(feature = "db")]
        let global_db = libsql::Database::open(&paths.global_db).await?;
        
        // Initialize services based on config toggles
        let services = ServiceRegistry::from_config(&config).await?;
        
        Ok(Self { bus, cache, global_db, analytics, rro, services, config: Arc::new(config) })
    }
    
    /// Get project-scoped infra (creates project DB + RRO collection if needed)
    pub async fn for_project(&self, project_id: Uuid) -> Result<ProjectInfra> {
        ProjectInfra::open(project_id, &self.config).await
    }
}

/// Per-project infrastructure
pub struct ProjectInfra {
    pub project_id: Uuid,
    pub db: libsql::Database,           // Project-specific libSQL
    pub rro: rro::VectorCollection,     // Project-specific collection
}
```

## API for Toggling

```rust
impl ServiceRegistry {
    /// Enable/disable a service at runtime
    pub async fn set_enabled(&mut self, kind: ServiceKind, enabled: bool) -> Result<()> {
        let state = self.states.entry(kind).or_default();
        
        if enabled && !state.loaded {
            // Load the service
            self.load_service(kind).await?;
            state.loaded = true;
        }
        
        state.enabled = enabled;
        Ok(())
    }
    
    /// Check if service is enabled
    pub fn is_enabled(&self, kind: ServiceKind) -> bool {
        self.states.get(&kind).map(|s| s.enabled).unwrap_or(false)
    }
    
    /// Get embedder (returns None if disabled)
    pub fn embedder(&self) -> Option<&Arc<dyn EmbedderService>> {
        if self.is_enabled(ServiceKind::Embedder) {
            self.embedder.as_ref()
        } else {
            None
        }
    }
    
    /// Get reranker (returns None if disabled)
    pub fn reranker(&self) -> Option<&Arc<dyn RerankerService>> {
        if self.is_enabled(ServiceKind::Reranker) {
            self.reranker.as_ref()
        } else {
            None
        }
    }
    
    /// Get LLM (returns None if disabled)
    pub fn llm(&self) -> Option<&Arc<dyn LlmService>> {
        if self.is_enabled(ServiceKind::Llm) {
            self.llm.as_ref()
        } else {
            None
        }
    }
}
```

## Adding New Models

1. Add entry to `config.toml` under appropriate `[models.X]` section
2. Set `active` field in `[services.X]` to new model ID
3. No code changes needed if model follows existing format

For entirely new model families:
1. Add variant to `ModelFamily` enum
2. Implement the appropriate trait (`EmbedderService`, `RerankerService`, `LlmService`)
3. Register loader in `ServiceRegistry::load_service()`

## File Structure

```
orchestrator/src/infra/
├── mod.rs              # Re-exports, Infra struct
├── services/
│   ├── mod.rs          # ServiceKind, ServiceRegistry, ServiceState
│   ├── traits.rs       # EmbedderService, RerankerService, LlmService traits
│   ├── descriptors.rs  # EmbedderDescriptor, RerankerDescriptor, LlmDescriptor
│   └── loaders.rs      # Factory functions for loading services from config
├── embedder.rs         # Qwen3EmbedderBackend (implements EmbedderService)
├── reranker.rs         # Qwen3RerankerBackend (implements RerankerService)
├── llm.rs              # Qwen3LlmBackend (implements LlmService)
├── config.rs           # DevPulseConfig, ServicesConfig
└── ...
```

## Implementation Order

1. **Phase 1: Config + Types** (this sprint)
   - [ ] Create `services/mod.rs` with `ServiceKind`, `ServiceState`, `ServiceRegistry`
   - [ ] Create `services/traits.rs` with service traits
   - [ ] Create `services/descriptors.rs` with model descriptors
   - [ ] Create `config.rs` with TOML parsing
   - [ ] Create default `config.toml` template

2. **Phase 2: Implement Traits** 
   - [ ] Update `embedder.rs` to implement `EmbedderService`
   - [ ] Update `reranker.rs` to implement `RerankerService`
   - [ ] Update `llm.rs` to implement `LlmService`

3. **Phase 3: Integration**
   - [ ] Create `services/loaders.rs` for factory loading
   - [ ] Update `Infra` struct to use `ServiceRegistry`
   - [ ] Wire up config loading on startup

4. **Phase 4: Per-Project**
   - [ ] Create `ProjectInfra` with project-scoped DB/RRO
   - [ ] Add project creation/loading logic
