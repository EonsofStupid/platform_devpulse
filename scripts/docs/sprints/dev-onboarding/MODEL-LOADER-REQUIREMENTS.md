# Model Loader — Complete Requirements for External Developer

> **Context:** Tauri 2 desktop app. SvelteKit 5 + Svelte 5 runes frontend. Rust backend.
> **Design system:** ColdLight — all UI must use `renderForge()` + `cssVarString()` for styling. No raw inline styles. No hardcoded colors.
> **State:** Svelte 5 runes (`$state`, `$derived`, `$effect`). No legacy stores.
> **Current sprint:** WIZARD OVERLAY ABSORPTION (supersedes all prior ML sprints)
> **Branch:** `feat/tts-sts-end-to-end`

---

## RULES (extracted from all sprint docs — non-negotiable)

### Architecture
1. `SetupWizardOverlay.svelte` mounted in `Frame.svelte` is the **SOLE SOURCE** for first-run setup. No `/routes/(setup)/model-loader/*` route. Ever.
2. **REAUTHOR ONLY.** No new files that duplicate absorbed functionality. Extend existing files when they cover the concern.
3. The 21 step files in `features/setup-wizard/steps/` and 8 overlay component files in `features/setup-wizard/components/` are the work surface — each reauthored in place.
4. ColdLight is SOLE AUTHORITY for all UI. Every visual component uses `renderForge()` + `cssVarString()`. No raw inline styles for colors/spacing. No custom tooltip divs. No hardcoded oklch in templates.
5. 2-layer enterprise pattern: Primitive hooks (behavior, WAI-ARIA APG) → Components (the product, hook + renderForge). No `ui/` folder. No middle layer.

### Data
6. **Rust SSOT for every visible string.** New copy keys authored into `wizard_copy.default.toml` first, matching struct in `kernel/model-loader/src/wizard/copy.rs`. Frontend consumes via `get_wizard_copy`. No hardcoded UI strings.
7. **Four role colors** from `semantic/wizard/wizard.tokens.json`: brain (purple), minion (green), encoder (blue), voice (coral). No `--accent-cyan-*` on role cards.
8. **No raw filenames** anywhere user-facing. Layman names only. Technical name in tooltip/disclosure only. `Qwen3-14B GGUF` becomes `"Clyffy's Brain — Balanced"`.
9. **Every download reflects real kernel bytes.** No mocks, no fake progress. Live byte-level from `hf-hub::api::Progress` bridge.
10. **Every model load** shows Clyffy sprite spinner with layman stage narration from real `LoadingStage` events (`kernel/model-loader/src/traits/events.rs`).

### Rust
11. No `unwrap()` in new Rust code. Use `?` or explicit handling.
12. No backwards-compat shims, no deprecations. Pre-release mode. Aggressively reauthor.
13. IP protection: kernel terms NEVER appear outside `kernel/`. Use public equivalents from `kernel_terms.toml`.
14. Desktop Tauri code NEVER imports `devpulse-clyffy`. Use `devpulse-engine` only. All kernel access through Platform facade.

### Svelte 5
15. Svelte 5 runes ONLY: `$state`, `$derived`, `$effect`, `$props`, `$bindable`. No legacy stores, no `$:`, no `writable()`.
16. Snippets (`{#snippet}`, `{@render}`) replace slots.
17. `.js` extensions on all TypeScript imports.
18. `forEach` for Set iteration (not `for...of`).
19. Tauri listeners inside `$effect`, return unlisten as cleanup. Never module scope.
20. Dialog focus trap via `{@attach}` on dialog root, APG pattern: snapshot `activeElement`, set `inert` on siblings, cycle Tab within focusables, Escape dismisses, teardown restores.

### ARIA (WAI-ARIA APG 1.2)
21. Dialog: `role="dialog" aria-modal="true" aria-labelledby` + focus trap + Escape + sibling `inert`.
22. Progressbar: `role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax="100" aria-valuetext="45% — 230 MB of 512 MB"`. Omit `aria-valuenow` for indeterminate.
23. Radiogroup (preset picker): container `role="radiogroup"`, items `role="radio" aria-checked`, roving `tabindex`, arrow keys, Home/End, Space/Enter.
24. Tablist (Change popup): `role="tablist"` + `role="tab" aria-selected aria-controls`, arrow nav, manual activation.
25. Color is NOT the sole indicator. Always pair colored dots/badges with text labels.
26. `aria-live="polite"` on status regions. `aria-live="assertive"` on error regions.
27. Every interactive button: `aria-label` with descriptive text.

### CSS / Tokens
28. TailwindCSS v4 utility classes. Minimum font size: `text-sm`. Zero `text-xs` anywhere.
29. All colors oklch. All sizes rem. NO hex, NO px, NO rgb, NO hsl in authored code.
30. Generated files MUST have `.generated.` in filename.
31. SD5 with `expand: true`, `outputReferences: false` — final resolved values.
32. No inventing CSS variable names without checking SD5 output.

### Quality Gates
33. **Hard stop between phases.** `cargo check` + `svelte-check` zero errors before next phase.
34. **Zero errors means zero.** No "pre-existing baseline" dismissal. Fix pre-existing errors in files you touch.
35. Compile check after EVERY file edit: `cargo check -p <crate>` for Rust, `pnpm svelte-check` for frontend.
36. `npx biome check` after ANY frontend edit.
37. FORBIDDEN from reporting "Done" until verification passes with zero errors.
38. Re-read files before AND after every edit. Max 3 edits to same file without verification read.
39. Max 5 files per phase. State plan upfront, wait for approval between phases.
40. No dead code. Warnings are blockers. Unused imports = delete.
41. No empty catch blocks. Every catch: throw, log with structured context, or set error state.
42. No `title=` attributes on interactive elements. Use ColdLight Tooltip component.

### Verification (run after every phase)
```bash
cargo check -p model-loader
cargo check -p devpulse-engine
cargo check -p devpulse_desktop_backend
cargo test  -p model-loader
cd interfaces/desktop
pnpm svelte-check
npx biome check src/lib/domains/app/models/ src/lib/layouts/app/ --diagnostic-level=warn
cargo xtask run-dev  # owner verifies visual + flow
```

### Banned
- Python, Docker, npm servers, external services
- `unwrap()` in production Rust
- `/core`, `/utils`, `/helpers` folders — use feature-based modules
- `ui/` folder, `useColdLight()`, `registerRecipe()`, `recipes/`, `registry/`
- `StyleMacro`, `resolveMacro()` — renamed to `renderForge()`
- Zod — use ArkType
- `@melt-ui/svelte` direct imports — ColdLight wraps Melt primitives
- jsdom testing — use vitest-browser-svelte + Playwright
- Hardcoded colors in component templates
- `any` types
- Legacy Svelte stores (`writable`, `readable`, `derived`)
- `$:` reactive statements
- Inline style objects with raw color values

---

## PLATFORM SPEC RULES (from PLATFORM_SPEC_LAYMAN.md)

### Core Philosophy
43. **Zero Config Default.** App works out of the box with bundled models. No setup required for basic use.
44. **Progressive Disclosure.** Power users can customize; beginners never need to. Technical details hidden behind "Advanced" or tooltip/disclosure.
45. **Local First.** All processing on-device. No data leaves the machine.
46. **Graceful Degradation.** Weaker hardware gets smaller models, still works. Never brick on low-end hardware.
47. **Hot Swap.** Switch models without restarting the app. Unload → load → ready, no app restart.

### User Mental Model
48. **Users think in capabilities, not models.** Slots exposed as: "AI Assistant", "Search Brain", "Voice Input", "Voice Output", "Image Understanding", "Background Removal". Never expose model filenames as primary identifiers.
49. **Status indicators are simple:** `● Ready`, `○ Not Loaded`, `⚠️ Error`. Three states only at the user level.
50. **Actionable buttons only:** `[Load]`, `[Unload]`, `[Change Model]`, `[Download]`. No configuration forms.

### Users NEVER see
51. Model formats (GGUF, ONNX, SafeTensors) — hidden behind layman names
52. Quantization levels (Q4_K_M, int8, fp16) — shown only in Advanced/tooltip
53. Backend selection (Candle, ORT, LlamaCpp) — automatic, never exposed
54. VRAM allocation details — shown as simple bar, not numbers by default
55. Inference configuration — zero config, handled by tier detection

### Hardware Tiers (auto-detected, drives defaults)
56. **Potato** (<4GB VRAM, <8GB RAM): Qwen 0.6B Q4, CPU embedder, no voice
57. **Entry** (4-6GB VRAM): Qwen 3B Q4, GPU embedder, voice on-demand
58. **Mainstream** (8-12GB VRAM): Qwen 9B Q4, all GPU, voice warm
59. **Prosumer** (16-24GB VRAM): Qwen 14B+ Q4, multi-model hot loading
60. **Workstation** (24GB+ VRAM): Full precision options, parallel inference

### Loading Strategies
61. `Hot` = "Always Ready" — loads on app start, stays loaded. Default for `chat.brain`, `rag.embedder`.
62. `Warm` = "Quick Start" — pre-loads when app predicts need. Default for `voice.tts`.
63. `OnDemand` = "Load When Needed" — first use has ~3s delay. Default for `voice.stt`, `media.matting`.
64. `Signal` = "Smart Loading" — loads when specific action triggers.

### Bundled Models (ship with app, always available)
65. Kokoro TTS int8 (88MB) — voice output, bundled for accessibility
66. Nomic Embed Q8 (152MB) — search/RAG, core feature
67. U2Net FP16 (~170MB) — background removal, media tools

### Model State Machine
68. **Cold** (disk only, 0 memory) → **Warm** (RAM, 50-500ms to hot) → **Hot/Loaded** (VRAM, 5-20ms inference) → **Active** (streaming)
69. Promotion: Warm→Hot automatic when request arrives and VRAM available
70. Eviction priority: OnDemand idle >5min first, then Warm not accessed, then Hot with lower priority

### Hot Swap Flow
71. User clicks Change Model → current model drains pending requests (max 5s timeout) → unload from VRAM → load new model → slot status updates to Ready. No app restart.

### Error Messages (layman only)
72. CUDA OOM → "Not enough graphics memory. Try a smaller model or close other apps."
73. Model corrupted → "This model file is damaged. [Re-download]"
74. Backend crash → "AI temporarily unavailable. [Retry] or [Switch to backup model]"
75. Network timeout → "Download paused. [Resume] when connected."

### Automatic Recovery
76. Slot fails to load → check fallback slot → if compatible, load fallback + notify "Using backup model" → if no fallback, offer: "Try smaller model" / "Free up VRAM" / "Report issue"

### Download Flow
77. VRAM check before download (warning if model exceeds GPU, user can proceed anyway)
78. Progress with pause/resume, speed, ETA
79. Integrity verification (SHA256)
80. Auto-register in model registry
81. Model appears in slot assignment UI

### Memory Pressure Handling
82. When VRAM tight: identify lowest-priority loaded model → demote to Warm (RAM) → free VRAM → load requested model. If RAM also tight, demote Warm to Cold (unload).

---

> **Validation:** ArkType (not Zod).
> **CSS:** TailwindCSS v4 utility classes. Minimum font size: `text-sm` (never `text-xs`).

---

## Stack Quick Reference

| Layer | Tech |
|-------|------|
| Desktop shell | Tauri 2.0 (Rust backend, WebView frontend) |
| Frontend | SvelteKit 5 + Svelte 5 runes |
| Styling | TailwindCSS v4 + ColdLight design system (`renderForge()`) |
| Rust crate | `kernel/model-loader` — discovery, registry, loading, inference |
| IPC | Tauri `invoke()` commands, Specta-generated TypeScript bindings |
| State | Rune modules at `domains/app/models/runes/*.svelte.ts` |
| Services | `domains/app/models/services/*.service.ts` (calls Tauri IPC) |
| Icons | `lucide-svelte` |
| Toasts | `svelte-sonner` via ColdLight `<Toaster>` component |

---

## R1: Rust — Model Discovery (Sprint ML-01)

### R1.1: Discover `.bin` Whisper models
- File: `kernel/model-loader/src/models/discovery.rs`
- The `walk_all()` function silently skips `.bin` files. Whisper uses `ggml-*.bin` format.
- **Requirement:** Add `.bin` extension arm that parses `ggml-*.bin` files as Whisper STT models.
- Parser infers quant from filename (`q5_1`, `q8_0`, or default `F16`), sets `compatible_capabilities: [SpeechToText]`, `architecture: "whisper"`, `supported_backends: [Sherpa]`.
- File size → VRAM estimate (bytes / 1MB).

### R1.2: Filter safetensor shards
- `model-NNNNN-of-NNNNN.safetensors` files are weight fragments, not standalone models.
- **Requirement:** After `walk_all()`, before folder hints, filter entries where filename matches shard pattern (`contains("-of-") && starts_with("model-")`). Log filtered count.

### R1.3: Deduplicate by path
- Same model file can exist in multiple subdirectories (`gguf/` and `chat/`).
- **Requirement:** After discovery, deduplicate by filename. Prefer copies in purpose directories (`chat/`, `voice/`, `rag/`, `vision/`) over `gguf/` or root.
- Windows-specific: `canonicalize()` returns `\\?\` prefix. Normalize paths: strip `\\?\`, forward slashes, lowercase drive letter.

### R1.4: Non-blocking scan
- File: `systems/devpulse-engine/src/platform/services/model_loader.rs`
- `scan_models()` does synchronous GGUF header parsing. Blocks the Tauri async runtime → "Not Responding" freeze.
- **Requirement:** Wrap `scan_models()` in `tokio::task::spawn_blocking`. Use `Arc<Mutex<Inner>>` so the clone can move into the blocking closure. Use `blocking_lock()` inside the closure.

### Verification
- `cargo check -p model-loader` — 0 errors
- `cargo check -p devpulse-engine` — 0 errors
- `cargo check -p devpulse_desktop_backend` — 0 errors
- After boot: registry contains `ggml-small.bin` with `SpeechToText` capability
- After boot: no shard entries, no duplicate filenames
- App does NOT freeze during model scan

---

## R2: Frontend — Download Event Wiring (Sprint ML-02)

### R2.1: Per-download tracking state
- File: `features/setup-wizard/wizard.runes.svelte.ts`
- **Requirement:** Add `activeDownloads` record keyed by `downloadId`. Each entry tracks: `downloadId`, `slot`, `filename`, `bytesDownloaded`, `totalBytes`, `speedBps`, `status` (active/complete/failed/cancelled), `error?`.
- Methods: `trackDownload()`, `updateDownloadProgress()`, `completeDownload()`, `failDownload()`, `downloadForSlot()`.
- All mutations use spread operator (Svelte 5 runes need new object references for nested reactivity).

### R2.2: Wire download progress events
- File: `features/setup-wizard/wizard.service.ts`
- Rust backend emits `model:download-progress` events with `{ downloadId, bytesDownloaded, totalBytes, speedBps }`.
- **Requirement:** In `downloadAndAssign()`, after starting download, subscribe to progress events via `onDownloadProgress()`. Update `wizardState.activeDownloads` on each event. Unsubscribe on complete or error (no listener leak). Wait for `onDownloadComplete()` event. Timeout after 30 minutes.
- Toast on start, complete, and failure.

### R2.3: Cancel download
- **Requirement:** `cancelActiveDownload(downloadId)` function. Calls Rust `cancel_download` IPC. Updates state to "cancelled". Fires toast.

### R2.4: Auto-assign all slots
- **Requirement:** `autoAssignAllSlots()` function. For each unassigned slot, find compatible models, sort by VRAM ascending, pick smallest. Call `modelsState.assign()`. Toast per assignment.

### R2.5: Single-click assign + load
- **Requirement:** `assignAndLoad(slotId, modelId)` function. Assigns model to slot then immediately loads it. VRAM warning toast if model exceeds free VRAM. Toast on success/failure.

### Verification
- `pnpm svelte-check` — 0 errors
- Download starts → `activeDownloads` updates in real time
- Toast appears on download start, complete, fail
- Cancel stops download

---

## R3: SlotAssignmentPanel — Full Rewrite (Sprint ML-03)

### R3.0: Delete ModelPicker.svelte
- `steps/ModelPicker.svelte` is the old floating modal. Delete it. Remove all imports/exports referencing it.

### R3.1: ColdLight glass cards
- File: `features/setup-wizard/steps/SlotAssignmentPanel.svelte` — **FULL REWRITE, not patch**
- **Requirement:** Every slot renders as a ColdLight Card using `renderForge({ kind: "card", preset: "glass" })`. Spread `dataAttrs` and apply `cssVarString(cssVars)` as inline style on the card div.
- `data-loaded="true"` when slot is hot/standby. `data-status="failed"` when failed.
- Scoped CSS: teal glow on `[data-loaded="true"]` (24px spread, oklch teal ~0.35 opacity), red glow on `[data-status="failed"]`.

### R3.2: Card layout per slot
- **Header:** Slot icon (lucide, per-subsystem map) + friendly label (`text-base bold`) + description (`text-sm muted`) + status Badge (ColdLight Badge component).
- **Model info (when assigned):** Filename, quant Badge, architecture Badge, size, context length, VRAM fit indicator (colored dot + text label — color alone is NOT sufficient per STIG V-222606).
- **Recommendation (when unassigned but rec exists):** Name, size, "Download & Assign" button.
- **No model state:** Italic text "No model assigned — click Assign to pick one".

### R3.3: Inline expandable model list
- Click "Assign" / "Change" button → card expands to show compatible models inline (NOT a floating modal/popup).
- Model list: `role="listbox"`, each row `role="option"`, keyboard navigable (Enter/Space to select, Escape to collapse).
- Each row: filename, quant badge, architecture, size, fit dot.
- Animation: slide-down expand (200ms ease-out).

### R3.4: Download progress inline
- When `wizardState.downloadForSlot(slot.id)` returns active download: show ColdLight `<Progress>` bar with percent, speed (`formatSpeed`), ETA (`formatEta`), cancel button.

### R3.5: Action footer per card
- **Load button:** VRAM-guarded. If model exceeds free VRAM, show warning dialog (not just disable). Dialog: "Model Too Large for GPU" with Cancel and "Load on CPU" buttons. `role="alertdialog"`, `aria-modal="true"`, Escape to dismiss.
- **Unload button:** Visible when slot is loaded.
- **Loading state:** Spinner + `translateLoadingStage()` text + `<Progress>` bar.
- **Failed state:** Error message, Retry button, "Try CPU Mode" button (only when error mentions VRAM/memory).

### R3.6: Subsystem grouping
- Cards grouped by subsystem: Chat, Minion, RAG, Vision, Voice.
- Order: chat first (with `chat.brain` as first card), then minion, rag, vision, voice.
- Subsystem headers with ColdLight `<Separator>`.

### R3.7: Readiness bar (top of panel)
- Per-subsystem dot indicator: green (assigned + loaded), teal (assigned not loaded), red (unassigned).
- Dot + text label (not color alone).

### R3.8: Bulk actions
- "Auto-Configure All" button → calls `autoAssignAllSlots()`.
- "Download All Recommended" button (only if recommendations exist) → calls `bulkDownloadAndAssign()`.

### R3.9: Tooltips
- Every interactive button uses ColdLight `<Tooltip>` / `<TooltipTrigger>` / `<TooltipContent>` components. NOT `title=` attributes. NOT custom tooltip divs.
- Rich content (not just text strings).
- Accessible: `aria-describedby`.

### R3.10: Summary + HuggingFace search
- Summary line: "{N} models on disk · {M} / {T} slots filled".
- HuggingFaceSearch component rendered inline below bulk actions (see R5).

### Constraints
- No `text-xs` anywhere.
- No floating layers (`fixed`, `z-50`) except the VRAM warning dialog.
- No hardcoded oklch colors in template — only in scoped `<style>` for glow effects.
- No raw `invoke()` calls — all through service layer.
- `renderForge()` on every ColdLight component.
- All buttons: `aria-label` with descriptive text.

### Verification
- `pnpm svelte-check` — 0 errors, 0 warnings
- GREP `text-xs` → 0 results
- GREP `title=` on buttons → 0 results
- GREP `ModelPicker` in models domain → 0 results
- Visual: glass cards with teal glow, subsystem headers, inline expand, progress bars

---

## R4: Layout + VRAM Bar + SwapOverlay (Sprint ML-04)

### R4.1: ModelLoaderStep layout
- File: `features/setup-wizard/steps/ModelLoaderStep.svelte`
- **Requirement:** Two-column grid (`grid-cols-[1fr_22rem]`). Left: SlotAssignmentPanel (scrollable). Right: VramGauge + ResourceAllocationPanel (sticky).
- Mount `<Toaster position="bottom-right" />`.
- Scan models on Phase 2 entry (`$effect` that calls `modelsState.scan()` once).
- Remove all ModelBrowserPopup and ImportPrompt references.

### R4.2: VRAM stacked bar
- File: `features/setup-wizard/steps/ResourceAllocationPanel.svelte`
- **Requirement:** Horizontal bar showing per-GPU-slot segments. Each segment width = `(model.vram_estimate_mb / vramTotalMb) * 100%`. Loaded slots: teal. Unloaded: muted. Free space: dark background.
- Over-budget indicator: red text "Over budget by {N}MB — some models will fall back to CPU".
- Per-slot breakdown list below bar.
- All `text-sm` minimum.

### R4.3: SwapOverlay rewrite
- File: `components/SwapOverlay.svelte`
- **Requirement:** Full-screen overlay during model load/unload. ColdLight glass Card (`renderForge`). Lucide icons (LoaderCircle spinning, AlertTriangle, CheckCircle). ColdLight `<Progress>` bar.
- 5-step stage indicator: Verifying → Allocating → Loading Weights → Tokenizer → Warming Up. Colored dots (complete=green, current=teal, future=muted) + text labels.
- Error state: error message, Retry button (dismiss then reload), Try CPU button (only for VRAM errors), Dismiss button.
- No emoji. No `text-xs`.

### Verification
- `pnpm svelte-check` — 0 errors
- GREP `ModelBrowserPopup|ImportPrompt` in ModelLoaderStep → 0 results
- GREP `text-xs` in ResourceAllocationPanel → 0 results
- GREP emoji in SwapOverlay → 0 results
- Visual: two-column layout, VRAM bar with segments, stage dots during load

---

## R5: HuggingFace Search Inline (Sprint ML-05)

### R5.1: HuggingFaceSearch component
- File: `features/setup-wizard/steps/HuggingFaceSearch.svelte` — **NEW FILE**
- **Requirement:** Inline section (NOT popup). Search input (`text-base`, full width). Results as ColdLight Cards with `renderForge`.
- Per result: model name + author (`text-base bold`), downloads count + likes (`text-sm muted`), pipeline tag Badge.
- GGUF files listed inside each result card: filename, quant Badge, size Badge, VRAM fit indicator (dot + text), "Download" button.
- Slot picker for download target: inline chip buttons per user slot (not a dropdown).
- "Load More" button for pagination.
- States: loading (Spinner), error (red message), empty ("No results"), no search yet (hint text).
- No floating layers. No `text-xs`.

### R5.2: Integration into SlotAssignmentPanel
- Rendered after bulk actions section, after a ColdLight `<Separator>`.

### Verification
- `pnpm svelte-check` — 0 errors
- GREP `text-xs` in HuggingFaceSearch → 0 results
- GREP `fixed|z-50` in HuggingFaceSearch → 0 results
- Search returns results, download triggers progress, slot picker works

---

## R6: Accessibility + Error Handling (Sprint ML-06)

### R6.1: STIG accessibility
- All buttons: `aria-label` with descriptive text.
- Expandable model list: `role="listbox"` on container, `role="option"` on rows.
- Keyboard: Tab through all buttons, Enter/Space to activate, Escape to collapse.
- Focus management: on expand → focus first model row. On collapse → return focus to trigger button.
- `aria-live="polite"` on status regions. `aria-live="assertive"` on error regions.
- Color is NOT the sole indicator for any state (always pair with text label).

### R6.2: Error documentation
- File: `features/setup-wizard/wizard.service.ts`
- Every exported function: JSDoc with `@throws`, `@sideeffects`, `@cleanup`.
- Every catch block: `logError()` with structured context object (not just error message). Include: slotId, modelFilename, modelSizeMb, vramEstimateMb, availableVramMb, gpuName.
- No empty catch blocks. No silent swallowing.

### R6.3: Verification checklist
- File: `scripts/docs/sprints/dev-onboarding/MODEL-LOADER-VERIFICATION.md`
- 60-item checklist. Every item: description, implementing file, proof method (screenshot, GREP output, or pasted console line).
- Covers all R1–R6 requirements.

### Verification
- GREP `aria-label` count matches interactive element count
- GREP `aria-live` — at least 2 instances (polite + assertive)
- GREP empty catch blocks → 0 results
- `pnpm svelte-check` — 0 errors, 0 warnings

---

## Global Constraints (Apply to ALL requirements)

1. **ColdLight only.** Every visual component uses `renderForge()` + `cssVarString()`. No raw inline styles for colors/spacing. No custom tooltip divs. No hardcoded oklch in templates.
2. **Svelte 5 runes only.** `$state`, `$derived`, `$effect`. No legacy stores. No `$:` reactive statements.
3. **Minimum text-sm.** Zero `text-xs` anywhere in model loader files.
4. **No floating layers** except VRAM warning dialog and SwapOverlay (both are intentional modal overlays with `aria-modal`).
5. **`.js` extensions** on all TypeScript imports.
6. **`forEach` for Set iteration** (not `for...of`).
7. **No `unwrap()`** in Rust production code. Use `?` or explicit handling.
8. **Compile gates after every file edit:** `cargo check -p <crate>` for Rust, `pnpm svelte-check` for frontend, `npx biome check` for formatting.
9. **No `title=` attributes** on interactive elements. Use ColdLight Tooltip component.
10. **No dead code.** Warnings are blockers. Unused imports = delete.

---

## File Inventory

### Rust (ML-01)
| File | Action |
|------|--------|
| `kernel/model-loader/src/models/discovery.rs` | Modify: .bin arm, shard filter, normalize_path |
| `kernel/model-loader/src/models/registry.rs` | Modify: deduplicate after scan |
| `systems/devpulse-engine/src/platform/services/model_loader.rs` | Modify: spawn_blocking on scan_models |

### Frontend — State/Services (ML-02)
| File | Action |
|------|--------|
| `features/setup-wizard/wizard.runes.svelte.ts` | Modify: activeDownloads tracking |
| `features/setup-wizard/wizard.service.ts` | Modify: downloadAndAssign, cancelActiveDownload, autoAssignAllSlots, assignAndLoad |

### Frontend — UI Components (ML-03, ML-04, ML-05)
| File | Action |
|------|--------|
| `features/setup-wizard/steps/ModelPicker.svelte` | **DELETE** |
| `features/setup-wizard/steps/ModelBrowserPopup.svelte` | **DELETE** |
| `features/setup-wizard/steps/ImportPrompt.svelte` | **DELETE** |
| `features/setup-wizard/steps/SlotAssignmentPanel.svelte` | **FULL REWRITE** (~500 lines) |
| `features/setup-wizard/steps/ModelLoaderStep.svelte` | Modify: layout, Toaster, scan-on-mount |
| `features/setup-wizard/steps/ResourceAllocationPanel.svelte` | Modify: VRAM bar, overflow indicator |
| `features/setup-wizard/steps/HuggingFaceSearch.svelte` | **CREATE** (~250 lines) |
| `components/SwapOverlay.svelte` | Modify: icons, renderForge, stage dots, retry |

### Barrel/Export Cleanup
| File | Action |
|------|--------|
| `features/setup-wizard/index.ts` | Remove ModelPicker, ModelBrowserPopup, ImportPrompt exports |

---

## Execution Order

1. **R1** (Rust discovery fixes) — no frontend deps
2. **R2** (Download wiring) — needs R1 for clean registry
3. **R3** (SlotAssignmentPanel rewrite) — needs R2 for download state
4. **R4** (Layout + VRAM + SwapOverlay) — needs R3 for panel to exist
5. **R5** (HuggingFace search) — needs R4 for layout
6. **R6** (Accessibility + error docs) — needs R1-R5 complete

Each requirement group is independently verifiable via compile gates before moving to next.
