# DevPulse Architecture

> **Status**: Living Document
> **Last Updated**: 2026-01-06
> **Owner**: @jesse

---

## Guiding Principle

**A 4B model with perfect context beats a 70B model with garbage context.**

Maestro is NOT a code generator. Maestro is the translator and quality gate between vibe coders and AI coding tools.

---

## Abstraction Layers

### Current State (Audit)

| Layer | Abstraction | Status |
|-------|-------------|--------|
| Sub-Agents | `Expert` trait | ✅ Defined in `shared/types/expert.rs` |
| LLM Adapters | None | ❌ Concrete `LlmBackend` stub |
| Storage | None | ❌ Concrete implementations |
| Embedder | None | ❌ Concrete `EmbedderBackend` |
| Reranker | None | ❌ Concrete `RerankerBackend` |
| Voice | None | ❌ Concrete `VoiceBackend` |

### Target State

```
shared/src/contracts/           # Trait definitions (contracts)
├── mod.rs
├── llm.rs                      # LlmAdapter trait
├── storage.rs                  # StorageAdapter trait
├── embedder.rs                 # EmbedderAdapter trait
├── reranker.rs                 # RerankerAdapter trait
└── voice.rs                    # VoiceAdapter trait

orchestrator/src/infra/         # Implementations
├── llm/
│   ├── mod.rs                  # LlmBackend (owns adapters)
│   ├── local.rs                # Candle implementation
│   ├── openai_compat.rs        # OpenAI, Groq, DeepSeek, OpenRouter
│   ├── anthropic.rs            # Claude API
│   └── google.rs               # Gemini API
├── storage/
│   ├── mod.rs                  # StorageBackend (owns adapters)
│   ├── libsql.rs               # SQLite implementation
│   ├── moka.rs                 # Cache implementation
│   ├── rro.rs               # Vector implementation
│   └── duckdb.rs               # Analytics implementation
└── ...
```

---

## Crate Structure

```
alpha/
├── shared/                     # Types, traits, contracts - NO implementations
│   └── src/
│       ├── config/             # Configuration types
│       ├── contracts/          # Adapter traits (NEW)
│       └── types/              # Domain types (Signal, Toon, Expert, etc.)
│
├── engine/                     # Rust nervous system - FS, security
│   └── src/
│
├── orchestrator/               # Llm - owns all infra, cortex, sub-agents
│   └── src/
│       ├── chat/               # Chat engine (entry point)
│       ├── cortex/             # CAG, Router, Rumination, COSTAR+
│       ├── frames/             # Ephemeral personas
│       ├── infra/              # All backends (implements contracts)
│       ├── runtime/            # DevPulseRuntime, Experiments
│       └── sub_agents/         # Expert implementations
│
├── desktop/                    # Tauri + Svelte Desktop app
│   ├── src/                    # Svelte frontend
│   └── src-tauri/              # Rust backend
│
├── lab/                        # Debug/observability TUI + Web
│   ├── src/                    # Rust TUI
│   └── web/                    # React dashboard
│
└── xtask/                      # Build tasks
```

---

## Storage Lanes

| Lane | Store | TTL | Purpose |
|------|-------|-----|---------|
| L1 REFLEX | `tokio::broadcast` | Ephemeral | Instant UI updates |
| L2 WORKING | `moka::Cache` | 5min | Hot session data |
| L3 DURABLE | `libSQL` | Persistent | Sessions, turns, chunks |
| L4 VECTOR | `RRO` | Persistent | Embeddings, semantic search |
| L5 PARKING | `fjall` | Persistent | Large blobs, signal replay |
| L6 ANALYTICS | `DuckDB` | Persistent | Metrics, ROTI |

---

## Inference Stack

| Component | Model | Runtime | Purpose |
|-----------|-------|---------|---------|
| Llm | Qwen3-VL-4B | Candle | Text generation + vision |
| Embedder | GTE-base | Candle | Semantic embeddings (384d) |
| Reranker | BGE-reranker | Candle | Cross-encoder scoring |
| Voice STT | Whisper | sherpa-rs | Speech-to-text |
| Voice TTS | Kokoro | sherpa-rs | Text-to-speech |

**Models Location**: `D:\localdev\dp_alpha\models\`

---

## Adapter Contracts (To Implement)

### LlmAdapter

```rust
// shared/src/contracts/llm.rs

#[async_trait]
pub trait LlmAdapter: Send + Sync {
    fn kind(&self) -> AdapterKind;
    fn is_ready(&self) -> bool;
    fn available_models(&self) -> Vec<ModelInfo>;

    async fn generate(&self, request: &LlmRequest) -> Result<LlmResponse, LlmError>;
    async fn generate_stream(
        &self,
        request: &LlmRequest
    ) -> Result<BoxStream<'_, Result<StreamChunk, LlmError>>, LlmError>;
}
```

### StorageAdapter

```rust
// shared/src/contracts/storage.rs

#[async_trait]
pub trait StorageAdapter: Send + Sync {
    fn kind(&self) -> StorageKind;
    fn is_ready(&self) -> bool;

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>, StorageError>;
    async fn set(&self, key: &str, value: &[u8], ttl: Option<Duration>) -> Result<(), StorageError>;
    async fn delete(&self, key: &str) -> Result<(), StorageError>;
}
```

### EmbedderAdapter

```rust
// shared/src/contracts/embedder.rs

pub trait EmbedderAdapter: Send + Sync {
    fn kind(&self) -> EmbedderKind;
    fn dimension(&self) -> usize;
    fn is_ready(&self) -> bool;

    fn embed(&self, text: &str) -> Result<Vec<f32>, EmbedderError>;
    fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedderError>;
}
```

---

## Desktop Architecture

### App Structure

Desktop is NOT a simple chat widget. It's a multi-route application:

```
desktop/src/routes/
├── +layout.svelte              # Shell with sidebar navigation
├── +page.svelte                # Dashboard (home)
├── chat/
│   └── +page.svelte            # Chat app (separate route)
├── projects/
│   └── +page.svelte            # Project management
├── settings/
│   └── +page.svelte            # Settings, API keys, voice
└── lab/
    └── +page.svelte            # Debug/observability
```

### Chat as App-Within-App

Chat is a first-class route, not an embedded widget:
- Full viewport control
- Own state management
- Route-aware (can deep-link to conversations)
- Can spawn additional panels (context viewer, thought tree)

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] DevPulse                              [Settings] [Lab]  │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │                    Chat Route                      │
│         │  ┌────────────────────────────────────────────┐   │
│ ○ Home  │  │  [Context Panel]   │   [Main Chat]         │   │
│ ● Chat  │  │  - Retrieved chunks│   - Messages          │   │
│ ○ Proj  │  │  - Sources         │   - Input             │   │
│ ○ Set   │  │  - Scores          │   - Streaming         │   │
│         │  └────────────────────────────────────────────┘   │
│         │  [Thought Tree Toggle] [Voice Toggle] [CoT View]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Signal Flow

```
User Input
    │
    ▼
┌─────────────┐
│ SignalKind  │  ← Typed enum (Chat, Tool, Expert, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Toon     │  ← Wire envelope (session, project, timing)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Router    │  ← Determines which experts handle this
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    CAG      │  ← Context Assembly Graph
│             │     1. Embed query
│             │     2. Search RRO
│             │     3. Rerank results
│             │     4. Adaptive threshold
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ LlmBackend  │  ← Generate response with context
└──────┬──────┘
       │
       ▼
Response to User
```

---

## Implementation Priority

### Phase 1: Foundation (Current Sprint)
1. ✅ Runtime architecture (`DevPulseRuntime`)
2. ✅ Experiment flags (`Experiments`)
3. ⏳ LLM adapter abstraction
4. ⏳ Desktop chat route

### Phase 2: Intelligence
1. CoT (Chain of Thought) visualization
2. Rumination tree UI
3. Sub-agent status display

### Phase 3: Polish
1. Gamification system
2. Progressive terminology
3. Voice setup wizard

---

## File Locations

| What | Where |
|------|-------|
| Models | `D:\localdev\dp_alpha\models\` |
| Data | `%APPDATA%\DevPulse\` (Windows) |
| Specs | `alpha/docs/` |
| Lab Reference | `lab/web/src/` |
