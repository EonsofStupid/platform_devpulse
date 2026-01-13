# Embedder Backend - Technical Implementation Notes

> **Status:** Production-ready
> **Last Major Change:** 2026-01-05 - Qwen2→Qwen3 migration, dual-mode API
> **Owner:** @jesse

---

## Executive Summary

The embedder is the foundation of all semantic operations in DevPulse. Every vector in RRO, every similarity calculation, every context retrieval starts here. Getting this wrong cascades everywhere.

**Model:** Qwen3-Embedding-0.6B (1024 dims)
**Device:** CPU-forced (non-negotiable - see rationale below)
**API:** Dual-mode (stateless for indexing, stateful for observation chains)

---

## Architectural Decisions

### Why CPU-Forced?

We run on an RTX 4070 (12GB VRAM). The memory budget:

| Component | VRAM |
|-----------|------|
| Qwen3-VL-4B Llm (Q4) | ~3 GB |
| Qwen3-Reranker-0.6B | ~400 MB |
| KV Cache (4K context) | ~1 GB |
| Headroom for inference | ~2 GB |
| **Available for embedder** | **0 GB** |

The embedder runs on CPU because **there's no VRAM left**. This is a deliberate architectural choice, not a limitation. CPU embedding is slower (~15s/doc stateless) but:

1. Embedding is often batch/offline (seeding RRO)
2. Real-time paths use stateful mode (~0.5s/doc)
3. We never compete with the Llm for GPU memory

**Alternative considered:** Time-slicing GPU between embedder and Llm. Rejected because context switching overhead + memory fragmentation makes this worse than dedicated CPU.

### Why Dual-Mode API?

The Qwen3 transformer accumulates state in its KV cache across forward passes. This is normally desirable for autoregressive generation but creates problems for embeddings:

**Problem discovered:** After embedding doc1, embedding doc2 produced different vectors than embedding doc2 alone. The KV cache from doc1 was bleeding into doc2's representation.

**Shape mismatch error:** `lhs: [1, 16, 21, 35], rhs: [1, 1, 21, 21]` - the KV cache dimensions didn't match the new input length.

**Solutions evaluated:**

1. **Reset KV cache between calls** - Candle's `clear_kv_cache()` is private
2. **Recreate model each call** - Works, but slow for batch operations
3. **Dual-mode API** - User controls when state accumulates

We chose (3) because it gives you both behaviors:
- `embed()` - Stateless, deterministic, for indexing
- `embed_stateful()` - Accumulating, for observation chains where context matters

### Why Qwen3 over Qwen2?

Qwen2 worked but:
- Qwen3 has better multilingual support
- The embedding models are specifically tuned for retrieval
- Architecture is similar enough that migration was straightforward
- Future-proofs us for Qwen3-Reranker compatibility

---

## Implementation Details

### Model Configuration

```rust
Qwen3ModelConfig {
    vocab_size: 151936,
    hidden_size: 1024,           // Output dimension
    intermediate_size: 2816,
    num_hidden_layers: 28,
    num_attention_heads: 16,
    num_key_value_heads: 8,      // GQA - 2:1 ratio
    head_dim: 128,
    max_position_embeddings: 40960,
    rms_norm_eps: 1e-6,
    rope_theta: 1000000.0,
    // Sliding window disabled for embedding
    sliding_window: None,
    use_sliding_window: false,
}
```

### File Layout

```
D:\localdev\dp_alpha\models\embedder\
├── model.safetensors          # Original weights (may be FP8)
├── model_bf16.safetensors     # Converted weights (preferred)
├── tokenizer.json             # MUST be from official HF repo
└── config.json                # Model architecture config
```

### Weight Loading Priority

```rust
if bf16_path.exists() {
    // Use converted BF16 - Candle can load this
    load(bf16_path)
} else {
    // Try original - will fail if FP8
    load(model.safetensors)
}
```

---

## Gotchas and War Stories

### 1. FP8 Weights Don't Load

**Symptom:** `unsupported dtype F8_E4M3`

**Cause:** Unsloth and other quantization tools produce FP8 safetensors. Candle's safetensors loader doesn't support FP8.

**Fix:** Convert to BF16:
```bash
python scripts/convert_fp8_to_bf16.py \
    D:\localdev\dp_alpha\models\embedder \
    D:\localdev\dp_alpha\models\embedder\model_bf16.safetensors
```

**Prevention:** The embedder now checks for `model_bf16.safetensors` first and provides a helpful error message if FP8 is detected.

### 2. Tokenizer "Repository" Error

**Symptom:** `Token 'Repository' out of vocabulary at line 757480`

**Cause:** The tokenizer.json bundled with some model downloads is corrupted or from a different model variant. The error message is misleading - "Repository" doesn't appear in the file.

**Fix:** Download the official tokenizer:
```powershell
Invoke-WebRequest -Uri 'https://huggingface.co/Qwen/Qwen3-Embedding-0.6B/resolve/main/tokenizer.json' -OutFile 'tokenizer.json'
```

**Root cause:** Likely a tokenizers crate version mismatch with the serialization format. The official HF tokenizer works with tokenizers 0.21.x.

### 3. KV Cache Shape Mismatch

**Symptom:** `shape mismatch in broadcast_add, lhs: [1, 16, 21, 35], rhs: [1, 1, 21, 21]`

**Cause:** KV cache from previous forward pass has dimensions for a different sequence length.

**Fix:** This is why we have dual-mode. For independent embeddings, use `embed()` which creates a fresh model. For chains where you want accumulated context, use `embed_stateful()` and call `clear_cache()` between contexts.

### 4. Windows Path Escaping in YAML

**Symptom:** RRO fails to start with YAML parse error

**Cause:** Windows backslashes (`\`) are escape characters in YAML. `D:\localdev` becomes `D:<newline>localdev`.

**Fix:** Use forward slashes in generated YAML:
```rust
let storage_path = paths.rro_dir.to_string_lossy().replace('\\', "/");
```

### 5. PDB Linker Lock on Windows

**Symptom:** `LINK : fatal error LNK1318: Unexpected PDB error; LIMIT (12)`

**Cause:** Windows MSVC linker's PDB server gets confused with large projects.

**Fix:** Kill the PDB server and retry:
```powershell
taskkill /F /IM mspdbsrv.exe
cargo build
```

---

## API Reference

### Initialization

```rust
// From default paths (dp_alpha layout)
let embedder = EmbedderBackend::from_config();

// From custom directory
let embedder = EmbedderBackend::load(&PathBuf::from("path/to/model"))?;
```

### Stateless Embedding (Indexing)

```rust
// Single document - creates fresh model, no state
let vector = embedder.embed("Document text here")?;
assert_eq!(vector.len(), 1024);

// Batch - each document independent
let vectors = embedder.embed_batch(&["doc1", "doc2", "doc3"])?;
```

**Performance:** ~15s first call (model load), ~15s subsequent (model rebuild each time)

**Use for:** RRO seeding, batch indexing, anywhere you need deterministic embeddings

### Stateful Embedding (Observation Chains)

```rust
// Sub-agent observing user actions - context accumulates
let obs1 = embedder.embed_stateful("User opened auth.rs")?;
let obs2 = embedder.embed_stateful("User added login function")?;
let obs3 = embedder.embed_stateful("User ran tests - 3 failures")?;

// obs3's embedding "knows about" obs1 and obs2

// Switch to different context
embedder.clear_cache();
let new_context = embedder.embed_stateful("Different task entirely")?;
```

**Performance:** ~15s first call (model load), ~0.5s subsequent (reuses model)

**Use for:** Sub-agent observation chains, sequential context building, proactive context warming

### Cache Control

```rust
// Check if stateful model is loaded
// (No direct API - it's lazy-initialized on first embed_stateful call)

// Clear accumulated state
embedder.clear_cache();
```

---

## Integration with DevPulse Architecture

### The Four Pillars

The embedder is foundational to all four pillars:

1. **Vectors** → Enable RRO semantic search
2. **Persona-Skewed Reranking** → Embeddings feed the reranker
3. **MMR Diversity** → Vector similarity for deduplication
4. **Focus Sphere** → Decay calculations use embedding distance

### CAG (Context Assembly Graph)

```
Signal arrives
    ↓
embedder.embed(signal.content)  ← HERE
    ↓
RRO hybrid search (dense + BM25)
    ↓
Reranker cross-encoder scoring
    ↓
Context blob assembly
    ↓
Llm rumination
```

### Sub-Agent Observation Flow

```
User action detected
    ↓
Sub-agent calls embedder.embed_stateful(action)
    ↓
RRO prefetch with embedding (warming)
    ↓
Related context retrieved proactively
    ↓
System "stays aware" without explicit query
```

---

## Performance Benchmarks

Measured on AMD Ryzen 9 + 64GB RAM, CPU-only:

| Operation | Cold (first) | Warm (cached) |
|-----------|--------------|---------------|
| Model load | 14.2s | 0.5s |
| embed() single | 15.1s | 14.8s |
| embed_stateful() first | 15.0s | 14.9s |
| embed_stateful() subsequent | 0.52s | 0.48s |
| embed_batch(8 docs) | 119s | 118s |
| embed_batch_stateful(8 docs) | 15.5s | 4.1s |

**Takeaway:** For batch operations where independence matters, pay the stateless cost. For sequential operations, stateful is 30x faster after warmup.

---

## Memory Profile

| Component | RAM Usage |
|-----------|-----------|
| Weights (F32 mmap) | ~2.4 GB mapped, ~800 MB resident |
| KV Cache (8K ctx) | ~200 MB |
| Tokenizer | ~50 MB |
| Tensors (inference) | ~100 MB peak |
| **Total** | ~1.2 GB resident, 2.7 GB virtual |

CPU RAM only. Zero VRAM.

---

## Dependencies

```toml
# Cargo.toml
candle-core = "0.9.2-alpha.2"
candle-nn = "0.9.2-alpha.2"
candle-transformers = "0.9.2-alpha.2"  # Has Qwen3 support
tokenizers = "0.21"                     # NOT 0.22 - regression
safetensors = "0.7"                     # F8 detection
```

**Critical:** `candle-transformers` must be 0.9.2-alpha.2 or later for Qwen3 model support. Earlier versions only have Qwen2.

---

## Future Considerations

### Known Limitations

1. **No true KV cache reset** - We drop and recreate the model. If Candle exposes `clear_kv_cache()`, we could be more efficient.

2. **Sequential batch only** - CPU can't parallelize the transformer. For massive batch jobs, consider splitting across processes.

3. **No streaming** - The embedding is computed all-at-once. For very long documents, we truncate to 8192 tokens.

### Potential Improvements

1. **ONNX Runtime path** - Could offload to DirectML for AMD GPUs or use CPU optimizations

2. **Quantized CPU inference** - INT8 quantization could speed up CPU path

3. **Async embedding** - Current API is sync. Could add `embed_async()` for non-blocking usage

4. **Embedding cache** - For repeated identical texts, could cache the vectors

---

## Debugging Checklist

When embedder fails:

1. **Check model files exist:**
   ```rust
   embedder.verify_model()  // Returns ModelStatus
   ```

2. **Check for FP8:**
   ```powershell
   python -c "import safetensors; print(safetensors.safe_open('model.safetensors', 'pt').keys())"
   ```

3. **Verify tokenizer:**
   ```powershell
   # Should not error
   python -c "from tokenizers import Tokenizer; Tokenizer.from_file('tokenizer.json')"
   ```

4. **Check dimensions:**
   ```rust
   let vec = embedder.embed("test")?;
   assert_eq!(vec.len(), 1024);
   ```

5. **Verify L2 normalization:**
   ```rust
   let mag: f32 = vec.iter().map(|x| x * x).sum::<f32>().sqrt();
   assert!((mag - 1.0).abs() < 0.01);
   ```

---

## Related Files

- [`embedder.rs`](./embedder.rs) - Implementation
- [`models.rs`](./models.rs) - Qwen3Config struct
- [`rro.rs`](./rro.rs) - Vector storage
- [`reranker.rs`](./reranker.rs) - Cross-encoder (uses same tokenizer)
- [RETRIEVAL_PIPELINE_INTEGRATION.md](../../docs/technical-references/RETRIEVAL_PIPELINE_INTEGRATION.md)
- [OUTLINES_CORE_INTEGRATION.md](../../docs/technical-references/OUTLINES_CORE_INTEGRATION.md)

---

*Document the pain so future-you doesn't repeat it.*
