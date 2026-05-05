# RUMINATION + RRO — Original Specs Inventory

| Field | Value |
|---|---|
| Status | INVENTORY (read-only, source of truth listing) |
| Created | 2026-05-01 |
| Purpose | List every original spec touching Rumination, retrieval, and RRO so they can be authored as one cohesive document |
| Authoring | NONE. This file does not invent. It lists what exists and what is missing. |

---

## What this inventory covers

The user request: *"we need to fully document the capabilities. Which means you need to list every original spec of Rumination, RRO, so I can have them all properly authored as one and cohesive and understood."*

This file is the answer. Below is every spec on disk that defines or references Rumination, retrieval, RRO, or the encoder/embedder/reranker pipeline. Each entry shows the file path, what concept it defines, and a one-line summary of its content.

---

## Specs that define Rumination directly

### RUMINATION.md — v2.0.0 (2025-12-23)
- Two-layer model: ML Backbone (always running, cheap) + AI Decision (on-demand, expensive)
- Four latency layers: Keystroke <50ms, Pause <500ms, Send 2-5s, Background minutes
- ML Backbone uses 0.6B embedder + 0.6B reranker + SigLIP2
- AI Decision uses 4B local OR API
- Explicit Gus naming throughout (pre-Clyffy rename)

### RUMINATION-2.md
- Same content as RUMINATION.md but with Gus → Clyffy rename applied
- Otherwise identical
- Indicates v2.0.0 was duplicated for the rename without consolidation

### RUMINATION_Architecture_Spec.md
- Most detailed of the three rumination docs
- Locked model stack table with VRAM costs
- Full Rust struct definitions for KeystrokeOutput, PauseOutput, SendOutput
- Two processing modes: AlwaysModel vs HeuristicFirst (A/B testable)
- Sub-agent contract trait with AgentOutput type
- REPO sub-agent reference implementation

### RUMINATION_PROTOCOL.md
- Specialist resource budget table (DIARY, REPO, PSYCH, TEACHER, SCRIBE, VISION, RESEARCHER, GUARDIAN)
- Background scheduler types (BackgroundTask enum)
- Signal weighting (recency 0.3, importance 0.2)
- Preemption rule: all background tasks yield on user input

---

## Specs that define COSTAR/Cortex (rumination orchestration)

### CORTEX.md — v1.0.0 (2025-12-22)
- Cortex = the thinking layer at orchestrator/src/cortex/
- Distinguishes: Kernel (mechanics) vs Cortex (cognition)
- Four-layer rumination architecture (Keystroke/Pause/Send/Background) with model assignments per layer
- Full COSTAR+ JSON output schema example
- Field definitions: CONTEXT, OBJECTIVE, STYLE, TONE, AUDIENCE, RESPONSE
- Gus system prompt (the Translator philosophy)
- Rumination UX (what the user sees during the four layers)

### KERNEL.md
- Kernel vs Cortex separation
- Kernel = state machine + event bus + scheduler
- Module structure: orchestrator/src/kernel/{state_machine, event_bus, scheduler, config}.rs
- Four-layer latency table (Cortex responsibility, Kernel ensures CPU/GPU time)

### FRAME_SPEC.md
- Frame trait with id/name/description/signature/triggers/priority
- Behavior types: Tone, Depth, Proactivity
- COSTAR override per frame
- SupportiveAlly frame example
- New frame checklist

### MODEL_STACK.md
- Locked model table per role
- Two vision paths: SigLIP2 (embedding) vs Qwen3-VL-4B (understanding)
- Embedder vs Reranker pipeline diagram
- Four-layer latency budget (mirrors Rumination spec)
- GGUF download commands
- Hardware tier requirements (8GB min, 12GB+ recommended)

---

## Specs that define retrieval (the layer RRO would formalize)

### POSTGRES_Schema_Spec_1.md
- gus.costar_prompts table (assembled COSTAR prompts for debugging/learning)
- gus.rumination_state table (current rumination state per session)
- retrieval.chunks table (indexed content chunks, embeddings live in Qdrant)
- Sub-agent outputs table with trace linkage

### 001_initial_schema.sql
- retrieval.chunks definition (project_id, content, source_path, source_type, language, qdrant_point_id, embedding_model, embedding_dim, is_stale)
- retrieval.files definition (path, file_hash, language, line_count, size_bytes, last_indexed_at, chunk_count)
- telemetry.model_calls (rumination_layer enum, prompt_tokens, completion_tokens)

### CONTRACTS.md
- Trait definitions: SemanticStore (Qdrant), EmbedderProvider, RerankerProvider
- Each lists implementor and purpose

### Type_Catalog.md
- ThinkingBudget enum: Reactive/Considered/Deliberate/Background
- Lives in orchestrator/cortex/thinking.rs
- Maps to four-layer rumination

---

## Specs that define foundational architecture

### DEVPULSE_FOUNDATION.md / DEVPULSE_FOUNDATION_v3_0.md
- Storage architecture (Trinity: Moka + libSQL + Qdrant + DuckDB)
- Model stack with VRAM totals
- Retrieval pipeline diagram: Embed query → Qdrant hybrid (dense + BM25 + RRF) → libSQL hydrate → 0.6B rerank → Context Assembly
- Qdrant collection definition (1024-dim Cosine, Int8 quantization, BM25 sparse vectors)

### DEVPULSE_AI_ARCHITECTURE.md
- Hypermodular AI orchestration
- Persona routing (Anthropic, OpenAI, Perplexity)
- Mode switching (General → Creator → Research)
- Composable prompts from multiple sources
- Admin control plane (A/B testing, prompt versioning, analytics)

### PHILOSOPHY.md / PHILOSOPHY_1.md (v1.1.0, stale per project knowledge)
- Translator-not-generator pattern
- Economic protection thesis
- Two layers stop and think (Keystroke/Pause)
- COSTAR teaching examples (the 6-words → full prompt example)

### 2._Crate_Map.md
- orchestrator/src/cortex/{router, rumination, costar, thinking, mission}.rs
- orchestrator/src/sub_agents/* (8 specialists)
- orchestrator/src/infra/{llm, embedder, reranker, vision, voice, storage}/
- orchestrator/src/rag/{retrieval, context}.rs

---

## What "RRO" actually is — searched, not invented

The term **"RRO"** / **"Reason Ready Object"** appears in:

- The userMemories section of every conversation: *"cortex/qdrant (RRO vector store)"* and *"Reason Ready Object format"*
- Recent conversations on May 1 2026
- Verbal references throughout this and prior sessions

The term **does NOT appear in any committed spec on disk.** Searched: every .md in /scripts/docs/, every project knowledge file, every Cargo.toml. Zero hits for "RRO" or "Reason Ready" in authored specs.

This means RRO is currently a concept in your head + Claude's memory, not a documented system. The closest existing specs are:

- The Trinity storage layer (Moka + libSQL + Qdrant + DuckDB) in DEVPULSE_FOUNDATION
- The retrieval pipeline diagram (Embed → Qdrant Hybrid → Rerank → Context)
- The retrieval.chunks Postgres schema
- The SemanticStore trait contract

**RRO is the missing wrapper around all four of these.** When authored, it consolidates: encoder/embedder/Qdrant/reranker into one named subsystem with one trait surface.

---

## What "RRD" — Reason Ready Daemon — actually is

Even less documented than RRO. The term appears only in conversation, never on disk. Concept introduced May 1 2026:

- The orchestrator process inside RRO
- Owns encoder lifecycle, embedder pipeline, event bridges, pause/resume, hot reload
- In-process Rust module (NOT a sidecar)
- Provides the layman-friendly configuration surface

No spec exists. Concept-only.

---

## What is missing if RRO/RRD are to be authored as one cohesive document

Required content the existing specs do NOT have:

1. **A definition of "Reason Ready Object"** — the data unit. What fields? Vector + provenance + governance metadata + what else?
2. **An RRO trait surface** — how do consumers (Cortex/rumination, sub-agents, layman config UI) talk to it?
3. **The encoder/embedder boundary** — when does one model serve as both, when are they distinct?
4. **The Qdrant fork's responsibilities** — what does the fork add beyond stock Qdrant? (Reason-Ready Object schema? Threshold-gated escalation? Other?)
5. **The RRD lifecycle** — Hot/Standby/Warm/Cold states, pause/resume protocol, hot-reload protocol with arc_swap
6. **The layman config surface** — what knobs are exposed, how are unsafe configurations prevented, what is the inspector vs configurator split
7. **The boundary with Cortex/rumination** — the four-layer rumination already exists; RRO either IS the ML Backbone or sits underneath it. Pick one and document it.
8. **The portability story** — RRO is meant to ship to enterprise (rroflow.ai). What does that boundary look like?

---

## Recommended next step (not done — owner decision)

Author one new file: scripts/docs/RRO.md, drawing from the inventory above. NOT a merge of stale documents. A fresh write that:

- Treats RRO as a named subsystem (not a renamed Cortex)
- Defines what a Reason Ready Object actually is at the data level
- Documents the trait surface and the four submodules (encoder, embedder, store, RRD)
- Maps cleanly to existing specs (cites RUMINATION.md, MODEL_STACK.md, retrieval.chunks schema)
- Sets the boundary between RRO (portable) and Cortex (DevPulse-specific cognition)

This authoring is owner-gated. Not started.

---

*End of inventory. No content invented. Every reference traces to a file path or to userMemories.*
