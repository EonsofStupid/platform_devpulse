# Retrieval Pipeline Integration: RRO + Qwen3 + outlines-core

| Field | Value |
|-------|-------|
| **Status** | `DRAFT` |
| **Version** | `0.1.0` |
| **Last Updated** | `2026-01-05` |
| **Owner** | `@jesse` |
| **Part of** | DevPulse Platform - CAG Module |

---

## Overview

This document specifies how the retrieval pipeline (CAG) integrates with grammar-constrained generation. The key insight: **retrieval quality directly impacts generation quality** — pristine context enables smaller models to outperform larger ones with poor context.

---

## 1. Pipeline Architecture

```
User Signal
    ↓
┌─────────────────────────────────────────────────────────────┐
│  EMBEDDING STAGE (Qwen3-Embedding-0.6B)                     │
│  Signal → 1024-dim dense vector                             │
│  Latency: ~5ms                                              │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  HYBRID SEARCH (RRO)                                     │
│                                                             │
│  Dense: cosine similarity on signal embedding               │
│  Sparse: BM25 on tokenized signal text                      │
│  Fusion: RRF (Reciprocal Rank Fusion)                       │
│                                                             │
│  Output: 50 candidates                                      │
│  Latency: ~20ms                                             │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  RERANKING (Qwen3-Reranker-0.6B)                           │
│                                                             │
│  Cross-encoder: (query, document) → relevance score         │
│  Batch processing for efficiency                            │
│                                                             │
│  Output: Top-k ranked documents                             │
│  Latency: ~50ms for 50 docs                                 │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  HYDRATION (libSQL)                                         │
│                                                             │
│  Point IDs → Full document content + metadata               │
│  Joined with project/session context                        │
│                                                             │
│  Latency: ~5ms                                              │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  CONTEXT ASSEMBLY                                           │
│                                                             │
│  Documents → ContextBlob                                    │
│  Token budget enforcement                                   │
│  Deduplication & ordering                                   │
│                                                             │
│  Output: Ready for prompt injection                         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  CONSTRAINED GENERATION (Qwen3-VL-4B + outlines-core)      │
│                                                             │
│  Prompt + ContextBlob → Grammar-constrained output          │
│  Guaranteed valid JSON                                      │
│                                                             │
│  Latency: 500ms - 5s depending on output length             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. RRO Configuration

### 2.1 Collection Schema

```rust
use rro_client::rro::{
    CreateCollectionBuilder, Distance, VectorParamsBuilder,
    SparseVectorParamsBuilder, MultiVectorConfigBuilder,
};

pub async fn create_devpulse_collection(client: &RRO) -> Result<()> {
    client.create_collection(
        CreateCollectionBuilder::new("devpulse_chunks")
            // Dense vectors from Qwen3-Embedding-0.6B
            .vectors_config(
                VectorParamsBuilder::new(1024, Distance::Cosine)
                    .on_disk(true)  // Keep HNSW index in memory, vectors on disk
            )
            // Sparse vectors for BM25
            .sparse_vectors_config(
                SparseVectorParamsBuilder::new()
                    .index(SparseIndexConfigBuilder::default())
            )
            // Late interaction vectors for ColBERT reranking (optional)
            .vectors_config_map([(
                "colbert",
                VectorParamsBuilder::new(128, Distance::Cosine)
                    .multivector_config(MultiVectorConfigBuilder::default())
            )])
            // Quantization for memory efficiency
            .quantization_config(
                ScalarQuantizationBuilder::default()
                    .quantile(0.99)
                    .always_ram(true)
            )
    ).await?;
    
    Ok(())
}
```

### 2.2 Payload Schema

```rust
use serde::{Deserialize, Serialize};
use rro_client::Payload;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChunkPayload {
    /// Unique chunk ID (matches libSQL)
    pub chunk_id: String,
    
    /// Source document path
    pub source_path: String,
    
    /// Chunk type for filtering
    pub chunk_type: ChunkType,
    
    /// Project ID for multi-tenancy
    pub project_id: String,
    
    /// Session ID for recency filtering
    pub session_id: Option<String>,
    
    /// Timestamp for time-decay scoring
    pub created_at: i64,
    
    /// Preview text for quick display (first 200 chars)
    pub preview: String,
    
    /// Semantic tags extracted by GUARDIAN
    pub tags: Vec<String>,
    
    /// Language/framework markers
    pub tech_stack: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ChunkType {
    /// Source code
    Code,
    /// Documentation/comments
    Documentation,
    /// Config files (toml, json, yaml)
    Config,
    /// Conversation history
    Conversation,
    /// User memory/preferences
    Memory,
    /// Error logs/stack traces
    Error,
    /// Project structure/manifest
    Structure,
}

impl From<ChunkPayload> for Payload {
    fn from(p: ChunkPayload) -> Self {
        serde_json::to_value(p)
            .expect("ChunkPayload serialization")
            .try_into()
            .expect("Payload conversion")
    }
}
```

### 2.3 Upsert with Multiple Vectors

```rust
use rro_client::rro::{PointStruct, vectors::VectorsOptions, NamedVectors};

pub async fn upsert_chunk(
    client: &RRO,
    chunk: &Chunk,
    dense_embedding: Vec<f32>,
    sparse_embedding: SparseVector,
) -> Result<()> {
    let point = PointStruct {
        id: Some(chunk.id.into()),
        vectors: Some(VectorsOptions::Vectors(NamedVectors {
            vectors: [
                ("".to_string(), dense_embedding.into()),
            ].into_iter().collect(),
        })),
        payload: ChunkPayload::from(chunk).into(),
    };
    
    client.upsert_points(
        UpsertPointsBuilder::new("devpulse_chunks", vec![point])
            .wait(true)
    ).await?;
    
    Ok(())
}
```

---

## 3. Embedding with Qwen3-Embedding-0.6B

### 3.1 Model Loading (Candle)

```rust
// orchestrator/infra/embedder.rs

use candle_core::{Device, Tensor, DType};
use candle_nn::VarBuilder;
use tokenizers::Tokenizer;

pub struct Qwen3Embedder {
    model: Qwen3EmbeddingModel,
    tokenizer: Tokenizer,
    device: Device,
    dim: usize,  // 1024 for Qwen3-Embedding-0.6B
}

impl Qwen3Embedder {
    pub async fn load(model_path: &str, device: Device) -> Result<Self> {
        let tokenizer = Tokenizer::from_file(format!("{}/tokenizer.json", model_path))?;
        
        let vb = VarBuilder::from_gguf(
            format!("{}/model.gguf", model_path),
            &device
        )?;
        
        let model = Qwen3EmbeddingModel::new(&vb)?;
        
        Ok(Self {
            model,
            tokenizer,
            device,
            dim: 1024,
        })
    }
    
    /// Embed a single text
    pub async fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let tokens = self.tokenizer.encode(text, true)?;
        let input_ids: Vec<i64> = tokens.get_ids().iter().map(|&x| x as i64).collect();
        
        let input = Tensor::from_vec(input_ids, tokens.len(), &self.device)?
            .unsqueeze(0)?;  // Add batch dim
        
        let embeddings = self.model.forward(&input)?;
        
        // Mean pooling over sequence
        let pooled = embeddings.mean(1)?;  // [batch, dim]
        
        // L2 normalize
        let norm = pooled.sqr()?.sum(1)?.sqrt()?;
        let normalized = pooled.broadcast_div(&norm.unsqueeze(1)?)?;
        
        // Extract first (only) batch element
        let embedding: Vec<f32> = normalized.squeeze(0)?.to_vec1()?;
        
        Ok(embedding)
    }
    
    /// Batch embed multiple texts
    pub async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        // Tokenize all with padding
        let encodings = self.tokenizer.encode_batch(texts.to_vec(), true)?;
        
        let max_len = encodings.iter().map(|e| e.len()).max().unwrap_or(0);
        
        // Pad and stack
        let mut input_ids = Vec::with_capacity(texts.len() * max_len);
        let mut attention_mask = Vec::with_capacity(texts.len() * max_len);
        
        for encoding in &encodings {
            let ids = encoding.get_ids();
            let pad_len = max_len - ids.len();
            
            input_ids.extend(ids.iter().map(|&x| x as i64));
            input_ids.extend(std::iter::repeat(0i64).take(pad_len));
            
            attention_mask.extend(std::iter::repeat(1.0f32).take(ids.len()));
            attention_mask.extend(std::iter::repeat(0.0f32).take(pad_len));
        }
        
        let input = Tensor::from_vec(input_ids, (texts.len(), max_len), &self.device)?;
        let mask = Tensor::from_vec(attention_mask, (texts.len(), max_len), &self.device)?;
        
        let embeddings = self.model.forward(&input)?;
        
        // Masked mean pooling
        let mask_expanded = mask.unsqueeze(2)?.broadcast_as(embeddings.shape())?;
        let sum = (embeddings * &mask_expanded)?.sum(1)?;
        let count = mask.sum(1)?.unsqueeze(1)?;
        let pooled = sum.broadcast_div(&count)?;
        
        // L2 normalize
        let norm = pooled.sqr()?.sum(1)?.sqrt()?.unsqueeze(1)?;
        let normalized = pooled.broadcast_div(&norm)?;
        
        // Extract each embedding
        let mut results = Vec::with_capacity(texts.len());
        for i in 0..texts.len() {
            let emb: Vec<f32> = normalized.get(i)?.to_vec1()?;
            results.push(emb);
        }
        
        Ok(results)
    }
}
```

### 3.2 Sparse Vector Generation (BM25)

```rust
// orchestrator/infra/sparse_encoder.rs

use std::collections::HashMap;

pub struct BM25Encoder {
    /// Token → IDF score
    idf: HashMap<String, f32>,
    /// Average document length
    avgdl: f32,
    /// BM25 parameters
    k1: f32,
    b: f32,
}

impl BM25Encoder {
    pub fn new(corpus_stats: &CorpusStats) -> Self {
        Self {
            idf: corpus_stats.idf.clone(),
            avgdl: corpus_stats.avgdl,
            k1: 1.5,
            b: 0.75,
        }
    }
    
    /// Encode text to sparse vector
    pub fn encode(&self, text: &str) -> SparseVector {
        let tokens = tokenize(text);
        let doc_len = tokens.len() as f32;
        
        // Count term frequencies
        let mut tf: HashMap<&str, u32> = HashMap::new();
        for token in &tokens {
            *tf.entry(token.as_str()).or_insert(0) += 1;
        }
        
        // Build sparse vector
        let mut indices = Vec::new();
        let mut values = Vec::new();
        
        for (token, count) in tf {
            if let Some(&idf) = self.idf.get(token) {
                let tf_score = (count as f32 * (self.k1 + 1.0)) /
                    (count as f32 + self.k1 * (1.0 - self.b + self.b * doc_len / self.avgdl));
                
                let score = idf * tf_score;
                
                // Token index (hash to fixed space)
                let idx = hash_token(token) % 30000;
                indices.push(idx);
                values.push(score);
            }
        }
        
        SparseVector { indices, values }
    }
}

fn tokenize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty() && s.len() > 2)
        .map(|s| s.to_string())
        .collect()
}

fn hash_token(token: &str) -> u32 {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    token.hash(&mut hasher);
    hasher.finish() as u32
}
```

---

## 4. Hybrid Search with RRF

### 4.1 Search Implementation

```rust
// orchestrator/cortex/cag.rs

use rro_client::rro::{
    SearchPointsBuilder, SearchBatchPointsBuilder,
    Filter, Condition, FieldCondition, Match,
    with_payload_selector::SelectorOptions, WithPayloadSelector,
};

impl CAG {
    /// Hybrid search with RRF fusion
    pub async fn hybrid_search(
        &self,
        query: &str,
        project_id: &str,
        limit: usize,
    ) -> Result<Vec<ScoredChunk>> {
        // 1. Embed query
        let dense_embedding = self.embedder.embed(query).await?;
        let sparse_embedding = self.sparse_encoder.encode(query);
        
        // 2. Build filter
        let filter = Filter::must([
            Condition::Field(FieldCondition {
                key: "project_id".to_string(),
                r#match: Some(Match::keyword(project_id)),
                ..Default::default()
            })
        ]);
        
        // 3. Dense search
        let dense_results = self.rro.search_points(
            SearchPointsBuilder::new("devpulse_chunks", dense_embedding, limit * 2)
                .filter(filter.clone())
                .with_payload(WithPayloadSelector {
                    selector_options: Some(SelectorOptions::Enable(true))
                })
        ).await?;
        
        // 4. Sparse search
        let sparse_results = self.rro.search_points(
            SearchPointsBuilder::new("devpulse_chunks", sparse_embedding, limit * 2)
                .filter(filter)
                .with_payload(WithPayloadSelector {
                    selector_options: Some(SelectorOptions::Enable(true))
                })
        ).await?;
        
        // 5. RRF fusion
        let fused = self.rrf_fusion(&dense_results.result, &sparse_results.result, limit);
        
        Ok(fused)
    }
    
    /// Reciprocal Rank Fusion
    fn rrf_fusion(
        &self,
        dense: &[ScoredPoint],
        sparse: &[ScoredPoint],
        limit: usize,
    ) -> Vec<ScoredChunk> {
        const K: f32 = 60.0;  // RRF constant
        
        let mut scores: HashMap<PointId, f32> = HashMap::new();
        let mut payloads: HashMap<PointId, Payload> = HashMap::new();
        
        // Score from dense results
        for (rank, point) in dense.iter().enumerate() {
            let rrf_score = 1.0 / (K + rank as f32 + 1.0);
            *scores.entry(point.id.clone()).or_insert(0.0) += rrf_score;
            payloads.insert(point.id.clone(), point.payload.clone());
        }
        
        // Score from sparse results
        for (rank, point) in sparse.iter().enumerate() {
            let rrf_score = 1.0 / (K + rank as f32 + 1.0);
            *scores.entry(point.id.clone()).or_insert(0.0) += rrf_score;
            if !payloads.contains_key(&point.id) {
                payloads.insert(point.id.clone(), point.payload.clone());
            }
        }
        
        // Sort by fused score
        let mut results: Vec<_> = scores.into_iter().collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        // Convert to ScoredChunk
        results.into_iter()
            .take(limit)
            .map(|(id, score)| {
                let payload = payloads.remove(&id).unwrap();
                ScoredChunk {
                    id: id.into(),
                    score,
                    payload: serde_json::from_value(payload.into()).unwrap(),
                }
            })
            .collect()
    }
}
```

---

## 5. Cross-Encoder Reranking

### 5.1 Qwen3-Reranker-0.6B Integration

```rust
// orchestrator/infra/reranker.rs

pub struct Qwen3Reranker {
    model: Qwen3RerankerModel,
    tokenizer: Tokenizer,
    device: Device,
}

impl Qwen3Reranker {
    pub async fn load(model_path: &str, device: Device) -> Result<Self> {
        let tokenizer = Tokenizer::from_file(format!("{}/tokenizer.json", model_path))?;
        let vb = VarBuilder::from_gguf(format!("{}/model.gguf", model_path), &device)?;
        let model = Qwen3RerankerModel::new(&vb)?;
        
        Ok(Self { model, tokenizer, device })
    }
    
    /// Rerank documents by relevance to query
    pub async fn rerank(
        &self,
        query: &str,
        documents: Vec<ScoredChunk>,
    ) -> Result<Vec<ScoredChunk>> {
        if documents.is_empty() {
            return Ok(documents);
        }
        
        // Build query-document pairs
        let pairs: Vec<String> = documents.iter()
            .map(|doc| format!(
                "<|im_start|>user\n{}\n<|im_end|>\n<|im_start|>assistant\n{}\n<|im_end|>",
                query,
                doc.payload.preview
            ))
            .collect();
        
        // Tokenize
        let encodings = self.tokenizer.encode_batch(pairs, true)?;
        let max_len = encodings.iter().map(|e| e.len()).min().unwrap_or(512).min(512);
        
        // Pad/truncate and stack
        let mut input_ids = Vec::new();
        for encoding in &encodings {
            let ids = encoding.get_ids();
            if ids.len() >= max_len {
                input_ids.extend(&ids[..max_len]);
            } else {
                input_ids.extend(ids);
                input_ids.extend(std::iter::repeat(0).take(max_len - ids.len()));
            }
        }
        
        let input = Tensor::from_vec(
            input_ids.iter().map(|&x| x as i64).collect(),
            (documents.len(), max_len),
            &self.device
        )?;
        
        // Get relevance scores
        let scores = self.model.forward(&input)?;  // [batch, 1]
        let scores: Vec<f32> = scores.squeeze(1)?.to_vec1()?;
        
        // Combine with documents and sort
        let mut reranked: Vec<_> = documents.into_iter()
            .zip(scores.into_iter())
            .map(|(mut doc, score)| {
                doc.score = score;  // Replace with reranker score
                doc
            })
            .collect();
        
        reranked.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        
        Ok(reranked)
    }
}
```

### 5.2 Batched Reranking for Efficiency

```rust
impl Qwen3Reranker {
    /// Rerank with batching for memory efficiency
    pub async fn rerank_batched(
        &self,
        query: &str,
        documents: Vec<ScoredChunk>,
        batch_size: usize,
    ) -> Result<Vec<ScoredChunk>> {
        let mut all_scored = Vec::with_capacity(documents.len());
        
        for chunk in documents.chunks(batch_size) {
            let batch_docs: Vec<ScoredChunk> = chunk.to_vec();
            let mut scored = self.rerank(query, batch_docs).await?;
            all_scored.append(&mut scored);
        }
        
        // Final sort
        all_scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        
        Ok(all_scored)
    }
}
```

---

## 6. Context Assembly (ContextBlob)

### 6.1 Token Budget Management

```rust
// orchestrator/cortex/context_blob.rs

use tiktoken_rs::cl100k_base;

pub struct ContextBlob {
    /// Project-level context (always included)
    pub project_context: String,
    
    /// Recent changes (time-weighted)
    pub recent_changes: String,
    
    /// Retrieved relevant chunks
    pub relevant_chunks: Vec<RetrievedChunk>,
    
    /// User session history
    pub session_history: String,
    
    /// Total token count
    pub token_count: usize,
}

pub struct ContextBlobBuilder {
    max_tokens: usize,
    current_tokens: usize,
    tokenizer: tiktoken_rs::CoreBPE,
    
    project_context: Option<String>,
    recent_changes: Vec<String>,
    relevant_chunks: Vec<RetrievedChunk>,
    session_history: Vec<String>,
}

impl ContextBlobBuilder {
    pub fn new(max_tokens: usize) -> Self {
        Self {
            max_tokens,
            current_tokens: 0,
            tokenizer: cl100k_base().unwrap(),
            project_context: None,
            recent_changes: Vec::new(),
            relevant_chunks: Vec::new(),
            session_history: Vec::new(),
        }
    }
    
    /// Add project context (always included, counts against budget)
    pub fn with_project_context(mut self, ctx: String) -> Self {
        let tokens = self.tokenizer.encode_with_special_tokens(&ctx).len();
        self.current_tokens += tokens;
        self.project_context = Some(ctx);
        self
    }
    
    /// Add retrieved chunks until budget exhausted
    pub fn with_chunks(mut self, chunks: Vec<RetrievedChunk>) -> Self {
        for chunk in chunks {
            let tokens = self.tokenizer.encode_with_special_tokens(&chunk.content).len();
            
            if self.current_tokens + tokens > self.max_tokens {
                break;  // Budget exhausted
            }
            
            self.current_tokens += tokens;
            self.relevant_chunks.push(chunk);
        }
        self
    }
    
    /// Add recent changes (newest first, until budget)
    pub fn with_recent_changes(mut self, changes: Vec<String>) -> Self {
        for change in changes {
            let tokens = self.tokenizer.encode_with_special_tokens(&change).len();
            
            if self.current_tokens + tokens > self.max_tokens {
                break;
            }
            
            self.current_tokens += tokens;
            self.recent_changes.push(change);
        }
        self
    }
    
    /// Build final blob
    pub fn build(self) -> ContextBlob {
        ContextBlob {
            project_context: self.project_context.unwrap_or_default(),
            recent_changes: self.recent_changes.join("\n---\n"),
            relevant_chunks: self.relevant_chunks,
            session_history: self.session_history.join("\n"),
            token_count: self.current_tokens,
        }
    }
}
```

### 6.2 Deduplication Strategy

```rust
impl ContextBlobBuilder {
    /// Deduplicate chunks by content similarity
    pub fn deduplicate_chunks(mut self, threshold: f32) -> Self {
        if self.relevant_chunks.len() < 2 {
            return self;
        }
        
        let mut keep = vec![true; self.relevant_chunks.len()];
        
        for i in 0..self.relevant_chunks.len() {
            if !keep[i] { continue; }
            
            for j in (i + 1)..self.relevant_chunks.len() {
                if !keep[j] { continue; }
                
                let sim = jaccard_similarity(
                    &self.relevant_chunks[i].content,
                    &self.relevant_chunks[j].content,
                );
                
                if sim > threshold {
                    // Keep higher-scored one
                    if self.relevant_chunks[i].score >= self.relevant_chunks[j].score {
                        keep[j] = false;
                    } else {
                        keep[i] = false;
                        break;
                    }
                }
            }
        }
        
        self.relevant_chunks = self.relevant_chunks
            .into_iter()
            .enumerate()
            .filter(|(i, _)| keep[*i])
            .map(|(_, c)| c)
            .collect();
        
        self
    }
}

fn jaccard_similarity(a: &str, b: &str) -> f32 {
    let set_a: HashSet<_> = a.split_whitespace().collect();
    let set_b: HashSet<_> = b.split_whitespace().collect();
    
    let intersection = set_a.intersection(&set_b).count();
    let union = set_a.union(&set_b).count();
    
    if union == 0 { 0.0 } else { intersection as f32 / union as f32 }
}
```

---

## 7. Integration with outlines-core Generation

### 7.1 Full Pipeline

```rust
// orchestrator/cortex/pipeline.rs

pub struct RuminationPipeline {
    cag: CAG,
    llm: Llm,
    frame_catalog: FrameCatalog,
}

impl RuminationPipeline {
    pub async fn process_signal(&self, signal: Signal) -> Result<RuminationResult> {
        let timer = Instant::now();
        
        // 1. Assemble context
        let context = self.cag.assemble(&signal).await?;
        let cag_latency = timer.elapsed();
        
        // 2. Select frame based on signal + context
        let frame = self.frame_catalog.select(&signal, &context);
        
        // 3. Build prompt
        let prompt = PromptBuilder::build_mission_prompt(&frame, &context, &signal);
        
        // 4. Generate with grammar constraint
        let gen_start = Instant::now();
        let mission: MissionPlan = self.llm.generate_constrained(
            &prompt,
            MissionPlan::JSON_SCHEMA,
            GenerationConfig {
                max_tokens: 512,
                sampling: Sampling::TopP { p: 0.95, temperature: 0.6 },
                deadman_receiver: None,
            }
        ).await?;
        let gen_latency = gen_start.elapsed();
        
        // 5. Record metrics
        let metrics = PipelineMetrics {
            cag_latency,
            gen_latency,
            total_latency: timer.elapsed(),
            context_tokens: context.token_count,
            output_tokens: mission.response.steps.len() * 20,  // Estimate
            cache_hit: false,  // From index cache stats
        };
        
        Ok(RuminationResult {
            mission,
            metrics,
            frame_used: frame.id,
        })
    }
}
```

### 7.2 Multi-Hop Rumination

```rust
impl RuminationPipeline {
    pub async fn multi_hop_rumination(
        &self,
        signal: Signal,
        max_hops: usize,
    ) -> Result<Vec<HopResult>> {
        let mut hops = Vec::new();
        let mut context = self.cag.assemble(&signal).await?;
        
        for hop_num in 0..max_hops {
            // Build hop-specific prompt
            let prompt = if hops.is_empty() {
                PromptBuilder::build_initial_hop(&context, &signal)
            } else {
                PromptBuilder::build_continuation_hop(&context, hops.last().unwrap())
            };
            
            // Generate hop result
            let hop: HopResult = self.llm.generate_constrained(
                &prompt,
                HopResult::JSON_SCHEMA,
                GenerationConfig {
                    max_tokens: 256,
                    sampling: Sampling::TopP { p: 0.9, temperature: 0.7 },
                    deadman_receiver: None,
                }
            ).await?;
            
            // Check termination
            let terminal = hop.terminal;
            hops.push(hop);
            
            if terminal {
                break;
            }
            
            // Select best direction and continue
            let best_direction = hops.last().unwrap()
                .directions
                .iter()
                .max_by_key(|d| d.priority)
                .unwrap();
            
            // Potentially re-query RRO based on direction
            if let DirectionAction::DrillDeeper { focus } = &best_direction.action {
                let additional = self.cag.targeted_search(focus, &signal.project_id).await?;
                context = context.extend_with(additional);
            }
        }
        
        Ok(hops)
    }
}
```

---

## 8. Performance Tuning

### 8.1 Latency Budget Allocation

| Stage | Target | Strategy |
|-------|--------|----------|
| Embedding | <10ms | Keep model warm, batch when possible |
| RRO search | <30ms | HNSW in RAM, vectors on SSD, proper indexing |
| Reranking | <100ms | Batch size 16, truncate to 512 tokens |
| Hydration | <10ms | libSQL with prepared statements |
| Generation | <2000ms | Pre-warmed KV cache, index caching |

### 8.2 Memory Budget (8GB VRAM Target)

| Component | VRAM | Notes |
|-----------|------|-------|
| Qwen3-VL-4B (Q4) | ~3GB | Main llm |
| Qwen3-Embedding-0.6B | ~400MB | Quantized |
| Qwen3-Reranker-0.6B | ~400MB | Quantized |
| KV Cache | ~1GB | For 4K context |
| outlines-core Index | CPU RAM | Not VRAM |
| RRO embedded | CPU RAM | HNSW index |
| **Total** | ~5GB | Leaves headroom |

### 8.3 Optimization Checklist

```rust
pub struct OptimizationConfig {
    /// Pre-warm embedding model on startup
    pub prewarm_embedder: bool,
    
    /// Pre-warm reranker on startup
    pub prewarm_reranker: bool,
    
    /// Pre-compile common schemas
    pub prewarm_schemas: Vec<String>,
    
    /// Maximum concurrent RRO queries
    pub rro_concurrency: usize,
    
    /// Reranker batch size
    pub rerank_batch_size: usize,
    
    /// Maximum context tokens
    pub max_context_tokens: usize,
    
    /// Use quantized models
    pub use_quantization: bool,
}

impl Default for OptimizationConfig {
    fn default() -> Self {
        Self {
            prewarm_embedder: true,
            prewarm_reranker: true,
            prewarm_schemas: vec![
                MissionPlan::JSON_SCHEMA.to_string(),
                HopResult::JSON_SCHEMA.to_string(),
            ],
            rro_concurrency: 4,
            rerank_batch_size: 16,
            max_context_tokens: 4096,
            use_quantization: true,
        }
    }
}
```

---

## 9. Monitoring & Observability

### 9.1 Key Metrics

```rust
use metrics::{counter, histogram, gauge};

pub fn record_pipeline_metrics(metrics: &PipelineMetrics) {
    histogram!("devpulse.cag.latency_ms", metrics.cag_latency.as_millis() as f64);
    histogram!("devpulse.gen.latency_ms", metrics.gen_latency.as_millis() as f64);
    histogram!("devpulse.total.latency_ms", metrics.total_latency.as_millis() as f64);
    
    gauge!("devpulse.context.tokens", metrics.context_tokens as f64);
    gauge!("devpulse.output.tokens", metrics.output_tokens as f64);
    
    if metrics.cache_hit {
        counter!("devpulse.index_cache.hits", 1);
    } else {
        counter!("devpulse.index_cache.misses", 1);
    }
}
```

### 9.2 ROTI Tracking

```rust
pub fn calculate_roti(
    task_value: f64,      // User-rated or estimated
    teaching_value: f64,  // Did user learn something?
    context_value: f64,   // Quality of retrieved context
    time_invested_ms: f64,
) -> f64 {
    (task_value + teaching_value + context_value) / (time_invested_ms / 1000.0)
}

pub fn estimate_task_value(mission: &MissionPlan) -> f64 {
    let complexity_factor = mission.response.estimated_complexity as f64 / 10.0;
    let step_count = mission.response.steps.len() as f64;
    
    // Higher complexity + more steps = more value
    (complexity_factor * 5.0) + (step_count * 2.0)
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-05 | Initial retrieval pipeline guide |

---

*This document should be read alongside OUTLINES_CORE_INTEGRATION.md for grammar-constrained generation details.*
