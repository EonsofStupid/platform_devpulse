# outlines-core Integration Guide for DevPulse

| Field | Value |
|-------|-------|
| **Status** | `DRAFT` |
| **Version** | `0.1.0` |
| **Last Updated** | `2026-01-05` |
| **Owner** | `@jesse` |
| **Part of** | DevPulse Platform - Cortex Module |

---

## Executive Summary

This document specifies how DevPulse integrates `outlines-core` (v0.2.13) for grammar-constrained generation within the rumination architecture. The key insight: **outlines-core provides token masking, not inference** — your Candle-based Llm owns the generation loop.

---

## 1. Architecture Overview

### 1.1 Why outlines-core (Not Kalosm)

| Requirement | Kalosm Problem | outlines-core Solution |
|-------------|----------------|------------------------|
| Multi-hop orchestration | Single `task.run()` — no hop control | You control the loop |
| CAG context assembly | Kalosm manages context | Pre-built blobs injected |
| Multiple concurrent models | One model per task | Same Index works with any model |
| Latency budgets (<50ms/<500ms/2-5s) | Abstracted away | You measure, you control |
| Frame spawn/kill | No concept | Inject/remove personas freely |
| Interrupt/cancel (deadman switch) | Abstracted | Check between tokens |

### 1.2 Integration Pattern

```
Signal arrives
    ↓
SignalKind.profile() → Processing::Rumination
    ↓
CAG assembles context blob (RRO + libSQL + cross-encoder rerank)
    ↓
Frame SPAWNS (persona + COSTAR+ instructions)
    ↓
Prompt assembled (Frame + Context)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  CANDLE + outlines-core GENERATION LOOP                     │
│                                                             │
│  1. Forward pass through Qwen3-VL-4B → logits               │
│  2. index.allowed_tokens(state) → valid token IDs           │
│  3. Mask logits: invalid tokens → -∞                        │
│  4. Sample from masked distribution                         │
│  5. index.next_state(state, token_id) → advance FSM         │
│  6. Check index.is_final_state() or max_tokens              │
│  7. Check deadman switch (mouse shake → abort)              │
│  8. Loop until complete                                     │
│                                                             │
│  Output: Guaranteed valid JSON matching schema              │
└─────────────────────────────────────────────────────────────┘
    ↓
Parse JSON → MissionPlan / HopResult / DirectionSet
    ↓
Frame KILLED
    ↓
Evaluate → Generate 1-5 Directions → Next hop or complete
```

---

## 2. Core Components

### 2.1 outlines-core API Surface

```rust
use outlines_core::prelude::*;

// === JSON Schema → Regex ===
let regex: String = json_schema::regex_from_str(
    &schema_json,      // JSON schema as string
    None,              // Optional whitespace pattern override
    None,              // Optional settings
)?;

// === Vocabulary Construction ===
// Option A: From pretrained (downloads tokenizer.json from HF)
let vocab = Vocabulary::from_pretrained("Qwen/Qwen3-0.6B", None)?;

// Option B: Manual construction (for custom/local tokenizers)
let mut vocab = Vocabulary::new(151645);  // eos_token_id for Qwen3
vocab.try_insert("hello", 0)?;
vocab.try_insert(vec![32], 1)?;  // Can insert by bytes

// Option C: From HashMap (bulk construction)
use rustc_hash::FxHashMap;
let mut tokens: FxHashMap<String, Vec<u32>> = FxHashMap::default();
tokens.insert("{".to_string(), vec![123]);
// ... populate from tokenizer
let vocab = Vocabulary::try_from((151645, tokens))?;

// === Index Construction (EXPENSIVE - cache this!) ===
let index = Index::new(&regex, &vocab)?;

// === Index API ===
let initial: u32 = index.initial_state();
let allowed: Option<&[u32]> = index.allowed_tokens(&state);
let next: Option<u32> = index.next_state(&state, &token_id);
let finals: &[u32] = index.final_states();
let is_final: bool = index.is_final_state(&state);
let transitions: &[(u32, u32, u32)] = index.transitions();  // (from, token, to)
```

### 2.2 Qwen3 Vocabulary Specifics

```rust
// Qwen3 tokenizer details (from HuggingFace config)
pub const QWEN3_VOCAB_SIZE: usize = 151936;
pub const QWEN3_EOS_TOKEN_ID: u32 = 151645;      // <|endoftext|>
pub const QWEN3_PAD_TOKEN_ID: u32 = 151643;
pub const QWEN3_THINK_START: u32 = 151667;       // <think>
pub const QWEN3_THINK_END: u32 = 151668;         // </think>

// Special tokens to handle
pub const QWEN3_SPECIAL_TOKENS: &[(&str, u32)] = &[
    ("<|endoftext|>", 151645),
    ("<|im_start|>", 151644),
    ("<|im_end|>", 151645),
    ("<think>", 151667),
    ("</think>", 151668),
];
```

### 2.3 Building Vocabulary from Qwen3 Tokenizer

```rust
// orchestrator/infra/vocab_builder.rs

use tokenizers::Tokenizer;
use outlines_core::Vocabulary;
use rustc_hash::FxHashMap;
use anyhow::Result;

pub fn build_qwen3_vocabulary(tokenizer_path: &str) -> Result<Vocabulary> {
    let tokenizer = Tokenizer::from_file(tokenizer_path)?;
    let vocab_map = tokenizer.get_vocab(true);  // include added tokens
    
    let mut tokens: FxHashMap<Vec<u8>, Vec<u32>> = FxHashMap::default();
    
    for (token_str, token_id) in vocab_map {
        // Convert token string to bytes
        // Handle special tokens that may have unicode replacements
        let bytes = token_str.as_bytes().to_vec();
        
        tokens
            .entry(bytes)
            .or_insert_with(Vec::new)
            .push(token_id);
    }
    
    let vocab = Vocabulary::try_from((QWEN3_EOS_TOKEN_ID, tokens))?;
    Ok(vocab)
}

// Cache the vocabulary - it's expensive to rebuild
lazy_static::lazy_static! {
    pub static ref QWEN3_VOCAB: Vocabulary = {
        build_qwen3_vocabulary("models/qwen3-vl-4b/tokenizer.json")
            .expect("Failed to build Qwen3 vocabulary")
    };
}
```

---

## 3. Schema Catalog

### 3.1 MissionPlan Schema (COSTAR+ Output)

```rust
// shared/src/types/mission.rs

use serde::{Deserialize, Serialize};

/// COSTAR+ structured output from rumination
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MissionPlan {
    /// Context: What we know, project state, recent changes
    #[serde(rename = "C")]
    pub context: String,
    
    /// Objective: Translated from vibe-speak to engineer-speak  
    #[serde(rename = "O")]
    pub objective: String,
    
    /// Style: architectural | tutorial | cli_command | refactor
    #[serde(rename = "S")]
    pub style: StyleMode,
    
    /// Tone: matched to user competency level
    #[serde(rename = "T")]
    pub tone: ToneLevel,
    
    /// Audience: the downstream AI or human consumer
    #[serde(rename = "A")]
    pub audience: String,
    
    /// Response: concrete deliverables
    #[serde(rename = "R")]
    pub response: ResponsePlan,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum StyleMode {
    Architectural,
    Tutorial,
    CliCommand,
    Refactor,
    Debug,
    Document,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ToneLevel {
    Beginner,      // Explain everything
    Intermediate,  // Assume basic knowledge
    Expert,        // Terse, technical
    Frustrated,    // Validation-first, then action
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResponsePlan {
    pub steps: Vec<String>,
    pub files_affected: Vec<String>,
    pub estimated_complexity: u8,  // 1-10
    pub verification: Vec<VerificationStep>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VerificationStep {
    pub check_type: VerifyType,
    pub target: String,
    pub expected: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum VerifyType {
    FileExists,
    SyntaxCheck,
    TypeCheck,
    UnitTest,
    LintPass,
    ManualReview,
}

impl MissionPlan {
    /// JSON Schema for outlines-core constraint
    pub const JSON_SCHEMA: &'static str = r#"{
        "type": "object",
        "properties": {
            "C": { 
                "type": "string",
                "minLength": 20,
                "maxLength": 1000
            },
            "O": { 
                "type": "string",
                "minLength": 10,
                "maxLength": 500
            },
            "S": { 
                "enum": ["architectural", "tutorial", "cli_command", "refactor", "debug", "document"]
            },
            "T": {
                "enum": ["beginner", "intermediate", "expert", "frustrated"]
            },
            "A": {
                "type": "string",
                "minLength": 5,
                "maxLength": 200
            },
            "R": {
                "type": "object",
                "properties": {
                    "steps": {
                        "type": "array",
                        "items": { "type": "string" },
                        "minItems": 1,
                        "maxItems": 10
                    },
                    "files_affected": {
                        "type": "array",
                        "items": { "type": "string" }
                    },
                    "estimated_complexity": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10
                    },
                    "verification": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "check_type": {
                                    "enum": ["file_exists", "syntax_check", "type_check", "unit_test", "lint_pass", "manual_review"]
                                },
                                "target": { "type": "string" },
                                "expected": { "type": ["string", "null"] }
                            },
                            "required": ["check_type", "target"]
                        }
                    }
                },
                "required": ["steps", "files_affected", "estimated_complexity", "verification"]
            }
        },
        "required": ["C", "O", "S", "T", "A", "R"]
    }"#;
}
```

### 3.2 HopResult Schema (Rumination Direction)

```rust
// shared/src/types/hop.rs

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HopResult {
    /// What we learned this hop
    pub insight: String,
    
    /// Confidence in this direction (0.0-1.0)
    pub confidence: f32,
    
    /// Possible next directions (1-5)
    pub directions: Vec<Direction>,
    
    /// Should we stop here?
    pub terminal: bool,
    
    /// Reasoning trace (for debugging/teaching)
    pub reasoning: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Direction {
    pub action: DirectionAction,
    pub priority: u8,  // 1-5, higher = more promising
    pub rationale: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum DirectionAction {
    DrillDeeper { focus: String },
    Pivot { reason: String, new_angle: String },
    Verify { checks: Vec<String> },
    Synthesize,
    RequestClarification { question: String },
    Complete { summary: String },
    Abort { error: String },
}

impl HopResult {
    pub const JSON_SCHEMA: &'static str = r#"{
        "type": "object",
        "properties": {
            "insight": { "type": "string", "minLength": 10 },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
            "directions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "drill_deeper": {
                                            "type": "object",
                                            "properties": { "focus": { "type": "string" } },
                                            "required": ["focus"]
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "pivot": {
                                            "type": "object",
                                            "properties": {
                                                "reason": { "type": "string" },
                                                "new_angle": { "type": "string" }
                                            },
                                            "required": ["reason", "new_angle"]
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "verify": {
                                            "type": "object",
                                            "properties": {
                                                "checks": { "type": "array", "items": { "type": "string" } }
                                            },
                                            "required": ["checks"]
                                        }
                                    }
                                },
                                { "const": "synthesize" },
                                {
                                    "type": "object",
                                    "properties": {
                                        "request_clarification": {
                                            "type": "object",
                                            "properties": { "question": { "type": "string" } },
                                            "required": ["question"]
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "complete": {
                                            "type": "object",
                                            "properties": { "summary": { "type": "string" } },
                                            "required": ["summary"]
                                        }
                                    }
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "abort": {
                                            "type": "object",
                                            "properties": { "error": { "type": "string" } },
                                            "required": ["error"]
                                        }
                                    }
                                }
                            ]
                        },
                        "priority": { "type": "integer", "minimum": 1, "maximum": 5 },
                        "rationale": { "type": "string" }
                    },
                    "required": ["action", "priority", "rationale"]
                },
                "minItems": 1,
                "maxItems": 5
            },
            "terminal": { "type": "boolean" },
            "reasoning": { "type": ["string", "null"] }
        },
        "required": ["insight", "confidence", "directions", "terminal"]
    }"#;
}
```

### 3.3 Simple Schemas for Minion Outputs

```rust
// GUARDIAN output
pub const GUARDIAN_SCHEMA: &str = r#"{
    "type": "object",
    "properties": {
        "drift_detected": { "type": "boolean" },
        "violations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "file": { "type": "string" },
                    "issue": { "type": "string" },
                    "severity": { "enum": ["info", "warning", "error"] }
                }
            }
        },
        "recommendations": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["drift_detected", "violations", "recommendations"]
}"#;

// PSYCH output (mood detection)
pub const PSYCH_SCHEMA: &str = r#"{
    "type": "object",
    "properties": {
        "valence": { "type": "number", "minimum": -1, "maximum": 1 },
        "arousal": { "type": "number", "minimum": 0, "maximum": 1 },
        "frustration_signals": { "type": "array", "items": { "type": "string" } },
        "recommended_tone": { "enum": ["soothing", "neutral", "energetic", "validation_first"] }
    },
    "required": ["valence", "arousal", "frustration_signals", "recommended_tone"]
}"#;

// ENFORCER output (COSTAR gate)
pub const ENFORCER_SCHEMA: &str = r#"{
    "type": "object",
    "properties": {
        "passes_gate": { "type": "boolean" },
        "missing_elements": { "type": "array", "items": { "enum": ["context", "objective", "style", "tone", "audience", "response"] } },
        "quality_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "suggestions": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["passes_gate", "missing_elements", "quality_score"]
}"#;
```

---

## 4. Index Management & Caching

### 4.1 The Problem: Index Compilation is SLOW

Index construction involves:
1. Parse JSON schema → regex
2. Compile regex → NFA → DFA
3. For each DFA state × vocabulary token: compute valid transitions
4. Build lookup tables

For complex schemas + 150K token vocabulary = **seconds of compute**.

### 4.2 Index Cache Architecture

```rust
// orchestrator/infra/index_cache.rs

use outlines_core::{Index, Vocabulary};
use moka::sync::Cache;
use std::hash::{Hash, Hasher};
use std::sync::Arc;
use bincode;

/// Cache key: hash of (schema + vocab_fingerprint)
#[derive(Clone, Eq, PartialEq, Hash)]
pub struct IndexCacheKey {
    schema_hash: u64,
    vocab_fingerprint: u64,
}

impl IndexCacheKey {
    pub fn new(schema: &str, vocab: &Vocabulary) -> Self {
        use std::collections::hash_map::DefaultHasher;
        
        let mut schema_hasher = DefaultHasher::new();
        schema.hash(&mut schema_hasher);
        
        // Vocab fingerprint: eos_token_id + vocab_size approximation
        let vocab_fingerprint = vocab.eos_token_id() as u64 * 1_000_000;
        
        Self {
            schema_hash: schema_hasher.finish(),
            vocab_fingerprint,
        }
    }
}

/// Thread-safe Index cache with disk persistence
pub struct IndexCache {
    /// In-memory LRU cache (hot)
    memory: Cache<IndexCacheKey, Arc<Index>>,
    
    /// Disk cache path for persistence across restarts
    disk_path: PathBuf,
    
    /// Shared vocabulary reference
    vocab: Arc<Vocabulary>,
}

impl IndexCache {
    pub fn new(vocab: Arc<Vocabulary>, cache_dir: PathBuf) -> Self {
        Self {
            memory: Cache::builder()
                .max_capacity(50)  // ~50 schemas in memory
                .time_to_idle(Duration::from_secs(3600))  // 1hr idle eviction
                .build(),
            disk_path: cache_dir.join("index_cache"),
            vocab,
        }
    }
    
    /// Get or build Index for schema
    pub fn get_or_build(&self, schema: &str) -> Result<Arc<Index>> {
        let key = IndexCacheKey::new(schema, &self.vocab);
        
        // Check memory cache first
        if let Some(index) = self.memory.get(&key) {
            return Ok(index);
        }
        
        // Check disk cache
        if let Some(index) = self.load_from_disk(&key)? {
            let arc = Arc::new(index);
            self.memory.insert(key, arc.clone());
            return Ok(arc);
        }
        
        // Build fresh
        let regex = json_schema::regex_from_str(schema, None, None)?;
        let index = Index::new(&regex, &self.vocab)?;
        let arc = Arc::new(index);
        
        // Persist
        self.save_to_disk(&key, &index)?;
        self.memory.insert(key, arc.clone());
        
        Ok(arc)
    }
    
    /// Pre-warm cache with known schemas
    pub fn warm_schemas(&self, schemas: &[&str]) {
        for schema in schemas {
            if let Err(e) = self.get_or_build(schema) {
                tracing::warn!("Failed to warm schema: {}", e);
            }
        }
    }
    
    fn disk_path_for_key(&self, key: &IndexCacheKey) -> PathBuf {
        self.disk_path.join(format!("{}_{}.bin", key.schema_hash, key.vocab_fingerprint))
    }
    
    fn load_from_disk(&self, key: &IndexCacheKey) -> Result<Option<Index>> {
        let path = self.disk_path_for_key(key);
        if !path.exists() {
            return Ok(None);
        }
        
        let bytes = std::fs::read(&path)?;
        let index: Index = bincode::deserialize(&bytes)?;
        Ok(Some(index))
    }
    
    fn save_to_disk(&self, key: &IndexCacheKey, index: &Index) -> Result<()> {
        std::fs::create_dir_all(&self.disk_path)?;
        let path = self.disk_path_for_key(key);
        let bytes = bincode::serialize(index)?;
        std::fs::write(path, bytes)?;
        Ok(())
    }
}

// Pre-warm on startup
pub fn prewarm_index_cache(cache: &IndexCache) {
    let schemas = [
        MissionPlan::JSON_SCHEMA,
        HopResult::JSON_SCHEMA,
        GUARDIAN_SCHEMA,
        PSYCH_SCHEMA,
        ENFORCER_SCHEMA,
    ];
    cache.warm_schemas(&schemas);
}
```

---

## 5. Constrained Generation Engine

### 5.1 Core Implementation

```rust
// orchestrator/cortex/constrained_gen.rs

use outlines_core::{Index, Vocabulary};
use candle_core::{Device, Tensor, DType};
use std::sync::Arc;

/// Stateful guide for grammar-constrained generation
pub struct ConstrainedGuide {
    index: Arc<Index>,
    state: u32,
    generated_tokens: Vec<u32>,
}

impl ConstrainedGuide {
    pub fn new(index: Arc<Index>) -> Self {
        Self {
            state: index.initial_state(),
            index,
            generated_tokens: Vec::new(),
        }
    }
    
    /// Get allowed token IDs for current state
    pub fn allowed_tokens(&self) -> Option<&[u32]> {
        self.index.allowed_tokens(&self.state)
    }
    
    /// Advance state after sampling a token
    /// Returns None if token is invalid (should never happen if masking works)
    pub fn advance(&mut self, token_id: u32) -> Option<u32> {
        let next = self.index.next_state(&self.state, &token_id)?;
        self.state = next;
        self.generated_tokens.push(token_id);
        Some(next)
    }
    
    /// Check if generation is complete
    pub fn is_finished(&self) -> bool {
        self.index.is_final_state(&self.state)
    }
    
    /// Reset for new generation
    pub fn reset(&mut self) {
        self.state = self.index.initial_state();
        self.generated_tokens.clear();
    }
    
    /// Get all generated tokens
    pub fn tokens(&self) -> &[u32] {
        &self.generated_tokens
    }
    
    /// Create logit mask tensor for Candle
    /// Returns tensor where valid tokens = 0.0, invalid = -inf
    pub fn create_mask(&self, vocab_size: usize, device: &Device) -> Result<Tensor> {
        let mut mask = vec![f32::NEG_INFINITY; vocab_size];
        
        if let Some(allowed) = self.allowed_tokens() {
            for &token_id in allowed {
                if (token_id as usize) < vocab_size {
                    mask[token_id as usize] = 0.0;
                }
            }
        }
        
        Tensor::from_vec(mask, vocab_size, device)
    }
    
    /// Apply mask to logits (in-place would be better but Candle tensors are immutable)
    pub fn apply_mask(&self, logits: &Tensor, device: &Device) -> Result<Tensor> {
        let mask = self.create_mask(logits.dim(0)?, device)?;
        Ok((logits + &mask)?)
    }
}
```

### 5.2 Integration with Candle Generation Loop

```rust
// orchestrator/cortex/llm.rs

use crate::constrained_gen::ConstrainedGuide;
use crate::index_cache::IndexCache;

pub struct Llm {
    model: Qwen3Model,          // Your Candle model wrapper
    tokenizer: Tokenizer,
    device: Device,
    index_cache: Arc<IndexCache>,
}

impl Llm {
    /// Generate with grammar constraint
    pub async fn generate_constrained<T: DeserializeOwned>(
        &self,
        prompt: &str,
        schema: &str,
        config: GenerationConfig,
    ) -> Result<T> {
        // Get cached Index
        let index = self.index_cache.get_or_build(schema)?;
        let mut guide = ConstrainedGuide::new(index);
        
        // Tokenize prompt
        let prompt_tokens = self.tokenizer.encode(prompt, true)?.get_ids().to_vec();
        let mut all_tokens = prompt_tokens.clone();
        
        // KV cache for efficient generation
        let mut kv_cache = self.model.empty_kv_cache();
        
        // Prefill: process prompt
        let prompt_tensor = Tensor::from_vec(
            prompt_tokens.iter().map(|&x| x as i64).collect(),
            prompt_tokens.len(),
            &self.device
        )?;
        let _ = self.model.forward(&prompt_tensor, &mut kv_cache)?;
        
        // Decode loop
        for step in 0..config.max_tokens {
            // Check termination
            if guide.is_finished() {
                break;
            }
            
            // Check deadman switch
            if config.should_abort() {
                return Err(anyhow!("Generation aborted by deadman switch"));
            }
            
            // Get logits for last token
            let last_token = Tensor::from_vec(
                vec![*all_tokens.last().unwrap() as i64],
                1,
                &self.device
            )?;
            let logits = self.model.forward(&last_token, &mut kv_cache)?;
            let logits = logits.squeeze(0)?.to_dtype(DType::F32)?;
            
            // Apply grammar mask
            let masked_logits = guide.apply_mask(&logits, &self.device)?;
            
            // Sample
            let next_token = self.sample(&masked_logits, &config)?;
            
            // Advance grammar state
            guide.advance(next_token).ok_or_else(|| {
                anyhow!("Grammar violation: token {} invalid at state", next_token)
            })?;
            
            all_tokens.push(next_token);
        }
        
        // Decode generated tokens (skip prompt)
        let generated = &all_tokens[prompt_tokens.len()..];
        let output_text = self.tokenizer.decode(generated, true)?;
        
        // Parse JSON (guaranteed valid by grammar!)
        let result: T = serde_json::from_str(&output_text)?;
        Ok(result)
    }
    
    fn sample(&self, logits: &Tensor, config: &GenerationConfig) -> Result<u32> {
        match config.sampling {
            Sampling::Greedy => {
                let token = logits.argmax(0)?.to_scalar::<i64>()? as u32;
                Ok(token)
            }
            Sampling::TopP { p, temperature } => {
                // Apply temperature
                let scaled = (logits / temperature)?;
                let probs = candle_nn::ops::softmax(&scaled, 0)?;
                
                // Top-p sampling
                let probs_vec: Vec<f32> = probs.to_vec1()?;
                let token = top_p_sample(&probs_vec, p)?;
                Ok(token)
            }
        }
    }
}

fn top_p_sample(probs: &[f32], p: f32) -> Result<u32> {
    let mut indexed: Vec<(usize, f32)> = probs.iter().cloned().enumerate().collect();
    indexed.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    
    let mut cumsum = 0.0;
    let mut candidates = Vec::new();
    for (idx, prob) in indexed {
        cumsum += prob;
        candidates.push((idx, prob));
        if cumsum >= p {
            break;
        }
    }
    
    // Renormalize and sample
    let total: f32 = candidates.iter().map(|(_, p)| p).sum();
    let mut rng = rand::thread_rng();
    let threshold: f32 = rng.gen::<f32>() * total;
    
    let mut cumsum = 0.0;
    for (idx, prob) in candidates {
        cumsum += prob;
        if cumsum >= threshold {
            return Ok(idx as u32);
        }
    }
    
    Ok(0)  // Fallback
}
```

---

## 6. Integration with CAG (Context Assembly)

### 6.1 CAG → Prompt → Constrained Generation Flow

```rust
// orchestrator/cortex/cag.rs

pub struct CAG {
    rro: RroClient,
    reranker: CrossEncoderReranker,  // Qwen3-Reranker-0.6B
    embedder: Qwen3Embedder,         // Qwen3-Embedding-0.6B
}

impl CAG {
    /// Assemble context for a signal
    pub async fn assemble(&self, signal: &Signal) -> Result<ContextBlob> {
        // 1. Embed query
        let query_embedding = self.embedder.embed(&signal.content).await?;
        
        // 2. Hybrid search: dense + BM25 + RRF fusion
        let candidates = self.rro_hybrid_search(
            &query_embedding,
            &signal.content,
            limit: 50,
        ).await?;
        
        // 3. Cross-encoder rerank
        let reranked = self.reranker.rerank(&signal.content, candidates).await?;
        
        // 4. Select top-k based on latency budget
        let top_k = match signal.kind.profile().latency_budget {
            LatencyBudget::Keystroke => 3,
            LatencyBudget::Pause => 5,
            LatencyBudget::Send => 10,
            LatencyBudget::Background => 20,
        };
        
        // 5. Hydrate from libSQL
        let chunks = self.hydrate_chunks(&reranked[..top_k]).await?;
        
        // 6. Assemble blob
        Ok(ContextBlob {
            project_context: chunks.project_summary,
            recent_changes: chunks.recent_changes,
            relevant_files: chunks.relevant_files,
            user_history: chunks.user_history,
            signal_metadata: signal.metadata.clone(),
        })
    }
}
```

### 6.2 Prompt Assembly with Frame

```rust
// orchestrator/cortex/prompt_builder.rs

pub struct PromptBuilder;

impl PromptBuilder {
    pub fn build_mission_prompt(frame: &Frame, context: &ContextBlob, signal: &Signal) -> String {
        format!(r#"<|im_start|>system
You are {name}. {description}

{instructions}

Communication style: {style}
Explanation depth: {depth}

You MUST respond with valid JSON matching this schema. No other text.
<|im_end|>

<|im_start|>context
## Project State
{project_context}

## Recent Changes
{recent_changes}

## Relevant Files
{relevant_files}

## User History
{user_history}
<|im_end|>

<|im_start|>user
{user_request}
<|im_end|>

<|im_start|>assistant
"#,
            name = frame.name,
            description = frame.description,
            instructions = frame.instructions,
            style = frame.costar_overrides.style,
            depth = frame.explanation_depth,
            project_context = context.project_context,
            recent_changes = context.recent_changes,
            relevant_files = context.relevant_files,
            user_history = context.user_history,
            user_request = signal.content,
        )
    }
    
    pub fn build_hop_prompt(
        frame: &Frame,
        context: &ContextBlob,
        previous_hop: &HopResult,
    ) -> String {
        format!(r#"<|im_start|>system
You are {name}. Continue reasoning from the previous hop.

Previous insight: {insight}
Previous confidence: {confidence}
Chosen direction: {direction}

Generate the next hop result as valid JSON.
<|im_end|>

<|im_start|>context
{context}
<|im_end|>

<|im_start|>assistant
"#,
            name = frame.name,
            insight = previous_hop.insight,
            confidence = previous_hop.confidence,
            direction = serde_json::to_string(&previous_hop.directions[0])?,
            context = context.to_summary(),
        )
    }
}
```

---

## 7. Latency Optimization

### 7.1 Pre-warming Strategies

```rust
// orchestrator/startup.rs

pub async fn initialize_cortex() -> Result<Cortex> {
    // 1. Load vocabulary ONCE
    let vocab = Arc::new(build_qwen3_vocabulary(TOKENIZER_PATH)?);
    
    // 2. Initialize index cache with pre-warming
    let index_cache = Arc::new(IndexCache::new(vocab.clone(), CACHE_DIR.into()));
    
    // Pre-warm critical schemas in background
    tokio::spawn({
        let cache = index_cache.clone();
        async move {
            prewarm_index_cache(&cache);
        }
    });
    
    // 3. Load model with KV cache pre-allocated
    let model = Qwen3Model::load(MODEL_PATH, &device)?;
    
    // 4. Initialize Llm
    let llm = Llm::new(model, tokenizer, device, index_cache);
    
    Ok(Cortex { llm, ... })
}
```

### 7.2 Latency Budgets per Signal Type

```rust
// From PHILOSOPHY.md latency requirements

pub enum LatencyBudget {
    Keystroke,   // <50ms  - Just warm cache, no generation
    Pause,       // <500ms - Quick classification only
    Send,        // 2-5s   - Full rumination
    Background,  // Minutes - Deep analysis
}

impl SignalKind {
    pub fn latency_budget(&self) -> LatencyBudget {
        match self {
            SignalKind::Keystroke(_) => LatencyBudget::Keystroke,
            SignalKind::Pause(_) => LatencyBudget::Pause,
            SignalKind::Send(_) => LatencyBudget::Send,
            SignalKind::Background(_) => LatencyBudget::Background,
        }
    }
}
```

### 7.3 Token Budget by Latency

| Budget | Max Tokens | Typical Schema | Use Case |
|--------|------------|----------------|----------|
| Keystroke | 0 | N/A | Cache warming only |
| Pause | 64 | PSYCH_SCHEMA | Mood detection |
| Send | 512 | MissionPlan | Full COSTAR+ |
| Background | 2048 | HopResult × N | Multi-hop rumination |

---

## 8. Error Handling & Recovery

### 8.1 Grammar Violation Recovery

```rust
impl Llm {
    pub async fn generate_with_retry<T: DeserializeOwned>(
        &self,
        prompt: &str,
        schema: &str,
        config: GenerationConfig,
    ) -> Result<T> {
        let mut attempts = 0;
        let max_attempts = 3;
        
        loop {
            match self.generate_constrained(prompt, schema, config.clone()).await {
                Ok(result) => return Ok(result),
                Err(e) if attempts < max_attempts => {
                    attempts += 1;
                    tracing::warn!(
                        "Generation attempt {} failed: {}. Retrying...",
                        attempts, e
                    );
                    
                    // Adjust temperature for retry
                    config.sampling = match config.sampling {
                        Sampling::TopP { p, temperature } => {
                            Sampling::TopP { p, temperature: temperature * 0.8 }
                        }
                        other => other,
                    };
                }
                Err(e) => return Err(e),
            }
        }
    }
}
```

### 8.2 Deadman Switch Integration

```rust
pub struct GenerationConfig {
    pub max_tokens: usize,
    pub sampling: Sampling,
    pub deadman_receiver: Option<tokio::sync::watch::Receiver<bool>>,
}

impl GenerationConfig {
    pub fn should_abort(&self) -> bool {
        self.deadman_receiver
            .as_ref()
            .map(|rx| *rx.borrow())
            .unwrap_or(false)
    }
}

// In UI layer
pub fn setup_deadman_switch() -> tokio::sync::watch::Sender<bool> {
    let (tx, _rx) = tokio::sync::watch::channel(false);
    
    // Mouse shake detection triggers abort
    tokio::spawn(async move {
        let mut detector = MouseShakeDetector::new();
        loop {
            if detector.check_shake().await {
                let _ = tx.send(true);
            }
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    });
    
    tx
}
```

---

## 9. Testing Strategy

### 9.1 Schema Validation Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_mission_plan_schema_compiles() {
        let regex = json_schema::regex_from_str(
            MissionPlan::JSON_SCHEMA,
            None,
            None
        );
        assert!(regex.is_ok(), "Schema should compile to regex");
    }
    
    #[test]
    fn test_mission_plan_roundtrip() {
        let plan = MissionPlan {
            context: "User wants login feature...".into(),
            objective: "Create LoginForm component".into(),
            style: StyleMode::Architectural,
            tone: ToneLevel::Intermediate,
            audience: "Claude Sonnet via API".into(),
            response: ResponsePlan {
                steps: vec!["Create component".into()],
                files_affected: vec!["src/auth/LoginForm.tsx".into()],
                estimated_complexity: 3,
                verification: vec![],
            },
        };
        
        let json = serde_json::to_string(&plan).unwrap();
        let parsed: MissionPlan = serde_json::from_str(&json).unwrap();
        assert_eq!(plan.objective, parsed.objective);
    }
    
    #[test]
    fn test_constrained_generation_produces_valid_json() {
        // This requires model loaded - mark as integration test
        // #[ignore] for unit test runs
    }
}
```

### 9.2 ROTI Measurement Points

```rust
pub struct ROTIMeasurement {
    pub task_start: Instant,
    pub cache_lookup_ms: u64,
    pub index_build_ms: Option<u64>,  // None if cache hit
    pub generation_ms: u64,
    pub tokens_generated: usize,
    pub schema_complexity: usize,  // Number of properties
}

impl ROTIMeasurement {
    pub fn roti_score(&self) -> f64 {
        let time_invested = self.total_ms() as f64;
        let task_value = self.tokens_generated as f64 * 0.1;  // Crude approximation
        let context_value = if self.index_build_ms.is_none() { 50.0 } else { 0.0 };  // Cache hit bonus
        
        (task_value + context_value) / (time_invested / 1000.0)
    }
}
```

---

## 10. File Structure

```
orchestrator/
├── cortex/
│   ├── llm.rs              # Candle model wrapper + generate_constrained
│   ├── constrained_gen.rs    # ConstrainedGuide implementation
│   ├── prompt_builder.rs     # Frame + Context → Prompt
│   ├── cag.rs                # Context Assembly Graph
│   └── rumination.rs         # Multi-hop orchestration
├── infra/
│   ├── index_cache.rs        # IndexCache with disk persistence
│   ├── vocab_builder.rs      # Qwen3 vocabulary construction
│   └── deadman.rs            # Abort signal handling
└── frames/
    ├── catalog.rs            # Frame definitions
    └── selector.rs           # Signal → Frame routing

shared/
└── types/
    ├── mission.rs            # MissionPlan + JSON_SCHEMA
    ├── hop.rs                # HopResult + Direction
    └── minion_outputs.rs     # GUARDIAN, PSYCH, ENFORCER schemas
```

---

## 11. Dependencies

```toml
# Cargo.toml additions

[dependencies]
outlines-core = "0.2.13"
candle-core = "0.8"
candle-nn = "0.8"
candle-transformers = "0.8"
tokenizers = "0.21"
rro-client = "1.12"
moka = { version = "0.12", features = ["sync"] }
bincode = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rustc-hash = "2.1"
anyhow = "1.0"
tracing = "0.1"
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Index compilation OOM on complex schemas | High | Limit schema complexity, monitor memory, cache aggressively |
| Qwen3 tokenizer mismatch with outlines-core | High | Build vocabulary from same tokenizer.json, validate on startup |
| Grammar gets stuck (no valid tokens) | Medium | Detect and fallback to unconstrained with JSON repair |
| Cache invalidation on schema change | Low | Hash schema in cache key, version schemas |
| bincode format changes break cache | Low | Version cache files, rebuild on incompatibility |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-05 | Initial integration guide |

---

*This document should be read alongside PHILOSOPHY.md for the "why" behind these technical decisions.*
