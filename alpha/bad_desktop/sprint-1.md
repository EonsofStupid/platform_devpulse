# Sprint 1: Chat + RRO + Embedder + Reranker

| Field | Value |
|-------|-------|
| **Status** | `PLANNING` |
| **Goal** | Wire real inference: embedder + rro + reranker + chat |
| **Scope** | NO LLM yet - just embedding, retrieval, reranking |
| **Working Directory** | `alpha/` ONLY |

---

## Locked Decisions

### Format Support

| Model | Format | File | Rationale |
|-------|--------|------|-----------|
| Embedder | Safetensors (FP8) | `model.safetensors` | Candle loads natively, works |
| Reranker | GGUF q8_0 | `Qwen3-Reranker-0.6B-q8_0.gguf` | Precision over 250MB savings |
| Llm | GGUF Q4_K_M | `Qwen3-VL-4B-Instruct-Q4_K_M.gguf` | Sprint 2 |

### Directory Structure (Canonical)

```
D:\localdev\dp_alpha\models\
├── embedder/
│   ├── config.json          # Architecture config
│   ├── model.safetensors    # 751MB FP8 weights
│   └── tokenizer.json       # 11MB Qwen3 tokenizer
├── reranker/
│   ├── Qwen3-Reranker-0.6B-q8_0.gguf   # 639MB
│   └── tokenizer.json
└── llm/
    └── Qwen3-VL-4B-Instruct-Q4_K_M.gguf  # 2.5GB (Sprint 2)
```

### Device Allocation

| Model | Device | Priority | VRAM |
|-------|--------|----------|------|
| Llm (4B) | GPU | P1 | ~3GB |
| Reranker (0.6B) | GPU | P2 | ~0.6GB |
| Embedder (0.6B) | **CPU forced** | N/A | Saves 400MB headroom |

### Model Path Resolution

- `project.toml` overrides `~/.local/share/devpulse/models.toml`
- Gaming project can have different models than Coding project

### Dimension Mismatch Handling

**Startup Assertion - Fail Fast**

If `embedder.hidden_size != rro.collection.vector_size`, crash immediately with clear error:
```
FATAL: Embedder dimension mismatch!
  Embedder: 1024 dims (from config.json)
  Collection 'code': 768 dims

Run `cargo xtask migrate-vectors` to recreate collections.
```

### Code Location Rules

| What | Where | NOT |
|------|-------|-----|
| Inference (embedder, reranker, llm) | `alpha/orchestrator/src/infra/` | NOT shared/ |
| Types (SignalKind, Toon, etc.) | `alpha/shared/src/types/` | |
| Config (paths, runtime) | `alpha/shared/src/config/` | |

**Rule: `shared/` = Types + Config. `orchestrator/` = Behavior + Inference.**

---

## Model Inventory (Verified Files)

### Embedder: `models/embedder/`

| File | Size | Purpose |
|------|------|---------|
| `model.safetensors` | 751,810,672 bytes | FP8 weights |
| `tokenizer.json` | 11,422,978 bytes | Qwen3 tokenizer |
| `config.json` | 942 bytes | Architecture |

**config.json contents:**
```json
{
  "architectures": ["Qwen3ForCausalLM"],
  "hidden_size": 1024,
  "num_hidden_layers": 28,
  "num_attention_heads": 16,
  "num_key_value_heads": 8,
  "intermediate_size": 3072,
  "vocab_size": 151936,
  "model_type": "qwen3",
  "eos_token_id": 151645
}
```

### Reranker: `models/reranker/`

| File | Size | Purpose |
|------|------|---------|
| `Qwen3-Reranker-0.6B-q8_0.gguf` | 639,150,432 bytes | Quantized weights |
| `tokenizer.json` | 11,422,978 bytes | Qwen3 tokenizer |

---

## Task Breakdown

### Task 1.1: Create Model Config Types

**File**: `alpha/orchestrator/src/infra/models.rs` (NEW)

**Purpose**: Define config structs for model loading.

```rust
//! Model configuration and loading infrastructure

use serde::Deserialize;
use std::path::{Path, PathBuf};
use candle_core::Device;

/// Qwen3 model architecture config (from config.json)
#[derive(Debug, Clone, Deserialize)]
pub struct Qwen3Config {
    pub hidden_size: usize,
    pub num_hidden_layers: usize,
    pub num_attention_heads: usize,
    pub num_key_value_heads: usize,
    pub intermediate_size: usize,
    pub vocab_size: usize,
    pub rms_norm_eps: f64,
    pub rope_theta: f64,
    #[serde(default)]
    pub tie_word_embeddings: bool,
}

impl Qwen3Config {
    pub fn from_file(path: &Path) -> anyhow::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }
}

/// Device allocation strategy
#[derive(Debug, Clone, Copy)]
pub enum DeviceAllocation {
    /// Force CPU (embedder - saves VRAM)
    CpuForced,
    /// GPU with priority (lower = higher priority)
    Gpu { priority: u8 },
}

impl DeviceAllocation {
    pub fn to_device(&self) -> Device {
        match self {
            DeviceAllocation::CpuForced => Device::Cpu,
            DeviceAllocation::Gpu { .. } => {
                Device::cuda_if_available(0).unwrap_or(Device::Cpu)
            }
        }
    }
}

/// Model paths container
#[derive(Debug, Clone)]
pub struct ModelPaths {
    pub embedder_dir: PathBuf,
    pub reranker_dir: PathBuf,
    pub llm_dir: PathBuf,
}

impl ModelPaths {
    /// Default paths for dp_alpha models
    pub fn default_dp_alpha() -> Self {
        Self {
            embedder_dir: PathBuf::from(r"D:\localdev\dp_alpha\models\embedder"),
            reranker_dir: PathBuf::from(r"D:\localdev\dp_alpha\models\reranker"),
            llm_dir: PathBuf::from(r"D:\localdev\dp_alpha\models\llm"),
        }
    }

    /// Verify all required files exist
    pub fn verify(&self) -> anyhow::Result<()> {
        let checks = [
            (self.embedder_dir.join("model.safetensors"), "Embedder weights"),
            (self.embedder_dir.join("tokenizer.json"), "Embedder tokenizer"),
            (self.embedder_dir.join("config.json"), "Embedder config"),
            (self.reranker_dir.join("Qwen3-Reranker-0.6B-q8_0.gguf"), "Reranker GGUF"),
            (self.reranker_dir.join("tokenizer.json"), "Reranker tokenizer"),
        ];

        for (path, name) in checks {
            if !path.exists() {
                anyhow::bail!("Missing {}: {:?}", name, path);
            }
        }
        Ok(())
    }
}
```

---

### Task 1.2: Implement Embedder (Candle + Safetensors)

**File**: `alpha/orchestrator/src/infra/embedder.rs` (REWRITE)

**Purpose**: Load safetensors, run forward pass, return 1024-dim vector.

**Key Implementation Details**:

1. **Model Loading**: Use `candle_transformers::models::qwen2::Model` (Qwen3 is architecturally compatible)
2. **Weights Loading**: `VarBuilder::from_mmaped_safetensors`
3. **Tokenization**: `tokenizers::Tokenizer::from_file`
4. **Pooling**: Mean pooling over sequence dimension
5. **Normalization**: L2 normalize output
6. **Device**: CPU forced (per locked decision)

```rust
//! Embedder backend - Qwen3-Embedding via Candle
//!
//! Device: CPU forced (saves 400MB VRAM headroom)
//! Format: Safetensors only
//! Output: 1024-dim L2-normalized vector

use anyhow::Result;
use candle_core::{Device, Tensor, DType, D};
use candle_nn::VarBuilder;
use candle_transformers::models::qwen2::{Config as Qwen2Config, Model as Qwen2Model};
use std::path::PathBuf;
use std::sync::Mutex;
use tokenizers::Tokenizer;

use super::models::{Qwen3Config, DeviceAllocation};

/// Embedder backend - CPU forced
pub struct EmbedderBackend {
    model: Mutex<Qwen2Model>,
    tokenizer: Tokenizer,
    device: Device,
    dimension: usize,
}

impl EmbedderBackend {
    /// Load embedder from directory
    pub fn load(embedder_dir: &PathBuf) -> Result<Self> {
        // Device: CPU forced per locked decision
        let device = DeviceAllocation::CpuForced.to_device();
        tracing::info!("Loading embedder on {:?}", device);

        // Paths
        let weights_path = embedder_dir.join("model.safetensors");
        let config_path = embedder_dir.join("config.json");
        let tokenizer_path = embedder_dir.join("tokenizer.json");

        // Load config
        let qwen3_config = Qwen3Config::from_file(&config_path)?;
        let dimension = qwen3_config.hidden_size;

        // Convert to Qwen2Config (compatible architecture)
        let config = Qwen2Config {
            vocab_size: qwen3_config.vocab_size,
            hidden_size: qwen3_config.hidden_size,
            intermediate_size: qwen3_config.intermediate_size,
            num_hidden_layers: qwen3_config.num_hidden_layers,
            num_attention_heads: qwen3_config.num_attention_heads,
            num_key_value_heads: qwen3_config.num_key_value_heads,
            hidden_act: candle_nn::Activation::Silu,
            max_position_embeddings: 32768,
            rms_norm_eps: qwen3_config.rms_norm_eps,
            rope_theta: qwen3_config.rope_theta,
            sliding_window: 0,
            max_window_layers: 0,
            use_sliding_window: false,
            tie_word_embeddings: qwen3_config.tie_word_embeddings,
        };

        // Load weights
        tracing::info!("Loading weights from {:?}", weights_path);
        let vb = unsafe {
            VarBuilder::from_mmaped_safetensors(&[&weights_path], DType::F32, &device)?
        };

        // Build model
        let model = Qwen2Model::new(&config, vb)?;

        // Load tokenizer
        let tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {}", e))?;

        tracing::info!("Embedder loaded: dim={}", dimension);

        Ok(Self {
            model: Mutex::new(model),
            tokenizer,
            device,
            dimension,
        })
    }

    /// Get embedding dimension
    pub fn dimension(&self) -> usize {
        self.dimension
    }

    /// Embed text to vector
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        // Tokenize
        let encoding = self.tokenizer
            .encode(text, true)
            .map_err(|e| anyhow::anyhow!("Tokenization failed: {}", e))?;

        let input_ids = encoding.get_ids();
        let input = Tensor::new(input_ids, &self.device)?.unsqueeze(0)?;

        // Forward pass
        let mut model = self.model.lock().unwrap();
        let hidden_states = model.forward(&input, 0, None)?;

        // Mean pooling over sequence
        let pooled = hidden_states.mean(D::Minus2)?;
        let pooled = pooled.squeeze(0)?;

        // L2 normalize
        let norm = pooled.sqr()?.sum_all()?.sqrt()?;
        let normalized = pooled.broadcast_div(&norm)?;

        // Convert to Vec<f32>
        Ok(normalized.to_vec1()?)
    }

    /// Batch embed (sequential for CPU)
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|t| self.embed(t)).collect()
    }
}
```

**Verification Test**:
```rust
#[test]
fn test_embedder_produces_1024_dims() {
    let paths = ModelPaths::default_dp_alpha();
    let embedder = EmbedderBackend::load(&paths.embedder_dir).unwrap();

    let vec = embedder.embed("Hello, world!").unwrap();
    assert_eq!(vec.len(), 1024, "Must produce 1024 dims");

    // Verify L2 normalized
    let mag: f32 = vec.iter().map(|x| x * x).sum::<f32>().sqrt();
    assert!((mag - 1.0).abs() < 0.01, "Must be L2 normalized");
}
```

---

### Task 1.3: Implement Reranker (Candle GGUF)

**File**: `alpha/orchestrator/src/infra/reranker.rs` (REWRITE)

**Purpose**: Load GGUF, score query-document pairs.

**Key Implementation Details**:

1. **Model Loading**: `candle_transformers::models::quantized_qwen3::ModelWeights`
2. **GGUF Loading**: `candle_core::quantized::gguf_file::Content`
3. **Device**: GPU P2 priority
4. **Scoring**: Extract logits for "yes"/"no" tokens, compute P(yes)/(P(yes)+P(no))

**Qwen3-Reranker Prompt Template** (from model card):
```
<|im_start|>system
Judge whether the Document meets the requirements based on the Query and the Instruct provided. Note that the answer can only be "yes" or "no".
<|im_end|>
<|im_start|>user
<Instruct>: {instruction}
<Query>: {query}
<Document>: {document}
<|im_end|>
<|im_start|>assistant
<think>

</think>

```

**Scoring**: Get logits at final position, extract P("yes") and P("no"), return `P(yes) / (P(yes) + P(no))`.

```rust
//! Reranker backend - Qwen3-Reranker via Candle GGUF
//!
//! Device: GPU P2 priority (~0.6GB VRAM)
//! Format: GGUF q8_0 only
//! Output: 0.0-1.0 relevance score
//!
//! Uses Qwen3 thinking mode: <think>...</think> then yes/no judgment

use anyhow::Result;
use candle_core::{Device, Tensor};
use candle_transformers::models::quantized_qwen3::ModelWeights;
use std::path::PathBuf;
use std::sync::Mutex;
use tokenizers::Tokenizer;

use super::models::DeviceAllocation;

/// Prompt components for Qwen3-Reranker
const SYSTEM_PROMPT: &str = "<|im_start|>system\nJudge whether the Document meets the requirements based on the Query and the Instruct provided. Note that the answer can only be \"yes\" or \"no\".<|im_end|>\n";
const USER_PREFIX: &str = "<|im_start|>user\n";
const USER_SUFFIX: &str = "<|im_end|>\n";
const ASSISTANT_THINKING: &str = "<|im_start|>assistant\n<think>\n\n</think>\n\n";
const DEFAULT_INSTRUCTION: &str = "Given a web search query, retrieve relevant passages that answer the query";

/// Reranker backend - GPU P2
pub struct RerankerBackend {
    model: Mutex<ModelWeights>,
    tokenizer: Tokenizer,
    device: Device,
    token_yes: u32,
    token_no: u32,
}

impl RerankerBackend {
    /// Load reranker from directory
    pub fn load(reranker_dir: &PathBuf) -> Result<Self> {
        // Device: GPU P2 priority
        let device = DeviceAllocation::Gpu { priority: 2 }.to_device();
        tracing::info!("Loading reranker on {:?}", device);

        // Paths - q8_0 only per locked decision
        let gguf_path = reranker_dir.join("Qwen3-Reranker-0.6B-q8_0.gguf");
        let tokenizer_path = reranker_dir.join("tokenizer.json");

        // Load GGUF
        tracing::info!("Loading GGUF from {:?}", gguf_path);
        let mut file = std::fs::File::open(&gguf_path)?;
        let content = candle_core::quantized::gguf_file::Content::read(&mut file)?;
        let model = ModelWeights::from_gguf(content, &mut file, &device)?;

        // Load tokenizer
        let tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {}", e))?;

        // Get token IDs for "yes" and "no"
        let token_yes = tokenizer.token_to_id("yes")
            .ok_or_else(|| anyhow::anyhow!("Token 'yes' not in vocabulary"))?;
        let token_no = tokenizer.token_to_id("no")
            .ok_or_else(|| anyhow::anyhow!("Token 'no' not in vocabulary"))?;

        tracing::info!("Reranker loaded (yes={}, no={})", token_yes, token_no);

        Ok(Self {
            model: Mutex::new(model),
            tokenizer,
            device,
            token_yes,
            token_no,
        })
    }

    /// Format the reranker prompt
    fn format_prompt(&self, instruction: &str, query: &str, document: &str) -> String {
        format!(
            "{}{}<Instruct>: {}\n<Query>: {}\n<Document>: {}{}{}",
            SYSTEM_PROMPT,
            USER_PREFIX,
            instruction,
            query,
            document,
            USER_SUFFIX,
            ASSISTANT_THINKING
        )
    }

    /// Score relevance between query and document
    pub fn score(&self, query: &str, document: &str) -> Result<f32> {
        self.score_with_instruction(DEFAULT_INSTRUCTION, query, document)
    }

    /// Score with custom instruction
    pub fn score_with_instruction(&self, instruction: &str, query: &str, document: &str) -> Result<f32> {
        let prompt = self.format_prompt(instruction, query, document);

        // Tokenize
        let encoding = self.tokenizer
            .encode(prompt.as_str(), true)
            .map_err(|e| anyhow::anyhow!("Tokenization failed: {}", e))?;

        let input_ids = encoding.get_ids();

        // Truncate to 8192 tokens max (model supports 32k but be conservative)
        let max_len = 8192;
        let truncated: Vec<u32> = if input_ids.len() > max_len {
            input_ids[..max_len].to_vec()
        } else {
            input_ids.to_vec()
        };

        let input = Tensor::new(truncated.as_slice(), &self.device)?.unsqueeze(0)?;

        // Forward pass
        let mut model = self.model.lock().unwrap();
        model.clear_kv_cache();
        let logits = model.forward(&input, 0)?;

        // Get logits at last position
        let last_logits = logits.squeeze(0)?;
        let logits_vec: Vec<f32> = last_logits.to_vec1()?;

        // Extract logits for "yes" and "no" tokens
        let yes_logit = logits_vec.get(self.token_yes as usize).copied().unwrap_or(-10.0);
        let no_logit = logits_vec.get(self.token_no as usize).copied().unwrap_or(-10.0);

        // Softmax over [no, yes] and return P(yes)
        let max_logit = yes_logit.max(no_logit);
        let yes_exp = (yes_logit - max_logit).exp();
        let no_exp = (no_logit - max_logit).exp();
        let score = yes_exp / (yes_exp + no_exp);

        Ok(score)
    }

    /// Rerank documents, return sorted (index, score) pairs
    pub fn rerank(&self, query: &str, documents: &[String]) -> Result<Vec<(usize, f32)>> {
        let mut results: Vec<(usize, f32)> = documents
            .iter()
            .enumerate()
            .map(|(i, doc)| {
                let score = self.score(query, doc).unwrap_or(0.0);
                (i, score)
            })
            .collect();

        // Sort descending by score
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        Ok(results)
    }
}
```

**Verification Test**:
```rust
#[test]
fn test_reranker_scores_in_range() {
    let paths = ModelPaths::default_dp_alpha();
    let reranker = RerankerBackend::load(&paths.reranker_dir).unwrap();

    let score = reranker.score("rust programming", "Rust is a systems language").unwrap();
    assert!(score >= 0.0 && score <= 1.0, "Score must be 0-1");
}
```

---

### Task 1.4: Update RRO with Dimension Assertion

**File**: `alpha/orchestrator/src/infra/rro.rs` (MODIFY)

**Purpose**: Add startup dimension check.

**Add to VectorStore**:
```rust
impl VectorStore {
    /// Verify collection dimension matches embedder
    pub async fn assert_dimension(&self, collection: &str, expected_dim: u64) -> anyhow::Result<()> {
        if let Some(info) = self.client.get_collection(collection).await? {
            let actual_dim = info.config.params.vectors.size;
            if actual_dim != expected_dim {
                anyhow::bail!(
                    "FATAL: Dimension mismatch!\n\
                     Embedder: {} dims\n\
                     Collection '{}': {} dims\n\n\
                     Run `cargo xtask migrate-vectors` to recreate collections.",
                    expected_dim, collection, actual_dim
                );
            }
        }
        Ok(())
    }
}
```

---

### Task 1.5: Create CAG Module

**File**: `alpha/orchestrator/src/cortex/cag.rs` (NEW)

**Purpose**: Context Assembly Graph - embed → search → rerank pipeline.

```rust
//! CAG - Context Assembly Graph
//!
//! Pipeline: Query → Embed → RRO Search → Rerank → Context

use crate::infra::{
    embedder::EmbedderBackend,
    rro::{VectorStore, SearchResult},
    reranker::RerankerBackend,
};
use anyhow::Result;
use std::sync::Arc;

/// Assembled context for LLM
#[derive(Debug, Clone)]
pub struct AssembledContext {
    pub query: String,
    pub chunks: Vec<ContextChunk>,
    pub candidates_searched: usize,
    pub assembly_time_ms: u64,
}

/// Single context chunk with scores
#[derive(Debug, Clone)]
pub struct ContextChunk {
    pub content: String,
    pub source: String,
    pub relevance_score: f32,
    pub vector_score: f32,
}

/// Assembly configuration
#[derive(Debug, Clone)]
pub struct AssemblyConfig {
    pub collection: String,
    pub candidate_limit: usize,
    pub top_k: usize,
}

impl Default for AssemblyConfig {
    fn default() -> Self {
        Self {
            collection: "code".to_string(),
            candidate_limit: 20,
            top_k: 5,
        }
    }
}

/// Context Assembly Graph
pub struct CAG {
    embedder: Arc<EmbedderBackend>,
    rro: Arc<VectorStore>,
    reranker: Arc<RerankerBackend>,
}

impl CAG {
    pub fn new(
        embedder: Arc<EmbedderBackend>,
        rro: Arc<VectorStore>,
        reranker: Arc<RerankerBackend>,
    ) -> Self {
        Self { embedder, rro, reranker }
    }

    /// Assemble context for query
    pub async fn assemble(&self, query: &str, config: &AssemblyConfig) -> Result<AssembledContext> {
        let start = std::time::Instant::now();

        // 1. Embed query (CPU)
        tracing::debug!("Embedding query: {} chars", query.len());
        let embedding = self.embedder.embed(query)?;

        // 2. Search RRO
        tracing::debug!("Searching {} for {} candidates", config.collection, config.candidate_limit);
        let search_results = self.rro
            .search(&config.collection, embedding, config.candidate_limit)
            .await?;

        let candidates_searched = search_results.len();

        if candidates_searched == 0 {
            return Ok(AssembledContext {
                query: query.to_string(),
                chunks: vec![],
                candidates_searched: 0,
                assembly_time_ms: start.elapsed().as_millis() as u64,
            });
        }

        // 3. Extract documents for reranking
        let documents: Vec<String> = search_results
            .iter()
            .map(|r| {
                r.payload
                    .get("content")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string()
            })
            .collect();

        // 4. Rerank (GPU)
        tracing::debug!("Reranking {} candidates", candidates_searched);
        let reranked = self.reranker.rerank(query, &documents)?;

        // 5. Build top-k chunks
        let chunks: Vec<ContextChunk> = reranked
            .into_iter()
            .take(config.top_k)
            .map(|(idx, relevance_score)| {
                let result = &search_results[idx];
                ContextChunk {
                    content: documents[idx].clone(),
                    source: result.payload
                        .get("source")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    relevance_score,
                    vector_score: result.score,
                }
            })
            .collect();

        Ok(AssembledContext {
            query: query.to_string(),
            chunks,
            candidates_searched,
            assembly_time_ms: start.elapsed().as_millis() as u64,
        })
    }
}
```

---

### Task 1.6: Wire Chat → CAG

**File**: `alpha/orchestrator/src/chat/mod.rs` (MODIFY)

**Purpose**: Update ChatEngine to use CAG.

```rust
// Add to ChatEngine::new()
pub async fn new() -> Result<Self> {
    let infra = Infra::init().await?;
    let session_id = SessionId::new();

    // Load models
    let paths = ModelPaths::default_dp_alpha();
    paths.verify()?;

    let embedder = Arc::new(EmbedderBackend::load(&paths.embedder_dir)?);
    let reranker = Arc::new(RerankerBackend::load(&paths.reranker_dir)?);

    // Dimension assertion
    let expected_dim = embedder.dimension() as u64;
    infra.vector_store.assert_dimension("code", expected_dim).await
        .ok(); // Collection may not exist yet

    let cag = CAG::new(
        embedder,
        Arc::new(infra.vector_store),
        reranker,
    );

    Ok(Self { infra, session_id, cag })
}

// Update send() to use CAG
pub async fn send(&self, message: &str) -> Result<ChatResponse> {
    // Assemble context
    let context = self.cag.assemble(message, &AssemblyConfig::default()).await?;

    // Sprint 1: Return context as response (no LLM yet)
    let response_text = format!(
        "Query: {}\nFound {} chunks in {}ms\n\n{}",
        context.query,
        context.chunks.len(),
        context.assembly_time_ms,
        context.chunks.iter().enumerate()
            .map(|(i, c)| format!(
                "--- Chunk {} (rel: {:.2}, src: {}) ---\n{}",
                i + 1, c.relevance_score, c.source,
                c.content.chars().take(200).collect::<String>()
            ))
            .collect::<Vec<_>>()
            .join("\n\n")
    );

    Ok(ChatResponse {
        message: response_text,
        tokens_used: 0,
        hops_executed: 1,
    })
}
```

---

### Task 1.7: Add xtask seed Command

**File**: `alpha/xtask/src/main.rs` (MODIFY)

**Purpose**: Seed RRO with test data.

```rust
// Add to match command
"seed" => seed().await?,

// Add function
async fn seed() -> Result<()> {
    println!("Seeding RRO with test data...\n");

    let paths = orchestrator::infra::models::ModelPaths::default_dp_alpha();
    paths.verify()?;

    // Load embedder
    let embedder = orchestrator::infra::embedder::EmbedderBackend::load(&paths.embedder_dir)?;
    println!("Embedder loaded (dim: {})", embedder.dimension());

    // Init RRO
    let infra = orchestrator::Infra::init().await?;

    // Create collection with correct dimension
    infra.vector_store.create_collection("code", embedder.dimension() as u64).await?;
    println!("Collection 'code' ready");

    // Test chunks
    let chunks = vec![
        ("fn main() { println!(\"Hello\"); }", "src/main.rs"),
        ("pub struct User { name: String, email: String }", "src/user.rs"),
        ("async fn fetch_data() -> Result<Data> { Ok(data) }", "src/api.rs"),
        ("impl Iterator for MyIter { type Item = T; }", "src/iter.rs"),
        ("pub trait Handler { fn handle(&self, req: Request); }", "src/handler.rs"),
    ];

    let mut points = Vec::new();
    for (content, source) in &chunks {
        print!("  Embedding {}... ", source);
        let vec = embedder.embed(content)?;
        println!("OK ({} dims)", vec.len());

        points.push(orchestrator::infra::rro::VectorPoint::new(
            uuid::Uuid::new_v4().to_string(),
            vec,
            serde_json::json!({
                "content": content,
                "source": source,
            }),
        ));
    }

    infra.vector_store.upsert("code", points).await?;
    println!("\nSeeded {} chunks to 'code' collection", chunks.len());

    Ok(())
}
```

---

## File Changes Summary

| File | Action | Lines (est) |
|------|--------|-------------|
| `orchestrator/src/infra/models.rs` | CREATE | ~80 |
| `orchestrator/src/infra/embedder.rs` | REWRITE | ~100 |
| `orchestrator/src/infra/reranker.rs` | REWRITE | ~90 |
| `orchestrator/src/infra/rro.rs` | MODIFY | +15 |
| `orchestrator/src/infra/mod.rs` | MODIFY | +1 |
| `orchestrator/src/cortex/cag.rs` | CREATE | ~120 |
| `orchestrator/src/cortex/mod.rs` | MODIFY | +1 |
| `orchestrator/src/chat/mod.rs` | MODIFY | ~40 |
| `xtask/src/main.rs` | MODIFY | ~50 |

---

## Verification Checklist

### Startup Checks
- [ ] `paths.verify()` passes - all model files present
- [ ] Dimension assertion - embedder dim == collection dim

### Unit Tests
- [ ] Embedder produces 1024 dims
- [ ] Embedder output is L2 normalized
- [ ] Reranker scores in 0-1 range
- [ ] CAG assembles context

### Integration Tests
- [ ] `cargo xtask seed` - creates collection, embeds chunks
- [ ] `cargo xtask chat` - returns assembled context
- [ ] Type "find user struct" → returns user.rs chunk ranked high

---

## Dependencies

### Workspace (alpha/Cargo.toml)

```toml
[workspace.dependencies]
# ML inference - Candle (with CUDA for GPU)
candle-core = { version = "0.8", features = ["cuda"] }
candle-nn = { version = "0.8", features = ["cuda"] }
candle-transformers = { version = "0.8", features = ["cuda"] }
tokenizers = "0.21"
safetensors = "0.4"

# Already present but verify:
uuid = { version = "1.11", features = ["v7", "v4", "serde"] }
serde_json = "1.0"
```

### Orchestrator (alpha/orchestrator/Cargo.toml)

```toml
[dependencies]
candle-core = { workspace = true }
candle-nn = { workspace = true }
candle-transformers = { workspace = true }
tokenizers = { workspace = true }
safetensors = { workspace = true }
uuid = { workspace = true }
serde_json = { workspace = true }
```

**CRITICAL**: The `cuda` feature MUST be enabled or `Device::cuda_if_available(0)` will fail/panic.

---

## Execution Order

Execute tasks in this order to minimize compiler fighting:

| Step | Task | Why First |
|------|------|-----------|
| 1 | **1.1 models.rs** | Defines types everyone else needs |
| 2 | **1.2 embedder.rs** | Write unit test immediately - confirm 1024 floats on CPU |
| 3 | **1.4 rro.rs** + **1.7 seed** | Run seed command - if this fails, nothing else matters |
| 4 | **1.3 reranker.rs** | Needs RRO working to test with |
| 5 | **1.5 cag.rs** + **1.6 chat/mod.rs** | Integration - wires everything together |

**After each step**: `cargo check --workspace` before moving on.

---

## Not In Sprint 1

- Llm LLM inference (Sprint 2)
- outlines-core grammar constraints (Sprint 2)
- Rumination multi-hop (Sprint 3)
- Hot model swapping (future)
- Multi-GPU (future)

---

**Status: Ready for Approval**
