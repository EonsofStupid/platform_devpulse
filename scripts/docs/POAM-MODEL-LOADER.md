# POA&M — Model Loader Foundation

> **Created**: 2026-04-03
> **Owner**: EonsofStupid
> **Status**: ACTIVE — Sprints pending approval

---

## Executive Summary

The model loader kernel crate has real inference code (Candle text generation works).
The Tauri command layer is fully wired (32 commands, 28 real).
The frontend components exist structurally.

**But the system cannot function end-to-end because:**

1. Boot pipeline blocks Model Loader behind SurrealDB (3-7s delay, zero dependency)
2. Frontend type shapes are wrong (snake_case vs camelCase = every field is `undefined`)
3. Voice backends are stubs returning silence/empty
4. GPU is unreachable in default build (features OFF)
5. Download progress is binary (0% then 100%)
6. Hot-swap is an empty file

---

## Milestones

### M1: FOUNDATION — Boot Unblock + Type Safety (Sprint 1)
**Objective**: Model Loader boots, frontend reads real data from backend.
**Deadline**: Sprint 1 completion
**Verification**: App starts → Model Loader panel shows real slot data with correct field values.

### M2: BROWSE + LOAD — Search, Import, Load Real Models (Sprint 2)
**Objective**: User can find models (HF search + local import), download them, load into slots.
**Deadline**: Sprint 2 completion
**Verification**: Type "qwen" → see results → download → assign to slot → load → inference works.

### M3: SAFE OPERATIONS — Budget, Halt, Switch, Progress (Sprint 3)
**Objective**: Model operations are safe. Loading halts background activity. Budget validates. 7B↔14B switching works. Real progress reporting.
**Deadline**: Sprint 3 completion
**Verification**: Switch from 7B to 14B → overlay blocks app → progress shows stages → completes or rolls back safely.

### M4: VOICE — STT + TTS Real Inference (Sprint 4)
**Objective**: Whisper transcribes audio. Kokoro/Piper speaks. Voice slots functional.
**Deadline**: Sprint 4 completion
**Verification**: Record audio → transcription text. Type text → audio playback.

### M5: DOGFOODING — Chat with Clyffy, Config Persistence (Sprint 5)
**Objective**: Main LLM in chat.brain slot responds to messages. Config persists across restarts. Baseline configurations for all processes.
**Deadline**: Sprint 5 completion
**Verification**: Start app → models auto-load from saved config → chat with Clyffy → restart → same config loads.

---

## Risk Register

| ID | Risk | Impact | Mitigation | Status |
|----|------|--------|------------|--------|
| R1 | SurrealDB WAL grows unbounded on dirty shutdown | 3-7s+ boot delay, potential data loss | Sprint 1: parallel boot. Future: fix close() to flush WAL | OPEN |
| R2 | No GPU in default build | All inference CPU-only, 14B unusable for most | Sprint 3: enable nvml + cuda features with runtime detection | OPEN |
| R3 | hf-hub sync API has no progress callbacks | Download UX is 0%→100% | Sprint 2: replace with raw reqwest + Range headers for chunked download | OPEN |
| R4 | Candle doesn't support Kokoro architecture | TTS requires separate runtime | Sprint 4: use ort crate for ONNX TTS | OPEN |
| R5 | llama.cpp bridge doesn't exist | AMD GPU users get CPU-only | Future: FFI bridge. Not in scope for M1-M5 | DEFERRED |
| R6 | HardwareMonitor::new() blocks 200ms synchronously | Blocks tokio runtime during boot | Sprint 1: wrap in spawn_blocking | OPEN |

---

## False Positive / Exception Register (Warnings Documentation)

| ID | Warning/Error | Source | Disposition | Notes |
|----|--------------|--------|-------------|-------|
| FP1 | `forward() not supported` on CandleBackend | `backends/candle/backend.rs` | EXCEPTION | Intentional — only `generate()` path is used. Trait requires it but it's a dead method. Document in code. |
| FP2 | `SNAC decode returns silence` without ort-backend | `backends/ort/snac.rs` | KNOWN STUB | Returns `vec![0.0; 24576]` with warn log. Acceptable until Sprint 4 enables ort. |
| FP3 | `var(-bg)` invalid CSS in ModelLoaderPanel | `components/ModelLoaderPanel.svelte:118` | BUG | Missing `--` prefix. Fix in Sprint 1. |
| FP4 | `ghost LOCK file` at `.userdata/global/surreal/knowledge/LOCK` | Pre-consolidation artifact | CLEANUP | 8 bytes, dated Mar 14. Safe to delete. Preflight doesn't clean it. |
| FP5 | `services.system.graph.path` in TOML is dead config | `platform.default.toml:55` | DOCUMENTATION | Config path is ignored — graph.rs hardcodes consolidated path. Document or remove from TOML. |
| FP6 | `platform:models-status` event has no consumer | `lib.rs` boot_task + `complete_model_setup` | KNOWN GAP | Event emitted but nothing listens. Wire in Sprint 1. |
| FP7 | `inference-token` event payload type mismatch | `models/mod.rs` emits bare string, frontend expects `{id, text}` | BUG | Fix in Sprint 2 — align types. |

---

## Dependency Map

```
Sprint 1 (Foundation)
    ├── Sprint 2 (Browse + Load)  ← requires real slot data
    │   └── Sprint 3 (Safe Ops)   ← requires working load/unload
    │       └── Sprint 5 (Dogfooding) ← requires safe switching + config
    └── Sprint 4 (Voice)          ← independent of 2/3, needs boot unblock
```

Sprint 4 (Voice) can run in parallel with Sprints 2-3 after Sprint 1.

---

## Acceptance Criteria per Milestone

### M1 Acceptance
- [ ] `cargo check -p devpulse-engine` passes with zero errors
- [ ] `pnpm svelte-check` passes with zero errors
- [ ] Model Loader boots within 500ms of app start (not blocked by SurrealDB)
- [ ] `get_slots` returns SlotInfo with all fields populated (not undefined)
- [ ] `get_hardware_metrics` returns real CPU/RAM values
- [ ] `scan_models` returns correct registry from .userdata/models/

### M2 Acceptance
- [ ] Type "qwen" in search → results appear within 3 seconds
- [ ] Click download → progress updates at least every 2 seconds
- [ ] Click "Import from Disk" → native file picker → file copied → appears in registry
- [ ] Assign model to chat.brain slot → load → inference generates tokens
- [ ] Cancel download mid-transfer → partial file cleaned up

### M3 Acceptance
- [ ] Loading a model → SwapOverlay blocks entire app (z-9999)
- [ ] Progress shows: "Parsing GGUF" → "Allocating memory" → "Loading tensors" → "Ready"
- [ ] Budget rejects load that would exceed 85% available RAM with actionable error message
- [ ] Switch 7B → 14B: unloads first, validates budget, loads new, falls back on failure
- [ ] Background inference on other slots continues during load (only UI is blocked)

### M4 Acceptance
- [ ] Whisper slot loaded → record 10s audio → transcription text returned
- [ ] TTS slot loaded → send text → audio buffer returned and playable
- [ ] Voice slots appear in wizard recommendations for ALL tiers

### M5 Acceptance
- [ ] App start → reads last-known-good config from libSQL → auto-loads models
- [ ] Chat with Clyffy: send message → streaming response from chat.brain slot
- [ ] Change main LLM from 7B to 14B → config persists → restart → 14B loads
- [ ] Baseline config per hardware tier established and documented
