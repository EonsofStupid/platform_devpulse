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

# Research: Embedded vs User-Managed Model Architecture

> **Date**: 2026-04-03
> **Context**: Owner wants voice (Whisper, Kokoro) and vision (SigLIP HD) embedded with the build, user only manages brain/minion swaps
> **Decision needed**: Bundle in installer vs auto-download on first run

---

## Industry Survey — How Desktop LLM Apps Handle Models (2025-2026)

**Universal pattern: ZERO apps bundle models in the installer.**

| App | Installer | Model Strategy | Ships Models? |
|-----|-----------|----------------|---------------|
| LM Studio | ~80 MB | Download-after-install via HF browser | No |
| Jan.ai | ~100 MB | Download-after-install via model hub | No |
| Ollama | ~150 MB | `ollama pull` from registry | No |
| KoboldCpp | ~15 MB | User supplies GGUF path | No |
| GPT4All | ~80 MB | Download-after-install via library | No |
| Msty (Tauri-based) | Small | Downloads models separately | No |

**Apple (CoreML)**: Recommends bundling a small "starter" model, downloading better models in background.

**Adobe/Topaz/DaVinci**: Ship 2-4 GB installers with ML models. These are pro creative apps where users expect large installs.

**Windows ML (GA Sept 2025)**: OS manages ONNX Runtime. App ships model only, not runtime.

---

## The Models DevPulse Wants to Embed

| Model | Size | Purpose | Format | Runtime |
|-------|------|---------|--------|---------|
| Whisper small | 466 MB | STT (voice input) | safetensors/bin | Candle or Sherpa |
| Kokoro v1.0 | 82 MB | TTS (voice output) | ONNX | ort |
| SigLIP2 base | 400 MB | Vision (screen management) | safetensors | Candle |
| **Total** | **~948 MB** | | | |

---

## Tauri 2 Resource Bundling: What's Technically Possible

### Config syntax
```jsonc
{
  "bundle": {
    "resources": {
      "models/bundled/kokoro.onnx": "models/bundled/",
      "models/bundled/whisper-small/**": "models/bundled/whisper-small/"
    }
  }
}
```

### Runtime access
```rust
let model_path = app.path().resolve(
    "models/bundled/kokoro.onnx",
    tauri::path::BaseDirectory::Resource
)?;
```

### Windows install location
- perUser: `C:\Users\{user}\AppData\Local\{identifier}\` (alongside .exe)
- perMachine: `C:\Program Files\{identifier}\`

### NSIS limits
- Modern NSIS: no hard 2 GB limit (older versions had one)
- LZMA compression: 5-15% reduction on model files (already quantized)
- ~948 MB models + ~50 MB app = ~1 GB installer
- **Fits**, but barely. Adding more models later hits the wall.

### Problems with 1 GB installer
- GitHub Releases: 2 GB per asset limit
- User abandonment: 12+ minutes on 10 Mbps connection
- Antivirus: Windows Defender may scan/flag large NSIS installers
- Every model update = entire installer rebuild + re-download

---

## Three Architecture Options

### Option A: Bundle Everything in Installer

```
Installer: ~1 GB
├── devpulse.exe (~30 MB)
├── frontend assets (~5 MB)
├── models/bundled/
│   ├── whisper-small/ (466 MB)
│   ├── kokoro.onnx (82 MB)
│   └── siglip2-base/ (400 MB)
```

**Pros**: Works offline immediately. Zero first-run setup for voice/vision.
**Cons**: 1 GB download. Slow install. AV flags. Every model update = new installer. No other desktop LLM app does this.

### Option B: Lean Installer + Auto-Download on First Run

```
Installer: ~50 MB
├── devpulse.exe
├── frontend assets

First run:
├── Auto-download voice + vision to .userdata/models/ (background, non-blocking)
├── SetupWizard for brain + minion (foreground, user chooses)
```

**Pros**: Fast install. Industry standard. Models update independently. Smaller builds.
**Cons**: Requires internet on first run. Voice/vision not immediately available (~2 min download).

### Option C: Hybrid — Bundle Kokoro, Auto-Download Rest

```
Installer: ~115 MB
├── devpulse.exe
├── frontend assets
├── models/bundled/kokoro.onnx (82 MB) ← TTS available immediately

First run:
├── Auto-download Whisper (466 MB) in background
├── Auto-download SigLIP2 (400 MB) in background
├── SetupWizard for brain + minion (foreground)
```

**Pros**: TTS works on first launch (Clyffy can speak immediately). Small installer. Other models download transparently.
**Cons**: STT and vision not ready for ~2 minutes after first launch.

---

## Technical Details: Loading from Read-Only Paths

### Candle (GGUF, safetensors)
- `gguf_file::Content::read()` opens file read-only. **Works from install dir.**
- `MmapedSafetensors::new()` creates read-only mmap. **Works from install dir.**
- No writes to model files during inference.

### ort (ONNX Runtime)
- `Session::builder()?.commit_from_file(path)` opens read-only. **Works from install dir.**
- **Gotcha**: ONNX Runtime writes optimization cache to same dir by default. Fix:
  ```rust
  .with_optimization_level(GraphOptimizationLevel::Disable)
  // OR redirect to user data dir:
  .with_optimized_model_filepath(&cache_dir.join("kokoro_opt.onnx"))
  ```

### Windows file locking
- mmapped files can't be deleted while mapped. Fine for bundled (never deleted).
- Windows Defender may scan large files on first access: 5-30s delay. Mitigate by pre-reading 1 byte during boot.

---

## Slot Configuration: `ModelSourceTier` Enum

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelSourceTier {
    /// Shipped with the app binary. Path resolved from $RESOURCE.
    /// User never sees these in the Model Loader UI.
    Bundled { resource_path: String },

    /// Downloaded automatically on first run. User doesn't choose these.
    /// Shows progress in boot overlay but not in Model Loader panel.
    AutoProvision { repo_id: String, filename: String },

    /// User selects and manages via Model Loader UI.
    /// These are the swappable models (brain, minion, embedder, reranker).
    UserManaged,
}
```

### Slot assignments with tiers

| Slot | Tier | Model | User Sees It? |
|------|------|-------|---------------|
| `voice.tts.primary` | Bundled | Kokoro v1.0 | No (always there) |
| `voice.stt` | AutoProvision | Whisper small | No (auto-downloaded) |
| `vision.embedder` | AutoProvision | SigLIP2 base | No (auto-downloaded) |
| `chat.brain` | UserManaged | Qwen3 7B/14B | Yes (Model Loader) |
| `minion.shared` | UserManaged | Qwen3 0.6B | Yes (Model Loader) |
| `rag.embedder` | UserManaged | nomic-embed | Yes (Model Loader) |
| `rag.reranker` | UserManaged | Qwen3-Reranker | Yes (Model Loader) |

### Build-time feature flags

```toml
# kernel/model-loader/Cargo.toml
[features]
bundled-tts = []     # Kokoro in resources
bundled-stt = []     # Whisper auto-provision
bundled-vision = []  # SigLIP auto-provision
```

Dev builds: skip all bundled, everything is UserManaged. Fast iteration.
Release builds: enable bundled features.

---

## Model Manifest (Tracking What's Downloaded)

```toml
# .userdata/models/manifest.toml
[manifest]
version = 1

[[models]]
id = "whisper-small"
slot = "voice.stt"
filename = "ggml-small.bin"
size_bytes = 466_000_000
sha256 = "abc123..."
status = "ready"  # ready | downloading | pending | failed
source = { type = "auto_provision", repo_id = "ggerganov/whisper.cpp" }

[[models]]
id = "qwen3-4b"
slot = "chat.brain"
filename = "Qwen3-4B-Q4_K_M.gguf"
size_bytes = 2_600_000_000
sha256 = "def456..."
status = "ready"
source = { type = "user_managed" }
```

---

## Recommendation

**Option C (Hybrid)** is the right call for DevPulse:

1. **Bundle Kokoro (82 MB)** — Clyffy speaks on first launch. This is the identity of the app.
2. **Auto-provision Whisper + SigLIP on first run** — Downloads in background during boot overlay. User sees progress but doesn't make decisions.
3. **UserManaged for brain/minion/embedder/reranker** — SetupWizard guides the user. Model Loader panel for ongoing management.

This gives:
- ~115 MB installer (fast install, no AV flags)
- Voice immediately available (Clyffy's personality)
- STT + vision online within 2 minutes of first launch
- User only worries about swapping brains

The owner said "lets assume the two voice models are going to be embedded with the build and the sigint hd." Option C bundles the tiny one (Kokoro, 82 MB) and auto-provisions the larger ones (Whisper 466 MB, SigLIP 400 MB). This respects the intent — user never manages these — while keeping the installer practical.

If the owner prefers Option A (bundle all three, ~1 GB installer), it's technically feasible but fights the entire industry pattern.

---

## Open Questions for Owner

1. **Kokoro only vs all three in installer?** Option C bundles just Kokoro (82 MB). Option A bundles all (~948 MB). Your call.
2. **Auto-provision blocking or non-blocking?** Should the app wait for Whisper + SigLIP to download before becoming usable, or let the user start chatting while they download?
3. **Dev build behavior?** Skip bundled models entirely (fastest iteration) or always bundle Kokoro?
4. **Orpheus TTS (3B)**: You have `voice.tts.secondary` with Orpheus 3B. Is this also bundled, or user-managed, or dropped entirely?
5. **SNAC decoder**: Required by Orpheus. Bundled with Orpheus, or separate?
