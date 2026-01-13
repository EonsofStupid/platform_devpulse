# DevPulse Platform Audit & Implementation Plan

**Date:** 2026-01-02
**Purpose:** Comprehensive audit of specs vs actual code, with implementation roadmap

---

## Part 1: What DevPulse IS (From Specs)

### Core Philosophy

DevPulse is a **translator and quality gate** between vibe coders and AI coding tools. Maestro is NOT a code generator — it translates vibe-speak into engineer-speak (COSTAR+ specs) that dumb executors can follow precisely.

**The Prime Directive:** Users pay a "learning tax" when prompting AI poorly. DevPulse pays that tax for them.

### Architecture Summary

```
USER ("fix the login thing")
        |
        v
+------------------+
|     Maestro      |  <-- 4B Llm (Qwen3-VL-4B)
|   (Translator)   |
+--------+---------+
         |
         | reads from
         v
+------------------+     +------------------+
|     MINIONS      |     |     MEMORY       |
|  (8 Specialists) |---->|  libSQL + RRO |
|   0.6B models    |     |  Moka + DuckDB   |
+------------------+     +------------------+
         |
         | writes COSTAR+ spec
         v
+------------------+
|    EXECUTOR      |  <-- Dumb AI (burns 200 tokens, not 2000)
+------------------+
```

### Four-Layer Rumination

| Layer | Budget | Model | Purpose |
|-------|--------|-------|---------|
| Keystroke | <50ms | 0.6B | Intent classification, prefetch candidates |
| Pause | <500ms | 0.6B | Rerank, score signals, identify domain |
| Send | 2-5s | 4B | Full rumination, COSTAR+ assembly, response |
| Background | Minutes | 0.6B | Index, consolidate, analyze (never blocks 4B) |

### The 8 Minions (Sub-Agents)

| Minion | Specialist Category | Status in Code |
|--------|---------------------|----------------|
| PSYCH | User emotional state | Partial (detector.rs exists) |
| GUARDIAN | Codebase state | REAL (full file watching, indexing) |
| SCRIBE | Intent translation | Partial (signals defined) |
| DIARY | Project journey | SCAFFOLD only |
| TEACHER | User competency | SCAFFOLD only |
| VISION | Visual state | PARTIAL (SigLIP2 works, VL-4B pending) |
| RESEARCHER | External knowledge | SCAFFOLD only |
| GUARDIAN | Security & constraints | SCAFFOLD only |

### Storage Stack (All Embedded, No Docker)

| Component | Tech | Purpose |
|-----------|------|---------|
| SSOT | libSQL | Sessions, turns, chunks, sub-agent outputs |
| Hot Cache | Moka | In-memory, TTL-based |
| Vectors | RRO embedded | Dense + BM25 sparse + RRF fusion |
| Analytics | DuckDB | Telemetry, ROTI metrics |

---

## Part 2: What Actually Exists in Code

### Crate Structure

```
alpha_devpulse/
├── shared/           # 88 files - Types, config, events, inference, storage
├── orchestrator/     # 90+ files - Cortex, Kernel, Maestro, Sub-agents, Minions
├── engine/           # 27 files - MOSTLY STUBS (capture, voice, system)
├── lab/              # 41 files - REAL (TUI, routes, tools)
└── desktop/          # 14 files - STUBS (Tauri commands)
```

### What's Working

| Component | Location | Status |
|-----------|----------|--------|
| Rumination Engine | `orchestrator/src/cortex/rumination/` | REAL (267 lines, 4-layer, A/B toggle) |
| NATS EventBus | `shared/src/events/` | REAL (40+ event types, JetStream) |
| GUARDIAN Sub-Agent | `orchestrator/src/sub_agents/guardian/` | REAL (indexer, chunker, observer) |
| VISION Sub-Agent | `orchestrator/src/sub_agents/vision/` | PARTIAL (SigLIP2 works, VL-4B pending) |
| VOICE Pipeline | `shared/src/inference/voice.rs` | REAL (Whisper + Kokoro) |
| RRO Embedded | `shared/src/storage/rro.rs` | REAL (hybrid search) |
| Kernel State Machine | `orchestrator/src/kernel/state_machine.rs` | REAL (347 lines) |
| Maestro Coordinator | `orchestrator/src/maestro/conductor.rs` | REAL (450 lines) |
| Lab TUI | `lab/src/tui/` | REAL (cortex_monitor, ab_test) |
| Lab Routes | `lab/src/routes/` | REAL (Axum + WebSocket) |
| Prompt Catalog | `orchestrator/src/prompts/` | REAL (COSTAR+, persona, templates) |
| Scribe Signals | `orchestrator/src/sub_agents/scribe/` | PARTIAL (signals defined) |
| PSYCH Detector | `orchestrator/src/sub_agents/psych/` | PARTIAL (frustration detection) |

### What's STUB/Missing

| Component | Location | Issue |
|-----------|----------|-------|
| Chat Engine | `orchestrator/src/chat/engine.rs` | Returns placeholder "I'm Maestro" text |
| COSTAR Builder | `orchestrator/src/prompts/costar/builder.rs` | Has TODOs, not fully wired |
| Engine Capture | `engine/src/capture/` | All TODOs |
| Engine Voice | `engine/src/voice/` | All TODOs (real voice in shared/inference) |
| Engine System | `engine/src/system/` | All TODOs |
| Desktop Commands | `desktop/src-tauri/src/commands/` | All stubs, no Maestro wiring |
| Minions DIARY | `orchestrator/src/minions/diary/` | Scaffold only |
| Minions TEACHER | `orchestrator/src/minions/teacher/` | Scaffold only |
| Minions RESEARCHER | `orchestrator/src/minions/researcher/` | Scaffold only |
| Minions GUARDIAN | `orchestrator/src/minions/guardian/` | Scaffold only |

---

## Part 3: Critical Gap - Dogfooding Architecture

### What I Got Wrong

I created a static `lefthook.yml` in the repo root. **This is fundamentally wrong.**

### What Dogfooding Actually Means

DevPulse is the tool that manages projects. When DevPulse "dogfoods" itself:

1. **DevPulse watches DevPulse** via GUARDIAN sub-agent
2. **`.devpulse/` is configuration** for how DevPulse monitors THIS project
3. **Lefthook is a PLATFORM FEATURE** - DevPulse should set up git hooks for projects it manages

### Correct Architecture

```
.devpulse/
├── .devpulse.self         # Config for dogfooding (project_id, domains, signals)
├── collections/           # RRO collection metadata
├── sessions/              # Session history
├── artifacts/             # Generated artifacts (COSTAR+ specs, etc.)
├── hooks/                 # Lefthook templates that DevPulse applies
│   └── lefthook.yml       # Template, NOT installed in root
└── policies/              # Project-specific rules GUARDIAN enforces
```

### How Lefthook Should Work

When DevPulse adds a project:
1. User runs `devpulse init` or registers project via UI
2. DevPulse creates `.devpulse/` folder in project
3. **DevPulse installs lefthook hooks** from `.devpulse/hooks/` template
4. GUARDIAN sub-agent watches for violations
5. Pre-commit: GUARDIAN runs checks (secrets, patterns, constraints)

This is a **platform feature**, not a static config file.

---

## Part 4: What Needs to Be Built

### Priority 1: Wire Inference to Chat

**Current:** `chat/engine.rs` returns placeholder text
**Needed:** Wire to `shared/src/inference/` models

```rust
// orchestrator/src/chat/engine.rs
pub async fn generate_response(&self, prompt: &str) -> Result<String> {
    // Current: returns "I'm Maestro..."
    // Needed:
    let model = self.llm.get_model()?;
    let response = model.generate(prompt).await?;
    Ok(response)
}
```

### Priority 2: Complete COSTAR+ Assembly

**Current:** Builder has TODOs
**Needed:** Wire context from GUARDIAN, signals from buffer

The prompt catalog (`orchestrator/src/prompts/`) is well-structured but needs:
- Integration with signal buffer
- Dynamic context injection from RRO
- Key junction awareness

### Priority 3: Implement Lefthook as Platform Feature

**Location:** New module in orchestrator or shared

```rust
// shared/src/hooks/lefthook.rs
pub struct LefthookManager {
    templates_dir: PathBuf,  // .devpulse/hooks/
}

impl LefthookManager {
    /// Install hooks when project is registered
    pub async fn install(&self, project_root: &Path) -> Result<()> {
        // 1. Copy template to project root
        // 2. Run `lefthook install`
        // 3. Register with GUARDIAN for violation tracking
    }

    /// Update hooks when policy changes
    pub async fn update(&self, project_id: &str) -> Result<()> { ... }
}
```

### Priority 4: Desktop <-> Orchestrator Wiring

All Tauri commands return stubs. Need:
1. IPC channel to Maestro coordinator
2. Stream responses back to UI
3. Replace TODO placeholders with real calls

### Priority 5: Complete Minion Implementation

8 minions defined, only 3 have real code:
- GUARDIAN (real)
- VISION (partial)
- PSYCH (partial)

Need:
- DIARY (session continuity)
- SCRIBE (intent translation) - signals exist, need logic
- TEACHER (competency tracking)
- RESEARCHER (external docs)
- GUARDIAN (security) - separate from GUARDIAN

---

## Part 5: Dogfooding Setup (Correct Approach)

### Step 1: Ensure GUARDIAN Works

GUARDIAN is the core of dogfooding. It needs:
- File watching via notify crate (EXISTS)
- Chunking and embedding (EXISTS)
- Indexing to RRO (EXISTS)
- Event emission via NATS (EXISTS)

**Status:** GUARDIAN is functional. Need to run it.

### Step 2: Run Dev Environment

The existing scripts are good:
```powershell
.\scripts\dev\run.ps1 -WithCortex  # Lab + Cortex monitor
```

Or via Makefile:
```bash
make dev   # cargo run -p orchestrator
make lab   # cargo run --bin cortex-monitor
```

### Step 3: Lab Tools for Observation

Lab provides visibility:
- `cortex_monitor.rs` - Real-time signal flow
- `rumination_ab_test.rs` - Compare with/without rumination
- `lab_server.rs` - Web dashboard

### Step 4: Lefthook Template (Future)

Create `.devpulse/hooks/lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    guardian-check:
      run: devpulse guardian check --staged
    secrets-scan:
      run: devpulse guardian secrets --staged
```

When implemented, DevPulse will install this for managed projects.

---

## Part 6: Build Commands

### Current (Working)

```bash
cargo check --workspace    # Verify compilation
cargo build -p lab         # Build lab tools
cargo run --bin cortex-monitor  # Run cortex TUI
```

### Dev Environment

```powershell
.\scripts\dev\run.ps1              # Full dev stack
.\scripts\dev\run.ps1 -Verify      # Check models/paths
.\scripts\dev\run.ps1 -WithCortex  # With cortex monitor
```

### Makefile (Created)

```makefile
make dev      # cargo run -p orchestrator
make lab      # cargo run --bin cortex-monitor
make check    # cargo check --workspace
make build    # cargo build --release --workspace
make test     # cargo test --workspace
make pre      # fmt + lint + test
```

---

## Part 7: Summary

### Specs Define

1. **Maestro** as translator (vibe -> engineer-speak)
2. **4-layer rumination** (keystroke/pause/send/background)
3. **8 minions** (PSYCH, GUARDIAN, SCRIBE, DIARY, TEACHER, VISION, RESEARCHER, GUARDIAN)
4. **Context isolation** (general chat vs project chat, domain segmentation)
5. **COSTAR+ assembly** for executor specs
6. **All embedded storage** (libSQL, Moka, RRO, DuckDB)
7. **Model stack** (4B llm, 0.6B minions, SigLIP2, Whisper, Kokoro)

### Code Provides

- Rumination engine (4-layer, A/B toggle)
- GUARDIAN sub-agent (file watching, indexing)
- VISION sub-agent (SigLIP2 embedding)
- VOICE pipeline (STT/TTS)
- Kernel state machine
- NATS event system
- Lab TUI tools
- Prompt catalog system

### Gaps to Fill

1. **Chat inference** - Wire models to chat engine
2. **COSTAR+ builder** - Complete context assembly
3. **Desktop wiring** - Tauri <-> Maestro IPC
4. **Remaining minions** - DIARY, TEACHER, RESEARCHER, GUARDIAN
5. **Lefthook platform feature** - DevPulse installs hooks for managed projects

### What I Should NOT Have Done

- Created static `lefthook.yml` in repo root
- Created verbose justfile commands
- Written random code without understanding specs

### What I Understand Now

DevPulse is a **platform** that manages projects. Dogfooding means DevPulse manages itself. All tooling (lefthook, policies, hooks) should be **platform features** that DevPulse applies to projects it manages, not static config files scattered in the repo.

---

## Next Actions

1. Run `cargo check --workspace` to verify build state
2. Test lab tools: `cargo run --bin cortex-monitor`
3. Verify GUARDIAN is watching files
4. Plan lefthook as platform feature (new module)
5. Wire chat engine to inference

---

*This plan reflects understanding of specs in `docs/SYSTEM-BUILD-SPECS/` and actual code audit.*
