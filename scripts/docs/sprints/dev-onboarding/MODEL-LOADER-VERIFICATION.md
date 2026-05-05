# Model Loader — Enterprise Verification Checklist

> Run this checklist after ML-01 through ML-06 are complete.
> Every item requires PROOF. "Looks good" is not proof.

## Rust Backend (ML-01)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 1 | .bin files discovered | model-loader/src/models/discovery.rs | PASTE registry entry for ggml-small.bin showing SpeechToText capability |
| 2 | Safetensor shards filtered | model-loader/src/models/discovery.rs | STATE count of safetensor entries in registry (expected: 0) |
| 3 | Duplicates deduplicated | model-loader/src/models/registry.rs | STATE total model count in registry (expected: 6-8, not 20) |
| 4 | cargo check passes | model-loader | PASTE last line of cargo check output (0 errors) |
| 5 | cargo test passes | model-loader | PASTE test summary line (all tests pass) |

## Download Pipeline (ML-02)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 6 | Download progress updates in state | wizard.runes.svelte.ts | Start download, inspect wizardState.activeDownloads — bytesDownloaded updates |
| 7 | Toast on download start | wizard.service.ts | Visual: "Downloading..." toast appears |
| 8 | Toast on download complete | wizard.service.ts | Visual: "downloaded" toast appears |
| 9 | Toast on download fail | wizard.service.ts | Visual: toast.error with raw message |
| 10 | Cancel download works | wizard.service.ts | Click cancel -> download stops, toast "cancelled" |
| 11 | pnpm svelte-check passes | -- | PASTE COMPLETED line (0 errors) |

## Slot Assignment Panel (ML-03)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 12 | Glass cards visible | SlotAssignmentPanel.svelte | Screenshot: cards have depth/glass effect |
| 13 | Teal glow on loaded slots | SlotAssignmentPanel.svelte | Screenshot: loaded card has teal border glow |
| 14 | Red glow on failed slots | SlotAssignmentPanel.svelte | Screenshot: failed card has red border glow |
| 15 | chat.brain appears FIRST | SlotAssignmentPanel.svelte | Screenshot: first card is "Main AI" |
| 16 | Subsystem headers visible | SlotAssignmentPanel.svelte | Screenshot: "Chat", "Search Pipeline", "Voice" headers |
| 17 | Model metadata inline | SlotAssignmentPanel.svelte | Screenshot: arch, quant, size, VRAM, context visible |
| 18 | Inline expand works | SlotAssignmentPanel.svelte | Screenshot: card expanded showing model list, NO floating layer |
| 19 | Assign by clicking model row | SlotAssignmentPanel.svelte | Click model -> assigned, card collapses |
| 20 | Load button works | SlotAssignmentPanel.svelte | Click Load -> model loads |
| 21 | Unload button visible on loaded | SlotAssignmentPanel.svelte | Screenshot: Unload button on hot/standby slot |
| 22 | VRAM guard disables Load | SlotAssignmentPanel.svelte | Screenshot: "Too large for GPU" message, Load disabled |
| 23 | Download progress inline | SlotAssignmentPanel.svelte | Screenshot: Progress bar with speed/ETA during download |
| 24 | Cancel download button | SlotAssignmentPanel.svelte | Click cancel -> download stops |
| 25 | Auto-Configure button | SlotAssignmentPanel.svelte | Click -> slots auto-filled -> toasts per assignment |
| 26 | No floating layers | SlotAssignmentPanel.svelte | GREP fixed\|z-50 -> 0 results |
| 27 | pnpm svelte-check passes | -- | PASTE COMPLETED line (0 errors) |

## Layout + VRAM + Swap (ML-04)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 28 | Toaster mounted | ModelLoaderStep.svelte | Toast notifications render in viewport |
| 29 | Scan on Phase 2 entry | ModelLoaderStep.svelte | Boot app -> Phase 2 -> models appear in slot cards |
| 30 | VRAM stacked bar | ResourceAllocationPanel.svelte | Screenshot: colored segments per slot |
| 31 | Over-budget indicator | ResourceAllocationPanel.svelte | Assign huge models -> red overflow message |
| 32 | Per-slot load time estimates | ResourceAllocationPanel.svelte | Screenshot: per-slot timing based on model size + device |

## HF Search + Cross-Links (ML-05)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 33 | HF search inline | HuggingFaceSearch.svelte | Screenshot: search section below slot cards |
| 34 | Search returns results | HuggingFaceSearch.svelte | Type query -> results appear |
| 35 | Download from HF | HuggingFaceSearch.svelte | Click Download -> slot picker -> download starts |
| 36 | Cross-link readiness bar | SlotAssignmentPanel.svelte | Screenshot: colored dots per subsystem |
| 37 | No floating popup for HF | -- | GREP ModelBrowserPopup in ModelLoaderStep -> 0 results |

## STIG Compliance (ML-06)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 38 | aria-label on all buttons | SlotAssignmentPanel.svelte | GREP aria-label -> count matches button count |
| 39 | Keyboard expand/collapse | SlotAssignmentPanel.svelte | Tab to Assign -> Enter -> list expands -> Escape -> collapses |
| 40 | Focus management | SlotAssignmentPanel.svelte | Expand -> focus moves to first model row |
| 41 | aria-live="polite" on status | SlotAssignmentPanel.svelte | GREP aria-live="polite" -> present on status Badge wrapper |
| 42 | aria-live="assertive" on errors | SlotAssignmentPanel.svelte | GREP aria-live="assertive" -> present on error divs |
| 43 | role="listbox" on model list | SlotAssignmentPanel.svelte | GREP role="listbox" -> present on expandable container |
| 44 | role="option" on model rows | SlotAssignmentPanel.svelte | GREP role="option" -> present on each model row |
| 45 | Color not sole indicator | SlotAssignmentPanel.svelte | Fit indicator has text label + dot (not dot alone) |
| 46 | svelte-check warnings documented | All files | STATE count, each has comment with reason |

## Error Handling (ML-06)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 47 | JSDoc on all public functions | wizard.service.ts | Read file, confirm every export has @throws or @sideeffects |
| 48 | logError with context | wizard.service.ts | GREP logError -> every catch block has structured context |
| 49 | Download fail logs repo+file | wizard.service.ts | Code review: catch in downloadAndAssign logs repo, file, bytes |
| 50 | Load fail logs VRAM+model | wizard.service.ts | Code review: catch in load path logs model size, available VRAM |
| 51 | No silent catch blocks | All files | GREP "catch" -> every catch either throws, logs, or sets error state |

## Data Integrity

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 52 | renderForge used on slot cards | SlotAssignmentPanel.svelte | GREP renderForge -> present, applied to card elements |
| 53 | No raw oklch in component files | All wizard components | GREP "oklch" -> 0 inline style results |
| 54 | ColdLight tokens for all colors | All wizard components | GREP "var(--" -> all colors use token variables |

## Sprint 13 Fixes

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 55 | Completion phase exists | wizard.types.ts | "completion" in WizardPhase union + WIZARD_PHASES array |
| 56 | CompletionStep rendered | SetupWizard.svelte | Phase "completion" block renders CompletionStep |
| 57 | Model browser slot selector | ModelBrowserPopup.svelte | targetSlot prop + selectedSlot state + slot dropdown |
| 58 | 8-field pipeline monitor | ClyfActivationStep.svelte | STT, Brain, TTS, VRAM, Last RT, Token/s, Voice latency, Round-trips |
| 59 | Path derived from .userdata | ProjectSetupStep.svelte | get_hardware_metrics -> model_dir -> parent -> /projects |
| 60 | state.hot + state.cold families | seed-families.ts | Both registered with coreFacts + 4 variations |

## Sprint 12 (Keyring)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 61 | 4 credential commands | credentials/mod.rs | store, get, delete, get_status with #[tauri::command] |
| 62 | Masked preview only to frontend | credentials/mod.rs | get_api_key_status shows first 8 chars + "...****" |
| 63 | NoEntry = Ok(None) | credentials/mod.rs | Match on keyring::Error::NoEntry returns Ok |
| 64 | Commands in lib.rs | lib.rs | All 4 in collect_commands |
