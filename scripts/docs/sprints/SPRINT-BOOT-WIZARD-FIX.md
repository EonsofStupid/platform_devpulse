# SPRINT: Boot Wizard Fix — GPU, Search, Visuals, Layout

**Date**: 2026-04-02
**Status**: PLAN — Owner approval required
**Research**: `SPRINT-BOOT-WIZARD-FIX.research.md`
**Depends on**: Build passing, SD5 pipeline working

---

## Problem Statement

The boot setup wizard has three broken systems and a layout problem:

1. **GPU not detected** — NVML init fails silently at `debug!` level, user sees "No GPU / CPU Mode"
2. **HF search errors invisible** — search may be failing but error styling is broken, masking the issue
3. **All 5 wizard renderForge kinds unregistered** — no DTCG tokens, components render with generic fallback
4. **Layout cramped** — entire wizard squeezed into 400px column with no scroll

---

## PHASE 1: GPU Detection — Surface the Error

**Goal**: User sees WHY GPU isn't detected, not just "No GPU".

### Task 1.1: Escalate NVML log level

**File**: `kernel/model-loader/src/hardware/metrics.rs`

Lines 143-147 and 151-157: Change `tracing::debug!` to `tracing::warn!` for both NVML init failure and device-not-found.

```rust
// BEFORE (line 146):
tracing::debug!("NVML init failed (no NVIDIA driver?): {e}");

// AFTER:
tracing::warn!("NVML init failed — GPU detection unavailable: {e}");
```

Same for device_by_index (line 154).

### Task 1.2: Add GPU detection reason to HardwareMetrics

**File**: `kernel/model-loader/src/hardware/metrics.rs`

Add field to `HardwareMetrics`:
```rust
/// Why GPU wasn't detected (None = GPU was detected successfully)
pub gpu_error: Option<String>,
```

Set it in `collect_gpu_metrics` when NVML fails:
```rust
Err(e) => {
    tracing::warn!("NVML init failed — GPU detection unavailable: {e}");
    metrics.gpu_error = Some(format!("NVML: {e}"));
    return;
}
```

### Task 1.3: Propagate to Tauri command + frontend types

**File**: `src-tauri/src/commands/models/mod.rs` — add `gpu_error` to `HardwareInfo`
**File**: `domains/app/models/types/models.types.ts` — add `gpuError?: string | null`
**File**: `domains/app/models/runes/hardware.runes.svelte.ts` — expose `gpuError` getter

### Task 1.4: Show GPU error in VramGauge

**File**: `domains/app/models/components/VramGauge.svelte`

When `!hasGpu && gpuError`:
```svelte
{:else}
  No GPU
  <text ...>{gpuError ?? "CPU Mode"}</text>
{/if}
```

### Task 1.5: Verify

- [ ] `cargo check -p model-loader`
- [ ] `cargo check -p devpulse-engine`
- [ ] `cargo check -p devpulse_desktop_backend`
- [ ] `pnpm svelte-check`
- [ ] Boot app — terminal shows NVML warn, VramGauge shows reason

---

## PHASE 2: Design System — Author 5 Wizard Kind Presets

**Goal**: Boot wizard components get proper ColdLight visual identity.

### STOP — Owner Decision Required

**Question**: What visual identity should each wizard kind have?

**Proposed mapping** (based on reference aesthetic):

| Kind | Base Preset Family | Rationale |
|------|-------------------|-----------|
| `boot-wizard` | `glass-deep` | Main wizard container — deep glass with teal undertone |
| `boot-wizard-btn` | `chrome-glow` | CTAs need pop — chrome with teal glow emission |
| `boot-wizard-knowledge` | `neuro-minimal` | Knowledge drops are secondary — subtle neumorphic |
| `clyffy-narration` | `glass-minimal` | Clyffy bubble — glass surface, not competing with content |
| `vram-gauge` | `neuro-elevated` | Gauge card — elevated neumorphic with accent-driven glow |

**Options**:
- A: Use these mappings (match existing dashboard aesthetic)
- B: Different mappings (owner specifies)
- C: Create new preset variants specifically for wizard (e.g., `wizard-deep`, `wizard-glow`)

**Impact**: Determines the DTCG values authored in style-presets.json.

### Task 2.1: Author DTCG tokens in style-presets.json

**File**: `scripts/build/styledictionary/tokens/src/style-presets.json`

Add 5 new top-level preset entries. Each needs all 20 axes.

Example for `boot-wizard-primary` (the per-kind override):
```json
"boot-wizard-glass-deep": {
  "background-color": { "$value": "oklch(0.12 0.02 230 / 0.85)", "$type": "color" },
  "box-shadow": { "$value": "0 0.5rem 2rem oklch(0 0 0 / 0.6), inset 0 0.0625rem 0 oklch(1 0 0 / 0.08), inset 0 -0.0625rem 0 oklch(0 0 0 / 0.3)", "$type": "shadow" },
  "color": { "$value": "oklch(0.93 0.015 224)", "$type": "color" },
  "border-color": { "$value": "oklch(0.55 0.12 180 / 0.25)", "$type": "color" },
  "border-width": { "$value": "0.0625rem", "$type": "dimension" },
  "backdrop-filter": { "$value": "blur(1.5rem)", "$type": "dimension" },
  "border-radius": { "$value": "1rem", "$type": "dimension" },
  ...all 20 axes
}
```

Repeat for:
- `boot-wizard-btn-chrome-glow` — bright CTA, teal glow border, bold text
- `boot-wizard-knowledge-neuro-minimal` — subtle card, muted text
- `clyffy-narration-glass-minimal` — translucent bubble, accent border-left
- `vram-gauge-neuro-elevated` — elevated gauge card with accent-driven color

### Task 2.2: Rebuild SD5 + kind-families

```bash
cd interfaces/desktop
pnpm ds:tokens:build           # Regenerates CSS from DTCG JSON
node scripts/build/styledictionary/derive-kind-families.mjs  # Rebuilds kind-families.ts
```

### Task 2.3: Verify kind-families.ts has new entries

**File**: `src/lib/design/renderforge/generated/kind-families.ts`

Should now contain:
```typescript
"boot-wizard": ["frame", "overlay", "surface", "text"],
"boot-wizard-btn": ["frame", "surface", "text"],
"boot-wizard-knowledge": ["surface", "text"],
"clyffy-narration": ["surface", "text"],
"vram-gauge": ["surface", "text"],
```

### Task 2.4: Verify

- [ ] `pnpm ds:tokens:build` — no errors
- [ ] `pnpm svelte-check` — 0 errors
- [ ] kind-families.ts contains all 5 new kinds
- [ ] CSS output has `--style-boot-wizard-*` variables

---

## PHASE 3: Layout — Expand Wizard, Add Scroll

**Goal**: Wizard uses proper real estate, boot log stays narrow, content scrolls.

### Task 3.1: BootOverlay — Two-phase layout

**File**: `src/lib/layouts/app/BootOverlay.svelte`

The overlay needs two layout modes:

**Boot phase** (subsystem list): Keep current narrow centered column (400px max).

**Wizard phase** (`platformState.needsModelSetup`): Expand to wider container with proper structure.

Change line 109 from:
```svelte
<div class={cn(stack({ gap: "24", align: "center" }), "min-w-[320px] max-w-[400px] p-[var(--space-32)]")}>
```

To use a derived class that widens when the wizard activates:
```svelte
{@const isWizardPhase = platformState.needsModelSetup}
<div class={cn(
  stack({ gap: "6", align: "center" }),
  isWizardPhase
    ? "w-full max-w-3xl px-8 py-6 overflow-y-auto max-h-[90vh]"
    : "min-w-[320px] max-w-[400px] p-8"
)}>
```

### Task 3.2: BootSetupWizard — Two-column recommendations

**File**: `domains/app/models/components/BootSetupWizard.svelte`

The recommendations step (line 369-440) needs restructuring:

```
┌──────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │  VramGauge   │  │  Suggested Models             │ │
│  │  (centered)  │  │  ┌─────────────────────────┐  │ │
│  │  CPU Mode    │  │  │ AI Brain · 500MB  [Get] │  │ │
│  │  tier msg    │  │  │ Search   · 300MB  [Get] │  │ │
│  └──────────────┘  │  └─────────────────────────┘  │ │
│                     │  [Install All Suggested]      │ │
│                     └───────────────────────────────┘ │
│  ─────────── or find something specific ──────────── │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Search HuggingFace                              │ │
│  │  [🔍 Search input................................]│ │
│  │  Results...                                      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  💬 Clyffy: "No dedicated GPU — that's fine!..."     │
│  Skip setup — I'll configure later                    │
└───────────────────────────────────────────────────────┘
```

Replace vertical stack with grid at the recommendations step:
```svelte
<div class="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 w-full">
  <!-- Left: Gauge -->
  <div class="flex flex-col items-center gap-3">
    <VramGauge ... />
    <Text ...>{tierMessage}</Text>
  </div>
  <!-- Right: Recommendations -->
  <div class={stack({ gap: "2" })}>
    ...recommendation cards...
    ...install all button...
  </div>
</div>
```

Search and ClyffyNarration below, full-width.

### Task 3.3: Add overflow scroll to overlay content

**File**: `src/lib/layouts/app/BootOverlay.svelte`

The inner content container needs `overflow-y-auto max-h-[90vh]` to prevent vertical overflow when wizard content exceeds viewport.

### Task 3.4: Verify

- [ ] `pnpm svelte-check`
- [ ] Boot overlay: subsystem list centered and narrow
- [ ] Wizard phase: content expands to ~768px, gauge beside recommendations
- [ ] Long content scrolls within overlay
- [ ] Skip button always visible (not pushed off-screen)

---

## PHASE 4: Search Error Visibility

**Goal**: When HF search fails, the user can see why.

### STOP — Owner Decision Required

**Question**: When you type in the search box, what happens? Do you see:
- A) Spinning loader that never stops
- B) Nothing at all (no visual response)
- C) An error message that's unreadable
- D) The search input doesn't respond to typing

**Impact**: Determines whether this is a search wiring issue (A/B), styling issue (C), or event binding issue (D).

### Task 4.1: Verify search error path renders visibly

**File**: `domains/app/models/components/ModelSearch.svelte`

Lines 78-82 show the error state — but it uses raw Tailwind `border-red-500/50` instead of renderForge. After Phase 2, this should use the `clyffy-narration` kind with `error` type for consistent styling.

Replace:
```svelte
<div class="rounded-lg border-l-4 border-red-500/50 px-3 py-2">
  <Text size="xs" weight="bold" color="primary">Search Error</Text>
  <Text size="xs" color="muted">{searchState.error}</Text>
</div>
```

With:
```svelte
<ClyffyNarration message={searchState.error} type="error" />
```

### Task 4.2: Add console logging for search attempts

**Already exists** in `search.service.ts` — `logInfo` and `logError`. Check boot.log/session log for search-related entries if search fails.

### Task 4.3: Verify

- [ ] Type a query → see loading state or results
- [ ] Force-fail (disconnect network) → see ClyffyNarration error with reason
- [ ] Error is readable and styled with ColdLight

---

## PHASE 5: Polish — Clyffy Identity

**Goal**: Clyffy narration bubble is visible, warm, and layman-friendly.

### Task 5.1: ClyffyNarration visual treatment

**File**: `domains/app/models/components/ClyffyNarration.svelte`

After Phase 2 gives it proper preset backing, verify it has:
- Visible accent border-left (teal for info, green for success, red for error)
- Glass/translucent background (not invisible)
- Text is readable against dark background
- The emoji icon is visible but not dominant

### Task 5.2: Wizard welcome step — Clyffy avatar

**File**: `domains/app/models/components/BootSetupWizard.svelte`

The welcome step (lines 342-359) has a generic Sparkles icon in a circle. For layman first-run, this should be warmer — Clyffy's identity. But this is cosmetic and can wait.

### STOP — Owner Decision Required

**Question**: Should Clyffy have a visual avatar (SVG mascot, animated icon, or just the Sparkles icon)?

**Options**:
- A: Keep Sparkles icon (functional, no design debt)
- B: SVG mascot (needs design work, adds personality)
- C: Animated teal orb (matches liquid metal aesthetic, implementable with existing SVG system)

**Impact**: Defines Clyffy's visual identity across all narration/assistant touchpoints.

### Task 5.3: Verify full flow

- [ ] Boot → subsystem list (narrow, centered)
- [ ] Platform ready → wizard expands (wide, 2-col)
- [ ] VramGauge shows GPU status or explains why not
- [ ] Recommendations have visual hierarchy (fit colors, CTA glow)
- [ ] Search works or shows clear error
- [ ] ClyffyNarration is visible and styled
- [ ] "Install All Suggested" button has chrome/glow treatment
- [ ] Skip link is always reachable
- [ ] After setup → overlay fades → dashboard visible

---

## Execution Order

1. **Phase 2** (presets) — FIRST, because it unblocks visual debugging of everything else
2. **Phase 3** (layout) — immediately visible improvement
3. **Phase 1** (GPU) — Rust change, separate cargo check cycle
4. **Phase 4** (search errors) — depends on Phase 2 for ClyffyNarration styling
5. **Phase 5** (polish) — after everything works

---

## Files Modified

| Phase | File | Change |
|-------|------|--------|
| 1 | `kernel/model-loader/src/hardware/metrics.rs` | warn! + gpu_error field |
| 1 | `src-tauri/src/commands/models/mod.rs` | gpu_error in HardwareInfo |
| 1 | `domains/app/models/types/models.types.ts` | gpuError field |
| 1 | `domains/app/models/runes/hardware.runes.svelte.ts` | gpuError getter |
| 1 | `domains/app/models/components/VramGauge.svelte` | Show error reason |
| 2 | `scripts/build/styledictionary/tokens/src/style-presets.json` | 5 new preset blocks |
| 2 | `src/lib/design/renderforge/generated/kind-families.ts` | AUTO-REGENERATED |
| 3 | `src/lib/layouts/app/BootOverlay.svelte` | Two-phase width, scroll |
| 3 | `domains/app/models/components/BootSetupWizard.svelte` | 2-col grid layout |
| 4 | `domains/app/models/components/ModelSearch.svelte` | ClyffyNarration for errors |
| 5 | `domains/app/models/components/ClyffyNarration.svelte` | Visual polish |

**Total**: 11 files across 5 phases. Max 5 per phase (compliant with CC rules).

---

## Gate

- [ ] GPU detection shows reason for failure (not just "No GPU")
- [ ] All 5 wizard kinds have DTCG backing in style-presets.json
- [ ] kind-families.ts regenerated with new entries
- [ ] Wizard layout uses 2-column grid for recommendations
- [ ] Overlay content scrolls when exceeding viewport
- [ ] Search errors visible via ClyffyNarration
- [ ] ClyffyNarration has glass surface + accent border
- [ ] Wizard CTAs have chrome/glow treatment
- [ ] Full boot→wizard→dashboard flow works end-to-end
