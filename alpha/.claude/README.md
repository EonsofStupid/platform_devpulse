# Claude Reference - DevPulse Codebase

**READ THIS BEFORE EVERY TASK**

## Quick Reference

### Run Development Environment
```cmd
D:\localdev\alpha_devpulse\alpha\scripts\dev\launch.bat
```

This launches:
- **Lab Backend**: http://127.0.0.1:3001 (Axum API)
- **Lab UI**: http://127.0.0.1:5174 (SvelteKit dashboard)
- **Desktop**: Tauri window with chat (Ctrl+G to open)

---

## Crate Structure

```
alpha/
├── shared/        ← SSOT: types, SignalKind, SignalHeader
├── orchestrator/  ← Llm: cortex, sub-agents, ALL storage
├── engine/        ← Hub: facades, router, registries (PUBLIC API)
├── lab/           ← Backend: Axum server
│   └── ui/        ← Frontend: SvelteKit dashboard
├── desktop/       ← Tauri + SvelteKit chat app
└── xtask/         ← Build automation
```

### Dependency Rules
- Desktop → Engine (NEVER directly to orchestrator)
- Lab → Engine (NEVER directly to orchestrator)
- Engine → Orchestrator
- Everyone → Shared

---

## UI Applications

### Desktop (Vibe Coder App)
- **Location**: `alpha/desktop/`
- **Frontend**: `alpha/desktop/src/` (SvelteKit)
- **Backend**: `alpha/desktop/src-tauri/` (Tauri + Rust)
- **Run**: `npm run tauri:dev` (from desktop/)
- **Chat**: Ctrl+G opens Maestro overlay

### Lab (Developer Dashboard)
- **Backend**: `alpha/lab/src/main.rs` (Axum on :3001)
- **Frontend**: `alpha/lab/ui/` (SvelteKit on :5174)
- **Run Backend**: `cargo run -p lab`
- **Run Frontend**: `npm run dev` (from lab/ui/)

---

## Models

| Component | Model | Location |
|-----------|-------|----------|
| **Llm** | Qwen3-VL-4B-Instruct | `D:\localdev\dp_alpha\models\qwen3-vl-4b\` |
| **8B VL** | Qwen3-VL-8B-Instruct | `D:\localdev\dp_alpha\models\8vlb\qwen3-vl-8b\` |
| **Embedder** | Qwen3-Embed-0.6B | `D:\localdev\dp_alpha\models\embedder\` |
| **Reranker** | Qwen3-Rerank-0.6B | `D:\localdev\dp_alpha\models\reranker\` |

**Default**: 4B VL loaded at startup
**Swap**: Lab UI can swap between 4B and 8B VL

---

## Storage Stack

| Lane | Store | Purpose |
|------|-------|---------|
| L1 | tokio::broadcast | Real-time UI signals |
| L2 | Moka | Hot cache (5min TTL) |
| L3 | libSQL | Projects, sessions, turns |
| L4 | RRO | Vector embeddings |
| L5 | Fjall | Large blobs, replay |
| L6 | DuckDB | Analytics, metrics |

---

## xtask Commands

```bash
cargo xtask dev        # Launch Lab + Desktop (MAIN)
cargo xtask check-all  # Verify all crates compile
cargo xtask chat       # CLI REPL (quick test)
cargo xtask seed       # Seed RRO test data
cargo xtask verify     # Check model files exist
```

---

## Key Files

### Signal Types
- Input: `shared/src/types/signal.rs` (SignalKind enum)
- Output: `engine/src/signals/variants.rs` (SignalVariant enum)
- Header: `shared/src/types/header.rs` (SignalHeader, SignalSource)

### Chat Flow
1. Desktop calls Tauri command `chat` → `desktop/src-tauri/src/lib.rs:91`
2. Tauri calls `engine.chat.send()` → `engine/src/facade/chat.rs:105`
3. ChatFacade calls orchestrator or returns stub
4. Response flows back through signal router

### Model Loading
- Registry: `orchestrator/src/infra/models.rs`
- Llm: `orchestrator/src/infra/llm.rs`
- Paths: `D:\localdev\dp_alpha\models\` (hardcoded)

---

## Philosophy (LOCKED)

**Maestro = Translator, NOT Generator**

Converts vibe-speak → engineer-speak for AI execution.

### 4-Layer Rumination
1. Keystroke (<50ms) - Intent classification
2. Pause (<500ms) - Context reranking
3. Send (2-5s) - Full COSTAR+ generation
4. Background (minutes) - Indexing, learning

### 8 Sub-Agents
DIARY, GUARDIAN, PSYCH, TEACHER, SCRIBE, VISION, RESEARCHER, ENFORCER

Only GUARDIAN is implemented. Others are scaffolds.

---

## Common Mistakes (DON'T DO THESE)

1. **Running Lab without Lab UI** - Lab is API only, needs `lab/ui/` running
2. **Wrong npm script** - Desktop uses `tauri:dev` not `tauri dev`
3. **Missing MSVC setup** - Run from VS Developer Prompt or use launch.bat
4. **Missing cp command** - Add Git's usr/bin to PATH
5. **Suggesting CLI when user wants UI** - Desktop has real chat UI
6. **Not knowing where models are** - `D:\localdev\dp_alpha\models\`

---

## Windows Build Requirements

From VS Developer Command Prompt or launch.bat:
```cmd
call vcvarsall.bat x64
set PATH=%PATH%;C:\Program Files\Git\usr\bin
set CC=cl
set CXX=cl
```

---

## BEFORE SAYING ANYTHING IS "DONE"

1. Verify it's not a stub (search for TODO, STUB, PhantomData)
2. Verify persistence exists (in-memory only = NOT DONE)
3. Verify signals flow (nothing emits/subscribes = not wired)
4. Run the actual code ("compiles" is not "works")
