# Research: Model Loader Foundation (Rust SSOT)

**Date**: 2026-04-08  
**Status**: Ready for sprint authoring  
**Scope**: backend contract integrity, deterministic routing, capability-driven DDD boundaries

## Executive Decision (Verbatim)

Rust is the SSOT for Model Loader domain behavior.  
Svelte and Tauri frontend layers are consumers/adapters only.  
No business policy, routing policy, or capability semantics are authored in frontend code.

## SSOT Ownership Map

| Concern | SSOT | Notes |
|---|---|---|
| Capability taxonomy (`text_generation`, `embedding`, `speech_to_text`, etc.) | `kernel/model-loader` | Canonical domain language |
| Format-to-backend policy (`.gguf`, `.safetensors`, `.onnx`) | `kernel/model-loader/src/backends/router.rs` | One authoritative router |
| Auto-config tier + recommendations | `kernel/model-loader/src/hardware/auto_config.rs` | Frontend must not reinterpret policy |
| Model discovery/registry truth | `kernel/model-loader/src/models/discovery.rs` + `registry.rs` | Registry is source of local model truth |
| Download lifecycle semantics | `kernel/model-loader/src/models/download.rs` + events | Backend owns terminal states |
| IPC command exposure | `interfaces/desktop/src-tauri/src/commands/models/mod.rs` | Adapter layer only |
| UI rendering and interaction | `interfaces/desktop/src/lib/...` | Present state; no duplicate domain rules |

## Confirmed Foundation Breakpoints (Audit)

1. `auto_configure` wire contract drift
- Rust currently serializes domain structs/enums in shapes that do not reliably match frontend expectations.
- Result: recommendations fail to map predictably; wizard appears broken despite command existing.

2. Routing policy inconsistency
- Router can select `LlamaCpp`, but load execution path still funnels `LlamaCpp` through Candle path branches.
- Result: format policy is non-deterministic in runtime behavior.

3. Download/event schema inconsistency
- Event key casing differs across layers (`download_id` vs `downloadId` patterns).
- Result: brittle listeners and hidden progress/complete regressions.

4. Recommendation matrix mismatch
- Current Rust recommendation table does not align with intended slot responsibilities and file-format strategy.
- Result: wrong model/file combos and inconsistent setup outcomes.

## Layman-Friendly LLM Loading Steps (Guided System SSOT)

This is the user-facing flow the product should expose in plain language:

1. **Check my machine**
- Detect GPU/VRAM/RAM/disk and explain in plain English what is possible.

2. **Pick my AI brains**
- Main Brain (`chat.brain`) and Helper Brain (`minion.shared`) with simple presets: Fast, Balanced, Smart.

3. **Pick model format (advanced but understandable)**
- Allow `GGUF` or `SafeTensors` for Main Brain and Helper Brain.
- Explain tradeoff in one line each.

4. **Confirm it fits**
- Show “Fits comfortably / Tight fit / CPU fallback” before download or load.

5. **Get models on disk**
- Download or import; show progress, speed, ETA, and clear failures.

6. **Assign models to roles**
- Main Brain, Helper Brain, Search, Voice Listen (STT), Voice Speak (TTS), Vision.

7. **Load and warm up**
- Show loading stages and completion status per role.

8. **Test chat**
- Send a test prompt and confirm generation is successful.

9. **Test voice chain end-to-end**
- Mic -> STT -> Brain -> TTS -> speaker loop with a one-click test.

10. **Test unified signal pipeline**
- Fire one synthetic signal and verify routing through helper/escalation paths.

11. **Trace critical sections**
- Toggle traces for critical lanes and confirm spans are visible.

12. **Quarantine/disconnect a section safely**
- Disable one lane (for example `SpeechToText`) without breaking the rest; verify degraded behavior and recovery.

## Guided System Coverage Matrix (Current vs Required)

| Capability | Current State | Required State |
|---|---|---|
| Hardware detection + tiering | Present | Keep, but improve layman messaging |
| Main/Helper brain selection | Partial | Preset-driven brain selection with clear labels |
| `GGUF` + `SafeTensors` for both brains | Partial/unstable | Mandatory and test-backed in routing + loading |
| Download UX (progress/speed/ETA) | Partial | Fully deterministic and event-schema stable |
| Slot assignment and load flow | Present | Keep, harden errors + fit checks |
| STT/TTS slot config | Present | Add explicit cross-link test path in guided flow |
| Unified signal observability | Present in backend telemetry lanes | Expose guided test path and lane toggles in product flow |
| Critical section tracing toggles | Present (`get_lane_config`/`set_lane_config`) | Add operator-facing guided controls and acceptance checks |
| Quarantine/disconnect lane behavior | Partial (disable lanes via config/toggles) | Explicit “quarantine lane” workflow + rollback |

## Required Architectural Rules (Sprint Must Enforce)

1. One concept -> one canonical type/contract in Rust.
2. No dual contract period (no shim types, no parallel payload shapes).
3. Tauri commands do translation only; no business policy branches.
4. Frontend does not infer backend behavior from filename heuristics.
5. Any discovered duplicate enum/table/policy is consolidated immediately into SSOT.

## Verbatim Sprint Language

Use this block directly in sprint spec:

> **SSOT Mandate**  
> Rust (`kernel/model-loader` + engine integration) is the sole source of truth for model capability semantics, recommendation policy, format routing, and download lifecycle events.  
> Frontend Svelte 5 code must consume canonical wire contracts and render state only.  
> Any duplicated policy or contract outside Rust is a defect and must be removed in the same wave it is found.

## Wave Authoring Sequence (Foundation-First)

### Wave A — SSOT normalization
- Collapse duplicate contract definitions to one Rust canonical shape.
- Enforce serialization naming strategy for stable frontend payloads.
- Add contract tests that fail on wire-shape drift.

### Wave B — Deterministic routing
- Enforce `.gguf -> llama.cpp`, `.safetensors -> Candle`, `.onnx -> ORT/Sherpa`.
- Split load execution paths so selected backend is actually honored.
- Add routing invariance tests.

### Wave C — Download lifecycle coherence
- Ensure backend completion updates registry visibility invariants.
- Canonicalize event schema keys across bridge/listener boundaries.
- Add event schema tests for progress/complete/fail payloads.

### Wave D — Command health and dead-code cleanup
- Verify all required commands map to healthy engine paths.
- Remove only truly unreferenced wizard files after reference re-scan.

### Wave E — Guided validation path (no overengineering)
- Add a minimal guided validation checklist in the app flow:
  - Brain format A/B (`GGUF` vs `SafeTensors`)
  - STT/TTS end-to-end loop
  - signal lane trace toggle
  - lane quarantine test + recovery
- Keep this as operator-grade diagnostics, not a new subsystem.

## Definition of Done (Foundation)

- Auto-config payload contract is deterministic and parseable by current wizard pipeline.
- Format routing is deterministic and enforced in runtime load path.
- Download completion leads to model discoverability without frontend timing dependency.
- No duplicated capability/routing/contract policy outside Rust SSOT.
- Compile/test gates pass for touched crates and no new lints in touched files.

## Non-Goals (This Sprint)

- No UI redesign.
- No generated binding rewrites.
- No temporary compatibility shims to preserve broken contracts.
