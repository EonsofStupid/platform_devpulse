# Model Loader — Real-World Gap Analysis

> Benchmark: Open WebUI, LM Studio, Jan.ai, GPT4All
> Date: 2026-04-06
> Status: BRUTALLY HONEST

---

## CURRENT STATE: What the wizard ACTUALLY does

The setup wizard shows slot rows with labels. Each row has a "Get" button (download) or "Load" button. There's a "Browse Models" popup and an "Import" prompt. That's it.

**What a user CAN do right now:**
1. See slot names (chat.brain, minion.shared, etc.) — but these are engineer jargon, not layman labels
2. See if a recommendation exists for a slot
3. Click "Get" to download a recommended model — IF the repo/filename is correct (3 of 5 were WRONG, just fixed)
4. Click "Load" — but this fires a Rust command that requires candle-backend feature
5. Click "Install All Suggested" — downloads all recs sequentially
6. Click "Import" — but it opens for chat.brain only, hardcoded
7. Click "Browse Models" — opens a popup

**What a user CANNOT do:**
- See ANY model metadata (size, quant, architecture, context length)
- See VRAM fit indicators that mean anything
- Browse their own downloaded models to assign to slots
- Drag-and-drop a GGUF file
- See download progress with speed/ETA
- Pause/resume/cancel a download
- Choose GPU vs CPU for a model
- Set GPU layer offloading
- See which models are currently loaded in memory
- See real-time VRAM/RAM usage
- Configure inference parameters (temperature, context length, etc.)
- Delete a model
- See where a model lives on disk
- Get ANY explanation of what a "slot" is or why they need 7 of them

---

## P0: MUST HAVE (Blocking basic usability)

### Discovery & Assignment — THE CORE PROBLEM

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Show locally discovered models in a list** | BROKEN | `modelsState.models` populated but never shown to user for selection. Wizard only shows "recommendations" — user can't pick from what's on disk |
| 2 | **Assign any local model to any slot** | BROKEN | No UI for "pick model X, assign to slot Y". `modelsState.assign()` exists but no dropdown/picker calls it |
| 3 | **Show model metadata per entry** | MISSING | Registry has: filename, architecture, quant_level, context_length, size_bytes, vram_estimate_mb. None shown in wizard |
| 4 | **"Fits in VRAM" indicator per model** | HALF | `calculateFit()` exists in types but only used on recommendations, not on model picker |
| 5 | **Model picker dropdown per slot** | MISSING | LM Studio style: click slot → see all compatible models → select one. Needs `modelsForCapability()` which exists but is unused |
| 6 | **Show file path on disk** | MISSING | `ModelInfo.path` exists in bindings but never displayed |
| 7 | **Show file size** | MISSING | `ModelInfo.size_bytes` exists but never displayed |
| 8 | **Explain what each slot IS in layman terms** | MISSING | "chat.brain" means nothing. Need: "Main AI Brain — this is the model that talks to you" |

### Download UX

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 | **Download progress bar with percentage** | MISSING | `downloadProgress` state exists but is never updated from Rust events. Always 0. |
| 10 | **Download speed (MB/s)** | MISSING | Rust emits `DownloadProgress` events with `speed_bps` — never wired to frontend |
| 11 | **ETA remaining** | MISSING | Rust emits `eta_secs` — never wired |
| 12 | **Downloaded / Total display** | MISSING | Rust emits `bytes_downloaded` / `total_bytes` — never wired |
| 13 | **Cancel download button** | MISSING | `cancel_download` Rust command exists. No UI button. |
| 14 | **Disk space check before download** | MISSING | `disk_free_mb` not even shown in UI |
| 15 | **Toast on download complete** | MISSING | Download silently completes. No notification. |
| 16 | **Toast on download failure** | PARTIAL | Error goes to `wizardState.error` inline text. Not a proper notification. |

### Load/Unload

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | **Load button that works** | BROKEN-ISH | Button exists, calls `loadSlot()`, which calls Rust. But load may fail silently if candle-backend can't load the arch. Error shown as inline text, easy to miss. |
| 18 | **Unload button** | MISSING in wizard | `modelsState.unload()` exists. No button in wizard UI. |
| 19 | **Loading progress** | MISSING | Rust emits load progress events. Frontend sets "loading" status but never updates percentage. |
| 20 | **Currently loaded models indicator** | MISSING | No persistent display of "these models are in memory right now" |
| 21 | **VRAM usage bar (real-time)** | PARTIAL | VramGauge component exists at top of ModelLoaderStep but gets data from `hardwareState` which may not update during loads |

### Hardware Display

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22 | **GPU name** | PARTIAL | Shown in VramGauge label, but only if you reach Phase 2 |
| 23 | **VRAM total/used/free** | PARTIAL | VramGauge shows it but values may be stale |
| 24 | **CPU name/cores** | SHOWN in Phase 1 | HardwareDetectionStep shows it |
| 25 | **RAM total/available** | SHOWN in Phase 1 | HardwareDetectionStep shows it |
| 26 | **Disk free space** | MISSING | Not shown anywhere |
| 27 | **Tokens/sec during inference** | MISSING | No performance metrics at all |

---

## P1: SHOULD HAVE (Expected by anyone who's used LM Studio)

### Model Browsing

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 28 | Search HuggingFace in-app | EXISTS | ModelBrowserPopup has HF search. `searchHuggingFace()` service works. |
| 29 | Filter by format (GGUF/SafeTensors) | EXISTS | `ModelBrowserFilter.format` in types |
| 30 | Filter by size ("fits in VRAM") | EXISTS | `ModelBrowserFilter.fitOnly` in types |
| 31 | Show quant variants per model | PARTIAL | HF search returns siblings with `.gguf` files |
| 32 | Show model description/README | MISSING | HF API returns description but not displayed |
| 33 | Show download count | MISSING | HF API returns downloads but not displayed |
| 34 | "Recommended for your hardware" section | EXISTS | `wizardState.recommendations` based on tier |
| 35 | Sort results (by size, popularity, name) | MISSING | No sort controls |

### Configuration

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 36 | Temperature slider | MISSING | No inference parameter UI |
| 37 | Context length selector | MISSING | Model context_length in registry but no UI to configure |
| 38 | System prompt editor | MISSING | Not in wizard scope but needed in chat |
| 39 | GPU layer offloading slider | MISSING | llama.cpp supports this, no UI |
| 40 | GPU vs CPU toggle per slot | PARTIAL | `DevicePreference` exists in types, shown in recommendation but not editable |

### Import

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 41 | Import from file picker | EXISTS | `ImportPrompt.svelte` exists |
| 42 | Drag-and-drop import | MISSING | No DnD handler |
| 43 | Symlink vs Copy choice | EXISTS | `ImportMode` type, radio buttons in ImportPrompt |
| 44 | Import to ANY slot (not just chat) | FIXED-ISH | `importTargetSlot` state exists. But the "Import" button on ModelLoaderStep hardcodes to `chat.brain` (line 107) |
| 45 | Auto-detect model type from filename | MISSING | Could infer slot from architecture (embedding → rag, whisper → stt) |

### Model Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 46 | Delete model from disk | MISSING | No delete button, no Rust command |
| 47 | Model detail/card view | MISSING | Click model → see full metadata. Doesn't exist. |
| 48 | Rename/alias model | MISSING | |
| 49 | Favorite/pin models | MISSING | |
| 50 | Group by family | MISSING | `subsystems` grouping exists for slots but not for model families |

---

## P2: NICE TO HAVE (Differentiators)

| # | Feature | Status |
|---|---------|--------|
| 51 | Local API server mode (OpenAI compat) | MISSING |
| 52 | Speculative decoding (draft + main) | MISSING |
| 53 | LoRA adapter loading | MISSING |
| 54 | Model comparison/arena | MISSING |
| 55 | Download pause/resume | MISSING (HF hub handles caching but no UI) |
| 56 | Multi-GPU selection | MISSING |
| 57 | KV cache quantization toggle | MISSING |
| 58 | Crash recovery | MISSING |
| 59 | Model usage analytics | MISSING |
| 60 | Chat template auto-detection | GGUF metadata has it, not exposed |

---

## ROOT CAUSES (Why it's broken)

### 1. No model picker for slots
The wizard shows recommendations and lets you "Get" them. But if you already HAVE models on disk (you do — 2 GGUF, 3 ONNX, 1 Whisper), there's no way to say "use THIS model for THIS slot." The `assign()` function exists. The `modelsForCapability()` function exists. No UI connects them.

### 2. Download events not wired
Rust emits `DownloadStarted`, `DownloadProgress`, `DownloadComplete`, `DownloadFailed` via Tauri events. The frontend has `onDownloadComplete()` in `download.service.ts`. But `DownloadProgress` events (speed, ETA, percentage) are NEVER listened to. The wizard shows nothing during download — just a spinner.

### 3. Slot jargon everywhere
Every label is engineer-speak: "chat.brain", "minion.shared", "rag.embedder", "voice.stt". The `friendlySlotLabel()` function exists and translates these. But the translations are still semi-technical: "Chat Brain", "Shared Minion". A layman needs: "Main AI — the model that talks to you", "Quick Helper — fast small model for background tasks", etc.

### 4. No model detail view
You can't click on a model to see: what architecture, what quant level, what context length, how big, where it lives on disk, whether it fits in VRAM. All this data EXISTS in `ModelInfo` (specta bindings). Zero UI.

### 5. Import hardcoded to one slot
The Import button on the ModelLoaderStep (line 107) hardcodes `importTargetSlot = "chat.brain"`. Should open a slot picker first, THEN the import dialog.

### 6. No unload in wizard
You can load but not unload. If you load the wrong model, you're stuck. The `unload()` function works. No button.

---

## WHAT NEEDS TO HAPPEN — ORDERED BY IMPACT

### Fix 1: Model Picker per Slot (BIGGEST IMPACT)
Each slot row needs a dropdown/dialog showing compatible local models. Click "Assign" → see list of models whose capabilities match that slot → select → assigned. This is the CORE missing feature.

**Needs:** 
- `modelsState.modelsForCapability(slot.required_capability)` — already exists
- A `<ModelPicker slot={slot} onSelect={handleAssign} />` component — DOES NOT EXIST
- Each row shows: filename, quant, size, VRAM estimate, fit indicator

### Fix 2: Wire Download Progress Events
Listen to `platform:download-progress` Tauri events. Update `wizardState.downloadProgress`, show speed/ETA/percentage in the slot row during download.

**Needs:**
- `listen("platform:download-progress", ...)` in wizard service or runes
- Progress bar component in SlotAssignmentPanel during download state

### Fix 3: Layman Slot Descriptions
Replace `friendlySlotLabel()` output with actual explanations:

| Slot ID | Current | Should Be |
|---------|---------|-----------|
| chat.brain | Chat Brain | Main AI — talks to you, writes code, answers questions |
| minion.shared | Shared Minion | Quick Helper — fast background tasks, summarizing, formatting |
| rag.embedder | RAG Embedder | Search Engine — finds relevant code and docs for context |
| rag.reranker | RAG Reranker | Search Refiner — ranks search results by relevance |
| vision.embedder | Vision | Image Reader — understands screenshots and diagrams |
| voice.stt | Voice STT | Ears — converts your speech to text |
| voice.tts | Voice TTS | Voice — speaks AI responses out loud |

### Fix 4: Model Detail on Click
Click any model name → slide-in panel or modal showing full metadata from `ModelInfo`:
- Architecture, quant level, context length, file size, VRAM estimate
- File path on disk
- Fit indicator with explanation
- "Assign to..." button with slot picker
- "Delete" button

### Fix 5: Add Unload Button
Next to "Load" button on loaded models, show "Unload" button. Uses existing `modelsState.unload()`.

### Fix 6: Fix Import Slot Selection
Replace hardcoded `chat.brain` with a slot picker that opens before the import dialog.

---

## ENTERPRISE CHECKLIST (Must pass before wizard is "done")

- [ ] User can see all models discovered on disk with metadata
- [ ] User can assign ANY discovered model to ANY compatible slot via dropdown
- [ ] User can download a model with visible progress (%, speed, ETA)
- [ ] User can cancel an in-progress download
- [ ] User can load a model and see it transition from "cold" to "hot"
- [ ] User can unload a model
- [ ] User can swap a model on a loaded slot
- [ ] User can import a GGUF from filesystem to any slot (not just chat)
- [ ] User can see VRAM usage update after loading a model
- [ ] User can see which models are currently in memory
- [ ] Every slot label is understandable by someone who's never seen a terminal
- [ ] Every error shows the ACTUAL error message, not "something went wrong"
- [ ] Download failure shows: what failed, why, what to do about it
- [ ] Load failure shows: what failed (OOM? wrong arch? corrupt file?), what to try
- [ ] No slot shows "undefined" or "null" for any field
- [ ] No button is a no-op (every click does something visible)
- [ ] Model detail view shows: name, architecture, quant, context length, size, path, VRAM estimate
- [ ] "Browse Models" popup shows real HF results with download buttons that work
- [ ] Disk space shown before download starts
- [ ] VRAM fit indicator shown before loading
