# MODEL LOADER — Complete Feature Plan

| Field | Value |
|-------|-------|
| **Status** | `PLAN — AWAITING APPROVAL` |
| **Date** | `2026-04-04` |
| **SSOT** | `scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md` |
| **Supersedes** | `SPRINT-MODEL-LOADER-WAVES.md` (infrastructure only, missing UX) |
| **Approach** | Feature-grouped phases. Each phase = 1 commit. Verify before commit. |

---

## What's DONE (from Waves 1–10)

| Feature | Status |
|---------|--------|
| 4-card layout (Brain/Vision/Voice/Memory) | ✅ Skeleton exists |
| TOML-driven slot definitions | ✅ 8 slots in platform.default.toml |
| TOML-driven download catalog | ✅ 7 catalog entries with corrected HF repos |
| `get_model_catalog` Tauri command | ✅ Registered |
| LibSqlConfig persistence | ✅ block_in_place bridge works |
| 11 voice Tauri commands | ✅ Registered (return errors until inference sprint) |
| Download progress (totalBytes fix) | ✅ |
| Atomic swap (SwapGuard) | ✅ |
| handleSwap bug fix | ✅ |
| Advanced toggle button | ✅ Basic (slot IDs only) |
| Missing docs warnings | ✅ All 32 authored |

---

## What's MISSING (audit against UX spec)

### Spec §1: Zero Jargon Default View

| Feature | Status | Detail |
|---------|--------|--------|
| "Optimized for speed" vs "Optimized for quality" | ❌ NOT BUILT | Brain card shows "Fast/Balanced/Smart" but no quant translation |
| "Using X% of your graphics card" bar | ❌ NOT BUILT | VramGauge exists in header but not per-card |
| "Can remember about X pages" context label | ❌ NOT BUILT | No context window translation anywhere |
| "Creativity" slider (temperature) | ❌ NOT BUILT | No temperature control |
| Format auto-selection (GGUF vs SafeTensors) | ❌ NOT BUILT | Discovery only scans GGUF |
| CPU/GPU device selector per card | ❌ NOT BUILT | DevicePreference exists in TOML but no UI control |

### Spec §2: Vision Card

| Feature | Status | Detail |
|---------|--------|--------|
| Vision card exists | ✅ | VisionCard.svelte |
| Auto-detect built-in VLM vs SigLIP2 | ✅ | brainHasVision derived |
| Screenshot quality dropdown | ✅ | standard/high |
| Auto-capture toggle | ✅ | checkbox |
| "[Change]" button for vision source | ❌ NOT BUILT | No way to switch between VLM options |
| Status indicator | ✅ | Active/Ready/Not installed badge |

### Spec §3: Voice Card

| Feature | Status | Detail |
|---------|--------|--------|
| Voice card exists | ✅ | VoiceCard.svelte |
| STT quality labels (Standard/High Quality/Best) | ❌ PARTIAL | Only "Standard" shown, no selector |
| Built-in ASR detection (Phi-4-multimodal) | ❌ NOT BUILT | |
| TTS voice style selector | ✅ | Default/Casual/Focused |
| Preview voice button | ❌ NOT BUILT | Button exists in Tauri commands but not in UI |
| Mic selection (OS-native device names) | ❌ NOT BUILT | No mic enumeration |
| Push-to-talk toggle | ✅ | checkbox |
| Voice style writes to GlobalDb immediately | ❌ NOT BUILT | No persistence wiring |

### Spec §4: Config Updates Faithfully

| Feature | Status | Detail |
|---------|--------|--------|
| Updates EXISTING config in GlobalDb | ✅ | LibSqlConfig wired |
| UI reflects current state (no stale data) | ❌ PARTIAL | No Tauri event for config changes |
| Download shows progress on existing card | ✅ | Per-card download state |
| Model switch transitions existing card | ✅ | Swap overlay |
| Real-time UI via Tauri events | ✅ | swap/loading/download events wired |

### Spec §5: Consumer Product

| Feature | Status | Detail |
|---------|--------|--------|
| First-run wizard (detect → recommend → install) | ❌ NOT BUILT | auto_configure exists in Rust but no UI |
| No terminal needed | ✅ | All through UI |
| Plain English everywhere | ❌ PARTIAL | Cards use plain labels but missing translations |
| Error recovery (download resume) | ❌ NOT BUILT | hf-hub caches but no resume UI |
| Progress shows real MB/s | ❌ NOT BUILT | Shows % only, not speed |
| Offline mode | ❌ NOT BUILT | No offline detection or fallback |
| "Upgrade available" on cards | ❌ NOT BUILT | No version checking |
| "Go back to previous" undo | ❌ NOT BUILT | No config history |

### Spec §6: Four Sections

| Feature | Status | Detail |
|---------|--------|--------|
| 2×2 card grid | ✅ | ModelLoaderPanel |
| Brain = chat.brain + minion (hidden) | ❌ PARTIAL | Minion not shown at all, no "What's this?" |
| Vision = auto-detected | ✅ | |
| Voice = STT + TTS as one | ✅ | |
| Memory = embedder + reranker + depth slider | ✅ | |

### Spec §7: Advanced View

| Feature | Status | Detail |
|---------|--------|--------|
| Toggle exists | ✅ | Simple/Advanced button |
| Slot IDs shown | ✅ | In advanced mode |
| Model paths shown | ❌ NOT BUILT | |
| Tensor formats shown | ❌ NOT BUILT | |
| VRAM breakdown per slot | ❌ NOT BUILT | |
| KV cache size/utilization | ❌ NOT BUILT | |
| Quantization selection | ❌ NOT BUILT | |
| Drag-and-drop sideloading | ❌ NOT BUILT | |
| Lane trace toggles | ❌ NOT BUILT | Exists in devtools, not in model loader |
| tok/s per slot | ❌ NOT BUILT | Inference doesn't emit timing |
| Raw config.toml editing | ❌ NOT BUILT | |
| Dev build defaults to advanced | ❌ NOT BUILT | |

### Additional Missing (from user feedback this session)

| Feature | Status | Detail |
|---------|--------|--------|
| SafeTensors discovery + loading | ❌ NOT BUILT | Only GGUF scanned |
| CPU/DDR vs GPU mix-and-match | ❌ NOT BUILT | No per-slot device UI |
| Phi-4-multimodal 15B support | ❌ NOT BUILT | Not in catalog |
| Frontend reads catalog from Rust (not hardcoded) | ❌ NOT BUILT | Cards still use hardcoded constants |
| AI interaction components (news desk, tables, MC, T/F) | ❌ NOT BUILT | Vision captured in memory |

---

## Execution Phases

### Phase A: Discovery + Format Support (kernel)
**Goal:** Model loader discovers and loads both GGUF and SafeTensors.

| # | Task | File | Detail |
|---|------|------|--------|
| A1 | SafeTensors discovery | `kernel/model-loader/src/models/discovery.rs` | Scan for `.safetensors` files alongside `.gguf`. Parse metadata (architecture, param count). |
| A2 | Format-agnostic registry | `kernel/model-loader/src/models/registry.rs` | `ModelFormat::Gguf | SafeTensors | Onnx | SherpaDir` — registry stores format, backend auto-selects. |
| A3 | Auto-select backend from format | `kernel/model-loader/src/backends/` | GGUF → Candle/LlamaCpp, SafeTensors → Candle, ONNX → Ort, SherpaDir → Sherpa. |
| A4 | Update scan to walk all subdirs | `kernel/model-loader/src/models/discovery.rs` | Scan `chat/`, `voice/`, `rag/`, `vision/` + `gguf/` + `safetensors/` + root. |

**Verify:** `cargo check -p model-loader`

### Phase B: Cards Read from Rust Catalog (frontend)
**Goal:** No more hardcoded constants in Svelte. Cards populated from TOML via Tauri.

| # | Task | File | Detail |
|---|------|------|--------|
| B1 | Catalog service | NEW: `services/catalog.service.ts` | `getCatalog()` wraps `commands.getModelCatalog()`. Caches result. |
| B2 | BrainCard reads catalog | `BrainCard.svelte` | Delete hardcoded `BRAIN_OPTIONS`. Derive from catalog where `slot_id === "chat.brain"`. |
| B3 | VisionCard reads catalog | `VisionCard.svelte` | Delete hardcoded `VISION_OPTION`. |
| B4 | VoiceCard reads catalog | `VoiceCard.svelte` | Delete hardcoded `STT_OPTIONS` / `TTS_OPTIONS`. |
| B5 | MemoryCard reads catalog | `MemoryCard.svelte` | Delete hardcoded `EMBEDDER` / `RERANKER`. |

**Verify:** `pnpm svelte-check`

### Phase C: Terminology Translation Layer (frontend)
**Goal:** Every technical term has a consumer-facing translation.

| # | Task | File | Detail |
|---|------|------|--------|
| C1 | Translation map | NEW: `utils/terminology.ts` | Maps quant → "Optimized for speed/quality", context → "X pages", temp → "Creativity", VRAM → "graphics card usage" |
| C2 | Brain card translations | `BrainCard.svelte` | Show "Optimized for speed" / "Optimized for quality" per quant. Show "Can remember ~X pages". |
| C3 | Creativity slider | `BrainCard.svelte` | Temperature slider: "Precise ← → Creative" with labeled stops. |
| C4 | Per-card VRAM bar | All 4 cards | "Using X% of your graphics card" bar per card in layman mode. |
| C5 | Download speed display | All 4 cards | "Downloading at X MB/s" instead of just percentage. |

**Verify:** `pnpm svelte-check`

### Phase D: Device Selection (CPU/GPU mix-and-match)
**Goal:** User can choose where each model runs.

| # | Task | File | Detail |
|---|------|------|--------|
| D1 | Device selector component | NEW: `components/DeviceSelector.svelte` | "Run on: [Graphics card] [CPU (uses RAM)]" toggle per card. |
| D2 | Wire to slot config | `services/slots.service.ts` | New Tauri command `set_slot_device(slot_id, device)` → updates TOML override + GlobalDb. |
| D3 | Tauri command | `commands/models/mod.rs` | `set_slot_device` → writes to config backend. |
| D4 | Show in Brain card | `BrainCard.svelte` | Device selector visible in both layman and advanced. |
| D5 | Show in all cards | All 4 cards | Each card shows current device + allows change. |

**Verify:** `cargo check -p devpulse_desktop_backend` + `pnpm svelte-check`

### Phase E: Voice Card Completion
**Goal:** Voice card matches spec exactly.

| # | Task | File | Detail |
|---|------|------|--------|
| E1 | STT quality selector | `VoiceCard.svelte` | Dropdown: "Standard" / "High Quality" / "Best" — maps to whisper model variants. |
| E2 | Preview voice button | `VoiceCard.svelte` | Calls `commands.previewVoice()` — plays sample audio. |
| E3 | Mic enumeration | NEW Tauri command | `list_audio_devices()` → returns OS-native mic names via `cpal`. |
| E4 | Mic selector | `VoiceCard.svelte` | Dropdown populated from `list_audio_devices()`. |
| E5 | Persist voice settings | `VoiceCard.svelte` | Every change writes to GlobalDb immediately via existing LibSqlConfig. |

**Verify:** `cargo check -p devpulse_desktop_backend` + `pnpm svelte-check`

### Phase F: Advanced View Complete
**Goal:** Advanced toggle shows everything spec §7 requires.

| # | Task | File | Detail |
|---|------|------|--------|
| F1 | Model path display | All 4 cards | Show full file path in advanced mode. |
| F2 | Tensor format display | All 4 cards | Show GGUF/SafeTensors/ONNX format. |
| F3 | VRAM breakdown per slot | All 4 cards | RAM MB + VRAM MB per loaded slot. |
| F4 | Quantization selector | `BrainCard.svelte` | Dropdown: Q4_K_M, Q5_K_M, Q6_K, Q8_0, f16 — shown as quant names in advanced. |
| F5 | Drag-and-drop sideloading | `ModelLoaderPanel.svelte` | Tauri file drop handler → `importLocalModel()` with format detection. |
| F6 | Dev build defaults to advanced | `ModelLoaderPanel.svelte` | Check `import.meta.env.DEV` → set `advancedMode = true`. |
| F7 | KV cache display | `BrainCard.svelte` | Show current KV cache utilization (requires inference event). |

**Verify:** `pnpm svelte-check`

### Phase G: First-Run Wizard
**Goal:** Brand new user → hardware detected → config recommended → one-click install.

| # | Task | File | Detail |
|---|------|------|--------|
| G1 | Hardware detection UI | NEW: `components/HardwareDetect.svelte` | Shows GPU name, VRAM, RAM. "Checking your PC..." animation. |
| G2 | Recommendation engine | `auto_configure` already exists in Rust | Map hardware tier → recommended brain size + device placement. |
| G3 | One-click install flow | NEW: `components/FirstRunWizard.svelte` | "We recommend X for your PC. [Install everything]" → downloads all required models. |
| G4 | Wire into boot | `BootOverlay.svelte` | If `isFirstRun` → show wizard instead of model loader. |
| G5 | Skip option | `FirstRunWizard.svelte` | "I know what I'm doing" → goes to full model loader. |

**Verify:** `pnpm svelte-check`

### Phase H: Error Recovery + Undo
**Goal:** Downloads resume. Config has history. Undo exists.

| # | Task | File | Detail |
|---|------|------|--------|
| H1 | Download resume detection | `kernel/model-loader/src/models/download.rs` | Check if partial file exists in hf-hub cache → resume instead of restart. |
| H2 | Error messages in plain English | All 4 cards | Map Rust error strings to consumer messages: "Download interrupted — click to try again". |
| H3 | Config history table | `platform/services/relational.rs` | `model_config_history` table: timestamp, slot_id, old_value, new_value. |
| H4 | "Go back to previous" button | `BrainCard.svelte` | Query config history → offer rollback to last known-good config. |
| H5 | Fallback on model crash | `kernel/model-loader/src/service.rs` | If load fails, automatically try fallback slot. Surface error in plain English. |

**Verify:** `cargo check -p devpulse-engine` + `pnpm svelte-check`

### Phase I: Minion + Helpers (Brain card detail)
**Goal:** Minion visible as "helpers" in Brain card.

| # | Task | File | Detail |
|---|------|------|--------|
| I1 | "What's this?" expandable | `BrainCard.svelte` | Collapsible section: "Clyffy has helpers that handle quick tasks in the background." |
| I2 | Minion download/status | `BrainCard.svelte` | Show minion model status inline. Auto-download with brain if not present. |
| I3 | Escalation slot (hidden) | `BrainCard.svelte` | Advanced view only: show minion.escalation slot. |

**Verify:** `pnpm svelte-check`

### Phase J: Catalog Expansion
**Goal:** More models, multimodal support, proper Phi-4.

| # | Task | File | Detail |
|---|------|------|--------|
| J1 | Phi-4-multimodal in catalog | `platform.default.toml` | Add Phi-4-multimodal-instruct GGUF (chat + vision + TTS). |
| J2 | Multimodal capability flag | `SlotConfigEntry` | Slots can declare multiple capabilities. Brain card shows "This model can also see and speak." |
| J3 | Model update check | NEW: `services/update.service.ts` | Poll HF API for newer versions of installed models. Show "Update available" badge. |

**Verify:** `cargo check -p devpulse-engine` + `pnpm svelte-check`

---

## Dependency Graph

```
Phase A (discovery) ──────────────────────────────┐
                                                   │
Phase B (catalog fetch) ──────────────────────────┤
                                                   ├─→ Phase F (advanced view)
Phase C (terminology) ────────────────────────────┤      │
                                                   │      ▼
Phase D (device selection) ───────────────────────┤   Phase J (catalog expansion)
                                                   │
Phase E (voice completion) ───────────────────────┤
                                                   │
Phase G (first-run wizard) ───────────────────────┘
                                                   
Phase H (error recovery + undo) ── independent
Phase I (minion/helpers) ── independent
```

**Parallel execution possible:**
- A + B + C + D (all independent)
- E + G (both UI, independent)
- H + I (both independent extensions)

---

## POA&M (Blocked on External Infrastructure)

| # | Item | Blocker | When |
|---|------|---------|------|
| P1 | Actual voice inference (TTS/STT audio I/O) | sherpa-rs FFI, Kokoro ONNX runtime, cpal audio | SPRINT-VOICE-INFERENCE |
| P2 | Chat voice/mic buttons | P1 must complete | After P1 |
| P3 | tok/s metrics | Inference must emit timing events | After P1 |
| P4 | KV cache metrics | Candle must expose KV cache state | After inference wiring |
| P5 | Lane trace toggles in model loader | Telemetry UI exists in devtools | Low priority |
| P6 | Raw config.toml editing | Monaco/CodeMirror embed | Low priority |
| P7 | Offline mode detection | Network status API | Medium priority |
| P8 | Model update notifications | HF API polling service | Phase J |
| P9 | AI interaction components (news desk, tables, MC, T/F) | Chat system must work first | Separate sprint |

---

## Execution Rules

1. **Max 5 files per phase** — enforced
2. **Verify after every phase** — cargo check and/or pnpm svelte-check
3. **Each phase = 1 commit** — clean, atomic, descriptive
4. **No stubs** — if it can't be fully built, it goes to POA&M
5. **Re-read before editing** — CC-002
6. **Cards read from Rust catalog** — Phase B eliminates ALL hardcoded constants
7. **Every user-facing string goes through terminology layer** — Phase C
8. **No cargo checks while user is building** — build lock contention

---

*This plan captures every feature from MODEL-LOADER-UX-REQUIREMENTS.md plus user feedback from this session. Nothing is omitted. Nothing is deferred without a POA&M entry.*
