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

# SPRINT: Model Loader UX — Make Everything Real

**Date**: 2026-04-03
**Status**: PLAN — Owner approval required before execution

---

## ISSUES (from owner testing)

1. Search returns nothing — type "llama", "qwen", nothing appears
2. No ability to add models from local filesystem
3. Voice models not visible or downloadable from model loader
4. Chat input is tiny, pulsing in and out
5. Load/unload isn't showing real feedback

---

## ROOT CAUSES (verified against code)

### Issue 1: Search returns nothing
**Root cause**: Need to verify Tauri HTTP scope. The Rust command uses `reqwest` to call `https://huggingface.co/api/models` — Tauri 2 requires explicit HTTP scope in `tauri.conf.json` for outbound requests. If missing, reqwest silently fails or gets blocked.

**Also**: The search error may be swallowed. `searchState.search()` catches errors and sets `this.error` but the error display in ModelSearch only shows if `searchState.error` is truthy AND `searchState.results.length === 0`. If the error is being cleared, the user sees nothing.

### Issue 2: No local file add
**Root cause**: Feature doesn't exist. The model loader only discovers files already in `.userdata/models/` via scan, or downloads from HuggingFace. No file picker dialog.

### Issue 3: Voice not in recommendations
**Root cause**: BootSetupWizard recommendations only include chat + minion + embedder models. Whisper STT and Kokoro TTS are NOT in the recommendation list. auto_config.rs in Rust DOES include them, but the frontend wizard uses its own hardcoded list.

### Issue 4: Chat input tiny + pulsing
**Root cause**: ChatFooter uses `TextField` with no explicit height/padding props. TextField inherits from the design system — if the preset doesn't set min-height, it collapses. The "pulsing" is likely the BootOverlay z-9999 competing with the chat window focus, or a CSS animation on the chat frame.

### Issue 5: Load/unload no feedback
**Root cause**: TauriEventBridge is not implemented. The Rust side emits `LoaderEvent::LoadingStarted/Stage/Complete/Failed` to a `TracingEventSink` (file log only). No Tauri events reach the frontend. The SwapOverlay listens for `"model:loading-stage"` etc but those events never arrive.

---

## PHASE 1: Fix Search (1 file Rust, 1 file config)

### Task 1.1: Verify HTTP scope in tauri.conf.json
Check if `https://huggingface.co/**` is allowed. If not, add it.

### Task 1.2: Add error visibility to search
If search fails, the error MUST be visible. Add `console.error` in the Tauri command so it shows in the dev console.

### Task 1.3: Test search end-to-end
After fixing scope, verify: type "qwen" → results appear with GGUF files.

**Gate**: Search works. Type "qwen" → see results.

---

## PHASE 2: Local File Import (2 files frontend, 1 file Rust)

### Task 2.1: Add "Import from Disk" button to ModelLoaderPanel
Next to "Download Model" button, add "Import from Disk" that opens a native file picker.

### Task 2.2: Create Tauri command `import_local_model`
Use `tauri::api::dialog::FileDialogBuilder` to open a file picker filtered to `.gguf` files. Copy selected file to `.userdata/models/` and trigger a registry scan.

### Task 2.3: Wire button to command
Button calls `invoke("import_local_model")` → file picker → copy → scan → refresh UI.

**Gate**: Click "Import from Disk" → native file picker → select a .gguf → appears in registry.

---

## PHASE 3: Voice Models in Wizard (1 file frontend)

### Task 3.1: Add Whisper + Kokoro to BootSetupWizard recommendations
The Rust auto_config already includes them. The frontend wizard hardcodes its own list. Add:
- Whisper small (ggml-small.bin, 466MB, CPU)
- Kokoro TTS (kokoro-v1.0.gguf, 82MB, CPU)

These appear in ALL tiers — voice is mandatory per owner's requirements.

### Task 3.2: Add voice slot visibility in ModelLoaderPanel
Voice slots (voice.stt, voice.tts) should be visible in the subsystem groups. They already should be — verify the SubsystemGroup rendering includes them.

**Gate**: Wizard shows voice models. Voice slots visible in panel.

---

## PHASE 4: Chat Input Fix (1 file)

### Task 4.1: Add min-height and padding to ChatFooter
The TextField in ChatFooter needs:
- `min-h-12` (48px minimum)
- Padding so there's breathing room before the user types
- Remove any animation that's causing the pulsing

### Task 4.2: Investigate pulsing
Check if the BootOverlay z-9999 is fighting with the chat window. Check for CSS `animation` on the chat frame or footer.

**Gate**: Chat input has proper height, padding, no pulsing.

---

## PHASE 5: TauriEventBridge — Real Load/Unload Feedback (2 files Rust, 1 file frontend)

### Task 5.1: Implement TauriEventBridge
`systems/devpulse-engine/src/platform/integrations/events.rs` — replace the TODO with a real bridge:
- Store `tauri::AppHandle` (passed during boot)
- On each `LoaderEvent`, call `app.emit("model:{event_type}", payload)`
- Events: `loading-started`, `loading-stage`, `loading-complete`, `loading-failed`, `unload-complete`, `download-progress`, `download-complete`

### Task 5.2: Wire AppHandle into ModelLoaderService boot
Pass `app.clone()` from boot_task into the model loader boot stage so the TauriEventBridge has access to the app handle.

### Task 5.3: Verify SwapOverlay receives events
The SwapOverlay and swap rune already listen for these events. Once the bridge emits them, the overlay should show progress during load and dismiss on complete/fail.

**Gate**: Click "Load" on a slot → SwapOverlay appears → shows progress stages → dismisses on complete or shows error on fail.

---

## EXECUTION ORDER

```
Phase 1 (search)   → Phase 2 (local import)  → Phase 3 (voice)
    ~30 min              ~1 hour                   ~30 min
                                                      ↓
                    Phase 4 (chat input) → Phase 5 (event bridge)
                         ~30 min              ~1.5 hours
```

Phase 1 first — search is the primary interaction for finding models.
Phase 5 last — biggest change, requires Rust + frontend coordination.

**Total: ~4 hours. 8 files changed. Zero stubs when done.**
