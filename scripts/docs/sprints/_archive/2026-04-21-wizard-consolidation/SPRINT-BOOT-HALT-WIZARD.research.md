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

# Research: Boot-Halt Wizard — Full Technical Architecture

**Date**: 2026-04-01
**Sprint**: SPRINT-BOOT-HALT-WIZARD
**Status**: COMPLETE

## SSOT Map

### Boot Lifecycle (Rust → Tauri → SvelteKit)

| Layer | SSOT | What It Controls |
|-------|------|-----------------|
| Window visibility | `src-tauri/tauri.conf.json` `visible: false` | Main window hidden at launch |
| Boot orchestration | `src-tauri/src/lib.rs` `boot_task()` | Services init, window.show(), chat window |
| Service pipeline | `engine/platform/boot/mod.rs` `execute_inner()` | 14 stages, strict sequential, timeout guard |
| Model loader boot | `engine/platform/boot/model_loader.rs` | Stage 12: scan, register slots, restore |
| Boot state (Rust) | `src-tauri/src/state.rs` `BootStateTracker` | Accumulates InitEvents for snapshot |
| Boot state (TS) | `sys/runes/platformState.svelte.ts` | `phase`, `subsystems`, `isReady`, `progress` |
| Boot overlay | `layouts/app/BootOverlay.svelte` | z-[9999], fades when `isReady` |
| Model state | `domains/app/models/runes/models.runes.svelte.ts` | `firstRun`, `models[]`, `slots[]` |
| Narration (Rust) | `engine/platform/integrations/narration.rs` | LoaderEvent → layman/advanced text |
| Narration (UI) | `domains/app/models/components/ClyffyNarration.svelte` | Bubble with emoji |

### Exact Boot Sequence (verified on disk)

```
EXE LAUNCH
  │
  ├─ Tauri Builder: main window created HIDDEN
  │
  ├─ setup(): manage PlatformState + BootStateTracker
  │
  ├─ DEV MODE: block_on(boot_task) ← BLOCKING
  │  RELEASE MODE: spawn(boot_task) ← ASYNC
  │
  └─ boot_task():
       │
       ├─ emit "platform:boot-phase" { phase: "initializing" }
       │
       ├─ Platform::boot(data_dir, on_event_callback)
       │    │
       │    └─ execute_inner() with timeout guard:
       │         Stage  1: preflight (dirs)
       │         Stage  2: system relational (LibSQL) ← CRITICAL
       │         Stage  3: system analytics (DuckDB)
       │         Stage  4: graph store (SurrealDB × 3) ← CRITICAL
       │         Stage  5: system cache (Moka)
       │         Stage  6: user relational (LibSQL)
       │         Stage  7: vector store (RRO) [feature-gated]
       │         Stage  8: voice service (Kokoros) [feature-gated]
       │         Stage  9: grammar (skipped)
       │         Stage 10: embedder (Candle) [feature-gated]
       │         Stage 11: whisper ASR (Candle) [feature-gated]
       │         Stage 12: MODEL LOADER [feature-gated]
       │              ├─ spawn_blocking: sync GGUF scan
       │              ├─ register 8 default slots
       │              ├─ restore saved assignments
       │              └─ scan models dir → Vec<ModelRegistryEntry>
       │         Stage 13: DevForge (VSCode)
       │         Stage 14: validate critical services
       │
       ├─ tracker.set_ready(health)
       ├─ state.platform = Some(Arc::new(platform)) ← UNLOCKS COMMANDS
       ├─ emit "platform:boot-phase" { phase: "ready" }
       │
       ├─ window.show() ← MAIN WINDOW BECOMES VISIBLE
       ├─ window.set_focus()
       │
       └─ open_chat_window() ← SECONDARY WINDOW
```

### Frontend Boot Sequence (verified on disk)

```
WINDOW VISIBLE (Tauri shows main window)
  │
  ├─ app.html: SPA shell loads
  │
  ├─ Root +layout.svelte mounts:
  │    ├─ installGlobalHandlers()
  │    ├─ platformState.init() [async, NOT awaited]
  │    ├─ <SvgFilters />
  │    ├─ <BootOverlay /> ← FULL SCREEN, z-[9999]
  │    ├─ <TokenDebugOverlay />
  │    └─ {@render children()} ← routes render IN PARALLEL
  │
  ├─ Root +page.ts: redirect(302, "/devpulse")
  │
  ├─ (app)/+layout.svelte: <Frame>{@render children()}</Frame>
  │    ├─ TopBar
  │    ├─ Sidebar
  │    ├─ Content slot (page renders here)
  │    ├─ Context slot (collapsed)
  │    └─ StatusBar
  │
  ├─ platformState.init():
  │    1. Poll window.__TAURI_INTERNALS__ (100ms intervals, 30s timeout)
  │    2. invoke("get_boot_state") → BootSnapshot
  │    3. Apply snapshot (replay accumulated events)
  │    4. Register live listeners:
  │       - "platform:subsystem-status" → applyEvent()
  │       - "platform:boot-phase" → applyPhaseTransition()
  │
  ├─ platformState.phase transitions to "ready"
  │    → platformState.isReady = true
  │
  └─ BootOverlay $effect:
       if (isReady && !fading) {
         fading = true
         setTimeout(() => visible = false, 600)
       }
       → OVERLAY FADES → APP INTERACTIVE
```

### Current Problems

1. **No model readiness gate.** BootOverlay fades on `platformState.isReady` which means "platform services booted" — NOT "models are loaded and assigned." A user with no models sees the full app with empty slots.

2. **SetupWizard buried in OverMind.** It's a widget inside `(app)/overmind/+page.svelte`. User must navigate there. A layman won't find it.

3. **Chat window opens regardless.** `open_chat_window()` fires in `boot_task()` after platform ready. If no models → chat has no brain.

4. **No content system.** All narration is inline Rust strings or hardcoded Svelte text. No JSON content file, no API, no rotating knowledge drops.

5. **Sprite system exists but is disconnected.** MinionOverlay, SpriteAnimator, overlay.runes all exist. Not wired to wizard or download progress.

## Architectural Decision

### Approach: Extend BootOverlay with a Model Setup Phase

**Why BootOverlay (not a new route or modal):**
- Already `fixed inset-0 z-[9999]` — blocks everything
- Already has phase transition logic
- Already integrated into root layout (renders for ALL routes)
- No route navigation needed (layman doesn't need to "go" anywhere)
- Tauri best practice: "responsive UI with progress, not frozen startup"

**The transition:**
```
BootOverlay Phase 1: "booting"
  → Current behavior: subsystem progress, badges, progress bar
  → Fade trigger: platformState.phase === "ready"

BootOverlay Phase 2: "model_setup" (NEW)
  → Triggers when: platform ready BUT models not ready
  → Shows: full-screen wizard (hardware detect → recommend → download → verify)
  → Fade trigger: models downloaded, assigned, and verified

BootOverlay Phase 3: "ready"
  → Both platform AND models ready
  → 600ms fade → unmount → app interactive
```

### Approach: Rust-Side Model Readiness Signal

After `Platform::boot()` succeeds, `boot_task()` should:
1. Check if model loader has models
2. Emit `"platform:models-status"` with `{ ready, firstRun, modelCount, assignedCount }`
3. Frontend `platformState` receives this and sets `modelsReady`
4. BootOverlay uses `platformState.isFullyReady` (platform + models)

### Approach: Content from Bundled JSON + API Fallback

```
1. Try: fetch from devpulse.app/api/wizard-content (if online)
2. Fallback: load from /static/content/wizard-content.json (bundled)
3. Cache in memory for session
```

Content includes: Clyffy greetings, knowledge drops, download messages, error translations.

### Approach: Minion Sprites as Progress Visualization

The MinionOverlay + SpriteAnimator already exist with:
- CSS steps() keyframe animation
- Sprite sheet support (WebP, 32×32 frames)
- 8 minion characters with 4 states (idle, walking, working, escalated)
- Random spawn positions
- Flip direction support

During download: activate 3-5 minions, have them walk left→right as progress advances.
When a model finishes: sprites play "working" → "idle" celebration.
Smoke puff effects trail behind.

Owner provides real sprite sheets. Emoji fallback exists.

## Anti-Pattern Risks

| Risk | Why Bad | Prevention |
|------|---------|------------|
| Creating a second blocking overlay | Two z-9999 layers = confused focus, double blocking | Extend BootOverlay only |
| Polling for model readiness | Wasteful, laggy, race conditions | Event-driven: Rust emits, TS listens |
| Hardcoding wizard content in components | Can't update, can't localize, messy | JSON content file + service |
| Making wizard dismissible on first run | User escapes setup, app broken | No dismiss button during first run |
| Loading models during boot | Blocks boot, slow startup | Scan only at boot; download/load in wizard |
| Opening chat window before models ready | Chat has no brain, confusing | Gate chat window on model readiness |

## Files Referenced

| File | Role |
|------|------|
| `src-tauri/src/lib.rs` | Boot orchestration, window.show(), chat window |
| `src-tauri/src/state.rs` | PlatformState, BootStateTracker |
| `src-tauri/tauri.conf.json` | Window config (visible: false) |
| `engine/platform/boot/mod.rs` | 14-stage service pipeline |
| `engine/platform/boot/model_loader.rs` | Model loader boot stage |
| `engine/platform/mod.rs` | Platform struct, health, shutdown |
| `engine/platform/integrations/narration.rs` | Event → layman text |
| `routes/+layout.svelte` | Root layout, mounts BootOverlay |
| `routes/+page.ts` | Root redirect to /devpulse |
| `routes/(app)/+layout.svelte` | App shell with Frame |
| `sys/runes/platformState.svelte.ts` | Boot state machine |
| `layouts/app/BootOverlay.svelte` | Full-screen boot gate |
| `layouts/app/Frame.svelte` | 6-zone app shell |
| `layouts/app/StatusBar.svelte` | Boot progress / health display |
| `domains/app/models/runes/models.runes.svelte.ts` | Model state |
| `domains/app/models/components/SetupWizard.svelte` | Existing wizard |
| `domains/app/models/components/ClyffyNarration.svelte` | Narration bubble |
| `design/overlays/MinionOverlay.svelte` | Sprite overlay system |
| `design/overlays/SpriteAnimator.svelte` | CSS sprite animation |
| `design/overlays/types.ts` | Sprite config types |
| `domains/app/minions/runes/overlay.runes.svelte.ts` | Minion state machine |
