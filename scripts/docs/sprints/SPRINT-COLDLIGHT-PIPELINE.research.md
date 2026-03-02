# Research: ColdLight End-to-End Pipeline — Fix the Wiring

**Date**: 2026-03-02
**Sprint**: COLDLIGHT-PIPELINE
**Status**: COMPLETE

---

## Question/Goal

The ColdLight infrastructure exists: config, contracts, scanner, token categories, presets, effects, 60+ builders, resolveVisual(). But the pipeline doesn't flow end-to-end. The manifest is empty, Tailwind @utility classes aren't generated from the SSOT, components have wrong layer concerns, and there's no auto-growth mechanism. The SSOT (token-categories.ts, contracts, presets) should DRIVE everything — add an entry, run build, folders/manifest/utilities follow.

---

## What EXISTS and is CORRECT

### Config Orchestrator — `coldlight.config.ts`
8 fragments assembled. Config drives everything. COMPLETE.

### Contract System — 87+ `primitives/{kind}/contract.ts`
Zod-validated PrimitiveContract: kind, ariaStateProvider, slots, slotSpec, states, slotStates, slotActions, aria, keyboard, focusStrategy, compound. COMPLETE.

### Scanner — `scanner.ts` (850 lines)
Scans all layers, loads contracts, validates parity, cross-validates component→primitive references, generates ColdLightManifest. COMPLETE as code.

### Token Category Registry — `registry/token-categories.ts` (853 lines)
THE SSOT for 8-axis encoding. 8 categories × N values each. CSS-ready tokenRefs. Derived Zod schemas, PresetSchema, encoding/decoding. COMPLETE.

### Preset Registry — `registry/presets.ts` (~860 lines)
~50 system presets. Map<string, PresetDefinition>. O(1) lookup. Wired to resolveVisual(). COMPLETE.

### Effects System — `effects/` (20+ files)
7 categories, registry, bridge, actions. COMPLETE.

### resolveVisual() — `registry/resolve-visual.ts`
Pipeline: kind defaults → preset → individual props → encoding override → ResolvedVisual. COMPLETE.

### Builder System (dsAdapter) — 60+ builders
Class-based, Synced state, ARIA, keyboard, data-cl-*. 1,286+ tests. COMPLETE.

### Vocabularies — `config/coldlight/vocabularies.cfg.ts`
ARIA_ROLES(68), ARIA_ATTRIBUTES(50+), KEYBOARD_KEYS(14), STATE_TOKENS(50+), SLOT_ACTIONS(20+), HTML_ELEMENTS(50+), FOCUS_STRATEGIES(5), SLOT_CHILDREN_MODES(3). COMPLETE.

---

## What's BROKEN — The Pipeline Gaps

### Gap 1: Manifest is EMPTY
`coldlight.manifest.json` has zero kinds (stale from 2026-02-16).
Scanner code exists but no build script calls scanColdLight() → writes JSON.
**Impact**: No auto-discovery. VPB, dev tools, generators have no manifest to read.

### Gap 2: No Tailwind @utility Generation from Token Categories
TOKEN_CATEGORY_REGISTRY has CSS-ready tokenRefs:
```
surface[1].tokenRefs = { background: "var(--glass-void)", "backdrop-filter": "blur(var(--blur-md))..." }
depth[1].tokenRefs = { "box-shadow": "var(--shadow-z1)" }
```
Comment says "generator dumps key:value pairs directly into @utility blocks."
BUT THAT GENERATOR DOES NOT EXIST.
The encoding `v-s1`, `v-d2`, etc. produces class names that reference nonexistent @utility rules.
**Impact**: The entire 8-axis encoding system is a dead letter in Tailwind. Classes exist in code but produce no CSS.

### Gap 3: Components Have Visual Concerns in Wrong Layer
Per locked architecture (2026-02-21): components/ = ARIA + state, ZERO visual. ui/ = styled.
Currently components/ has useColdLight(), ColdLightProps, recipes, data-encoding.
ui/ layer does not exist.
**Impact**: Layer violation. Users can't import components without visual. Components aren't reusable.

### Gap 4: No data-variant Attribute
Config: { kind, slot, state, id }. Missing: variant.
When preset "btn-primary" is applied, it should be `data-variant="btn-primary"` for CSS targeting.
**Impact**: Can't target variants in CSS without JS. Dev tools can't show variant.

### Gap 5: ID System is Basic
Counter-based `cl-${counter++}`. No collision prevention across SSR/hydration.
No structured format for debugging (doesn't include kind or slot in ID).
**Impact**: Works for now but fragile.

### Gap 6: No Build Pipeline Script
Individual pieces exist but no unified command:
- `pnpm ds:tokens:build` — SD5 only
- Scanner function exists but no CLI
- @utility generator doesn't exist
- Manifest write doesn't exist
**Impact**: Nothing auto-generates. Every change is manual.

---

## Architecture Vision (Owner's Spec)

1. **Contracts = SSOT master list** — declares everything about each primitive
2. **Config declares framework** — coldlight.config.ts says Svelte 5, tools read it
3. **Builders flow from contracts** — contract says slots/states/ARIA → builder implements
4. **dsAdapter creates components** — builder + primitive → component with proper props/IDs/styles
5. **data-kind, data-slot, data-variant** — SSOT attributes with children props tied to them
6. **Tailwind effects generated** — token category tokenRefs → @utility CSS, mapped as available presets
7. **Auto-growth** — add contract → run build → manifest/utilities/registry all update

---

## Real-World Patterns (2026)

### shadcn Registry Pattern
- `registry.json` = master list (SSOT)
- `shadcn build` reads it → generates per-component artifacts
- CLI resolves dependencies, transforms imports for target project
- ColdLight equivalent: contracts = master list, scanner = build, manifest = generated artifact

### Ark UI / Zag.js Anatomy
- `createAnatomy("button").parts("root", "label", "icon")` → machine-readable slot list
- Slots drive: styling recipes, ARIA mapping, manifest
- ColdLight equivalent: contract.slots = anatomy definition

### Ark UI / Zag.js ID System
- User provides root ID → machine derives all part IDs: `{id}:trigger:{itemId}`
- Deterministic, scoped, no collisions by construction
- ColdLight should adopt: `cl-{kind}-{slot}-{instance}`

### Tailwind v4 @theme + @utility
- `@theme { --color-surface-1: var(--token); }` → utility classes auto-generated
- `@utility v-s1 { background: var(--glass-void); }` → custom utilities
- ColdLight needs the @utility generation step

### DTCG 2025.10
- W3C stable token format. SD5 has first-class support.
- ColdLight already uses SD5 + DTCG 1.0. Aligned.

---

## Recommendations (Priority Order)

### P0: Tailwind @utility Generator
Create script that reads TOKEN_CATEGORY_REGISTRY → emits @utility CSS.
Output: `design/.generated/encoding-utilities.css`
```css
/* Auto-generated from TOKEN_CATEGORY_REGISTRY — DO NOT EDIT */
@utility v-s0 { background: transparent; }
@utility v-s1 { background: var(--glass-void); backdrop-filter: blur(var(--blur-md)) saturate(1.5); border: 1px solid oklch(from var(--color-teal-700) l c h / 0.22); }
@utility v-d1 { box-shadow: var(--shadow-z1); }
/* ... all 8 axes × all values */
```
This makes the entire 8-axis encoding system WORK.

### P1: Build Pipeline Script
Create `scripts/coldlight-build.ts` that runs:
1. SD5 token build (existing)
2. @utility generation from token categories (new)
3. Scanner → manifest (existing code, needs script wrapper)
Wire to: `pnpm coldlight:build`

### P2: Add data-variant to Attributes
Add `variant: "data-variant"` to `config/coldlight/attributes.cfg.ts`.
Apply in resolveVisual() or useColdLight() output.

### P3: Strengthen ID System
Pattern: `cl-{kind}-{counter}` with per-slot derivation: `cl-button-42`, `cl-button-42-icon`.
Use `crypto.randomUUID().slice(0, 8)` or structured counter.

### P4: Fix Component Layer
Strip visual from components/, create ui/ layer.
(Already planned in SPRINT-DSADAPTER-ALIGNMENT)

### P5: Wire Scanner to Build
Create CLI script that calls scanColdLight() → writes manifest.json.
Wire to: `pnpm coldlight:manifest`

---

## Files Referenced

- `coldlight.config.ts` + 8 config fragments
- `registry/token-categories.ts` — 8-axis SSOT (853 lines)
- `registry/presets.ts` — named presets (~860 lines)
- `registry/resolve-visual.ts` — resolution pipeline
- `scanner.ts` — build-time scanner (850 lines)
- `scanner.types.ts` — scanner types
- `.generated/coldlight.manifest.json` — EMPTY
- `effects/index.ts` — effects barrel
- `api/adapters/coldlight/builders/builder-metadata.ts` — ID system
- `config/coldlight/attributes.cfg.ts` — data attributes
- `config/coldlight/vocabularies.cfg.ts` — typed vocabularies
- `config/coldlight/generation.cfg.ts` — generation categories
