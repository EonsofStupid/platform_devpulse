# SPRINT: Cloud Clyffy + No-Code Onboarding + DevHub Overlay

**Date**: 2026-04-01
**Status**: PLAN — Owner approval required before execution
**Depends on**: Model Loader wired (SPRINT-MODEL-LOADER-REAL), Boot Wizard (committed)

---

## WHAT THIS SPRINT DOES

1. **Cloud Clyffy** — API-powered Clyffy on devpulse.app as fallback until local LLM loads
2. **No-code onboarding** — guided setup that requires zero technical knowledge
3. **Interaction library** — tooltips, callouts, assistance overlays powered by Clyffy
4. **DevHub overlay** — keyboard-shortcut-triggered dev tools panel

---

## PHASE 1: CLOUD CLYFFY — API FALLBACK

**Goal**: Clyffy is always available. Before a local model loads, Clyffy runs through devpulse.app API. After local model loads, Clyffy switches to local inference. User never notices the switch.

### 1.1 Architecture

```
User opens DevPulse (first time, no models)
    │
    ▼
Clyffy checks: is local model loaded?
    │
    ├── YES → route to local inference (model-loader InferenceHandle)
    │
    └── NO → route to devpulse.app Cloud API
              │
              ▼
         HTTPS POST devpulse.app/api/clyffy/chat
         Body: { prompt, context, session_id }
         Auth: embedded app key (not user's key)
         Response: streamed tokens
              │
              ▼
         Same UI. Same streaming. User sees no difference.
```

### 1.2 Cloud API Service

**File**: `interfaces/desktop/src/lib/domains/clyffy/services/cloud.service.ts`

```typescript
const CLOUD_ENDPOINT = "https://devpulse.app/api/clyffy/chat";

export async function cloudChat(
    prompt: string,
    context: ClyffyContext,
    onToken: (token: string) => void,
): Promise<string> {
    // Streaming fetch to devpulse.app
    // Uses embedded app API key (not user's personal key)
    // Falls back to bundled responses if network unavailable
}
```

### 1.3 Clyffy Router

**File**: `interfaces/desktop/src/lib/domains/clyffy/services/router.service.ts`

```typescript
export async function clyffyChat(
    prompt: string,
    context: ClyffyContext,
    onToken: (token: string) => void,
): Promise<string> {
    // Check if local model is loaded via model-loader slot status
    const brainLoaded = await isSlotLoaded("chat.brain");

    if (brainLoaded) {
        return localChat(prompt, context, onToken);
    }

    return cloudChat(prompt, context, onToken);
}
```

### 1.4 Supabase Backend on devpulse.app

Backend already exists on Supabase — needs the Clyffy chat endpoint finished.

**Supabase Edge Function**: `supabase/functions/clyffy-chat/index.ts`

```typescript
// Receives: { prompt, context, session_id }
// Calls Anthropic API with DevPulse system prompt
// Streams response back
// Rate-limited per device fingerprint
```

**Embedded App Key**: NOT a user API key. Platform key embedded at build time.

- Stored via env var `DEVPULSE_CLOUD_KEY` → compiled into binary
- Rate-limited per install (device fingerprint in request header)
- Only used for Clyffy interactions (tooltips, onboarding, assistance)
- NOT for general LLM access — just the guided experience
- Revocable server-side via Supabase dashboard

**File**: `systems/devpulse-engine/platform.default.toml`

```toml
[services.system.clyffy_cloud]
enabled = true
endpoint = "https://devpulse.app/functions/v1/clyffy-chat"
# Key injected at build time via env var DEVPULSE_CLOUD_KEY
```

### 1.5 Bundled Offline Fallback

When both local model AND cloud are unavailable (no internet, no models):

**File**: `interfaces/desktop/static/clyffy/bundled-responses.json`

Pre-authored responses for common interactions:
- Onboarding greetings
- Model download guidance
- Error recovery suggestions
- "I'm offline right now" messages
- Tooltip content for all UI elements

Clyffy reads from this JSON when network is down. Not AI-generated — hand-authored, cached locally, always available.

### GATE: Clyffy responds in chat/tooltips whether local model is loaded or not.

---

## PHASE 2: NO-CODE ONBOARDING — HARDWARE-BASED LLM SELECTION

**Goal**: User opens DevPulse. Hardware is scanned. Compatible LLMs are shown. User picks. Downloads happen. Voice (Kokoros TTS + Whisper STT) enabled automatically. Done.

No intention picker. No categories. Just: "here's what fits your machine, pick one."

### 2.1 Onboarding Flow

```
App launches (first run detected)
    │
    ▼
Step 1: WELCOME
    Clyffy (cloud): "Hey! I'm Clyffy. Let me check your hardware
                     and find the best AI models for your machine."
    │
    ▼
Step 2: HARDWARE SCAN (automatic, no user action)
    → Detect GPU (NVML), VRAM, RAM, CPU
    → Clyffy: "You've got a RTX 3070 with 8GB — nice."
    │
    ▼
Step 3: MODEL SELECTION (the main screen)
    Show all compatible LLMs with color-coded fit:

    ┌─ Pick your AI brain ───────────────────────────┐
    │                                                 │
    │  ● Llama 3.1 8B Q4_K_M         [5.2 GB]  ✓    │
    │    Fast, great for code. Fits easily.           │
    │                                                 │
    │  ● Phi-4 Mini 3.8B Q6_K        [3.1 GB]  ✓    │
    │    Compact but smart. Lots of headroom.         │
    │                                                 │
    │  ● Qwen3 4B Q4_K_M             [2.6 GB]  ✓    │
    │    Multilingual. Good all-rounder.              │
    │                                                 │
    │  ○ Llama 3.1 70B Q4_K_M        [42 GB]   ✗    │
    │    Too big for your GPU.                        │
    │                                                 │
    │  Also downloading:                              │
    │  • Whisper Small (STT)          [0.5 GB]        │
    │  • Kokoro v1.0 (TTS)           [0.3 GB]        │
    │  • nomic-embed-v1.5 (search)   [0.3 GB]        │
    │                                                 │
    │            [Set Me Up]                          │
    └─────────────────────────────────────────────────┘

    User selects ONE brain model. Supporting models
    (Whisper, Kokoro, embedder) are always included
    automatically — not optional.

    │
    ▼
Step 4: DOWNLOAD + SETUP
    → Downloads selected brain + Whisper + Kokoro + embedder
    → Clyffy narrates via cloud (local not ready yet)
    → Progress bar per model
    → Auto-assigns to slots on completion
    → Auto-loads brain
    │
    ▼
Step 5: VOICE CHECK
    Clyffy (now local): "I can hear you and talk back.
                         Try saying something."
    → Verify Whisper STT works (mic permission)
    → Verify Kokoro TTS works (play test audio)
    → If mic denied: "No worries, text works too."
    │
    ▼
Step 6: READY
    Clyffy: "All set. I'm running locally on your machine now.
             No cloud needed."
    → Dismiss onboarding → dashboard
```

### 2.2 Target Model Range: 7-9B

The brain model picker targets the **7-9B parameter sweet spot**:

| Model | Params | Format | Size (Q4_K_M) | Why |
|-------|--------|--------|---------------|-----|
| Llama 3.1 8B | 8B | GGUF | ~5.2 GB | Best code model in class |
| Phi-4 Mini | 3.8B | GGUF | ~3.1 GB | Compact, strong reasoning |
| Qwen3 4B | 4B | GGUF | ~2.6 GB | Multilingual, good generalist |
| Mistral 7B | 7B | GGUF | ~4.4 GB | Proven, fast |
| Gemma 2 9B | 9B | GGUF | ~5.8 GB | Google quality, newer |

Smaller fallbacks for low VRAM:
| Model | Params | Size | When |
|-------|--------|------|------|
| Qwen3 0.6B | 0.6B | ~0.5 GB | Under 4GB VRAM or CPU-only |
| Phi-3 Mini 3.8B | 3.8B | ~2.5 GB | Under 6GB VRAM |

### 2.3 Supporting Models (always included, not optional)

| Model | Slot | Purpose | Size |
|-------|------|---------|------|
| Whisper Small | voice.stt | Speech-to-text | ~0.5 GB |
| Kokoro v1.0 | voice.tts | Text-to-speech | ~0.3 GB |
| nomic-embed-v1.5 | rag.embedder | Code/doc search | ~0.3 GB |

### 2.4 Kokoros + Whisper Enablement

These are currently disabled due to build issues:
- **Kokoros**: `espeak-rs-sys` needs system install fix
- **Whisper**: sherpa-rs model files needed

**This sprint enables both:**

1. Fix espeak-rs-sys build (or use Kokoro's ONNX-only path that skips espeak)
2. Bundle Whisper model download in the onboarding flow
3. Enable `kokoros` and `whisper` features in desktop Cargo.toml
4. Add voice slots to auto-download list
5. Voice check step in onboarding verifies both work

### 2.5 Model Recommendation Engine Update

**File**: `kernel/model-loader/src/hardware/auto_config.rs`

Replace the Qwen-only recommendation table with the full model range:

```rust
fn brain_recommendations(tier: HardwareTier) -> Vec<BrainOption> {
    match tier {
        High => vec![
            brain("meta-llama/Llama-3.1-8B-Instruct-GGUF", "Q4_K_M", 5200, 6000),
            brain("google/gemma-2-9b-it-GGUF", "Q4_K_M", 5800, 6800),
            brain("bartowski/Qwen3-4B-GGUF", "Q4_K_M", 2600, 3200),
        ],
        Medium => vec![
            brain("bartowski/Phi-4-mini-GGUF", "Q6_K", 3100, 3800),
            brain("bartowski/Qwen3-4B-GGUF", "Q4_K_M", 2600, 3200),
            brain("mistralai/Mistral-7B-Instruct-GGUF", "Q4_K_M", 4400, 5200),
        ],
        Low => vec![
            brain("bartowski/Phi-4-mini-GGUF", "Q4_K_M", 2500, 3000),
            brain("Qwen/Qwen3-0.6B-GGUF", "Q8_0", 700, 400),
        ],
        Minimal | CpuOnly => vec![
            brain("Qwen/Qwen3-0.6B-GGUF", "Q4_K_M", 500, 350),
        ],
    }
}
```

User sees ALL compatible options with fit colors. Picks one. Done.

### GATE: First-time user picks a brain model, gets voice + search automatically, everything loads and works.

---

## PHASE 3: INTERACTION LIBRARY — Clyffy-Powered UI Assistance

**Goal**: Every UI element can have Clyffy-powered tooltips, callouts, and contextual help. Not static text — dynamic, awareness-based.

### 3.1 Interaction Types

```typescript
type ClyffyInteraction =
    | { type: "tooltip"; elementId: string; content: string }
    | { type: "callout"; message: string; actions?: ClyffyAction[] }
    | { type: "spotlight"; elementSelector: string; message: string }
    | { type: "suggestion"; context: string; message: string }
    | { type: "error-help"; error: string; recovery: string[] };

type ClyffyAction =
    | { label: string; action: "navigate"; href: string }
    | { label: string; action: "invoke"; command: string }
    | { label: string; action: "dismiss" };
```

### 3.2 Interaction Store

**File**: `interfaces/desktop/src/lib/domains/clyffy/runes/interactions.runes.svelte.ts`

```typescript
class InteractionState {
    active = $state<ClyffyInteraction[]>([]);
    tooltipCache = $state<Record<string, string>>({});

    /** Show a tooltip for a UI element */
    showTooltip(elementId: string): void { ... }

    /** Show a callout with actions */
    showCallout(message: string, actions?: ClyffyAction[]): void { ... }

    /** Spotlight a UI element with explanation */
    spotlight(selector: string, message: string): void { ... }

    /** Contextual suggestion based on what user is doing */
    suggest(context: string): void { ... }

    /** Error with recovery options */
    errorHelp(error: string): void { ... }

    /** Dismiss all active interactions */
    dismissAll(): void { ... }
}

export const interactionState = new InteractionState();
```

### 3.3 Tooltip Content Source

Three tiers, checked in order:
1. **Bundled JSON** — instant, always available, hand-authored
2. **Cloud Clyffy** — contextual, dynamic, requires network
3. **Local model** — same quality as cloud, no network needed

```typescript
async function getTooltipContent(elementId: string): Promise<string> {
    // 1. Check bundled cache
    const bundled = bundledTooltips[elementId];
    if (bundled) return bundled;

    // 2. Try Clyffy (cloud or local, router handles it)
    return clyffyChat(
        `Explain what "${elementId}" does in one sentence for a beginner.`,
        { type: "tooltip", elementId },
        () => {}, // no streaming for tooltips
    );
}
```

### 3.4 ClyffyCallout Component

**File**: `interfaces/desktop/src/lib/domains/clyffy/components/ClyffyCallout.svelte`

Floating card that appears near relevant UI. Clyffy avatar + message + action buttons. Dismissible. Auto-positions to avoid viewport edges.

### 3.5 ClyffySpotlight Component

**File**: `interfaces/desktop/src/lib/domains/clyffy/components/ClyffySpotlight.svelte`

Darkens everything except the spotlighted element. Clyffy message appears below/above. Used during tour and contextual help.

### GATE: Any UI element can trigger a Clyffy tooltip/callout. Works offline (bundled), online (cloud), and with local model.

---

## PHASE 4: DEVHUB OVERLAY

**Goal**: Keyboard shortcut opens a floating dev tools panel. Contains model loader, system status, Clyffy config, and future tools.

### 4.1 Keyboard Shortcut

**Shortcut**: `Ctrl+Shift+.` (period)

Why this combo:
- Not used by any browser (Ctrl+Shift+Z = redo, Ctrl+Shift+D = bookmark)
- Not used by VS Code
- Easy to hit — right hand only (Ctrl+Shift on left, period on right)
- Period suggests "more options" / "menu" semantically
- Memorable: "Ctrl+Shift+dot = DevPulse tools"

Dev mode only: `Ctrl+Shift+.` opens DevHub
Production: DevHub not available (or gated behind settings toggle)

### 4.2 DevHub Panel

**File**: `interfaces/desktop/src/lib/domains/devhub/components/DevHub.svelte`

Floating overlay panel — NOT a route. Appears over current content. Can be dragged. Can be pinned.

```
┌─────────────────────────────────────────┐
│  DevPulse DevHub                   [×]  │
├─────────────────────────────────────────┤
│  [Model Control] [System] [Clyffy] [+]  │
├─────────────────────────────────────────┤
│                                         │
│  (active tab content renders here)      │
│                                         │
│  Model Control tab:                     │
│    → Full ModelLoaderPanel              │
│    → HF Search                          │
│    → Slot management                    │
│                                         │
│  System tab:                            │
│    → Boot status                        │
│    → Service health                     │
│    → Hardware metrics                   │
│                                         │
│  Clyffy tab:                            │
│    → Cloud/Local status                 │
│    → Active model info                  │
│    → Interaction library config         │
│    → Bundled response editor            │
│                                         │
└─────────────────────────────────────────┘
```

### 4.3 Shortcut Registration

**File**: `interfaces/desktop/src/lib/sys/shortcuts/devhub.ts`

```typescript
export function registerDevHubShortcut(): void {
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === ".") {
            e.preventDefault();
            devHubState.toggle();
        }
    });
}
```

Called from root `(app)/+layout.svelte` on mount.

### 4.4 DevHub State

**File**: `interfaces/desktop/src/lib/domains/devhub/runes/devhub.runes.svelte.ts`

```typescript
class DevHubState {
    open = $state(false);
    activeTab = $state<"models" | "system" | "clyffy">("models");
    position = $state({ x: 100, y: 100 });
    pinned = $state(false);

    toggle(): void { this.open = !this.open; }
    close(): void { this.open = false; }
    setTab(tab: string): void { this.activeTab = tab; }
}

export const devHubState = new DevHubState();
```

### 4.5 Tab Content Components

Each tab is a self-contained component:
- **Models tab**: imports `ModelLoaderPanel` from models domain
- **System tab**: imports `platformState` + service health display
- **Clyffy tab**: shows cloud/local status, model info, interaction config

### 4.6 Root Layout Wiring

**File**: `interfaces/desktop/src/routes/(app)/+layout.svelte`

```svelte
<script>
import DevHub from "$lib/domains/devhub/components/DevHub.svelte";
import { registerDevHubShortcut } from "$lib/sys/shortcuts/devhub.js";
import { onMount } from "svelte";

onMount(() => registerDevHubShortcut());
</script>

<DevHub />
{@render children()}
```

### GATE: Ctrl+Shift+. opens floating DevHub with model control, system status, and Clyffy config.

---

## FOLDER STRUCTURE

```
interfaces/desktop/src/lib/
├── domains/
│   ├── clyffy/                        # Clyffy domain (NEW)
│   │   ├── services/
│   │   │   ├── cloud.service.ts       # Cloud API fallback
│   │   │   ├── router.service.ts      # Local vs cloud routing
│   │   │   └── index.ts
│   │   ├── runes/
│   │   │   ├── clyffy.runes.svelte.ts # Clyffy state
│   │   │   ├── interactions.runes.svelte.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── Onboarding.svelte      # Full onboarding flow
│   │   │   ├── ClyffyCallout.svelte   # Floating callout
│   │   │   ├── ClyffySpotlight.svelte # Spotlight overlay
│   │   │   ├── ClyffyTooltip.svelte   # Enhanced tooltip
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── clyffy.types.ts
│   │   └── index.ts
│   │
│   └── devhub/                        # DevHub domain (NEW)
│       ├── components/
│       │   ├── DevHub.svelte          # Main overlay panel
│       │   ├── DevHubModels.svelte    # Models tab content
│       │   ├── DevHubSystem.svelte    # System tab content
│       │   ├── DevHubClyffy.svelte    # Clyffy tab content
│       │   └── index.ts
│       ├── runes/
│       │   ├── devhub.runes.svelte.ts
│       │   └── index.ts
│       └── index.ts
│
├── sys/
│   └── shortcuts/
│       └── devhub.ts                  # Ctrl+Shift+. registration
│
└── static/
    └── clyffy/
        └── bundled-responses.json     # Offline fallback content
```

---

## RUST CHANGES

### Cloud Key Config

**File**: `systems/devpulse-engine/platform.default.toml`

```toml
[services.system.clyffy_cloud]
enabled = true
endpoint = "https://devpulse.app/functions/v1/clyffy-chat"
```

### Brain Model Range Update

**File**: `kernel/model-loader/src/hardware/auto_config.rs`

Replace Qwen-only recommendations with Llama/Phi/Qwen/Mistral/Gemma range. Add supporting model auto-include (Whisper, Kokoro, embedder).

### Enable Kokoros + Whisper Features

**File**: `interfaces/desktop/src-tauri/Cargo.toml`

```toml
devpulse-engine = { ..., features = ["rro", "candle", "inference", "kokoros"] }
```

**File**: `systems/devpulse-engine/platform.default.toml`

```toml
[services.system.voice]
enabled = true    # was false — now enabled
critical = false

[services.system.whisper]
enabled = true    # was false — now enabled
critical = false
```

### Fix espeak-rs-sys Build

Either:
- A) Install espeak-ng system dependency and document in xtask preflight
- B) Use Kokoro's ONNX-only phonemization path (no espeak dependency)

Decision needed from owner.

### Model Ready Signal

**File**: `kernel/model-loader/src/service.rs`

```rust
pub fn is_brain_ready(&self) -> bool {
    // Check if chat.brain slot is loaded
}
```

Exposed as Tauri command for the frontend Clyffy router.

---

## OWNER DECISION GATES

| # | Question | Impact |
|---|----------|--------|
| 1 | devpulse.app API endpoint — does it exist yet? Need to build it? | Phase 1 timeline |
| 2 | Embedded app key — how is it provisioned? Env var at build? | Phase 1 security |
| 3 | Rate limit for cloud Clyffy — per install? Per hour? | Phase 1 cost |
| 4 | Should onboarding intention affect which hubs are visible? | Phase 2 UX |
| 5 | DevHub in production builds — hidden, gated, or removed? | Phase 4 scope |

---

## NOT IN SCOPE

- devpulse.app Supabase backend completion (separate project — API contract defined here)
- Clyffy personality/prompt engineering (separate sprint)
- Chibi minion animations (overlay system exists, art assets needed)
- llguidance constrained decoding (separate sprint, fork not ready)

---

*When this sprint is done: Clyffy is always available (cloud → local seamless switch), first-run users get guided through everything with zero technical knowledge, every UI element can have Clyffy-powered help, and Ctrl+Shift+. opens a floating dev tools panel.*
