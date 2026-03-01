---
paths:
  - "systems/devpulse-engine/**/*.rs"
  - "interfaces/desktop/**/*.ts"
  - "interfaces/desktop/**/*.svelte"
  - "interfaces/desktop/src-tauri/**/*.rs"
---

# IP Protection — Kernel/Engine Boundary

**SSOT**: `systems/devpulse-engine/ip/kernel_terms.toml`

## Absolute Rule

The terms below are KERNEL-ONLY. They must NEVER appear in code outside `kernel/`.

### In Engine Rust Code
Use `ip_term!("TERM")` macro. The macro handles remapping for engine builds.

### In Frontend Code (TS/Svelte)
Use the PUBLIC EQUIVALENT from the "engine" column in `kernel_terms.toml`. Never the kernel term.

### In Desktop Tauri Code
NEVER import `devpulse-maestro`. Use `devpulse-engine` only. All kernel access goes through the Platform facade.

## Forbidden Terms (outside kernel/)

**Sub-Agents**: DIARY, GUARDIAN, PSYCH, TEACHER, SCRIBE, VISION, RESEARCHER, ENFORCER, sub-agent, Minion

**Rumination**: rumination, rumination layer, keystroke layer, pause layer, send layer, background layer, latency budget, KV cache warmth

**COSTAR+**: COSTAR+, COSTAR, Context-Objective-Style-Tone-Audience-Response, vibe-speak, engineer-speak, translation layer, provider-specific frame, frame tuning

**Algorithms**: HMM, Hidden Markov Model, state transition matrix, RRF fusion, Reciprocal Rank Fusion, CAG, Context-Augmented Generation, RAG pipeline, Retrieval-Augmented Generation, RKYV, zero-copy deserialization, BM25, cross-encoder, dense retrieval, hybrid search, reranking, speculative decoding, RRO, Reasoning Ready Object

**Architecture**: Maestro, Cortex, Trinity, OverMind

## Public Equivalents (use these instead)

| Kernel Term | Public Equivalent |
|-------------|-------------------|
| DIARY | Memory |
| GUARDIAN | Quality Check |
| Maestro | Gus |
| Cortex | knowledge engine |
| Trinity | data layer |
| rumination | thinking |
| COSTAR+ | prompt builder |
| HMM | context switching |
| RRF fusion | smart ranking |
| CAG | cached retrieval |

Full mapping: see `kernel_terms.toml` (47 terms, 5 categories).
