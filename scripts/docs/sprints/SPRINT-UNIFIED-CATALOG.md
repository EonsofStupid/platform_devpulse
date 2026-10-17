# SPRINT: Unified Catalog — Make ColdLight's Manifest REAL

> **Status**: READY FOR APPROVAL
> **Date**: 2026-03-02
> **Research**: `SPRINT-UNIFIED-CATALOG.research.md`
> **Depends On**: Existing contracts, scanner, token pipeline, recipes, presets, effects
> **Blocks**: VPB consumption, AI guidance, wizard UI, dynamic composition

---

## Problem Statement

ColdLight has real working pieces — 89 contracts, 61 builders, 59 primitives, 82 components, 50 recipes, 50 presets, 7 effect categories, full SD5 token pipeline. But there is NO unified manifest that catalogs all of this for VPB/AI consumption. The scanner manifest has been empty since Feb 16. The token manifest has encoding data but zero components. VPB reads an empty file.

**Until a unified catalog exists, VPB is blind, AI has nothing to guide from, and the system cannot auto-grow.**

---

## Phase 1: Unblock the Scanner (THE BLOCKER)

### Task 1.1: Make parity errors non-fatal

File: `config/coldlight/enforcement.cfg.ts`

Change `failOnParity: true` to allow the scanner to emit a manifest even when some primitives lack implementations. The scanner should:
- Collect parity errors as warnings
- Still emit the manifest with all valid entries
- Mark incomplete kinds with `status: "contract-only"` vs `status: "complete"`

```typescript
export const ENFORCEMENT = {
  mode: "strict",
  failOnParity: false,     // ← was true, blocks manifest entirely
  failOnContractLoad: true, // keep — bad contracts are fatal
  warnOnParity: true,       // NEW — emit warnings, don't abort
  lefthook: {
    enabled: true,
    verifyCmd: "pnpm coldlight:verify",
  },
} as const;
```

### Task 1.2: Update scanner to emit partial manifest

File: `scanner.ts`

The scanner currently returns `{ valid: false, manifest: null }` when parity errors exist. Change to:
- Return the manifest WITH the errors (don't null it out)
- Add `status` field to each ManifestPrimitive: "complete" | "contract-only" | "no-contract"
- Only return null if `failOnContractLoad` errors occur (truly fatal)

### Task 1.3: Update ManifestPrimitive type

File: `scanner.types.ts`

Add implementation status:
```typescript
export interface ManifestPrimitive {
  // ... existing fields ...
  readonly status: "complete" | "contract-only" | "no-contract";
}
```

### Task 1.4: Run `pnpm coldlight:generate` and verify output

Expected: `.generated/coldlight.manifest.json` populated with all 89 primitives (37 complete, 52 contract-only), plus components, recipes, effects.

---

## Phase 2: Merge Into ONE Unified Manifest

### Task 2.1: Design unified manifest schema

The build pipeline should produce ONE manifest that combines:
- **tokens**: encoding categories, token enums, generated files (from SD5)
- **primitives**: kind, status, contract, builder, data attributes, available presets (from scanner)
- **components**: kind, primitiveKind, slots, ARIA, states, keyboard (from scanner)
- **recipes**: id, kind, label, defaults (from scanner)
- **presets**: id, category values (from preset registry)
- **effects**: id, category, classes, triggers (from scanner)

### Task 2.2: Update build.ts to merge both sources

File: `scripts/dev/design/sd/build.ts`

After SD5 build completes:
1. Import scanner function
2. Run scanner (with parity=warn)
3. Merge token data + scanner data into unified manifest
4. Write ONE `generated/coldlight.manifest.json`

### Task 2.3: Update VPB manifest-reader

File: `sys/debug/vpb/manifest/manifest-reader.ts`

Point at `generated/coldlight.manifest.json` (the unified one).
Update `ColdLightManifest` type to include tokens section.

### Task 2.4: Remove stale `.generated/` directory

After migration, the `.generated/` directory is dead. Remove it.
Update `generation.cfg.ts` to point to `generated/`.

---

## Phase 3: Wire data-variant and data-id to DOM

### Task 3.1: Update component base pattern

Every component that uses `useColdLight()` needs to render:
- `data-variant={visual.variant}` — which preset was applied
- `data-id={builder.ids.root}` — unique structured ID

### Task 3.2: Update Button.svelte as reference implementation

```svelte
<ButtonRoot
  {...builder.root}
  {...rest}
  class={classes}
  data-encoding={visual.encoding || undefined}
  data-variant={visual.variant || undefined}
  data-id={builder.ids.root}
>
```

### Task 3.3: Apply to all 82 components

Mechanical update: add `data-variant` and `data-id` to each component's root element.

---

## Phase 4: Enrich Manifest with Per-Kind Metadata

### Task 4.1: Add preset associations per kind

The manifest should list which presets are available for each kind:
```json
{
  "kind": "button",
  "presets": ["btn-primary", "btn-secondary", "btn-ghost", "btn-danger", "btn-outline"]
}
```

Source: `registry/presets.ts` already groups presets by kind prefix.

### Task 4.2: Add recipe associations per kind

```json
{
  "kind": "button",
  "recipes": ["button.glass.void"]
}
```

Source: `recipes/components/{kind}/` directories.

### Task 4.3: Add per-slot child prop documentation

Each slot should list its props:
```json
{
  "slotSpec": {
    "root": {
      "element": "button",
      "children": "snippet",
      "aria": { "role": "button", "optional": ["aria-pressed"] },
      "dataAttributes": ["data-kind", "data-slot", "data-state", "data-variant", "data-id"],
      "cssTarget": "[data-kind='button'][data-slot='root']"
    }
  }
}
```

### Task 4.4: Add category tags for organization

```json
{ "kind": "button", "categories": ["action", "form", "interactive"] }
{ "kind": "dialog", "categories": ["overlay", "modal", "interactive"] }
{ "kind": "badge", "categories": ["display", "status"] }
```

---

## Phase 5: Unified Build Command

### Task 5.1: Create `pnpm ds:build` (unified)

New script that runs the full pipeline:
1. SD5 token build (tokens, tailwind, types, DTCG)
2. Variant/typography/focus/scrollbar/keyframe generation
3. Scanner (parity=warn) → primitives, components, recipes, effects
4. Merge → unified manifest
5. Report: X primitives (Y complete, Z contract-only), N components, M recipes, K presets

### Task 5.2: Wire to package.json

```json
{
  "ds:build": "tsx scripts/dev/design/sd/build.ts",
  "ds:build:full": "tsx scripts/dev/design/sd/build-unified.ts"
}
```

---

## Phase 6: Verification

### Task 6.1: Unified manifest has ALL sections
- tokens (8 categories, 59 values, 17 enums)
- primitives (89 kinds with status)
- components (82 kinds with contract data)
- recipes (50+ with defaults)
- presets (50 with encoding values)
- effects (7 categories)

### Task 6.2: VPB can read the manifest
- loadManifest() returns non-null
- getPrimitiveFromManifest("button") returns full contract data
- getRecipesFromManifest("button") returns recipe entries

### Task 6.3: data-variant and data-id appear in DOM
- Render `<Button intent="primary">` → inspect DOM
- `data-variant="btn-primary"` present
- `data-id="cl-button-root-0"` present

### Task 6.4: Auto-growth works
- Add a new contract to `primitives/test-widget/contract.ts`
- Run `pnpm ds:build:full`
- Manifest includes `test-widget` with `status: "contract-only"`

---

## Execution Strategy

### Wave 1: Unblock (Phase 1)
Make scanner produce output. This is the single biggest blocker.

### Wave 2: Unify (Phase 2)
Merge token + scanner into ONE manifest. Kill the dual-manifest confusion.

### Wave 3: Wire DOM (Phase 3)
data-variant and data-id rendered in every component.

### Wave 4: Enrich (Phase 4)
Presets, recipes, categories, per-slot docs in the manifest.

### Wave 5: Pipeline (Phase 5)
One command builds everything.

### Wave 6: Verify (Phase 6)
End-to-end: add contract → build → manifest updated → VPB sees it.

---

## What This Sprint Does NOT Cover

1. **VPB wizard UI** — separate sprint, depends on manifest existing
2. **AI guidance integration** — separate sprint, depends on manifest existing
3. **Framework attuning** (TSX support) — separate sprint
4. **Implementing the 52 missing primitives** — separate sprint
5. **Creating the ui/ layer** — separate sprint (DSADAPTER-ALIGNMENT)
6. **SEO/metadata sections** — Phase 4 extensible, but full SEO is separate

---

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| Scanner produces manifest | `.generated/` or `generated/` has non-empty manifest with primitives |
| Unified manifest exists | ONE file with tokens + primitives + components + recipes + presets + effects |
| data-variant in DOM | At least 1 component renders data-variant from resolveVisual() |
| data-id in DOM | At least 1 component renders structured ID from builder |
| VPB reads manifest | loadManifest() returns non-null with real data |
| Auto-growth works | Add contract → build → manifest includes new kind |
| Build command | `pnpm ds:build:full` runs complete pipeline |
