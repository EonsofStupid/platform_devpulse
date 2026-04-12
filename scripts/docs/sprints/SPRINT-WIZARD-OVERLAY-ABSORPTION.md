# SPRINT — WIZARD OVERLAY ABSORPTION (sole source end-to-end)

> **Owner**: Jesse. Sole authority.
> **Date**: 2026-04-11
> **Branch**: `feat/tts-sts-end-to-end`
> **Supersedes**: the pending Phase 5 entry in `C:\Users\jessa\.claude\plans\tidy-singing-truffle.md`
> **Rule**: no code edits until the owner green-lights. Hard gate per phase. cargo check + svelte-check zero errors or the phase does not close.

---

## 1. Ruling (LOCKED 2026-04-11, tightened)

**`SetupWizardOverlay.svelte` mounted inside `layouts/app/Frame.svelte` is the SOLE SOURCE** for first-run model setup, HF token entry, download progress, model load feedback, voice round-trip testing, and the four role cards. There is **no `routes/(setup)/model-loader/*`** route. Ever.

**REAUTHOR ONLY**. No new files. No deletions. Every phase fully reauthors existing files to carry the absorbed functionality. The 21 step files in `features/setup-wizard/steps/` and the 8 overlay component files in `features/setup-wizard/components/` are the work surface — each gets reauthored in place until it earns its place in the active flow or is already live.

### Non-negotiables

- Rust SSOT for every visible string. New copy keys authored into `systems/devpulse-engine/config/wizard_copy.default.toml` first and the matching struct in `kernel/model-loader/src/wizard/copy.rs`. Frontend consumes via `get_wizard_copy`.
- Four role colors from `semantic/wizard/wizard.tokens.json` — `wizard.role.brain` (purple), `wizard.role.minion` (green), `wizard.role.encoder` (blue), `wizard.role.voice` (coral). No `--accent-cyan-*` on role cards.
- No raw filenames anywhere user-facing. Layman names only. A Qwen3-14B GGUF becomes `"Clyffy's Brain — Balanced"` in the card, with the technical name stashed in a tooltip/details disclosure.
- Every download reflects real kernel bytes. No mocks, no fake progress.
- Every model load shows a Clyffy sprite spinner with layman stage narration driven by real `LoadingStage` events from `kernel/model-loader/src/traits/events.rs`.
- No `unwrap()` in new Rust code.
- No new files that duplicate absorbed functionality. Prefer extending existing files when they cover the concern.
- No backwards-compat shims, no deprecations. Pre-release mode. Aggressively reauthor when a file doesn't match the new contract.
- Hard stop between phases. cargo check + svelte-check green before the next.

---

## 2. Ground truth (verified 2026-04-11 by grep and file-read, not memory)

### 2.1 What's already on disk and working

| Concern | Location | State |
|---|---|---|
| Kernel download with `hf-hub::api::Progress` bridge | `kernel/model-loader/src/models/download.rs` | **DONE this sprint** (Phase 2) — live byte-level progress, throttled to ~20 Hz, emits `LoaderEvent::DownloadProgress` |
| HF token wired into `ApiBuilder::with_token` | `kernel/model-loader/src/models/download.rs` | **DONE this sprint** |
| Symlink → hard-link → copy import ladder | `kernel/model-loader/src/models/download.rs` `link_or_copy` | **DONE this sprint** |
| `Secrets` store in `{models_dir}/../secrets.toml` with 0o600 on Unix | `kernel/model-loader/src/models/secrets.rs` | **DONE this sprint** |
| Service `set_hf_token` / `has_hf_token` / `clear_hf_token` | `kernel/model-loader/src/service.rs` | **DONE this sprint** |
| Engine facade `set_hf_token` / `has_hf_token` / `clear_hf_token` | `systems/devpulse-engine/src/platform/services/model_loader.rs` | **DONE this sprint** |
| Tauri commands `set_hf_token` / `has_hf_token` / `clear_hf_token` | `interfaces/desktop/src-tauri/src/commands/models/mod.rs` + registered in `lib.rs` | **DONE this sprint** |
| Kernel loading events (`LoadingStarted`, `LoadingStage`, `LoadingComplete`, `LoadingFailed`, `UnloadComplete`) | `kernel/model-loader/src/traits/events.rs` | Exists, unchanged |
| Kernel download events (`DownloadStarted`, `Progress`, `Complete`, `Failed`, `Cancelled`) | `kernel/model-loader/src/traits/events.rs` | Exists, unchanged |
| Rune state `activeDownloads`, `updateDownloadProgress`, `completeDownload`, `failDownload`, `selectedPresetName`, `isOpen` | `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.ts` | Exists, no loading tracker yet |
| `SetupWizardOverlay.svelte` with welcome/scanning/detected phases, preset grid | `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/SetupWizardOverlay.svelte` | Exists, 688 lines, **NOT imported in Frame.svelte** — svelte-check error at `Frame.svelte:131` |
| `wizard_copy.default.toml` + `WizardCopy` struct | `systems/devpulse-engine/config/wizard_copy.default.toml`, `kernel/model-loader/src/wizard/copy.rs` | Exists, 9 sections, no HF token / download / load / role-card copy yet |
| Wizard role colors | `interfaces/desktop/scripts/build/styledictionary/tokens/src/semantic/wizard/wizard.tokens.json` | `wizard.role.brain`, `minion`, `encoder`, `voice` all live in the new DTCG tree (Phase C.1/C.2 landed) |
| 21 orphaned step files | `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/*.svelte` | 5446 LOC, most not referenced by the current overlay |
| 8 overlay component files | `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/*.svelte` | `CurrentSetupPopup`, `HuggingFaceSearch`, `PresetCard`, `SlotCard`, `SlotSwapPopup`, `VramBar`, `WizardHelpTip`, `WizardInfoPopup` — some usable, some drift |

### 2.2 What does NOT exist yet

- `HfTokenModal.svelte` — in-overlay password field + save / clear / X-close / focus trap
- `DownloadProgressRow.svelte` — ColdLight component consuming `wizardState.activeDownloads`
- `download-bootstrap.ts` — root-mounted listener that bridges Tauri events into rune state
- `ClyffyLoadSpinner.svelte` — Clyffy sprite overlay with stage narration
- `RoleCardGrid.svelte` / `RoleCard.svelte` — the four-card grid (Brain / Minion / Encoder / Voice)
- `ModelChangePopup.svelte` — in-overlay Recommended / HF Search / Local Browse tab panel
- `activeLoads` rune state + `startLoad`, `updateLoadStage`, `completeLoad`, `failLoad` methods
- Copy TOML keys for HF token, downloads, loads, role cards, Clyffy tooltips
- Frame.svelte import for `SetupWizardOverlay`

---

## 3. Research summary (cited, not fluff)

### 3.1 DTCG 2025.10 (W3C stable, published 2025-10-28) — already landed in Phase C
- Canonical: [designtokens.org/tr/2025.10/format/](https://www.designtokens.org/tr/drafts/format/), [color module](https://www.designtokens.org/tr/2025.10/color/), [resolver module](https://www.designtokens.org/tr/2025.10/resolver/)
- Wizard role tokens already use `colorSpace: "oklch"` + `components: [L, C, H]` + `alpha` + `hex` — compliant.
- Fluid dimensions carry `$extensions.com.devpulse.coldlight.fluid: { minPx, maxPx, minViewportPx, maxViewportPx }` — rendered by the new `fluidDimensionToClamp` SD5 transform.

### 3.2 Candle + GGUF/SafeTensors lifecycle — informs Phase 6
- `VarBuilder::from_mmaped_safetensors(paths, dtype, device)` handles both single-file and multi-shard by passing a slice of paths. `unsafe` inherited from `memmap2`. BF16 is the Qwen3 training dtype and the default for Ampere+/Metal.
- GGUF path: `gguf_file::Content::read(file)` → `ModelWeights::from_gguf(content, file, device)` in `quantized_qwen3`, `quantized_qwen3_moe`, `quantized_llama`.
- Lifecycle is platform-imposed (Candle has no notion): Cold (disk only) → Warm (mmap or CPU build) → Hot (GPU build). Promotion = rebuild via `from_gguf` / `from_mmaped_safetensors` on the new `Device`. Unload = `drop(ModelWeights)`; wrap in `Option<_>` and `.take()` for belt-and-braces. `cudarc` releases the context on `Device` drop.
- Sources: [candle-nn var_builder.rs](https://github.com/huggingface/candle/blob/main/candle-nn/src/var_builder.rs), [quantized-qwen3 example](https://github.com/huggingface/candle/blob/main/candle-examples/examples/quantized-qwen3/main.rs).

### 3.3 hf-hub 0.5 sync API — already landed in Phase 2
- `ApiBuilder::with_token(Option<String>).with_progress(false).with_retries(3).build()`.
- `Progress` trait `init/update/finish`. Throttle emits to ~20 Hz in the bridge or the Tauri bus floods.
- Already wired in `kernel/model-loader/src/models/download.rs`.

### 3.4 Windows symlink ladder — already landed in Phase 2
- `std::os::windows::fs::symlink_file` requires `SeCreateSymbolicLinkPrivilege` (Dev Mode or admin). Error 1314 = `ERROR_PRIVILEGE_NOT_HELD`. Detect via `raw_os_error()`.
- Fall back to `std::fs::hard_link` (same volume only, `ERROR_NOT_SAME_DEVICE` on cross-volume).
- Final fallback `std::fs::copy`.
- `junction` crate 1.4.2 is NTFS directory junctions only, not needed for single model files.
- Already wired in `link_or_copy` in `kernel/model-loader/src/models/download.rs`.

### 3.5 Svelte 5 runes patterns — informs Phases 4, 7
- Phase machine: `let phase = $state<Phase>("welcome")`. `$derived` for booleans. `$effect` for event subscribe + focus trap + scroll lock. `$props` destructured. Snippets (`{#snippet}...{/snippet}`, `{@render}`) replace slots.
- `{@attach (node) => { /* setup */; return () => { /* teardown */ } }}` replaces `use:` actions for reactive cases (stable through 5.36). Use inside `$effect` or directly on elements.
- Tauri listeners: register inside `$effect`, return the unlisten as the cleanup. Never module scope.
- Dialog focus trap: snapshot `document.activeElement` on open, set `inert` on non-dialog siblings, query focusables inside dialog, keydown handler cycles Tab within list, Escape dismisses, teardown restores.
- Sources: [svelte.dev/docs/svelte/what-are-runes](https://svelte.dev/docs/svelte/what-are-runes), [@attach](https://svelte.dev/docs/svelte/@attach).

### 3.6 WAI-ARIA APG 1.2 — informs Phases 3, 5, 7
- Dialog: `role="dialog" aria-modal="true" aria-labelledby=".."` + focus trap + Escape + sibling `inert`.
- Radiogroup (preset picker): container `role="radiogroup"`, items `role="radio" aria-checked`, roving `tabindex`, arrow-key navigation, Home/End, Space/Enter selects.
- Progressbar: `role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax="100" aria-valuetext="45% — 230 MB of 512 MB"`. Omit `aria-valuenow` for indeterminate.
- Tablist (Change popup tabs): `role="tablist"` with `role="tab" aria-selected aria-controls`, roving `tabindex`, Arrow-Left/Right navigation, manual activation (Enter/Space) is the accessible default.
- Sources: [apg/patterns/dialog-modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### 3.7 Tauri 2.10 plugin wiring — informs Phase 9 (deferred to later sprint, not in scope here)
- Global shortcut, notifications, positioner — documented for the eventual Clyffy float window sub-sprint. **Not in this sprint's scope.**

### 3.8 tauri-specta v2 — deferred
- String-named `emit` + `listen<T>` already works and the kernel bus is fast enough. Typed events are an incremental upgrade, landing in a follow-up sprint once the overlay is functionally end-to-end. **Not in this sprint's scope.**

### 3.9 Local manager UX references — informs Phases 3, 5, 6
- LM Studio: live VRAM estimate when adjusting context length + GPU layer slider, HF browser with one-click download, model cards with quant + params + license. No hot-swap.
- Jan: full chat UI + extension system + model hub + OpenAI-compat server.
- Ollama: `keep_alive` default 5 min, `-1` pins forever.
- llama-swap: YAML-driven backend-per-model proxy with idle auto-unload — closest analogue to our ActiveIdle swap policy.
- Takeaways: show VRAM estimate **before** commit; model card preview with quant/params/size/license from HF; resumable download progress with pause; "Change brain" is the hot-swap path; default quant pick guided by tier not dropdown.
- Sources: [Run Local LLMs 2026 guide](https://www.sitepoint.com/run-local-llms-2026-complete-developer-guide/), [Ollama vs LM Studio vs Jan 2026](https://dev.to/synsun/running-local-llms-in-2026-ollama-lm-studio-and-jan-compared-5dii), [llama-swap comparison](https://modelslab.com/blog/api/llama-swap-vs-ollama-vs-lm-studio-which-local-llm-tool).

### 3.10 Vercel AI SDK 6 `needsApproval` + Claude April 2026 — informs a future agentic overlay phase, not this sprint
- Documented for completeness. **Not in this sprint's scope.**

---

## 4. Phases

Each phase has an exit gate. **cargo check + svelte-check zero errors** required before the next phase starts. Owner approval required at every gate.

### Phase A — Frame import + overlay sanity (1 line + verification)

**Files touched**
- `interfaces/desktop/src/lib/layouts/app/Frame.svelte` (1 line added: `import SetupWizardOverlay ...`)

**Work**
1. Add the missing import under the existing `SwapOverlay` import.
2. Verify `<SetupWizardOverlay />` at line 131 resolves.
3. Run `pnpm svelte-check` — expect **0 errors** (down from 1).
4. Run `cargo check -p devpulse_desktop_backend` — still 0.

**Exit gate**: svelte-check 0 errors. No other files touched in this phase.

---

### Phase B — Runes + event bridge + copy scaffolding

**Files touched**
- `kernel/model-loader/src/wizard/copy.rs` — extend `WizardCopy` with `hf_token: HfTokenCopy`, `downloads: DownloadsCopy`, `loading: LoadingCopy`, `role_cards: RoleCardsCopy`, `clyffy_tooltips: ClyffyTooltipsCopy`
- `systems/devpulse-engine/config/wizard_copy.default.toml` — author TOML values for every new field. Layman English only.
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.ts` — add `activeLoads: Record<string, LoadingTracker>` + `startLoad`, `updateLoadStage`, `completeLoad`, `failLoad`
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/download-bootstrap.ts` — **new file**. Root-mounted async function that:
  - `listen<DownloadProgressPayload>("model:download-progress", ...)` → `wizardState.updateDownloadProgress(...)`
  - `listen<DownloadCompletePayload>("model:download-complete", ...)` → `wizardState.completeDownload(...)` + auto-chain `assign_model_to_slot` + `load_slot`
  - `listen<DownloadFailedPayload>("model:download-failed", ...)` → `wizardState.failDownload(...)` + inline error state
  - `listen<DownloadCancelledPayload>("model:download-cancelled", ...)` → remove from `activeDownloads`
  - `listen<LoadingStagePayload>("model:loading-stage", ...)` → `wizardState.updateLoadStage(...)`
  - `listen<LoadingCompletePayload>("model:loading-complete", ...)` → `wizardState.completeLoad(...)`
  - `listen<LoadingFailedPayload>("model:loading-failed", ...)` → `wizardState.failLoad(...)`
  - Returns a combined `unlisten` function.
- `interfaces/desktop/src/routes/+layout.svelte` — mount the bootstrap inside `$effect` with teardown

**Contracts (locked)**

```ts
interface LoadingTracker {
  slotId: string;
  modelName: string;           // layman
  stage: "mmap" | "kv_alloc" | "warmup" | "ready" | "failed";
  progressPct: number;
  stageLabel: string;          // from copy.loading.stage_labels[stage]
  error: string | null;
}
```

```rust
// wizard_copy.default.toml shape
[hf_token]
title = "HuggingFace Token"
subtitle = "Paste your token to unlock private repos and faster downloads."
field_label = "Token"
field_placeholder = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
save_label = "Save"
clear_label = "Clear"
saved_badge = "Stored"
help_link_label = "Where do I get one?"
help_url = "https://huggingface.co/settings/tokens"

[downloads]
progress_aria_template = "{percent}% — {bytes_mb} MB of {total_mb} MB at {speed_mb}/s"
cancel_label = "Cancel"
retry_label = "Retry"
eta_template = "about {minutes} min left"
speed_template = "{mb}/s"
starting_label = "Starting..."
verifying_label = "Verifying..."
importing_label = "Importing into registry..."

[loading]
title_template = "Loading {model_name}..."
stage_mmap = "Reading file from disk"
stage_kv_alloc = "Allocating memory"
stage_warmup = "Warming up the model"
stage_ready = "Ready"
stage_failed = "Something went wrong"
retry_label = "Try again"

[role_cards]
brain_title = "Thinking"
brain_layman = "Clyffy's main brain — the model that answers your questions."
brain_change_label = "Change brain"
minion_title = "Helpers"
minion_layman = "Small fast models that handle background tasks."
minion_change_label = "Change helpers"
encoder_title = "Searching"
encoder_layman = "The model that finds related code and memory across your project."
encoder_change_label = "Change search"
voice_title = "Talking"
voice_layman = "The models that hear you and speak back."
voice_change_label = "Change voice"

[clyffy_tooltips]
# keys referenced by ClyffyTooltip component via get_wizard_copy
# populated as the component calls require them
```

**Exit gate**: cargo check model-loader + devpulse-engine + devpulse_desktop_backend all 0. svelte-check 0. Owner manually loads the app, copy loads, bootstrap attaches, no console errors.

---

### Phase C — `HfTokenModal.svelte`

**New files**
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/HfTokenModal.svelte`

**Work**
1. Password-field form backed by `$state`. Save calls `commands.setHfToken(value)`. Clear calls `commands.clearHfToken()`.
2. Lock-icon pill in the overlay header reads from `has_hf_token` (stored in a rune cache, refreshed after every save/clear).
3. Dialog: `role="dialog" aria-modal="true" aria-labelledby` + focus trap + Escape dismiss + click-outside dismiss. Focus trap via `{@attach}` on the dialog root using APG pattern.
4. Never stores the token in a rune or state — only the boolean. On save, we call the Tauri command and throw away the plaintext.
5. All strings from `copy.hf_token.*` only.

**Exit gate**: owner stores a token, closes the app, reopens — lock icon still lit. Owner clears the token, reopens — lock gone. Zero hardcoded strings. svelte-check 0.

---

### Phase D — `DownloadProgressRow.svelte` + overlay integration

**New files**
- `interfaces/desktop/src/lib/design/components/progress-bar/ProgressBar.svelte` (if missing — verify first; if it exists, extend it)
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/DownloadProgressRow.svelte`

**Work**
1. `DownloadProgressRow` props: `tracker: DownloadTracker`. Renders layman model name + bytes / total MB + percent + speed + ETA + cancel + retry (on failure).
2. ARIA: `role="progressbar"` with `aria-valuenow / aria-valuemin / aria-valuemax / aria-valuetext` using the `copy.downloads.progress_aria_template`.
3. Cancel calls `commands.cancelDownload(download_id)`.
4. Retry calls `commands.downloadModel(repo_id, filename)` with the same args stashed in the tracker.
5. Overlay renders every row for `wizardState.downloadsList` while any download is active; a dismiss button clears a completed row via a new `wizardState.dismissDownload(id)` method.
6. Tailwind classes only, no inline styles. Wizard role color optional prop (card forwards its own accent).

**Exit gate**: owner triggers a real HF download (small test model). Bar fills in real time, MB/s updates, ETA counts down, cancel works, retry works after an artificial disconnect. svelte-check 0.

---

### Phase E — Role card grid + role color wiring

**New files**
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/RoleCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/RoleCardGrid.svelte`

**Work**
1. Four roles, four cards, driven by `role: "brain" | "minion" | "encoder" | "voice"`.
2. Each card pulls its accent from the DTCG wizard role tokens via a small map: `brain → --wizard-role-brain-main/glow/fill`, etc. Set via `style:--wizard-role-main` rune-driven.
3. Fields: icon, role title (from `copy.role_cards.*_title`), layman line (from `*_layman`), current slot model (layman name from `slotDisplay` helper, **never** raw filename), status badge (Empty / Downloading / Warming / Ready / Error), VRAM estimate badge, Change button (opens `ModelChangePopup` for this slot).
4. Status badge renders via `wizardState.activeDownloads + activeLoads + slotRegistry` projections.
5. While downloading or loading, the card shows `DownloadProgressRow` or `ClyffyLoadSpinner` inside its body.
6. Grid layout: 2×2 responsive, collapses to 1×4 on narrow widths. Fluid via clamp().

**Exit gate**: four distinct colors on screen. No `--accent-cyan-*` anywhere in role-specific CSS. Owner can see the VRAM estimate before committing. svelte-check 0.

---

### Phase F — `ModelChangePopup.svelte` (Recommended / HF Search / Local Browse tabs)

**New files**
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/ModelChangePopup.svelte`

**Reuses**
- `components/HuggingFaceSearch.svelte` if it's clean; reauthor if drifted
- `components/SlotCard.svelte` / `PresetCard.svelte` for recommended list
- Existing `import_local_model` Tauri command (already supports `import_mode = "symlink"`)

**Work**
1. Sub-panel rendered **inside** the overlay, not a separate route or window. Slides in from the right edge of the overlay panel.
2. APG tablist: `role="tablist"` + three `role="tab"` buttons (Recommended / HF Search / Local Browse). Arrow-key nav, Home/End, manual activation.
3. Recommended tab: reads `list_presets` + current hardware tier → shows the matching model(s) for the slot as cards. One click → download + auto-load.
4. HF Search tab: wraps existing `HuggingFaceSearch.svelte`. Results include a per-file VRAM estimate badge computed from the file size × 1.2 heuristic for GGUF (conservative). "Download" button on each row → `commands.downloadModel(repo_id, filename)` + overlay auto-chains load.
5. Local Browse tab: "Browse File" button opens `rfd::AsyncFileDialog` via `import_local_model` command with `import_mode = "symlink"` as the default toggle. Fallback ladder happens in kernel (already landed).
6. Cancel button at popup header closes the sub-panel and restores role card view.

**Exit gate**: owner picks a model from every tab, each triggers the correct kernel path, download bars appear in the role card afterward. svelte-check 0.

---

### Phase G — `ClyffyLoadSpinner.svelte` + auto-chain download → load

**New files**
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/ClyffyLoadSpinner.svelte`

**Work**
1. Render a Clyffy mascot sprite (pulls from `/imgs/mascot/clyffyloading.gif` — verify it exists in `static/imgs/mascot/`; fall back to `clyffy-anim-blinking.png` otherwise).
2. Stage label text from `copy.loading.stage_{mmap|kv_alloc|warmup|ready|failed}`.
3. Indeterminate `role="progressbar"` — `aria-valuetext` updates per stage label. No `aria-valuenow`.
4. `download-bootstrap.ts` already wired in Phase B: on `DownloadComplete`, dispatches `commands.assignModelToSlot` then `commands.loadSlot`. Kernel fires `LoadingStarted → LoadingStage(mmap → kv_alloc → warmup) → LoadingComplete` or `LoadingFailed`.
5. Role card body: while `activeLoads[slotId]` is set, render the spinner instead of the static "Ready" state. On `LoadingComplete`, card flips to Ready with role-color glow ring (`--wizard-role-{role}-glow`).
6. On `LoadingFailed`, inline error + Retry button that calls `commands.loadSlot(slotId)` again.

**Exit gate**: owner triggers a real end-to-end from Recommended tab: download progress fills, spinner shows stages, card flips to Ready. svelte-check 0.

---

### Phase H — End-to-end STS / TTS / STT test button (reuse existing step)

**Files touched**
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/FullPipelineTest.svelte` — **absorbed or reauthored** into an inline panel the Voice card opens via a "Test Voice" button
- `SetupWizardOverlay.svelte` — render `FullPipelineTest` inline when `voiceTestOpen === true`

**Work**
1. Owner clicks "Test Voice" on the Voice card after it reaches Ready.
2. Inline panel runs the existing pipeline test (canned audio → STT → LLM → TTS → audio out). Prints transcript + response + audio waveform inline.
3. Pass / fail visible. Error states routed through existing error copy.
4. Closes back to the four-card view.

**Exit gate**: owner hears Clyffy speak back on a real machine with a real voice stack. svelte-check 0.

---

### Phase I — Orphan cleanup + completion

**Files touched**
- Delete every step file in `features/setup-wizard/steps/` that is not referenced anywhere. Verify via grep per file.
- Delete every overlay component file in `features/setup-wizard/components/` that is not referenced anywhere after Phase F. Verify via grep per file.
- Update `features/setup-wizard/index.ts` public API to export only the live surface.
- `SetupWizardOverlay.svelte` — final phase rendered is "setup complete" with four Ready cards + "Close" button that calls `wizardState.close()` + dispatches `commands.completeModelSetup()` to persist `first_run = false`.

**Work rules**
- Delete, don't comment out. Pre-release mode.
- For any file that's partially used, **extract** the used bit into a new atom file under `components/` and delete the original.
- Final audit: `grep -rn "SetupWizard\|WelcomeStep\|HardwareDetectionStep..." interfaces/desktop/src` returns only active references.

**Exit gate**: orphan inventory goes from 21 step files + 8 components to the minimal live set. cargo check + svelte-check 0. Owner restarts the app, wizard opens on first run, walks the entire flow, closes, reopens — overlay stays closed.

---

## 5. Out of scope (tracked for follow-up sprints, do not leak into this one)

- **BackgroundScene animated backdrop with 3–5 variations** — dedicated asset-pipeline sprint. Kept out because the overlay lives inside the app frame, not a dedicated shell, so it inherits whatever backdrop the Frame renders.
- **Clyffy float window + Ctrl+Shift+Z global hotkey + Windows toast** — dedicated multi-window sprint using `tauri-plugin-global-shortcut` + `tauri-plugin-notification`. Documented in research but not authored here.
- **tauri-specta v2 typed events** — incremental upgrade that replaces the string-based `listen<T>` bridge in `download-bootstrap.ts`. Runs after this sprint lands, when the overlay is already functional.
- **A2UI / AG-UI agentic component trees** — Clyffy-from-devpulse.app backend. Future sprint.
- **Voice cloning (OpenVoice V2 / CosyVoice2)** — future sub-sprint after basic voice round-trip is proven.
- **Built-ins SSOT catalog (rro/encoder.primary/filter.primary/wake.builtin)** — already staged in kernel, verified by tests. Not re-opened here.
- **Shard rotation UI (Keep Hot / Warm Standby / Cold / Lane Rotation)** — future sprint. Requires dev tools tab, not first-run overlay.

---

## 6. Verification gates (run after every phase)

```bash
# Rust
cargo check -p model-loader
cargo check -p devpulse-engine
cargo check -p devpulse_desktop_backend
cargo test  -p model-loader            # secrets round-trip, IP boundary, built-ins

# Frontend
cd interfaces/desktop
pnpm svelte-check                      # ZERO errors, no "baseline" dismissal
npx biome check src/lib/domains/app/models/ src/lib/layouts/app/ --diagnostic-level=warn

# Manual
cargo xtask run-dev                    # owner verifies visual + flow
```

**Zero errors means zero.** No "pre-existing baseline" dismissal is accepted by this sprint. If a pre-existing error exists in a file touched by this sprint, it gets fixed in the phase that touches the file.

---

## 7. Definition of Done

- Owner opens DevPulse on a fresh install.
- SetupWizardOverlay mounts on first run.
- Hardware scans, tier picked, four role cards appear with four distinct colors.
- Owner clicks Change on the Brain card → ModelChangePopup opens inline.
- Owner enters an HF token via the token modal, stored, lock icon lit.
- Owner searches HF for a SafeTensors or GGUF model, picks one, clicks Download.
- DownloadProgressRow shows live MB/s and ETA. Finishes.
- Auto-chains to `assign_model_to_slot` → `load_slot`. ClyffyLoadSpinner shows stage narration. Finishes.
- Role card flips to Ready with the brain role's purple glow.
- Owner repeats for Voice. Voice card reaches Ready.
- Owner clicks "Test Voice" on the Voice card. Canned audio round-trips STT → LLM → TTS. Clyffy speaks.
- Owner clicks "Close" on the completion view. Overlay dismisses. `first_run = false` persists.
- Next launch: overlay stays closed. Main app visible. No regressions elsewhere.

**Everything above runs on a real machine with real models. No mocks anywhere in the path.**
