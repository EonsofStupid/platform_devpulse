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

# SPRINT: Model Loader Foundation (Rust SSOT)

| Field | Value |
|---|---|
| Status | APPROVED FOR EXECUTION |
| Date | 2026-04-08 |
| Parent Research | `scripts/docs/sprints/SPRINT-MODEL-LOADER-FOUNDATION.research.md` |
| Scope | Backend contract correctness, deterministic backend routing, download lifecycle coherence, command health |
| SSOT Mandate | Rust model-loader domain is the sole source of truth |
| Max files per wave | 5 |
| Verification policy | compile/test gates after every wave |

---

## Verbatim Mandate

Rust (`kernel/model-loader` + engine integration) is the sole source of truth for model capability semantics, recommendation policy, format routing, and download lifecycle events. Frontend Svelte 5 code consumes canonical wire contracts and renders state only. Any duplicated policy or contract outside Rust is a defect and is removed in the same wave it is found.

---

## Guardrails

1. No UI rewrites in this sprint.
2. No generated binding edits.
3. No temporary shims or dual contract period.
4. No policy logic added in Tauri command handlers.
5. Any duplicate enum/table/policy discovered is consolidated immediately into Rust SSOT.
6. Keep implementation lean: no new orchestration framework when existing lane + command surfaces already solve the need.

---

## Layman Guided Outcomes (Must Be Captured)

The guided system must let a non-technical user complete these outcomes:

1. Understand hardware readiness in plain language.
2. Choose Main Brain + Helper Brain with simple presets.
3. Choose `GGUF` or `SafeTensors` for both Main and Helper brains.
4. See fit status before loading.
5. Download/import with visible progress.
6. Assign/load all required roles.
7. Confirm chat generation.
8. Confirm STT -> Brain -> TTS loop.
9. Toggle trace lanes for critical sections.
10. Quarantine (disable) one section and observe safe degradation + recovery.

---

## Wave 0 — SSOT Normalization (Architecture First)

### Goal
Collapse duplicate policy/contract definitions and lock DDD ownership boundaries.

### Target Files
- `kernel/model-loader/src/**`
- `systems/devpulse-engine/src/platform/services/model_loader.rs`
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs`

### Tasks
1. Define canonical ownership map in code comments + sprint evidence notes.
2. Remove duplicate policy branches from adapter layers.
3. Ensure one canonical type per concept (tier, device preference, slot recommendation payload).
4. Lock single routing authority function in router module.

### Acceptance Criteria
- [ ] No model-loader business policy branch remains in Tauri command handlers.
- [ ] One canonical contract/type per concept is used across engine and commands.
- [ ] `cargo check -p model-loader` passes.
- [ ] `cargo check -p devpulse-engine` passes.

### Verification Commands
```bash
cargo check -p model-loader
cargo check -p devpulse-engine
```

---

## Wave 1 — Auto Configure Contract Authority

### Goal
Make `auto_configure` output deterministic and frontend-compatible without frontend workarounds.

### Target Files
- `kernel/model-loader/src/hardware/auto_config.rs`
- `kernel/model-loader/src/slots/types.rs`
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs`

### Tasks
1. Apply explicit serde naming strategy and stable enum wire values.
2. Align recommendation payload shape to canonical contract expected by current wizard parsing.
3. Re-author recommendation matrix to intended slot responsibilities and formats.
4. Ensure `already_downloaded` is derived from canonical registry filename set.
5. Add contract serialization tests that fail on wire drift.

### Acceptance Criteria
- [ ] `auto_configure` payload parses cleanly in existing wizard path.
- [ ] Enum values are deterministic (no implicit Rust variant serialization surprises).
- [ ] Recommendation entries are slot-correct and format-correct.
- [ ] Contract tests added and passing.
- [ ] `cargo check -p model-loader` passes.

### Verification Commands
```bash
cargo test -p model-loader auto_config -- --nocapture
cargo check -p model-loader
```

---

## Wave 2 — Deterministic Format Routing

### Goal
Enforce runtime routing policy exactly:
- `.gguf` -> llama.cpp
- `.safetensors` -> Candle
- `.onnx`/Sherpa assets -> ORT/Sherpa

### Target Files
- `kernel/model-loader/src/backends/router.rs`
- `kernel/model-loader/src/service.rs`
- `kernel/model-loader/src/models/discovery.rs`
- `kernel/model-loader/src/backends/mod.rs`

### Tasks
1. Remove Candle-first GGUF ambiguity in routing policy.
2. Split load execution branches so selected backend is actually honored.
3. Prevent `.bin`/Whisper edge cases from being mislabeled into GGUF load path.
4. Add invariance tests for extension -> backend mapping.
5. Add smoke test `test_load_any_model` (skip cleanly if no model files exist).

### Acceptance Criteria
- [ ] Runtime does not funnel `LlamaCpp` through Candle pool path.
- [ ] Extension-based routing is deterministic and test-backed.
- [ ] `test_load_any_model` exists and reports actionable load/fail errors.
- [ ] `cargo check -p model-loader` passes.
- [ ] `cargo check -p devpulse-engine` passes.

### Verification Commands
```bash
cargo test -p model-loader test_load_any_model -- --nocapture
cargo test -p model-loader router -- --nocapture
cargo check -p model-loader
cargo check -p devpulse-engine
```

---

## Wave 3 — Download Lifecycle and Event Schema Coherence

### Goal
Backend owns full download lifecycle and emits one canonical event schema.

### Target Files
- `kernel/model-loader/src/models/download.rs`
- `kernel/model-loader/src/traits/events.rs`
- `systems/devpulse-engine/src/platform/integrations/events.rs`
- `systems/devpulse-engine/src/platform/services/model_loader.rs`

### Tasks
1. Guarantee post-download registry visibility invariant in backend flow.
2. Canonicalize event payload key casing across emit bridge and listeners.
3. Ensure complete/fail/cancel terminal events are always emitted.
4. Add schema tests for progress/complete/fail payloads.

### Acceptance Criteria
- [ ] Download completion makes model discoverable without frontend timing dependency.
- [ ] Event payload keys are consistent and documented.
- [ ] Progress/complete/fail events are all observable and test-backed.
- [ ] `cargo check -p model-loader` passes.
- [ ] `cargo check -p devpulse-engine` passes.

### Verification Commands
```bash
cargo test -p model-loader download -- --nocapture
cargo check -p model-loader
cargo check -p devpulse-engine
```

---

## Wave 4 — Command Health + Dead File Cleanup (Safe)

### Goal
Validate command surfaces and remove only truly orphaned UI files.

### Target Files
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs`
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/**`

### Tasks
1. Validate command map for:
   - `auto_configure`
   - `scan_models`
   - `get_slots`
   - `download_model`
   - `load_slot`
   - `inference_generate`
   - `get_hardware_metrics`
   - `get_model_catalog`
   - `assign_model_to_slot`
   - `complete_model_setup`
2. Re-scan references for candidate dead files.
3. Delete only files with zero references.

### Acceptance Criteria
- [ ] All required commands resolve to healthy backend paths.
- [ ] No referenced wizard file is deleted.
- [ ] Cleanup removes only true orphans.
- [ ] `cargo check -p devpulse-engine` passes.

### Verification Commands
```bash
cargo check -p devpulse-engine
```

---

## Wave 5 — Guided Validation Pack (Lean Operator Tooling)

### Goal
Provide explicit, minimal validation flow for LLM format testing, voice cross-linking, and lane trace/quarantine checks.

### Target Files
- `scripts/docs/sprints/SPRINT-MODEL-LOADER-FOUNDATION.research.md`
- `scripts/docs/sprints/SPRINT-MODEL-LOADER-FOUNDATION.md`
- (execution phase) guided wizard/service docs where validation checklist is surfaced

### Tasks
1. Add explicit test matrix:
   - Main Brain `GGUF`
   - Main Brain `SafeTensors`
   - Helper Brain `GGUF`
   - Helper Brain `SafeTensors`
2. Add STT/TTS cross-link validation steps (single-click loop test).
3. Add telemetry lane validation steps using:
   - `get_lane_config`
   - `set_lane_config`
   - `query_span_traces`
4. Define quarantine test:
   - disable one lane
   - verify degraded behavior
   - re-enable and verify recovery

### Acceptance Criteria
- [ ] Guided flow explicitly covers both model formats for both brains.
- [ ] STT/TTS cross-link test path is documented and executable.
- [ ] Critical lane trace toggle path is documented and executable.
- [ ] Quarantine/recovery path is documented and executable.

### Verification Commands
```bash
# Runtime command checks already available via bindings/tauri commands:
# get_lane_config, set_lane_config, query_span_traces
```

---

## Final Exit Criteria (Sprint Complete)

- [ ] Wizard model step receives valid recommendations from Rust contract.
- [ ] Routing by file format is deterministic in runtime load paths.
- [ ] Download completion guarantees discoverability in registry.
- [ ] No duplicate policy/contract logic remains outside Rust SSOT.
- [ ] Guided validation supports GGUF/SafeTensors A/B testing for Main + Helper brains.
- [ ] Guided validation confirms STT/TTS cross-link behavior.
- [ ] Guided validation confirms trace toggles and lane quarantine/recovery.
- [ ] All per-wave verification commands pass.
