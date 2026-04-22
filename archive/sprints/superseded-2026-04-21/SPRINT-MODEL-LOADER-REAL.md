> # ☠️ SUPERSEDED — DO NOT EXECUTE
>
> **This sprint doc is DEAD.** The model-loader / setup-wizard work has been
> re-chartered under `POAM-MODEL-LOADER-WIZARD.md`, which embeds the 10
> Commandments verbatim as the workflow SSOT.
>
> - Do not plan against this file.
> - Do not cite "DONE" items below as evidence of working behavior.
> - If you need historical context, read this as archaeology, not authority.
>
> **Go to:** `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# SPRINT: Model Loader — THE REAL ONE

> **Status**: EXECUTING — no more plans without execution
> **Date**: 2026-04-03
> **Rule**: Nothing is "done" until the app runs, the UI renders, and the feature works end-to-end

---

## WHAT THE OWNER SEES WHEN DONE

A devtool panel that clearly shows:

```
┌─────────────────────────────────────────────────────────────┐
│  🐄 CLYFFY MODEL CONFIGURATION                    [DevTool] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLYFFY'S BRAIN (Chat)                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [  4B  ] [  7B  ] [ 14B ]    Status: Not Loaded      │   │
│  │ Qwen3-4B-Q4_K_M.gguf        [ Download ] [ Load ]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  MINION BRAIN (Background Tasks)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Qwen3-0.6B-Q4_K_M           Status: Not Loaded      │   │
│  │                              [ Download ] [ Load ]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  VOICE — Speech Recognition (STT)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Whisper Large v3 Turbo (fp16) Status: Not Downloaded │   │
│  │ 1.6 GB                       [ Download ]             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  VOICE — Text to Speech (TTS)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Kokoro v1.0 (fp16)           Status: Not Downloaded  │   │
│  │ 163 MB + voices (2 MB)       [ Download ]             │   │
│  │ Voice: [af_heart ▼] (Female) [ Preview ]              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  VISION — Screen Analysis (SigLIP2 HD)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SigLIP2 Base (int8)          Status: Not Downloaded  │   │
│  │ 95 MB                        [ Download ]             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  SEARCH — Embedder (RAG)                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ nomic-embed-v1.5 Q8          Status: Not Downloaded  │   │
│  │ 300 MB                       [ Download ] [ Load ]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  SEARCH — Reranker (RAG)                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Qwen3-Reranker-0.6B          Status: Not Downloaded  │   │
│  │ 300 MB                       [ Download ] [ Load ]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PLATFORM STATUS                                            │
│  LibSQL: ✅ Ready    DuckDB: ✅ Ready   Moka: ✅ Ready     │
│  SurrealDB: ✅ Ready  RRO/Qdrant: ✅ Ready                 │
│  Model Loader: ✅ Ready (8 slots, 0 loaded)                │
├─────────────────────────────────────────────────────────────┤
│  [ Import from Disk ]  [ Search HuggingFace ]               │
│                                                             │
│  [ Save Configuration ]  [ Apply & Launch Clyffy ]          │
└─────────────────────────────────────────────────────────────┘
```

---

## ACCEPTANCE CRITERIA — EVERY ONE MUST PASS

- [ ] App starts via `cargo xtask run-dev` with ZERO errors
- [ ] Model loader panel renders with ALL slots visible
- [ ] Each slot shows: friendly name, model file, status (downloaded/loaded/not)
- [ ] Clyffy's Brain has 4B/7B/14B size selector
- [ ] One-click download for EVERY model (hardcoded HF repos)
- [ ] Download shows real progress (not 0% then 100%)
- [ ] After download, model appears as "Downloaded, not loaded"
- [ ] Load button assigns model to slot and loads it
- [ ] Platform status bar shows all service health (LibSQL, DuckDB, SurrealDB, RRO, Moka, Model Loader)
- [ ] Import from Disk opens native file picker, imports GGUF
- [ ] Search HuggingFace returns real results when typing "llama", "phi", "qwen"
- [ ] Voice TTS section has voice picker dropdown (male/female)
- [ ] "Save Configuration" persists slot assignments
- [ ] "Apply & Launch Clyffy" verifies brain is loaded, opens chat
- [ ] Chat window opens and Clyffy can receive messages
- [ ] ALL compile warnings fixed (see list below)

---

## COMPILE WARNINGS TO FIX

### kernel/model-loader (8 warnings)

| # | File | Warning | Fix |
|---|------|---------|-----|
| 1 | `backends/orpheus.rs:22` | unused `START_TOKEN_ID` | prefix with `_` |
| 2 | `backends/orpheus.rs:25` | unused `CODE_START_TOKEN_ID` | prefix with `_` |
| 3 | `backends/orpheus.rs:40` | unused `MIN_FRAMES_BEFORE_DECODE` | prefix with `_` |
| 4 | `backends/orpheus.rs:57` | missing doc on `new()` | add doc comment |
| 5 | `backends/ort/kokoro.rs:24` | missing doc on `new()` | add doc comment |
| 6 | `backends/ort/snac.rs:30` | missing doc on `new()` | add doc comment |
| 7 | `backends/ort/whisper.rs:29` | missing doc on `new()` | add doc comment |
| 8 | `slots/types.rs:122` | missing doc on `Coupled { parent }` | add doc comment |

### kernel/devpulse-clyffy (36 warnings)

| # | File | Warning | Fix |
|---|------|---------|-----|
| 9 | `adapters/safety/scanner.rs:13` | unused import `patterns_for_lang` | remove |
| 10 | `adapters/safety/scanner.rs:11` | unused import `VulnPattern` | remove |
| 11 | `cortex/persistence/mod.rs:23,41` | `cfg(feature = "kokoros")` — feature doesn't exist | add feature to Cargo.toml OR remove cfg gate |
| 12 | `adapters/safety/rename_guard.rs` | 10 unused functions (lang-specific query builders) | prefix with `_` or cfg-gate |
| 13 | `adapters/kv_cache/mod.rs` | 2 missing docs | add module docs |
| 14 | `adapters/persistence/mod.rs` | 5 missing docs | add module docs |
| 15 | `adapters/persistence/surreal.rs` | missing struct doc | add doc |
| 16 | `adapters/reasoning/mod.rs` | 3 missing docs | add module docs |
| 17 | `adapters/reasoning/hmm.rs` | missing struct doc | add doc |
| 18 | `adapters/safety/language.rs` | 7 missing variant docs | add docs |
| 19 | `cortex/traits/mod.rs` | 3 missing module docs | add docs |
| 20 | `cortex/traits/memory.rs` | 2 missing method docs | add docs |
| 21 | `cortex/traits/reasoning.rs` | 1 missing method doc | add doc |
| 22 | `cortex/traits/security.rs` | 1 missing method doc | add doc |

### interfaces/desktop/src-tauri (2 warnings)

| # | File | Warning | Fix |
|---|------|---------|-----|
| 23 | `lib.rs:435` | `cfg(feature = "inference")` — feature not in Tauri crate | remove cfg or add feature |
| 24 | `lib.rs:431` | unused variable `platform` | prefix with `_` |

### Frontend raw values (3 violations)

| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|
| 25 | `ModelSearch.svelte` | 61 | raw `oklch(0.15 0.01 270 / 0.5)` | use token var |
| 26 | `HfModelCard.svelte` | 83-88 | raw oklch in fitColorMap | use `var(--signal-*)` |
| 27 | `HfModelCard.svelte` | 165 | raw oklch on download button | use token var |

---

## PHASE 1: Fix All Compile Warnings (Rust)

Fix every warning listed above. Zero warnings target.

### Task Checklist
- [ ] 1.1: Fix 8 model-loader warnings (unused consts, missing docs)
- [ ] 1.2: Fix 36 devpulse-clyffy warnings (unused imports, missing docs, dead code, cfg)
- [ ] 1.3: Fix 2 devpulse_desktop_backend warnings (cfg feature, unused var)
- [ ] 1.4: `cargo xtask run-dev` builds with ZERO warnings
- [ ] 1.5: Commit

---

## PHASE 2: Build the Real Model Loader DevTool Panel

Replace the broken SetupWizard/ModelLoaderPanel with a single, clear devtool component.

### New Component: `ClyffyModelConfig.svelte`

This is NOT the wizard. This is a devtool panel that shows every slot, every model, every status. It exists in the Model Loader window (`/model-loader` route).

### Hardcoded Model Registry

Each slot has exact HF repo + filename. No searching required for the baseline:

```typescript
const BASELINE_MODELS = {
  "chat.brain": {
    label: "Clyffy's Brain",
    sizes: [
      { label: "4B", repo: "bartowski/Qwen3-4B-GGUF", file: "Qwen3-4B-Q4_K_M.gguf", sizeMb: 2600 },
      { label: "7B", repo: "bartowski/Qwen3-7B-GGUF", file: "Qwen3-7B-Q4_K_M.gguf", sizeMb: 4100 },
      { label: "14B", repo: "bartowski/Qwen3-14B-GGUF", file: "Qwen3-14B-Q4_K_M.gguf", sizeMb: 8100 },
    ],
  },
  "minion.shared": {
    label: "Minion Brain",
    sizes: [
      { label: "0.6B", repo: "Qwen/Qwen3-0.6B-GGUF", file: "qwen3-0.6b-q4_k_m.gguf", sizeMb: 500 },
    ],
  },
  "voice.stt": {
    label: "Voice — Speech Recognition (STT)",
    sizes: [
      { label: "Whisper Large v3 Turbo", repo: "csukuangfj/sherpa-onnx-whisper-large-v3-turbo", file: "large-v3-turbo-encoder.int8.onnx", sizeMb: 1600, isDir: true },
    ],
  },
  "voice.tts": {
    label: "Voice — Text to Speech (TTS)",
    sizes: [
      { label: "Kokoro v1.0 fp16", repo: "onnx-community/Kokoro-82M-v1.0-ONNX", file: "model_fp16.onnx", sizeMb: 163 },
    ],
  },
  "vision.embedder": {
    label: "Vision — Screen Analysis (SigLIP2 HD)",
    sizes: [
      { label: "SigLIP2 Base int8", repo: "onnx-community/siglip2-base-patch16-256-ONNX", file: "vision_model_int8.onnx", sizeMb: 95 },
    ],
  },
  "rag.embedder": {
    label: "Search — Embedder",
    sizes: [
      { label: "nomic-embed-v1.5", repo: "nomic-ai/nomic-embed-text-v1.5-GGUF", file: "nomic-embed-text-v1.5.Q8_0.gguf", sizeMb: 300 },
    ],
  },
  "rag.reranker": {
    label: "Search — Reranker",
    sizes: [
      { label: "Qwen3-Reranker-0.6B", repo: "Qwen/Qwen3-Reranker-0.6B-GGUF", file: "qwen3-reranker-0.6b.Q8_0.gguf", sizeMb: 300 },
    ],
  },
};
```

### Per-Slot Row UI

Each slot row shows:
1. **Friendly name** (Clyffy's Brain, Minion Brain, Voice STT, etc.)
2. **Size selector** (4B/7B/14B for brain, single option for others)
3. **Status badge**: Not Downloaded → Downloading X% → Downloaded → Loading → Loaded → Error
4. **Action buttons**: [Download] [Load] [Unload] — context-dependent
5. **File info**: filename, size on disk

### Platform Status Bar

Shows health of every booted service:
- LibSQL, DuckDB, SurrealDB, Moka, RRO/Qdrant, Model Loader
- Each: name + status (Ready/Failed/Skipped) + latency
- Data comes from `commands.getStatus()` → `SystemHealth`

### Voice TTS Section — Extra Controls

- Voice picker dropdown: grouped by language → gender
- Preview button: synthesize "Hello, I'm Clyffy" with selected voice
- Speed slider (future — not blocking)

### Bottom Actions

- **Import from Disk**: native file picker → GGUF → auto-detect slot
- **Search HuggingFace**: inline search (existing ModelSearch component)
- **Save Configuration**: persist slot assignments to disk
- **Apply & Launch Clyffy**: verify brain loaded → open chat window

### Task Checklist
- [ ] 2.1: Create `ClyffyModelConfig.svelte` component
- [ ] 2.2: Create `BASELINE_MODELS` constant with all hardcoded repos
- [ ] 2.3: Build slot row component with size selector + status + actions
- [ ] 2.4: Build platform status bar (service health from getStatus)
- [ ] 2.5: Wire download buttons to `commands.downloadModel(repo, file)`
- [ ] 2.6: Wire load/unload to `commands.loadSlot()` / `commands.unloadSlot()`
- [ ] 2.7: Wire "Apply & Launch" to `commands.completeModelSetup()`
- [ ] 2.8: Voice picker dropdown for TTS slot
- [ ] 2.9: Import from Disk button
- [ ] 2.10: Inline HF search
- [ ] 2.11: Wire into `/model-loader` route
- [ ] 2.12: `pnpm svelte-check` — zero errors

---

## PHASE 3: Fix Frontend Raw Values

- [ ] 3.1: ModelSearch.svelte line 61 — replace raw oklch with token
- [ ] 3.2: HfModelCard.svelte lines 83-88 — fitColorMap use signal tokens
- [ ] 3.3: HfModelCard.svelte line 165 — download button use token
- [ ] 3.4: `pnpm svelte-check`

---

## PHASE 4: Wire Boot Overlay to Real Panel

The BootOverlay wizard phase should show the `ClyffyModelConfig` panel (or a simplified version of it) instead of the broken SetupWizard.

- [ ] 4.1: BootOverlay loads ClyffyModelConfig in wizard phase
- [ ] 4.2: "Apply & Launch Clyffy" in the config panel calls completeModelSetup
- [ ] 4.3: completeModelSetup verifies brain → signals ready → overlay fades → chat opens
- [ ] 4.4: If brain not assigned, error shows in panel (not silent)

---

## PHASE 5: End-to-End Verification

- [ ] 5.1: `cargo xtask run-dev` — ZERO errors, ZERO warnings
- [ ] 5.2: App starts, boot overlay shows
- [ ] 5.3: Model config panel renders with all 7 slots
- [ ] 5.4: Click Download on Clyffy's Brain 4B → download starts → progress shows → completes
- [ ] 5.5: Click Load → model loads → status changes to "Loaded"
- [ ] 5.6: Click "Apply & Launch Clyffy" → overlay fades → chat window opens
- [ ] 5.7: Platform status shows all services
- [ ] 5.8: Search "llama" → results appear with GGUF files
- [ ] 5.9: Import from Disk → file picker → model imported
- [ ] 5.10: Commit with all acceptance criteria verified

---

## MODEL FILES — EXACT DOWNLOAD SOURCES

| Slot | Model | HuggingFace Repo | File | Size |
|------|-------|-------------------|------|------|
| chat.brain (4B) | Qwen3-4B | bartowski/Qwen3-4B-GGUF | Qwen3-4B-Q4_K_M.gguf | 2.6 GB |
| chat.brain (7B) | Qwen3-7B | bartowski/Qwen3-7B-GGUF | Qwen3-7B-Q4_K_M.gguf | 4.1 GB |
| chat.brain (14B) | Qwen3-14B | bartowski/Qwen3-14B-GGUF | Qwen3-14B-Q4_K_M.gguf | 8.1 GB |
| minion.shared | Qwen3-0.6B | Qwen/Qwen3-0.6B-GGUF | qwen3-0.6b-q4_k_m.gguf | 500 MB |
| voice.stt | Whisper Turbo | csukuangfj/sherpa-onnx-whisper-large-v3-turbo | (directory) | 1.6 GB |
| voice.tts | Kokoro v1.0 | onnx-community/Kokoro-82M-v1.0-ONNX | model_fp16.onnx | 163 MB |
| voice.tts (voices) | Kokoro voices | thewh1teagle/kokoro-onnx | voices-v1.0.bin | 2 MB |
| vision.embedder | SigLIP2 Base | onnx-community/siglip2-base-patch16-256-ONNX | vision_model_int8.onnx | 95 MB |
| rag.embedder | nomic-embed | nomic-ai/nomic-embed-text-v1.5-GGUF | nomic-embed-text-v1.5.Q8_0.gguf | 300 MB |
| rag.reranker | Qwen3-Reranker | (repo TBD — verify exists) | (file TBD) | ~300 MB |
