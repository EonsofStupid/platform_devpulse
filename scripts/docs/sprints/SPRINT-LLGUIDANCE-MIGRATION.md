# SPRINT: outlines-core → llguidance Migration + Graceful Zero-Model Startup

**Date**: 2026-03-31
**Status**: PLAN — Owner approval required before execution
**Depends on**: SPRINT-MODEL-LOADER (Phases 1-10 complete)

---

## WHAT THIS SPRINT DOES

1. **Rips out `outlines-core`** entirely — dependency, adapter, service, boot stage, config
2. **Wires `llguidance`** as the constrained decoding engine (Earley parser, per-token mask)
3. **Establishes graceful zero-model startup** — app boots clean with nothing loaded, Clyffy guides you through setup
4. **Prepares the animation attachment points** for chibi 8-bit minion overlays

---

## CURRENT STATE (verified 2026-03-31)

### outlines-core Footprint (EVERYTHING THAT NEEDS TO GO)

| File | What | Lines |
|------|------|-------|
| `Cargo.toml` (workspace) | `outlines-core = "0.1"` + patch to `../deps/outlines-core` | 2 |
| `kernel/devpulse-clyffy/Cargo.toml` | `outlines = ["dep:outlines-core"]` feature + dep | 3 |
| `kernel/devpulse-clyffy/src/cortex/persistence/outlines.rs` | `OutlinesAdapter` — schema→regex stub | 54 |
| `kernel/devpulse-clyffy/src/cortex/persistence/mod.rs` | `#[cfg(feature = "outlines")] pub mod outlines;` | 2 |
| `systems/devpulse-engine/Cargo.toml` | `outlines = ["devpulse-clyffy/outlines"]` feature | 1 |
| `systems/devpulse-engine/src/platform/services/grammar.rs` | `GrammarService` wrapping `OutlinesAdapter` | 51 |
| `systems/devpulse-engine/src/platform/services/mod.rs` | `#[cfg(feature = "outlines")] pub mod grammar;` | 2 |
| `systems/devpulse-engine/src/platform/boot/grammar.rs` | Boot stage 9 — initializes GrammarService | 62 |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | Grammar boot call in execute() | ~5 |
| `systems/devpulse-engine/src/platform/mod.rs` | `grammar()` getter + field | ~5 |
| `systems/devpulse-engine/src/platform/config.rs` | `GrammarServiceEntry` struct | ~25 |
| `systems/devpulse-engine/platform.default.toml` | `[services.system.grammar]` section | 4 |
| `.cargo/config.toml` | Comment about esaxx-rs from outlines-core | 1 |
| `interfaces/desktop/src-tauri/Cargo.toml` | ~~`outlines` feature~~ (ALREADY REMOVED in model-loader sprint) | 0 |

**Total: ~215 lines across 13 files. All feature-gated. All stubs/wrappers.**

### llguidance Status

- Fork planned at `EonsofStupid/llguidance` — **NOT YET CLONED**
- Locked decision: llguidance is the constrained decoding engine
- Integration point: per-token logit masking in the generation loop (Candle + llama.cpp)
- The `model-loader` crate's `InferenceBackend::forward()` returns raw logits — llguidance mask applies BEFORE sampling

---

## OWNER DECISION GATES

### GATE 1: Fork Setup

**Q**: Do you want to fork `microsoft/llguidance` now or stub the feature and wire it later?

**Options**:
- **A) Fork now** — clone `microsoft/llguidance` to `EonsofStupid/llguidance`, add to `deps/`, wire as `git=` dep
- **B) Stub and wire later** — remove outlines-core, define the `constrained` feature flag + trait boundary, implement when fork is ready

**Recommendation**: Option B. The model loader works without constrained decoding. Get the zero-model startup + UI polished first. llguidance is a deep integration that deserves its own focused sprint.

**Impact**: If B, the grammar service disappears entirely until the llguidance sprint. No constrained output. Models generate free-form text only. This is fine for Phase 1 — constrained decoding is a quality feature, not a blocker.

### GATE 2: Chibi Animation System

**Q**: Where do the 8-bit minion animations live architecturally?

**Options**:
- **A) ColdLight overlay system** — new `design/overlays/` layer with sprite animation primitives. Global overlay that sits above all routes.
- **B) Per-route injection** — each route that wants minion animations imports an `<AnimatedMinion>` component.
- **C) StatusBar/TopBar integration** — minions animate in the persistent chrome, not over content.

**Recommendation**: Option A. A global overlay layer controlled by MAESTRO signals. Minions appear/disappear based on system state. The overlay is a transparent full-screen canvas with pointer-events:none so it doesn't block interaction. Sprite sheets are static `.webp` assets, animated via CSS `steps()` — zero JS animation overhead.

---

## PHASE 1: REMOVE outlines-core

**Goal**: Clean removal. Zero compile errors. Grammar feature flag still exists but gates nothing until llguidance is ready.

### Task 1.1: Remove outlines-core from workspace

**File**: `Cargo.toml` (workspace root)

Remove:
```toml
# From [workspace.dependencies]:
outlines-core = "0.1"

# From [patch.crates-io]:
outlines-core = { path = "../deps/outlines-core" }
```

### Task 1.2: Remove from kernel

**File**: `kernel/devpulse-clyffy/Cargo.toml`

Change feature:
```toml
# OLD:
outlines = ["dep:outlines-core"]
# NEW:
# outlines feature reserved for llguidance — no deps until fork is ready
```

Remove dependency:
```toml
# REMOVE:
outlines-core = { workspace = true, optional = true }
```

**File**: `kernel/devpulse-clyffy/src/cortex/persistence/outlines.rs`
- **DELETE** entirely

**File**: `kernel/devpulse-clyffy/src/cortex/persistence/mod.rs`
- Remove `#[cfg(feature = "outlines")] pub mod outlines;`
- Remove `pub use outlines::OutlinesAdapter;`

### Task 1.3: Remove from engine

**File**: `systems/devpulse-engine/Cargo.toml`
- Keep `outlines = ["devpulse-clyffy/outlines"]` — it gates nothing now but preserves the feature name for llguidance

**File**: `systems/devpulse-engine/src/platform/services/grammar.rs`
- **DELETE** entirely

**File**: `systems/devpulse-engine/src/platform/services/mod.rs`
- Remove `#[cfg(feature = "outlines")] pub mod grammar;`
- Remove `Grammar` from `ServiceRole` enum? **NO** — keep the enum variant, it'll be reused for llguidance. Just remove the module.

**File**: `systems/devpulse-engine/src/platform/boot/grammar.rs`
- **DELETE** entirely

**File**: `systems/devpulse-engine/src/platform/boot/mod.rs`
- Remove the grammar boot call from `execute()`

**File**: `systems/devpulse-engine/src/platform/mod.rs`
- Remove `grammar` field from Platform struct
- Remove `grammar()` getter
- Remove the `use services::grammar::GrammarService` import

**File**: `systems/devpulse-engine/src/platform/config.rs`
- Remove `GrammarServiceEntry` struct
- Remove grammar from `PlatformBootConfig` and parsing

### Task 1.4: Clean config

**File**: `systems/devpulse-engine/platform.default.toml`

Change:
```toml
# OLD:
[services.system.grammar]
enabled = true
critical = true
kind = "outlines"

# NEW:
# [services.system.grammar]
# Reserved for llguidance constrained decoding.
# enabled = false
# kind = "llguidance"
```

### Task 1.5: Clean .cargo/config.toml comment

**File**: `.cargo/config.toml`
- Update the CRT comment to remove outlines-core reference

### Task 1.6: Compile Check

```bash
cargo check -p devpulse-clyffy
cargo check -p devpulse-engine
cargo check -p devpulse_desktop_backend
cargo test -p model-loader --no-default-features
```

All must pass. Zero references to `outlines_core` in any compiled code.

### GATE: outlines-core fully removed. No compile errors. Grammar feature flag exists but empty.

---

## PHASE 2: GRACEFUL ZERO-MODEL STARTUP

**Goal**: App boots clean with zero models, zero encoders, zero grammar engine. Every "missing" state is handled with clear UI guidance, not errors.

### Task 2.1: Boot Pipeline — Skip Missing Services Gracefully

The boot pipeline already handles `enabled = false` services. Verify:
- Grammar: disabled in config (Phase 1)
- Embedder: `enabled = false` in config (already)
- Whisper: `enabled = false` in config (already)
- Voice: `enabled = false` in config (already)

The inference service (model-loader) boots but registers slots without loading anything.

### Task 2.2: Model Loader — Empty State UI

The `ModelLoaderPanel` already shows Clyffy narration for zero models. Enhance it:

**When zero models + first run:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    ╭───────╮                                            │
│    │  GPU  │    RTX 3070 · 8 GB                        │
│    │  8 GB │    (detected)                              │
│    ╰───────╯                                            │
│                                                         │
│  No models yet.                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💬 "I see you've got a RTX 3070 with 8 GB.    │   │
│  │     Let me set things up. One click and I'll    │   │
│  │     download the right models for your GPU."    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│        ┌──────────────────────────┐                     │
│        │   ⚡ Set Me Up           │                     │
│        └──────────────────────────┘                     │
│                                                         │
│  Or: [Browse Models]  [Scan Local Folder]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Task 2.3: "Set Me Up" Flow

Add `SetupWizard.svelte` to the models components:

```
Step 1: Hardware detected (already done by HardwareState)
Step 2: Show recommended models for tier (from auto_configure())
  - Each model card: name, size, what it does, fit color
  - Total download size prominently shown
  - "This will take about X minutes at your internet speed"
Step 3: [Set Me Up] clicked → download all recommended models
  - Combined progress bar
  - Per-model progress underneath
  - Clyffy narrates: "Getting the brain...", "Grabbing the search engine..."
Step 4: Auto-assign to slots → auto-load Brain + Minion
Step 5: "All set! Try typing something."
```

### Task 2.4: Slot Empty States

Each `SlotRow` when unassigned shows:
- Gray dot (no fit to calculate)
- "Click to assign" link
- No load button (nothing to load)
- Clyffy tip: "This slot handles [purpose]. Assign a model to activate it."

When assigned but not loaded:
- Green/yellow/red dot based on VRAM fit
- Load button visible
- Status: "Not Loaded"

### Task 2.5: StatusBar Zero-State

StatusBar shows:
```
● Online │ No GPU Memory in use │ No models loaded │ [Set up models →]
```

The `[Set up models →]` is a clickable link that navigates to `/overmind`.

### Task 2.6: Chat Zero-State

When user types in chat with no brain model loaded:
```
┌────────────────────────────────────────┐
│  💬 Clyffy:                            │
│  "I don't have a brain loaded yet!     │
│   Head to Model Control to set me up." │
│                                        │
│  [Open Model Control]                  │
└────────────────────────────────────────┘
```

Not an error. A guided redirect.

### GATE: App boots clean with zero models. Every empty state guides the user. No red errors on fresh install.

---

## PHASE 3: CHIBI 8-BIT MINION ANIMATION OVERLAY

**Goal**: Establish the animation system architecture. Sprite attachment points. Global overlay layer. No actual sprites yet (Jesse creates those) — but the system is ready to receive them.

### Task 3.1: Overlay Architecture

```
interfaces/desktop/src/lib/design/overlays/
├── MinionOverlay.svelte       # Global transparent overlay
├── SpriteAnimator.svelte      # Single animated sprite (CSS steps())
├── types.ts                   # MinionSpriteState, SpriteSheet, Animation
└── index.ts
```

### Task 3.2: MinionOverlay.svelte

Global overlay component — renders in the root layout, above all routes:
- `position: fixed; inset: 0; pointer-events: none; z-index: 9999;`
- Listens to MAESTRO signals for minion activity
- When a minion activates: sprite appears at a random edge, walks/floats to a "work area"
- When idle: sprite sits, blinks, occasionally looks around
- When escalated: sprite glows, runs to a different position

**No actual sprites yet** — placeholder colored squares with the minion icon until Jesse provides the 8-bit art.

### Task 3.3: SpriteAnimator.svelte

Reusable sprite animation component:
```svelte
<SpriteAnimator
  sheet="/sprites/minions/guardian-walk.webp"
  frameWidth={32}
  frameHeight={32}
  frameCount={8}
  fps={8}
  scale={2}
  x={position.x}
  y={position.y}
  state="walking" | "idle" | "working" | "escalated"
/>
```

- CSS `background-image` + `background-position` + `animation: steps(N)`
- Zero JS animation — pure CSS `@keyframes` with `steps()` timing
- `.webp` sprite sheets for compression
- `image-rendering: pixelated` for crisp 8-bit scaling

### Task 3.4: Sprite Type Definitions

```typescript
interface MinionSpriteConfig {
  minionId: string;           // "guardian", "enforcer", etc.
  sheets: {
    idle: string;             // path to idle sprite sheet
    walking: string;          // path to walking sprite sheet
    working: string;          // path to working animation
    escalated: string;        // path to escalated glow animation
  };
  frameWidth: number;         // px per frame (e.g. 32)
  frameHeight: number;        // px per frame
  frameCounts: {
    idle: number;
    walking: number;
    working: number;
    escalated: number;
  };
}

interface ActiveMinion {
  minionId: string;
  state: "idle" | "walking" | "working" | "escalated";
  x: number;                  // viewport position
  y: number;
  targetX: number;            // destination (for walking)
  targetY: number;
}
```

### Task 3.5: Integration Points

The overlay reads from a `minionOverlayState` rune:
```typescript
class MinionOverlayState {
  active = $state<ActiveMinion[]>([]);
  enabled = $state(true);  // user can toggle off

  // Called by MAESTRO signal handlers
  activate(minionId: string): void { ... }
  deactivate(minionId: string): void { ... }
  escalate(minionId: string): void { ... }
}
```

### Task 3.6: Root Layout Wiring

Add `<MinionOverlay />` to the root `(app)/+layout.svelte` — renders once, globally, above everything.

### GATE: Overlay system exists. Placeholder sprites work. Ready for Jesse's 8-bit art assets.

---

## PHASE 4: LLGUIDANCE INTEGRATION (FUTURE — NOT THIS SPRINT)

This phase is documented here for completeness but is a **separate sprint** executed after the llguidance fork is cloned and tested.

### What llguidance Replaces
- `outlines-core::json_schema::regex_from_str()` → `llguidance` Earley parser
- Regex-based token masking → per-token logit masking via `llguidance::TokenMask`
- Schema compilation happens once (Moka cached), mask applied per-token in generation loop

### Integration Architecture
```
model-loader crate:
  InferenceBackend::forward() returns raw logits
  ↓
constrained crate (new, depends on model-loader + llguidance):
  Compiles JSON schema → llguidance Grammar
  Caches compiled grammars in Moka
  At each token: Grammar.compute_mask() → Vec<bool>
  Apply mask to logits before sampling
  ↓
  Masked logits → sample_token() → next token
```

### Files to Create (Phase 4 sprint)
```
kernel/constrained/Cargo.toml         # deps: model-loader, llguidance, moka
kernel/constrained/src/lib.rs
kernel/constrained/src/engine.rs      # ConstraintEngine
kernel/constrained/src/masks.rs       # Per-token masking
kernel/constrained/src/cache.rs       # Moka schema cache
kernel/constrained/src/schemas/       # 8 Minion output schemas
```

---

## FILES CHANGED (Summary)

### Phase 1: DELETED
```
kernel/devpulse-clyffy/src/cortex/persistence/outlines.rs    (54 lines)
systems/devpulse-engine/src/platform/services/grammar.rs     (51 lines)
systems/devpulse-engine/src/platform/boot/grammar.rs         (62 lines)
```

### Phase 1: MODIFIED
```
Cargo.toml                                                    # remove outlines-core dep + patch
kernel/devpulse-clyffy/Cargo.toml                             # remove outlines dep + feature content
kernel/devpulse-clyffy/src/cortex/persistence/mod.rs          # remove outlines module
systems/devpulse-engine/src/platform/services/mod.rs          # remove grammar module
systems/devpulse-engine/src/platform/boot/mod.rs              # remove grammar boot call
systems/devpulse-engine/src/platform/mod.rs                   # remove grammar field + getter
systems/devpulse-engine/src/platform/config.rs                # remove GrammarServiceEntry
systems/devpulse-engine/platform.default.toml                 # comment out grammar config
.cargo/config.toml                                            # update comment
```

### Phase 2: CREATED
```
interfaces/desktop/src/lib/domains/app/models/components/SetupWizard.svelte
```

### Phase 2: MODIFIED
```
interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte  # zero-state UI
interfaces/desktop/src/lib/domains/app/models/components/SlotRow.svelte           # empty state tips
interfaces/desktop/src/lib/components/layout/StatusBar.svelte                     # zero-state segment
interfaces/desktop/src/routes/(chat)/chat/+page.svelte                           # no-model redirect
```

### Phase 3: CREATED
```
interfaces/desktop/src/lib/design/overlays/MinionOverlay.svelte
interfaces/desktop/src/lib/design/overlays/SpriteAnimator.svelte
interfaces/desktop/src/lib/design/overlays/types.ts
interfaces/desktop/src/lib/design/overlays/index.ts
interfaces/desktop/src/lib/domains/app/minions/runes/overlay.runes.svelte.ts
```

### Phase 3: MODIFIED
```
interfaces/desktop/src/routes/(app)/+layout.svelte   # add MinionOverlay
```

---

## EXECUTION RULES

1. Phase 1 compiles before Phase 2 starts
2. No outlines-core references survive Phase 1
3. Zero-model startup must show NO red error blocks (Phase 2)
4. Overlay system uses ZERO JavaScript animation — CSS `steps()` only
5. Sprite sheets are `.webp` for compression, `image-rendering: pixelated` for crisp scaling
6. All changes pass `cargo check` + `svelte-check`

---

*When this sprint is done: outlines-core is gone, the app boots gracefully with nothing loaded, Clyffy guides first-run users through setup, and the animation overlay is ready for Jesse's chibi pixel art.*
