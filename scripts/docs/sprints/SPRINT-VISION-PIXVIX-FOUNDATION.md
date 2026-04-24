# Sprint: Vision + PixVix Foundation

**Goal**: Hypermodular, dev-first foundation for screen/webcam capture → SigLip encoding → user-directed storage, surfaced through a reauthored `/devtools/vision` devtool with real ColdLight + fluid clamp UX. Rust/Tauri drives everything; SvelteKit stays a dumb consumer. Customer-facing UI is a later sprint on top of this foundation.

**Owner-approved decisions** (logged so we don't re-litigate mid-sprint):
- Foundation over fastest. Right-the-first-time.
- HD path is a real toggle, not a roadmap item.
- Webcam + monitor + window sources are all first-class.
- PixVix lives under WiredFront physical boundary and crosslinks to Clyffy analysis.
- Storage sinks are user-directed (disk / libSQL / DuckDB / composite).
- CPU governance must coexist gracefully with every other service on the event bridge.

---

## Architectural contract — Rust drives, Svelte renders

Every UI screen in this sprint follows one shape:

```
┌──────────────────────────────────────────────────────────────┐
│  Rust (devpulse-engine + src-tauri commands + platform:*    │
│         event bridge)                                         │
│    - Owns state, capture loops, governor, SigLip, sinks.     │
│    - Emits `platform:pixvix-status` + `platform:vision-*`.   │
│    - Exposes pure command surface for user actions.          │
└──────────────────────────────────────────────────────────────┘
                          ▲                ▼
                  commands.*          listen(platform:*)
                          ▼                ▲
┌──────────────────────────────────────────────────────────────┐
│  Svelte (ColdLight components + fluid clamp + runes)         │
│    - No business logic. Listeners fill `$state`.             │
│    - Every button is a one-liner command invocation.         │
│    - ServiceDevtoolShell owns chrome; extra tabs are thin.   │
└──────────────────────────────────────────────────────────────┘
```

**Non-negotiables**:
- Svelte never holds authoritative state. Rust's snapshot is the source of truth.
- Frame bytes never traverse the event bus. Bus carries metadata; frames fetched via `get_latest_frame()` command.
- Every persisted knob goes through `get_preference` / `set_preference`.
- Every new component uses ColdLight tokens (`--accent-*`, `--signal-*`, `--surface-*`) and fluid clamp helpers (`FLUID_SPACE`, `FLUID_SIZE`, `FLUID_PADDING`) — no raw px / hex.

**Specta contract**: Every Tauri command added this sprint carries `#[specta::specta]`. Every Rust DTO carries `#[derive(Serialize, Type)]`. Bindings regenerate via `DEVPULSE_BINDINGS_EXPORT_ONLY=1 ./target/debug/devpulse-desktop-app.exe` from `src-tauri/`. Frontend imports from `$lib/sys/generated/bindings.js` only — no duplicate type definitions.

---

## Phase checklist

### V-0 Pre-flight (dep sanity + pinning)

- [x] Confirm `clampFluid` + `FLUID_*` presets exist at `$lib/design/utils/clamp/clamp.ts`
- [x] Confirm `PixVix` declared under WiredFront in `project.manifest.yml`
- [x] Confirm `sysinfo` available in both engine + src-tauri
- [x] Pin ONNX SigLip 2 target → `onnx-community/siglip2-so400m-patch14-384-ONNX` @ commit `8ecf3f2` (SigLip 2 SO400M, FixRes 384, no NaFlex export exists yet upstream — see V-11)
- [x] Add `xcap = "0.9"` + `nokhwa = "0.10"` with `input-native` to `src-tauri/Cargo.toml`
- [x] `cargo check -p devpulse_desktop_backend` green with new deps (resolved to `xcap 0.9.4` + `nokhwa 0.10.10` + `nokhwa-bindings-windows 0.4.5`, 0 errors)
- [x] `ort` dep addition deferred to V-5 branch so vision/pixvix MVP doesn't block on it
- [ ] Commit `chore(desktop): pre-flight deps for PixVix capture stack`

### V-1 Baseline verify (no new code, trust but verify)

**Revised after safetensors header inspection — the model is SigLIP 2, not SigLIP 1. The preset id `google/siglip2-so400m-patch14-384` is the real HuggingFace repo. HF's `/` → `--` dir convention explains the folder name. No rename needed.**

Also confirmed from inspection:
- Safetensors tensor keys are identical to SigLip 1 layout (`vision_model.embeddings.*`, `vision_model.encoder.layers.*`). 888 tensors total.
- Our existing `backends/candle/siglip.rs` loads via `vb.pp("vision_model")` which matches the on-disk prefix.
- Conclusion: **candle-transformers 0.9.2 should load this SigLIP 2 checkpoint as-is**. No candle bump needed for V-1.
- Bonus: `ort = "=2.0.0-rc.12"` is **already** in the workspace `Cargo.toml` — V-5 doesn't need a new dep, just a feature gate in model-loader.

- [x] Confirm model identity via safetensors header inspection — is SigLIP 2 SO400M patch14 384
- [x] Confirm tensor prefix matches candle load path (`vision_model.*`)
- [x] Confirm `ort` already workspace-pinned at 2.0.0-rc.12 (V-5 unblocked)
- [x] Confirm slots.default.toml defines `vision.embedder` with capability `VisionEmbedding` + signal-loaded on `screenshot.captured` + Candle runtime
- [x] Confirm presets.default.toml references `google/siglip2-so400m-patch14-384` as the bundled default
- [x] Update `models/vision/google--siglip2/devpulse.json` with explicit HF repo id + tensor layout + size + architecture (so downstream tooling doesn't guess)
- [x] Leave empty `google--siglip2-base/` stub — intentional placeholder for a smaller base variant
- [ ] **Owner-run runtime smoke** (I can't run the GUI): `cargo xtask run-dev` → `/devtools/vision` → Load slot → Pick image → confirm 1152-dim output and `norm ≈ 1.0` — numbers land in the V-1 commit body as the baseline
- [ ] Commit `chore(model-loader): sharpen vision.embedder metadata for SigLIP 2 baseline`

### V-2 Engine vision module (governor + metrics + DTOs)

- [ ] New crate module `systems/devpulse-engine/src/vision/mod.rs`
- [ ] `vision/governor.rs`: `Governor` struct with `GovernorPolicy { cpu_ceiling_pct, ram_ceiling_mb, event_bridge_qps }` + `GovernorState { throttled, reason, last_tick_ms }`. Ticks every 500ms via `sysinfo`. Publishes state on a `tokio::sync::broadcast` channel.
- [ ] `vision/metrics.rs`: `FrameMetric` DTO (ts_ms, source, capture_ms, encode_ms, sink_ms, frame_bytes, embedding_dim, embedding_norm, similarity_to_prev, cpu_pct, rss_mb, governor_throttled, hd_path, sink_list). Batched writer that flushes to DuckDB every N frames.
- [ ] DuckDB schema DDL for `vision_frame_metrics` + `vision_governor_ticks`. Install via analytics boot (matches `lane_baselines` pattern).
- [ ] `vision/mod.rs`: wire engine-public re-exports. Follow same shape as `platform/reasoning/` and `platform/telemetry/`.
- [ ] 5+ unit tests: governor throttles under mock CPU load, metrics batch flushes on capacity, similarity-to-prev math.
- [ ] `cargo test -p devpulse-engine --lib vision` all green
- [ ] Commit `feat(engine): vision governor + metrics foundation`

### V-3 Capture primitives (Rust-side)

- [ ] New module `interfaces/desktop/src-tauri/src/commands/pixvix/`
  - [ ] `paths.rs`: resolve `.userdata/vision-frames/` per OS
  - [ ] `monitor.rs`: xcap-backed `list_monitors() -> Vec<MonitorInfo>`, `capture_monitor_once(idx) -> CapturedFrame`
  - [ ] `window.rs`: xcap-backed `list_windows() -> Vec<WindowInfo>`, `capture_window_once(id) -> CapturedFrame`
  - [ ] `webcam.rs`: nokhwa-backed `list_webcams() -> Vec<WebcamInfo>`, `capture_webcam_once(idx) -> CapturedFrame`
  - [ ] `session.rs`: `start_capture_session(config)` / `stop_capture_session()` — long-running task that honors `Governor` + emits `platform:pixvix-status`
  - [ ] `mod.rs`: Tauri command surface + barrel
- [ ] DTOs: `CapturedFrame { id, ts_ms, source, dims, png_bytes_b64 }`, `MonitorInfo`, `WindowInfo`, `WebcamInfo`, `CaptureSessionConfig`, `CaptureSessionStatus`
- [ ] All DTOs `#[derive(Serialize, Deserialize, Type)]`
- [ ] All commands `#[tauri::command] #[specta::specta]`
- [ ] Unit tests: enumeration returns non-empty on CI, PNG round-trip preserves dims
- [ ] Register commands in `lib.rs::collect_commands![]`
- [ ] Commit `feat(pixvix): monitor/window/webcam capture primitives`

### V-4 Pipeline + user-directed sinks

- [ ] New `vision/pipeline.rs`: owns the capture → encode → sink chain. Reads `Governor` before every tick. Drops frames (not whole session) when throttled.
- [ ] New `vision/sinks.rs`: `FrameSink` trait (`write`, `name`, `health`). Implementations:
  - [ ] `DiskFrameSink` — writes PNG to `.userdata/vision-frames/{session_id}/{ts}.png`
  - [ ] `LibSqlFrameSink` — writes `(session_id, ts_ms, source, dims, sink_path, embedding_blob)` into `vision_frames` table
  - [ ] `DuckDbEmbeddingSink` — writes per-frame embedding + metrics into `vision_frame_metrics`
  - [ ] `DiscardSink` — no-op, for perf profiling
  - [ ] `CompositeSink` — fan-out; per-sink error isolation (one bad sink never kills the session)
- [ ] libSQL migration for `vision_frames` table (id PK, session_id, ts_ms, source, width, height, sink_path TEXT, embedding BLOB)
- [ ] Preference keys → sink factory (`vision.sink.frames`, `vision.sink.embeddings`, `vision.sink.directory`, `vision.sink.retention_days`)
- [ ] Retention worker that prunes disk PNGs older than `retention_days` (runs on session stop)
- [ ] 6+ unit tests: composite fan-out, per-sink error isolation, retention cutoff, discard sink zero-cost
- [ ] Commit `feat(vision): pipeline + user-directed sinks with retention`

### V-5 HD via ONNX SigLip 2 (ort backend)

*(V-0 inspection found `ort = "=2.0.0-rc.12"` already workspace-pinned — skip the dep-add step and go straight to enabling the feature in model-loader.)*

- [ ] Add `ort = { workspace = true, optional = true }` to `kernel/model-loader/Cargo.toml` behind new `ort-backend` feature (no version bump needed — reuses workspace pin)
- [ ] New backend `kernel/model-loader/src/backends/ort/siglip_naflex.rs` implementing `VisionEmbeddingBackend`
  - [ ] Loads `onnx-community/siglip2-so400m-patch14-384-ONNX` (FixRes, not NaFlex — NaFlex deferred)
  - [ ] Same preprocessing as candle path (mean 0.5, std 0.5, 384² RGB CHW)
  - [ ] Exposes `backend_name() -> "siglip2-onnx-fixres"`
- [ ] Dispatcher in `voice_pool.rs` picks candle vs ort based on slot `hd_enabled` preference
- [ ] Model download helper → `kernel/model-loader/src/models/download.rs` learns about ONNX exports (distinct from safetensors path)
- [ ] Preference key `vision.hd.backend` enum: `'siglip1-candle'` (default) | `'siglip2-ort'` | `'siglip1-tiled'` (tile-based pseudo-HD, V-11)
- [ ] Tests: ort backend loads, encodes a golden test image, embedding dim matches expectation
- [ ] Commit `feat(model-loader): siglip 2 ONNX backend via ort (HD path)`

### V-6 WiredFront PixVix feature domain (Svelte)

- [ ] New `interfaces/desktop/src/lib/domains/app/wiredfront/feature/pixvix/`
  - [ ] `data-access/pixvix.state.svelte.ts` — runes state class; `listen('platform:pixvix-status')` drives it
  - [ ] `data-access/pixvix.svc.ts` — thin wrappers over Tauri commands, returns typed DTOs from generated bindings
  - [ ] `ui/PixVixSourcePicker.svelte` — monitor/window/webcam segmented tabs, lists each source with live dim/fps
  - [ ] `ui/PixVixCaptureCanvas.svelte` — canvas-backed live preview of latest frame; honors fluid clamp for sizing
  - [ ] `ui/PixVixRegionOverlay.svelte` — drag-to-select region overlay on top of the canvas
  - [ ] `ui/PixVixHotkeyBadge.svelte` — display configured hotkeys (capture-now, start/stop)
  - [ ] `util/pixvix.format.ts` — byte/dim/fps pretty-printers
  - [ ] `index.ts` — barrel re-exports every public surface
- [ ] All components use `renderForge` + `cssVarString` + `data-cl-*` per ColdLight ADR-001
- [ ] All sizing via `clampFluid` / `FLUID_SPACE` / `FLUID_SIZE` — no raw px outside tokens
- [ ] All tones via existing `--accent-*` / `--signal-*` — no raw oklch
- [ ] `pnpm svelte-check` + `biome check` green for new files
- [ ] Commit `feat(wiredfront): pixvix feature domain — source picker + live canvas + overlays`

### V-7 Vision consumer domain (Svelte)

- [ ] New `interfaces/desktop/src/lib/domains/app/vision/`
  - [ ] `data-access/vision.state.svelte.ts` — runes state; subscribes to `platform:vision-status`
  - [ ] `data-access/vision.svc.ts` — Tauri command wrappers (encode, session start/stop, metrics query, hd toggle, clyffy toggle)
  - [ ] `feature/VisionLiveOverlay.svelte` — overlay rendered on top of PixVix canvas showing encode dim, norm, latency, similarity-to-prev
  - [ ] `feature/VisionConfigPanel.svelte` — every `vision.*` knob, organized into Source / HD / Cadence / Governor / Sinks / Privacy / Clyffy sections
  - [ ] `feature/VisionMetricsPanel.svelte` — DuckDB-driven charts (latency p50/p95, governor throttle rate, sink health, similarity distribution)
  - [ ] `feature/VisionClyffyFeedback.svelte` — inline thread of Clyffy analyses with storage sink selector per message
  - [ ] `util/vision.format.ts` — vector/norm/latency formatters
  - [ ] `index.ts` — barrel
- [ ] Every panel uses ServiceDevtoolShell contracts (single-snippet body, no drift)
- [ ] Every chart uses ColdLight tokens only — `--accent-teal-main`, `--signal-warning`, etc.
- [ ] Commit `feat(vision): consumer domain — live overlay + config + metrics + clyffy feedback`

### V-8 Reauthor `/devtools/vision` page with extraTabs

- [ ] Edit `interfaces/desktop/src/routes/(devtools)/devtools/vision/+page.svelte`
- [ ] Keep the four standard tabs (Status / Config / Logs / Actions) — reuse Status baseline, expand Config with VisionConfigPanel, rewire Logs to `query_scoped_log('vision.')`, expand Actions with Start/Pause session buttons
- [ ] Add `extraTabs={['live', 'metrics', 'clyffy', 'pixvix']}` prop with matching `{#snippet extra(tabId)}` dispatcher
- [ ] **Live** tab → VisionLiveOverlay over PixVixCaptureCanvas, PixVixSourcePicker above, HD toggle + pause/resume
- [ ] **Metrics** tab → VisionMetricsPanel
- [ ] **Clyffy** tab → VisionClyffyFeedback
- [ ] **PixVix** tab → raw PixVix controls (device inventory, hotkey config, per-source test capture)
- [ ] Every tab body uses `FLUID_PADDING.standard-y/x` for consistent breathing room
- [ ] Every tab header uses ColdLight Badge/Text/Button — no custom elements
- [ ] Reflow hot path: Live tab must not re-render when unrelated state changes. Use `$derived` surgically.
- [ ] `pnpm svelte-check` + `biome check` green
- [ ] Commit `feat(devtools): reauthor /devtools/vision with 4 extra tabs (live, metrics, clyffy, pixvix)`

### V-9 Clyffy feedback pipeline

- [ ] New module `systems/devpulse-engine/src/vision/clyffy_feedback.rs` — reads captured frame + embedding, calls Clyffy facade with configurable prompt template, returns structured analysis
- [ ] Tauri commands: `submit_frame_to_clyffy(frame_id, prompt) -> ClyffyAnalysis`, `list_clyffy_feedback(session_id) -> Vec<ClyffyFeedbackEntry>`
- [ ] Storage: `clyffy_vision_feedback` libSQL table with explicit per-row sink choice (disk/libsql/both/discard)
- [ ] Preference: `vision.clyffy.feedback_enabled`, `vision.clyffy.feedback_prompt`, `vision.clyffy.storage_default`
- [ ] VisionClyffyFeedback component shows thread + allows reshoot-with-different-prompt
- [ ] Guard: only fires when `vision.clyffy.feedback_enabled = true` AND user clicks "Send to Clyffy" OR auto-send toggle is on
- [ ] Commit `feat(vision): clyffy feedback pipeline with user-directed storage`

### V-10 Demo recording (WebView2 MediaRecorder → WebM)

- [ ] New `domains/app/vision/feature/VisionRecordButton.svelte` — renderer-only
- [ ] Uses `canvas.captureStream()` on the live canvas → `MediaRecorder` → Blob → base64
- [ ] New Tauri command `save_demo_recording(bytes_b64, filename) -> String` writes to `.userdata/vision-recordings/`
- [ ] List + play-back endpoint: `list_demo_recordings() -> Vec<RecordingInfo>` and `open_demo_recording(id)` (shell out to default handler)
- [ ] Doc the Windows-only WebM / macOS MP4 caveat in a code comment
- [ ] Commit `feat(vision): demo recording via WebView2 MediaRecorder`

### V-11 Deferred upgrades (documented, not built this sprint)

- [ ] **True NaFlex**: export `google/siglip2-so400m-patch16-naflex` → ONNX via Optimum, host internally. Implement variable-resolution preproc + dynamic position-embedding interpolation. Own `SigLipNaflexBackend`.
- [ ] **Tile-based pseudo-HD**: for users without the ONNX runtime; split HD capture into 384² tiles, encode each, mean-pool. Pure SigLip 1.
- [ ] **Per-app exclusion list** (Screenpipe parity)
- [ ] **Event-driven cadence mode**: frame-diff-hash change detection replaces fixed interval
- [ ] **Pause when screen locked**: Windows `WTSWaitSystemEvent` / macOS CGSession API

---

## Sanity test (end-of-sprint validation, in order)

Run after V-10, before declaring sprint done. Every bullet must pass with a human eye on the devtool.

1. **Build sanity**
   - [ ] `cargo check -p devpulse-engine` — 0 errors, 0 warnings
   - [ ] `cargo check -p devpulse_desktop_backend` — 0 errors, 0 warnings
   - [ ] `cargo check -p devpulse-clyffy --features kernel` — 0 errors
   - [ ] `cargo test -p devpulse-engine --lib vision` — all green
   - [ ] `cargo test -p devpulse_desktop_backend --lib commands::pixvix` — all green
   - [ ] `cargo test -p devpulse_desktop_backend --lib commands::vision` — all green

2. **Specta bindings regen** (REQUIRED — sprint NOT done until this passes)
   - [ ] Build binary: `cargo build -p devpulse_desktop_backend --bin devpulse-desktop-app`
   - [ ] From `interfaces/desktop/src-tauri/`: `DEVPULSE_BINDINGS_EXPORT_ONLY=1 ../../../target/debug/devpulse-desktop-app.exe`
   - [ ] `interfaces/desktop/src/lib/sys/generated/bindings.ts` contains every new command: `listMonitors`, `listWebcams`, `listWindows`, `captureMonitorOnce`, `captureWindowOnce`, `captureWebcamOnce`, `startCaptureSession`, `stopCaptureSession`, `submitFrameToClyffy`, `listClyffyFeedback`, `saveDemoRecording`, `listDemoRecordings`, `openDemoRecording`
   - [ ] Every new DTO is present: `MonitorInfo`, `WindowInfo`, `WebcamInfo`, `CapturedFrame`, `CaptureSessionConfig`, `CaptureSessionStatus`, `FrameMetric`, `GovernorState`, `ClyffyAnalysis`, `ClyffyFeedbackEntry`, `RecordingInfo`
   - [ ] `git diff interfaces/desktop/src/lib/sys/generated/bindings.ts` shows additions only — no deletions (means no accidental command removal)

3. **Frontend typecheck**
   - [ ] `pnpm svelte-check --tsconfig ./tsconfig.json` — 0 errors, 0 warnings
   - [ ] `pnpm exec biome check interfaces/desktop/src/lib/domains/app/wiredfront/feature/pixvix` — clean
   - [ ] `pnpm exec biome check interfaces/desktop/src/lib/domains/app/vision` — clean
   - [ ] `pnpm exec biome check "interfaces/desktop/src/routes/(devtools)/devtools/vision/+page.svelte"` — clean

4. **IP-protection lint**
   - [ ] `lefthook run pre-commit` — no banned-term hits in any new file
   - [ ] No kernel vocabulary (HMM, BM25, RRF, qdrant, kv_cache, etc.) in `commands/pixvix/` or `domains/app/vision/` or `domains/app/wiredfront/feature/pixvix/`

5. **Runtime smoke (`cargo xtask run-dev`, F12 open)**
   - [ ] App boots in < 30s
   - [ ] Navigate to `/devtools/vision` — page loads, no console errors
   - [ ] Status tab shows vision.embedder slot
   - [ ] Load button → model loads, Badge flips to Ready
   - [ ] Config tab shows every knob; toggling `vision.hd.enabled` persists across reload
   - [ ] Logs tab auto-fetches with default prefix `vision.` — shows real log lines
   - [ ] Actions tab "Start session" button starts capture, Pause stops it
   - [ ] Live tab shows live frame updates at the configured cadence
   - [ ] HD toggle in Live tab swaps backend without crashing (observe target name change)
   - [ ] Source picker swaps monitor → webcam → window smoothly
   - [ ] Region overlay drags, selection reflects in capture on next tick
   - [ ] Metrics tab populates after ~30s of session runtime
   - [ ] Clyffy tab → "Send latest frame to Clyffy" produces an analysis (or clean error if Clyffy not wired yet)
   - [ ] PixVix tab shows monitor/window/webcam inventory matching the OS
   - [ ] Record button creates a `.webm` in `.userdata/vision-recordings/`
   - [ ] Governor tab / overlay shows throttle state during a high-CPU stress test

6. **CPU + graceful coexistence check**
   - [ ] Start vision session at 1s cadence
   - [ ] Observe other services on event bridge — RRO snapshots, model-loader status, chat interactions — still emit without stalling
   - [ ] Launch Claude devtool side-by-side; ensure both pages receive their respective `platform:*-status` events
   - [ ] Artificial CPU load (`stress-ng --cpu 4` or equivalent) → governor pauses capture, resumes when CPU drops
   - [ ] Launch model loader, unload something → vision session pauses frames briefly (model loader priority)

7. **Storage sink contract**
   - [ ] Pick `disk + libsql + duckdb` (default composite) → files appear in `.userdata/vision-frames/`, rows appear in `vision_frames`, DuckDB table populates
   - [ ] Switch to `discard` → no writes anywhere, session still emits status updates
   - [ ] Switch to `libsql only` → no disk PNGs written, libSQL row points at in-DB BLOB
   - [ ] Retention worker prunes after set cutoff
   - [ ] Per-sink failure isolation: corrupt the disk dir mid-session — libsql + duckdb keep writing, disk sink reports degraded health in status

8. **Specta cleanup notes (final)**
   - [ ] Confirm no orphaned bindings: grep `bindings.ts` for any command name we removed (there should be none)
   - [ ] Confirm every new command has a matching frontend caller — unused bindings are dead code
   - [ ] Add a short note to `scripts/docs/sprints/SPRINT-VISION-PIXVIX-FOUNDATION-COMPLETE.md` summarizing: final LOC, commit shas, deferred items → V-11

---

## Sprint exit criteria

All checkboxes above marked ✅ **and** a screen recording (V-10's own output) showing the full flow from source pick → capture → encode → Clyffy feedback → stop → metrics review. If the sprint produces its own demo artifact, we know the devtool works end-to-end.
