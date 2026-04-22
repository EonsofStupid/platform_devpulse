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

# SPRINT ML-02: Browse + Load — Search, Import, Load Real Models

> **Status**: PLAN — Owner approval required
> **POA&M**: Milestone M2
> **Depends on**: ML-01 (Foundation) complete
> **Scope**: ~8 files changed
> **Verification**: `cargo check -p devpulse-engine` + `pnpm svelte-check` after every phase

---

## What This Sprint Delivers

After ML-01, the model loader boots and the frontend reads real data. This sprint makes the user-facing operations work:

1. **Search**: Type "qwen" → see HF results with GGUF files and sizes
2. **Download**: Click download → real progress (not 0%→100%) → file on disk
3. **Import**: Click "Import from Disk" → native file picker → file in registry
4. **Load**: Assign model to slot → load → Candle inference running → tokens generate
5. **Unload**: Unload slot → memory freed → slot empty

---

## PHASE 1: Fix Download Progress — Replace hf-hub with Chunked reqwest

### Problem
`kernel/model-loader/src/models/download.rs` uses `hf_hub::api::sync::ApiRepo::get()` which downloads the entire file with zero progress callbacks. Result: 0% then 100%.

### Files
- `kernel/model-loader/src/models/download.rs` — rewrite `execute_download`

### What Changes

Replace the `hf-hub` download path with direct `reqwest` chunked download:

1. Use `hf-hub` ONLY for resolving the download URL (it handles CDN routing and auth)
2. Use `reqwest` with `Range` headers for the actual download
3. Write to `{filename}.partial` during download, rename on completion
4. Emit `DownloadProgress` events every 500ms with real bytes/speed
5. Support resume: if `.partial` exists, read its size, send `Range: bytes={size}-`
6. SHA256 verify after download (from HF `lfs.oid` if available)
7. Disk space check before starting (file size + 10% headroom)

### Task Checklist
- [ ] 1.1: Read `download.rs` — understand current `execute_download` flow
- [ ] 1.2: Read `hf-hub` API to find URL resolution method (without full download)
- [ ] 1.3: Check if `reqwest` is already a dependency of model-loader
- [ ] 1.4: Rewrite `execute_download`:
  - Resolve URL via hf-hub or construct directly from repo_id + filename
  - HEAD request to get Content-Length
  - Check disk space (`fs2::available_space` or equivalent)
  - Check for existing `.partial` file (resume support)
  - GET with `Range` header if resuming
  - Stream chunks (64KB), emit progress every 500ms
  - Write to `.partial` file
  - SHA256 hash during download
  - Rename `.partial` → final on completion
  - Emit DownloadComplete with registry entry
- [ ] 1.5: Update `DownloadManager::start_download` to pass event_sink to new download fn
- [ ] 1.6: `cargo check -p model-loader`
- [ ] 1.7: Test download of a small GGUF (e.g., Qwen3-0.6B, ~400MB)

**Gate**: Download shows real progress. `.partial` file grows on disk. Rename on complete.

---

## PHASE 2: Fix Search UX — Error Visibility + Result Quality

### Problem
Search may silently fail (error swallowed). Results need GGUF file sizes visible so users can assess before downloading.

### Files
- `kernel/model-loader/src/models/search.rs` — add file size fetching
- `interfaces/desktop/src/lib/domains/app/models/components/HfModelCard.svelte` — show file sizes clearly
- `interfaces/desktop/src/lib/domains/app/models/runes/search.runes.svelte.ts` — ensure errors surface

### What Changes

1. **Backend**: After HF search returns repos, for each repo with GGUF files, the `gguf_files` field already includes `size_bytes` from the search API response. Verify this is populated. If not, add a follow-up call to `/api/models/{repo_id}/tree/main` to get file sizes.

2. **Frontend**: `HfModelCard` already shows GGUF files with fit indicators. Verify:
   - File size displayed in human-readable format (e.g., "4.1 GB")
   - VRAM fit indicator works (green/yellow/red based on hardware rune)
   - Download button per file calls `download.service.downloadModel(repo_id, filename)`

3. **Error handling**: Search rune must surface errors to UI. If HF returns 429 (rate limit), show "HuggingFace rate limit — try again in 60s". If network unreachable, show "No internet connection — use Import from Disk for local models."

### Task Checklist
- [ ] 2.1: Read `search.rs` — verify `gguf_files` includes `size_bytes`
- [ ] 2.2: Read `HfModelCard.svelte` — verify size display and download button
- [ ] 2.3: Read `search.runes.svelte.ts` — verify error surfaces to UI
- [ ] 2.4: Add human-friendly error messages for common HTTP errors (429, timeout, no network)
- [ ] 2.5: Verify search → download pipeline works end-to-end in code
- [ ] 2.6: `pnpm svelte-check`

**Gate**: Search shows results with file sizes. Errors are visible and actionable.

---

## PHASE 3: Verify Import from Disk

### Problem
`import_local_model` command exists in Rust (uses `rfd::FileDialog`). Need to verify the full pipeline: file picker → copy → scan → registry update → UI refresh.

### Files
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — verify `import_local_model`
- `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte` — verify import button wiring

### What Changes

1. Read `import_local_model` command — verify it:
   - Opens native file dialog filtered to `.gguf`
   - Copies to `.userdata/models/chat/` (or appropriate subfolder)
   - Calls `scan_models()` after copy
   - Returns the new model's info

2. Read ModelLoaderPanel — verify import button:
   - Calls `commands.importLocalModel()` (specta binding)
   - Refreshes model list on success
   - Shows error on failure

3. Fix if broken. If already working, mark as verified.

### Task Checklist
- [ ] 3.1: Read `import_local_model` in Rust — verify file dialog + copy + scan
- [ ] 3.2: Check file dialog filter — should accept `.gguf`, `.bin` (whisper), `.onnx`
- [ ] 3.3: Read ModelLoaderPanel import button — verify invoke path
- [ ] 3.4: Ensure import triggers rune refresh (models.runes.svelte.ts)
- [ ] 3.5: `cargo check -p devpulse-desktop` (tauri crate)
- [ ] 3.6: `pnpm svelte-check`

**Gate**: Click Import → file picker opens → select GGUF → appears in model list.

---

## PHASE 4: Wire Load/Unload End-to-End

### Problem
`load_slot` and `unload_slot` Tauri commands exist and delegate to ModelLoaderService. The frontend calls them via runes. But we need to verify the full chain works and the SwapOverlay receives real events.

### Files
- `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts` — verify load/unload calls
- `interfaces/desktop/src/lib/domains/app/models/runes/swap.runes.svelte.ts` — verify event listeners
- `interfaces/desktop/src/lib/domains/app/models/components/SlotRow.svelte` — verify load/unload buttons

### What Changes

1. Verify load flow:
   - SlotRow "Load" button → `models.runes.load(slotId)` → `commands.loadSlot(slotId)` → Rust `load_slot` → Candle loads GGUF → EventBridge emits `model:loading-stage/complete/failed` → `swap.runes` receives → `SwapOverlay` shows progress

2. Verify unload flow:
   - SlotRow "Unload" button → `models.runes.unload(slotId)` → `commands.unloadSlot(slotId)` → Rust `unload_slot` (2 retries then hard fail) → EventBridge emits `model:unload-complete` → SwapOverlay dismisses

3. Fix the inference-token event type mismatch:
   - Rust emits bare string for `inference-token`
   - Frontend expects `{ id, text }`
   - Align to match

### Task Checklist
- [ ] 4.1: Read SlotRow — find load/unload button handlers
- [ ] 4.2: Trace the call chain from button → rune → command → Rust → event
- [ ] 4.3: Verify SwapOverlay event listener names match what Rust emits
- [ ] 4.4: Fix inference-token event type (Rust side: wrap in `{ text }` object, or frontend side: handle bare string)
- [ ] 4.5: `pnpm svelte-check`

**Gate**: Load/unload triggers SwapOverlay with progress. Events flow from Rust to frontend.

---

## PHASE 5: Verify Inference End-to-End

### Problem
After loading a model, `inference_generate` should stream tokens. Need to verify the full path: frontend → Tauri command → InferenceHandle.generate() → flume bridge → CandleBackend.generate() → streaming tokens back.

### Files
- `interfaces/desktop/src/lib/domains/app/models/services/inference.service.ts` — after Phase 2 rewrite
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — `inference_generate` command

### What Changes

1. Verify `inference_generate` command:
   - Gets InferenceHandle from loaded slot
   - Calls `handle.generate(prompt, max_tokens, temperature)`
   - Receives `InferenceResponse::Token(text)` via flume
   - Emits `inference-token` Tauri event per token
   - Returns complete text on `InferenceResponse::Done`

2. Verify frontend `inference.service.ts` listens correctly

3. Create a simple test path: load Qwen3-0.6B → send "Hello" → tokens stream back

### Task Checklist
- [ ] 5.1: Read `inference_generate` command — verify streaming logic
- [ ] 5.2: Read `inference.service.ts` — verify listener
- [ ] 5.3: Verify event name match (`inference-token` both sides)
- [ ] 5.4: Verify payload shape match (align Rust emit with frontend listener)
- [ ] 5.5: `pnpm svelte-check`

**Gate**: Load model → generate → tokens stream to frontend.

---

## Summary

| Phase | Focus | Files | Verification |
|-------|-------|-------|-------------|
| 1 | Download progress | 1 Rust | `cargo check -p model-loader` |
| 2 | Search UX + errors | 1 Rust, 2 Svelte | `pnpm svelte-check` |
| 3 | Import from disk | 1 Rust, 1 Svelte | Both checks |
| 4 | Load/unload pipeline | 3 Svelte | `pnpm svelte-check` |
| 5 | Inference e2e | 1 Svelte, 1 Rust | Both checks |
| **Total** | | **~8 files** | |
