# SPRINT: Boot-Halt Wizard — Full-Screen First-Run Experience

**Date**: 2026-04-01
**Status**: PLAN — Owner approval required before execution
**Research**: `SPRINT-BOOT-HALT-WIZARD.research.md`
**Depends on**: `feat(clyffy): wire model-loader` (9747e69e)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                   BootOverlay                        │
│                  (z-[9999])                          │
│                                                     │
│  Phase 1: BOOTING                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Subsystem progress bars (current behavior)   │  │
│  │  "Starting LibSQL... Starting SurrealDB..."   │  │
│  └───────────────────────────────────────────────┘  │
│                     ↓ platform ready                 │
│  Phase 2: MODEL SETUP (only if no models)            │
│  ┌───────────��───────────────────────────────────┐  │
│  │  BootSetupWizard (full-screen, 6 steps)       │  ��
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  ��  Step 1: Welcome (Clyffy greeting)      │  │  │
│  │  │  Step 2: Hardware Scan                  │  │  │
│  │  │  Step 3: Recommendations                │  │  │
│  │  │  Step 4: Downloading (minion sprites)   │  │  │
│  │  │  Step 5: Verifying (load + test)        │  │  │
│  │  │  Step 6: Ready (celebration)            │  │  │
│  │  └─────────────────────────────────────────┘  │  │
���  └──────��────────────────────────────────────────┘  │
│                     ��� models ready                   │
│  Phase 3: FADE OUT → app interactive                 │
└───────────��─────────────────────���───────────────────┘
```

**Three-layer gate:**
1. Tauri: window hidden until `boot_task()` completes (existing)
2. BootOverlay: blocks UI until `platformState.isReady` (existing)
3. BootOverlay: blocks UI until `platformState.modelsReady` (NEW)

---

## PHASE 1: RUST — Model Readiness Signal

**Goal**: After boot, Rust tells the frontend whether models are ready.

### Task 1.1: Emit Model Status After Boot

**File**: `src-tauri/src/lib.rs` (in `boot_task()`, after platform ready)

After `state.platform = Some(Arc::new(platform))`, query the model loader:

```rust
// Check model readiness
let model_status = {
    let guard = state.platform.read().await;
    if let Some(ref p) = *guard {
        if let Some(loader) = p.model_loader() {
            let models = loader.get_registry().await;
            let slots = loader.list_slots().await;
            let first_run = loader.is_first_run().await;
            let assigned = slots.iter()
                .filter(|s| s.assigned_model.is_some())
                .count();
            serde_json::json!({
                "ready": !models.is_empty() && assigned > 0,
                "firstRun": first_run,
                "modelCount": models.len(),
                "slotCount": slots.len(),
                "assignedCount": assigned,
            })
        } else {
            serde_json::json!({
                "ready": false,
                "firstRun": true,
                "modelCount": 0,
                "slotCount": 0,
                "assignedCount": 0,
            })
        }
    } else {
        serde_json::json!({ "ready": false, "firstRun": true })
    }
};

app.emit("platform:models-status", &model_status);
```

### Task 1.2: Gate Chat Window on Model Readiness

**File**: `src-tauri/src/lib.rs`

Move `open_chat_window()` — only call when models are ready:

```rust
if model_status["ready"].as_bool().unwrap_or(false) {
    open_chat_window(app.clone()).await;
}
```

If not ready, the BootSetupWizard handles it. Chat window opens after
wizard completes (frontend emits event → Rust opens window).

### Task 1.3: Add Tauri Command — Complete Model Setup

**File**: `src-tauri/src/commands/models/mod.rs`

New command called when wizard finishes:

```rust
#[tauri::command]
#[specta::specta]
pub async fn complete_model_setup(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    // Verify models are actually loaded
    let loader = get_loader(&state).await?;
    let models = loader.get_registry().await;
    if models.is_empty() {
        return Err("No models available".into());
    }

    // Emit ready signal
    app.emit("platform:models-status", serde_json::json!({
        "ready": true,
        "modelCount": models.len(),
    })).map_err(|e| e.to_string())?;

    // Now open chat window
    commands::window::open_chat_window(app).await
        .map_err(|e| e.to_string())
}
```

### GATE: Rust emits model status. Chat window gated. Setup completion command exists.

---

## PHASE 2: FRONTEND STATE — Model Readiness in Platform State

**Goal**: `platformState` tracks model readiness alongside boot readiness.

### Task 2.1: Extend PlatformState Rune

**File**: `sys/runes/platformState.svelte.ts`

Add new state:

```ts
// Model readiness (separate from platform boot)
modelsReady = $state(false);
modelsFirstRun = $state(true);
modelCount = $state(0);
assignedCount = $state(0);

// Combined readiness gate
get isFullyReady(): boolean {
    return this.phase === "ready" && this.modelsReady;
}

// Whether wizard should show
get needsModelSetup(): boolean {
    return this.phase === "ready" && !this.modelsReady;
}
```

In `init()`, register listener for `"platform:models-status"`:

```ts
const unlistenModels = await listen("platform:models-status", (e) => {
    const payload = e.payload as ModelStatusPayload;
    this.modelsReady = payload.ready;
    this.modelsFirstRun = payload.firstRun;
    this.modelCount = payload.modelCount;
    this.assignedCount = payload.assignedCount;
});
```

### Task 2.2: Update BootOverlay Gate

**File**: `layouts/app/BootOverlay.svelte`

Change the fade trigger from `isReady` to `isFullyReady`:

```svelte
$effect(() => {
    if (platformState.isFullyReady && !fading) {
        fading = true;
        setTimeout(() => { visible = false; }, 600);
    }
});
```

Add wizard phase detection:

```svelte
const showWizard = $derived(platformState.needsModelSetup);
```

In the template, after the boot progress section:

```svelte
{#if showWizard}
    <BootSetupWizard onComplete={handleWizardComplete} />
{/if}
```

The `handleWizardComplete` callback calls `invoke("complete_model_setup")`.

### GATE: BootOverlay holds until models ready. Wizard shows in overlay when needed.

---

## PHASE 3: BOOT SETUP WIZARD — Full-Screen Layman Experience

**Goal**: 6-step wizard inside BootOverlay. Zero jargon. Clyffy narrates.

### Task 3.1: Create Wizard Content JSON

**File**: `interfaces/desktop/static/content/wizard-content.json` (NEW)

Bundled content file. Structure:

```json
{
    "version": 1,
    "welcome": {
        "greeting": "Hi! I'm Clyffy, your AI assistant.",
        "subtitle": "I'll set up your AI tools — no coding needed.",
        "cta": "Let's Go"
    },
    "scanning": {
        "title": "Checking your computer...",
        "messages": [
            "Looking at your hardware...",
            "Checking GPU memory...",
            "Figuring out the best setup for you..."
        ],
        "results": {
            "gpuFound": "Nice! You have a {gpuName} with {vramGb} GB of GPU memory.",
            "noGpu": "No dedicated GPU — that's fine! We'll use your CPU instead.",
            "tierHigh": "That's a powerful setup! You can run the big models.",
            "tierMedium": "Good setup! Mid-range models will run great.",
            "tierLow": "Entry-level GPU — smaller models will work well.",
            "tierCpu": "CPU mode — slower but everything works. No worries."
        }
    },
    "recommendations": {
        "title": "Here's what I recommend",
        "subtitle": "These AI models are tailored for your hardware.",
        "slotLabels": {
            "chat.brain": { "name": "AI Brain", "desc": "The main AI that thinks and talks" },
            "minion.shared": { "name": "Quick Worker", "desc": "Fast helper for background tasks" },
            "rag.embedder": { "name": "Search Engine", "desc": "Finds relevant code and docs" }
        },
        "fitLabels": {
            "green": "Easy fit",
            "yellow": "Tight fit — might be slow",
            "red": "Too big for your hardware",
            "gray": "Will run on CPU"
        },
        "cta": "Set Me Up",
        "manual": "I'll configure manually"
    },
    "downloading": {
        "title": "Getting your AI ready...",
        "subtitle": "This is a one-time download.",
        "etaFormat": "About {minutes} minutes left",
        "messages": [
            "Pulling AI models from the cloud...",
            "Once downloaded, everything runs on your machine.",
            "Your data never leaves your computer.",
            "Almost there — setting up the final pieces..."
        ]
    },
    "knowledgeDrops": [
        {
            "title": "Did you know?",
            "body": "AI models are like specialized brains. Each one is trained for a specific job."
        },
        {
            "title": "Privacy first",
            "body": "Your code and conversations stay on YOUR computer. Nothing goes to the cloud."
        },
        {
            "title": "How it works",
            "body": "The AI runs right on your machine using your GPU — that's why it's so fast."
        },
        {
            "title": "Fun fact",
            "body": "The AI brain has billions of connections — more than stars you can see with your eyes."
        },
        {
            "title": "Hot swap",
            "body": "You can change AI models anytime. Just open Model Control and swap."
        },
        {
            "title": "Local power",
            "body": "No internet needed after setup. Your AI works offline, on a plane, anywhere."
        }
    ],
    "verifying": {
        "title": "Almost there!",
        "subtitle": "Testing your AI to make sure everything works...",
        "slotVerifying": "Testing {slotName}...",
        "slotReady": "{slotName} is online!"
    },
    "ready": {
        "title": "You're all set!",
        "subtitle": "Your AI is online and ready to help.",
        "cta": "Start Using DevPulse"
    },
    "errors": {
        "downloadFailed": "Download didn't work. Check your internet and try again.",
        "vramInsufficient": "Not enough GPU memory. Try a smaller model.",
        "diskFull": "Your drive is full. Free up some space and try again.",
        "modelCorrupt": "This file is damaged. I'll try to re-download it.",
        "noGpuDriver": "No GPU driver found. We'll use CPU mode — slower but works.",
        "networkTimeout": "Connection timed out. Want to try again?"
    }
}
```

### Task 3.2: Create Content Service

**File**: `domains/app/models/services/content.service.ts` (NEW)

```ts
export interface WizardContent { /* matches JSON structure */ }

let cached: WizardContent | null = null;

export async function loadWizardContent(): Promise<WizardContent> {
    if (cached) return cached;

    // Try devpulse.app API first (fresh content when online)
    try {
        const res = await fetch("https://devpulse.app/api/v1/wizard-content");
        if (res.ok) {
            cached = await res.json();
            return cached;
        }
    } catch {
        // Offline — fall through to bundled
    }

    // Fall back to bundled JSON
    const res = await fetch("/content/wizard-content.json");
    cached = await res.json();
    return cached;
}
```

### Task 3.3: Create BootSetupWizard Component

**File**: `domains/app/models/components/BootSetupWizard.svelte` (NEW)

Full-viewport wizard with 6 steps. Props:

```ts
interface Props {
    onComplete: () => void;
}
```

Each step is a discrete section with smooth crossfade transitions.
Content loaded from `wizard-content.json` via content service.
Hardware detection via `hardwareState`.
Recommendations via `auto_configure()` Tauri command.
Downloads via `downloadModel()` with real progress events.
Verification via `load_slot()` per assigned slot.

Uses ColdLight: `renderForge()`, `cssVarString()`, Tailwind layout.
Uses existing components: `VramGauge`, `ClyffyNarration`, `Badge`, `Text`, `Progress`.

### Task 3.4: Create KnowledgeDropCard Component

**File**: `domains/app/models/components/KnowledgeDropCard.svelte` (NEW)

Rotating card during download phase:
- Fades in/out every 8-10 seconds
- Pulls from `knowledgeDrops[]` array
- Larger than ClyffyNarration — centered, prominent
- Styled with `renderForge({ kind: "knowledge-drop", preset: "info" })`

### Task 3.5: Embed in BootOverlay

**File**: `layouts/app/BootOverlay.svelte`

After the boot progress section, conditionally render wizard:

```svelte
{#if platformState.needsModelSetup}
    <!-- Smooth transition from boot progress to wizard -->
    <div class="..." transition:fade={{ duration: 400 }}>
        <BootSetupWizard onComplete={handleWizardComplete} />
    </div>
{/if}
```

### GATE: Full wizard renders in BootOverlay. Content from JSON. 6 steps complete.

---

## PHASE 4: FUN PROGRESS — Minion Sprites During Download

**Goal**: Download phase has visual entertainment, not just a progress bar.

### Task 4.1: Create MinionProgressScene Component

**File**: `domains/app/models/components/MinionProgressScene.svelte` (NEW)

Self-contained scene rendered below wizard content during download:
- 150px tall strip at bottom of wizard
- Uses existing `SpriteAnimator` from `design/overlays/`
- 3-5 minion sprites walking left → right
- Movement speed tied to download progress (0% = left edge, 100% = right edge)
- When a model finishes downloading: nearest sprite plays celebration
- Smoke puff CSS animation trails behind sprites
- Emoji fallback if no sprite sheets loaded

### Task 4.2: Wire MinionOverlayState to Download Events

**File**: `domains/app/minions/runes/overlay.runes.svelte.ts`

Add methods:
- `activateForDownload(count: number)` — spawn N minions at left edge
- `setDownloadProgress(pct: number)` — update positions proportionally
- `celebrateSlot(index: number)` — trigger celebration for specific minion
- `deactivateAll()` — clear when download complete

### Task 4.3: Asset Manifest Contract

**File**: `domains/app/models/types/wizard-assets.ts` (NEW)

Define what owner-provided art looks like:

```ts
export interface WizardAssetManifest {
    clyffyAvatar: string;
    minionSprites: Record<string, {
        idle: string;
        walking: string;
        working: string;
        celebrating: string;
    }>;
    backgrounds: Record<string, string>;
    effects: {
        smoke: string;
        confetti: string;
        sparkle: string;
    };
}

// Default manifest — emoji fallback
export const DEFAULT_ASSETS: WizardAssetManifest = {
    clyffyAvatar: "",  // empty = use emoji 🤖
    minionSprites: {},  // empty = use emoji fallback
    backgrounds: {},
    effects: { smoke: "", confetti: "", sparkle: "" },
};
```

Load from `/static/assets/wizard-manifest.json` if exists, else use defaults.

### GATE: Minions animate during download. Asset contract defined. Emoji fallback works.

---

## PHASE 5: HOT-SWAP — Safe Runtime Model Change

**Goal**: User can change models anytime without crashing anything.

### Task 5.1: Add "Model Control" Button to TopBar or Sidebar

**File**: `layouts/app/TopBar.svelte` or `layouts/app/Sidebar.svelte`

Add a visible entry point. When no models are loaded, it pulses/glows.

### Task 5.2: Create ModelControlDialog Component

**File**: `domains/app/models/components/ModelControlDialog.svelte` (NEW)

Uses ColdLight `Dialog` component. Shows:
- Current model per slot (friendly names)
- Status badges (loaded / not loaded / loading)
- "Swap" button per slot
- Hardware gauge
- "Search HuggingFace" inline (existing ModelSearch)

### Task 5.3: Safe Halt-and-Swap Command

**File**: `src-tauri/src/commands/models/mod.rs`

```rust
#[tauri::command]
#[specta::specta]
pub async fn halt_and_swap(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
    new_model_id: String,
) -> Result<(), String>
```

Sequence: emit "swapping" → unload → assign → load → verify → emit "complete".
Frontend shows SwapOverlay during the operation.

### Task 5.4: SwapOverlay Component

**File**: `domains/app/models/components/SwapOverlay.svelte` (NEW)

Semi-transparent overlay (not full blocking). Shows:
- "Swapping AI model... one moment"
- Clyffy narration: "I'm switching brains — be right back!"
- Spinner/progress
- Auto-dismisses on "model:swap-complete" event

### GATE: User can swap models at runtime. Safe halt. No crashes. Clear UX.

---

## PHASE 6: ERROR HANDLING — Zero Silent Failures

**Goal**: Every operation has try/catch. Every failure is logged. Every error
has a layman explanation via Clyffy.

### Task 6.1: Create Layman Error Map

**File**: `domains/app/models/types/error-messages.ts` (NEW)

Maps Rust error strings to layman text. Used by all model components.

### Task 6.2: Audit Frontend Service Layer

Every function in `services/*.ts` must:
- Wrap in try/catch
- Log via `logError()` with specific context
- Throw with descriptive message (not generic)
- Never silently return default values on error

### Task 6.3: Audit Tauri Commands

Every command in `src-tauri/src/commands/models/mod.rs` must:
- Log entry to model-loader.log (via tracing)
- Log result (success with data, or error with context)
- Return specific error strings (not "Something went wrong")
- Handle the case where model loader service is None gracefully

### Task 6.4: Wire Errors to ClyffyNarration

When any model operation fails, the error message should:
1. Look up in layman error map
2. Show via ClyffyNarration with type="error"
3. Include recovery action if available (retry, try smaller model, etc.)

### GATE: Zero silent failures anywhere in the model-loader domain.

---

## File Manifest

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `static/content/wizard-content.json` | 3 | Bundled Clyffy content |
| `services/content.service.ts` | 3 | Content loading (JSON + API) |
| `components/BootSetupWizard.svelte` | 3 | Full-screen first-run wizard |
| `components/KnowledgeDropCard.svelte` | 3 | Rotating knowledge cards |
| `components/MinionProgressScene.svelte` | 4 | Fun download animation |
| `types/wizard-assets.ts` | 4 | Asset manifest contract |
| `components/ModelControlDialog.svelte` | 5 | Runtime model swap UI |
| `components/SwapOverlay.svelte` | 5 | Overlay during hot-swap |
| `types/error-messages.ts` | 6 | Layman error text mapping |

### Modified Files
| File | Phase | Change |
|------|-------|--------|
| `src-tauri/src/lib.rs` | 1 | Emit models-status, gate chat window |
| `src-tauri/src/commands/models/mod.rs` | 1, 5 | complete_model_setup, halt_and_swap |
| `src-tauri/src/lib.rs` specta builder | 1, 5 | Register new commands |
| `sys/runes/platformState.svelte.ts` | 2 | modelsReady, isFullyReady, needsModelSetup |
| `layouts/app/BootOverlay.svelte` | 2, 3 | Model gate, wizard phase |
| `domains/app/minions/runes/overlay.runes.svelte.ts` | 4 | Download progress methods |
| `layouts/app/TopBar.svelte` or `Sidebar.svelte` | 5 | Model Control button |
| `services/*.ts` (all) | 6 | Try/catch audit |
| `src-tauri/src/commands/models/mod.rs` | 6 | Logging audit |
