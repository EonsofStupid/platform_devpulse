# SPRINT: ColdLight Pipeline — Wire the SSOT End-to-End

> **Status**: READY FOR APPROVAL
> **Date**: 2026-03-02
> **Research**: `SPRINT-COLDLIGHT-PIPELINE.research.md`
> **Depends On**: Existing token-categories.ts (SSOT), scanner.ts, contracts
> **Blocks**: Component layer fix, [DELETED — no ui/ layer. Components ARE the styled final product], VPB integration, dev tool manifest consumption

---

## Problem Statement

The ColdLight infrastructure is built — config, contracts, scanner, token categories, presets, effects, 60+ builders, resolveVisual(). But the pipeline doesn't flow end-to-end:

1. **The 8-axis encoding produces class names (`v-s1`, `v-d2`) with NO CSS behind them** — the @utility generator doesn't exist
2. **The manifest is empty** — scanner code exists but hasn't been wired to a build script
3. **No build command** — individual tools exist but no unified pipeline
4. **No data-variant attribute** — can't CSS-target which variant is applied

Until the @utility generator exists, **the entire visual encoding system is dead** — resolveVisual() produces class names that do nothing.

---

## Prerequisites

- [x] TOKEN_CATEGORY_REGISTRY exists with CSS-ready tokenRefs (8 axes, ~60 values total)
- [x] Scanner code exists (850 lines, fully functional)
- [x] Contracts exist (87+, Zod-validated)
- [x] Preset registry exists (~50 system presets)
- [x] Effects system exists (7 categories)
- [x] resolveVisual() pipeline works (produces encoding strings + segments)
- [ ] Node.js fs available for build scripts

---

## Phase 0: Verify Current State

### Task 0.1: Check if encoding utilities already exist somewhere
```bash
cd interfaces/desktop
grep -r "@utility v-" src/lib/design/ --include="*.css"
```
If found: document where. If not: confirms gap.

### Task 0.2: Run scanner manually to see errors
```bash
cd interfaces/desktop && pnpm svelte-check
```

### Task 0.3: Verify token-categories.ts compiles
```bash
cd interfaces/desktop && npx tsc --noEmit src/lib/design/registry/token-categories.ts
```

---

## Phase 1: Tailwind @utility Generator (THE CRITICAL FIX)

### Task 1.1: Create generator script

File: `interfaces/desktop/src/lib/design/.generated/generate-encoding-utilities.ts`

Reads: `TOKEN_CATEGORY_REGISTRY` from `registry/token-categories.ts`
Writes: `design/.generated/encoding-utilities.css`

Logic:
```typescript
for each category in TOKEN_CATEGORY_REGISTRY:
  for each value in category.values:
    emit `@utility v-${category.code}${value.index} {`
    for each [property, cssValue] in value.tokenRefs:
      emit `  ${property}: ${cssValue};`
    emit `}`
```

Output example:
```css
/* @generated — DO NOT EDIT. Source: registry/token-categories.ts */
/* Surface (s) — 8 values */
@utility v-s0 { background: transparent; }
@utility v-s1 { background: var(--glass-void); backdrop-filter: blur(var(--blur-md)) saturate(1.5); border: 1px solid oklch(from var(--color-teal-700) l c h / 0.22); }
@utility v-s2 { background: var(--glass-deep); backdrop-filter: blur(var(--blur-lg)) saturate(1.3); border: 1px solid oklch(from var(--color-teal-600) l c h / 0.18); }
/* ... */

/* Depth (d) — 5 values */
@utility v-d0 { box-shadow: none; }
@utility v-d1 { box-shadow: var(--shadow-z1); }
@utility v-d2 { box-shadow: var(--shadow-z2); }
/* ... */

/* Bevel (b) — 5 values */
@utility v-b0 { }
@utility v-b1 { box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.06), inset 0 -1px 0 oklch(0 0 0 / 0.1); }
/* ... */

/* Glow (g) — 7 values */
@utility v-g0 { }
@utility v-g1 { box-shadow: var(--shadow-glow-teal); }
/* ... */

/* Frame (f) — 5 values */
/* Motion (m) — 9 values */
/* Transition (t) — 10 values */
/* Material (z) — 10 values */
```

### Task 1.2: Handle shadow composition

Multiple axes produce `box-shadow` (depth, bevel, glow, frame). They need to COMPOSE, not override.
Strategy: Use CSS custom properties for shadow layering:
```css
@utility v-d1 { --cl-shadow-depth: var(--shadow-z1); box-shadow: var(--cl-shadow-depth, none), var(--cl-shadow-bevel, none), var(--cl-shadow-glow, none); }
@utility v-b1 { --cl-shadow-bevel: inset 0 1px 0 oklch(1 0 0 / 0.06), inset 0 -1px 0 oklch(0 0 0 / 0.1); }
@utility v-g1 { --cl-shadow-glow: var(--shadow-glow-teal); }
```

This way `v-d1 v-b1 v-g1` composes all three shadow layers.

### Task 1.3: Import generated CSS in app entry

In `design/index.css` or equivalent, add:
```css
@import "./.generated/encoding-utilities.css";
```

### Task 1.4: Verify encoding utilities work

Create a test page or component that uses `class="v-s1 v-d2 v-g6"` and inspect computed styles.

---

## Phase 2: Build Pipeline Script

### Task 2.1: Create unified build script

File: `interfaces/desktop/scripts/coldlight-build.ts`

Steps:
1. Run SD5 token build (existing `ds:tokens:build`)
2. Run @utility generator (Phase 1)
3. Run scanner → write manifest (existing scanner code + fs.writeFileSync)

### Task 2.2: Wire to package.json

```json
{
  "scripts": {
    "coldlight:build": "tsx scripts/coldlight-build.ts",
    "coldlight:manifest": "tsx scripts/coldlight-manifest.ts",
    "coldlight:generate": "tsx scripts/coldlight-generate.ts"
  }
}
```

### Task 2.3: Run and verify manifest output

```bash
cd interfaces/desktop && pnpm coldlight:build
```

Expected: `coldlight.manifest.json` populated with all 87+ primitive kinds, component kinds, effect definitions, recipe entries.

---

## Phase 3: Add data-variant Attribute

### Task 3.1: Update attributes config

File: `config/coldlight/attributes.cfg.ts`
```typescript
export const ATTRIBUTES = {
  kind: "data-kind",
  slot: "data-slot",
  state: "data-state",
  id: "data-id",
  variant: "data-variant",  // NEW — tracks applied preset/variant
} as const;
```

### Task 3.2: Update ColdLightConfig type

Add `variant` to the attributes type if it's typed.

### Task 3.3: Apply in resolveVisual() output

Add `variant` field to `ResolvedVisual`:
```typescript
interface ResolvedVisual {
  // existing...
  variant: string | undefined;  // preset ID that was applied
}
```

### Task 3.4: Apply data-variant in components

Components that use resolveVisual() should spread `data-variant={visual.variant}` on root.

---

## Phase 4: Strengthen ID System

### Task 4.1: Update builder-metadata.ts

Change ID format from `cl-${counter++}` to `cl-{kind}-{counter}`:
```typescript
export function createBuilderMetadata(name: string, parts: string[]) {
  // ...
  createIds(): Record<string, string> {
    const instance = counter++;
    const ids: Record<string, string> = {};
    parts.forEach(part => {
      ids[part] = `cl-${name}-${part}-${instance}`;
    });
    return ids;
  }
}
```

### Task 4.2: Verify no test breakage

IDs changed format → some tests may assert specific ID strings.
```bash
cd interfaces/desktop && npx vitest run
```

---

## Phase 5: Verification

### Task 5.1: Encoding utilities generate valid CSS
```bash
cd interfaces/desktop && pnpm coldlight:build
# Check .generated/encoding-utilities.css exists and has content
```

### Task 5.2: Manifest is populated
```bash
cat src/lib/design/.generated/coldlight.manifest.json | head -50
# Should show version, adapters, primitives with kinds array
```

### Task 5.3: Encoding classes produce computed styles
Apply `class="v-s1 v-d2 v-g6"` to a div. Inspect:
- background should be glass-void
- box-shadow should have depth z2 + glow cyber
- backdrop-filter should have blur

### Task 5.4: Shadow composition works
Apply `class="v-d2 v-b2 v-g1"` (depth + bevel + glow). All three shadow layers should compose.

### Task 5.5: data-variant appears in DOM
Apply preset "btn-primary" to a button. Inspect DOM:
- `data-variant="btn-primary"` should be present

---

## Execution Strategy

### Wave 1: The Generator (CRITICAL PATH)
- Phase 0: Verify state
- Phase 1: @utility generator + shadow composition + import + verify

### Wave 2: Build Pipeline
- Phase 2: Build script + package.json + manifest verification

### Wave 3: Attributes + IDs
- Phase 3: data-variant
- Phase 4: ID system

### Wave 4: Verification
- Phase 5: All checks

---

## What This Sprint Does NOT Cover

1. **Component layer fix** — Stripping visual from components/ → separate sprint (DSADAPTER-ALIGNMENT)
2. **[DELETED — no ui/ layer. Components ARE the styled final product] creation** — Creating ui/ wrappers → separate sprint
3. **VPB integration** — VPB consuming manifest → separate sprint
4. **New builders** — Existing 60+ are correct
5. **New primitives** — Existing 87+ are correct
6. **Test coverage** — Separate sprint
7. **CI/CD integration** — Lefthook verify command → separate sprint

---

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| @utility CSS generated | `.generated/encoding-utilities.css` exists with rules for all 8 axes |
| Encoding classes work | `v-s1 v-d2 v-g6` produces real computed styles |
| Shadow composition | `v-d2 v-b2 v-g1` composes three shadow layers |
| Manifest populated | `coldlight.manifest.json` has 87+ primitive kinds |
| Build command | `pnpm coldlight:build` runs full pipeline |
| data-variant | Attribute appears in DOM when preset applied |
| ID format | IDs include kind name for debugging |
