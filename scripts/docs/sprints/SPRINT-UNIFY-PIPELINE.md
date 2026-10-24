# SPRINT: Unify ColdLight Pipeline

> Written 2026-03-07 from full codebase audit. Every claim below is verified against disk.

---

## Goal

Eliminate confusion, dead layers, and disconnected pieces. Establish ONE pipeline where:

1. **dsadapters** own behavior (MeltUI passthrough OR ColdLight ARIA)
2. **Components** are ColdLight-prop-driven shells that cloak adapters — the ONLY public API
3. **Contracts** are unified per-kind schemas (structure + ARIA + visual axes + recipe)
4. **ColdLight rune store** provides global defaults + per-context overrides
5. **VPB** proves the entire system by loading schemas and rendering blocks

---

## Current State (Verified on Disk)

| Layer | What Exists | Problem |
|-------|-------------|---------|
| primitives/ | 92 kinds, 59 .svelte files (bare HTML shells), all have contract.ts | Shells are `<button {...rest}>` — zero value as separate files. Components already wrap them. Extra indirection. |
| dsadapters/coldlight/ | 59 kinds with real Builder classes (ARIA, keyboard, handlers) | Working. Well-structured. |
| dsadapters/meltui/ | 21 kinds with real melt/builders imports + adapter.contract.ts | Working. Passthrough principle correct. |
| components/ | 88 kinds, 167 .svelte files. Import primitive + builder + useColdLight + recipe | Working but import chain is: component → primitive → HTML. Primitive adds nothing. |
| recipes/ | 91 files, registerRecipe() system | Working. |
| registry/ | token-categories.ts (SSOT), presets.ts (56), resolve-visual.ts | Working. |
| config/ | 11 cfg files, ColdLightConfig type, vocabularies SSOT | Working but no runtime store. Build-time only. |
| ui/ | DOES NOT EXIST | Docs reference it. Kill the concept. |
| blocks/ | Only widgets/ is real (Widget, RadialGauge, SparkLine). Rest are READMEs. | Needs expansion for VPB. |
| VPB | Block schema exists (BlockNodeSchema, BlockDocumentSchema). No UI. | Not built. |
| Global store | useColdLight() exists per-component. No global config rune. | Missing. |

---

## Architecture Target

```
coldlight.config.ts (build-time SSOT)
    |
    v
token-categories.ts ──> SD5 build ──> tokens.css, tailwind.css, variants.css, types.ts
    |
    v
registry/presets.ts (56 named presets, 8-axis encoded)
    |
    v
registry/resolve-visual.ts (kind defaults -> preset -> props -> encoding)
    |
    v
ColdLight Rune Store ($state global + per-context overrides)
    |
    v
components/{kind}/ ─── THE public API, exported via design/index.js
    |   |
    |   ├── dsadapters/{engine}/_internal/{kind}/ (ARIA/behavior, never leaks)
    |   ├── recipes/components/{kind}/ (styling)
    |   ├── useColdLight() (reads from rune store + local props)
    |   └── unified contract (kind-schema.ts = structure + ARIA + visual + recipe)
    |
    v
blocks/{category}/ (page-level compositions using components)
    |
    v
VPB (loads kind-schemas, renders blocks, full encoding control)
```

---

## Phase 1: Flatten Primitives (absorb into components)

### What Changes

The primitive .svelte files are bare HTML shells (`<button data-kind="button" data-slot="root" class={cn(className)} {...rest}>`). They add zero value as separate files — the component already handles everything.

**Action:** Inline the primitive HTML into each component .svelte file. Delete the primitive .svelte files. Keep primitive contracts as the structural SSOT (rename to kind-schema).

### Before (current)
```
components/button/Button.svelte
  imports primitives/button/Button.svelte   <-- just <button {...rest}>
  imports dsadapters/coldlight/_internal/button/factory.ts
  calls useColdLight()

primitives/button/
  Button.svelte      <-- bare shell, delete
  contract.ts        <-- valuable, keep as kind-schema
  types.ts           <-- slot/state types, merge into unified types
  index.ts           <-- barrel, delete
```

### After (target)
```
components/button/
  Button.svelte      <-- renders <button> directly, spreads builder.root
  kind-schema.ts     <-- unified: structure + ARIA + visual axes + recipe ref
  types.ts           <-- component props (includes ColdLight visual props)
  recipe.ts          <-- styling
  index.ts           <-- barrel export
  Button.test.ts     <-- tests
```

### Migration Pattern (per kind)

For each of the 59 ColdLight-owned kinds that have a primitive .svelte:

1. Read the primitive .svelte (e.g., `<button data-kind="button" data-slot="root" class={cn(className)} {...rest}>`)
2. Move that HTML directly into the component .svelte (replace `<ButtonRoot {...builder.root} {...rest} class={classes}>` with `<button data-kind="button" data-slot="root" {...builder.root} {...rest} class={classes}>`)
3. Remove the primitive import from the component
4. Move `primitives/{kind}/contract.ts` to `components/{kind}/kind-schema.ts` (rename + extend)

For the 33 MeltUI-adapted kinds (contract-only primitives, no .svelte):

1. Move `primitives/{kind}/contract.ts` to `components/{kind}/kind-schema.ts`
2. No .svelte migration needed (MeltUI transport components already don't use primitive .svelte)

### Cleanup

After all migrations:
- Delete `primitives/` directory entirely
- Update all imports referencing `$lib/design/primitives/`
- Update `cn` import path (currently from `primitives/types.ts` — move to `utils/cn.ts`)
- Update config roots (remove primitivesRoot)

### Verification

- `pnpm svelte-check` passes with 0 errors
- `pnpm dev` starts without errors
- All existing component behavior preserved (data-kind, data-slot, class composition)

---

## Phase 2: Unified Kind Schema

### What Changes

Currently contracts are split across 3 places:
- `primitives/{kind}/contract.ts` — structure, slots, ARIA, states
- `components/{kind}/contract.ts` — component-level contract (when it exists)
- `recipes/components/{kind}/types.ts` — recipe shape

Unify into ONE schema per kind: `components/{kind}/kind-schema.ts`

### Schema Shape

```typescript
import { z } from "zod";
import { PresetSchema } from "$lib/design/registry/token-categories.js";

export const ButtonKindSchema = z.object({
  // Identity
  kind: z.literal("button"),
  engine: z.enum(["coldlight", "meltui"]),

  // Structure (from primitive contract)
  compound: z.boolean(),
  slots: z.object({
    required: z.array(z.string()),
    optional: z.array(z.string()),
  }),
  slotSpec: z.record(z.object({
    element: z.string(),
    aria: z.object({
      role: z.string().optional(),
      required: z.array(z.string()),
      optional: z.array(z.string()),
    }),
  })),

  // States + keyboard (from primitive contract)
  states: z.object({
    shared: z.array(z.string()),
    specific: z.array(z.string()),
  }),
  keyboard: z.array(z.string()),
  focusStrategy: z.enum(["none", "trap", "roving", "activedescendant", "redirect"]),

  // Visual axes (from token-categories, partial preset)
  defaultPreset: z.string().optional(),
  visualDefaults: PresetSchema.partial().optional(),

  // Recipe reference
  recipeId: z.string().optional(),

  // VPB metadata
  vpb: z.object({
    category: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

export type ButtonKindDef = z.infer<typeof ButtonKindSchema>;
```

### What This Enables

- VPB loads kind-schemas to build its palette (knows all slots, states, visual axes)
- Contracts cross-reference: types inferred from schema, recipe validates against schema
- One file to read to understand everything about a kind
- Scanner validates ONE schema instead of stitching 3 together

---

## Phase 3: ColdLight Rune Store

### What Changes

Currently `useColdLight()` resolves visual props per-component with no global context. Adding:

1. **Global ColdLight store** — `$state` object with system-wide defaults (theme, accent, default preset overrides)
2. **Context provider** — Svelte context that overrides global for a subtree (e.g., sidebar uses different defaults than main content)
3. **useColdLight() reads both** — merges global → context → component props

### Files

```
design/
  store/
    coldlight-store.svelte.ts    <-- global $state rune store
    coldlight-provider.svelte    <-- context provider component
    coldlight-context.ts         <-- getContext/setContext helpers
    index.ts                     <-- barrel
```

### Store Shape

```typescript
interface ColdLightStore {
  // Global theme defaults
  theme: {
    accent: AccentToken;          // "teal" | "purple" | etc.
    surface: SurfaceId;           // default surface for all components
    depth: DepthId;               // default depth
    transition: TransitionId;     // default transition speed
  };

  // Per-kind preset overrides (global level)
  kindDefaults: Partial<Record<string, string>>;  // kind → preset name

  // Feature flags
  features: {
    animations: boolean;          // master motion toggle
    glows: boolean;               // master glow toggle
    bevels: boolean;              // master bevel toggle
  };
}
```

### Context Provider

```svelte
<!-- ColdLightProvider.svelte -->
<script lang="ts">
  import type { ColdLightStore } from "./coldlight-store.svelte.js";

  let { overrides, children }: { overrides: Partial<ColdLightStore>; children: Snippet } = $props();

  // Merges parent context + overrides, sets new context for children
</script>

{@render children()}
```

### useColdLight() Update

```typescript
export function useColdLight(getProps, kindDefaults) {
  const globalStore = getColdLightStore();      // global $state
  const contextOverrides = getColdLightContext(); // nearest provider

  const resolved = $derived(resolveVisual(
    mergeProps(globalStore, contextOverrides, getProps()),
    kindDefaults
  ));

  return { /* same getters as before */ };
}
```

### Platform Settings Tab

Route: `/devpulse/settings` (already exists, currently placeholder)

UI: ColdLight config panel that reads/writes the global store:
- Accent color picker
- Default surface selector
- Animation/glow/bevel toggles
- Per-kind preset overrides (dropdown per kind)

---

## Phase 4: VPB (Visual Page Builder)

### What It Proves

- Kind-schemas load correctly and describe all component capabilities
- Encoding system (v-s1d2g3) applies visuals in real-time
- Presets resolve through the full pipeline
- Blocks compose from components
- ColdLight store overrides work at context boundaries

### Files

```
design/
  vpb/
    VpbCanvas.svelte           <-- drop zone, renders block tree
    VpbPalette.svelte          <-- component picker (reads kind-schemas)
    VpbInspector.svelte        <-- 8-axis visual controls per selected block
    VpbPresetPicker.svelte     <-- preset browser
    VpbBlockTree.svelte        <-- block hierarchy view
    vpb-store.svelte.ts        <-- VPB state (selected block, document, undo stack)
    index.ts
```

### Route

`/devpulse/vpb` — new page under the devpulse app group

### VPB Inspector

For each selected block, shows:
- Kind name + description (from kind-schema)
- 8 visual axis controls (surface dropdown, depth slider, glow picker, etc.)
  - Control types come from `vpbControl` field in token-categories.ts (already declared)
- Preset picker (filters presets by selected kind)
- Live encoding string display (v-s1d2g3...)
- Slot list with per-slot state toggles

### Block Schema (Already Exists)

```typescript
// blocks/schema.ts — BlockNodeSchema, BlockDocumentSchema
// Already defines: kind, props, children, slots
// VPB will extend with: visual encoding, preset ref, context boundary flag
```

---

## Phase 5: Cleanup + Docs

1. Delete `primitives/` directory (after Phase 1 migration)
2. Remove all CLAUDE.md references to `ui/` layer
3. Update CLAUDE.md layer documentation to reflect 3-layer model: dsadapters → components → blocks
4. Update coldlight.config.ts (remove primitivesRoot, add store config)
5. Update `coldlight:generate` to read kind-schemas from components/ instead of primitives/
6. Run `pnpm svelte-check`, `pnpm dev`, all tests

---

## Execution Order

| Phase | Depends On | Estimated Scope |
|-------|-----------|----------------|
| Phase 1: Flatten primitives | Nothing | 92 kinds to migrate, mechanical |
| Phase 2: Unified kind-schema | Phase 1 | Schema design + migration of 92 contracts |
| Phase 3: ColdLight rune store | Phase 2 (reads kind-schemas) | 4 new files + useColdLight update + settings UI |
| Phase 4: VPB | Phase 2 + 3 | 6 new files + route + inspector controls |
| Phase 5: Cleanup | All above | Docs + config + scanner updates |

---

## Risks

1. **Import chain breakage** — Phase 1 touches every component. Must verify svelte-check after each batch.
2. **cn() path** — Currently imported from `primitives/types.ts`. Must move to `utils/cn.ts` FIRST before deleting primitives.
3. **MeltUI transport components** — Some compound components (dialog, tabs) use ColdLight-owned ARIA via `.svelte.ts` files in dsadapters. These DON'T use primitive .svelte files. No migration needed for those.
4. **Scanner/manifest** — `coldlight:generate` currently reads from primitives/. Must update to read from components/kind-schema.ts.
5. **Existing tests** — Must not break. Run full test suite after each phase.

---

## Decision Log

| Question | Answer | Rationale |
|----------|--------|-----------|
| Kill ui/ layer? | YES | Components already are the public API. Extra layer adds confusion. |
| Primitives as separate .svelte files? | NO — absorb into components | Bare HTML shells add zero value. Contract data moves to kind-schema. |
| Global + contextual store? | YES — both | 2026 design systems use theme providers. Global defaults + subtree overrides. |
| One schema per kind? | YES | Unifies structure + ARIA + visual + recipe into one Zod-validated file. |
| VPB now? | YES | Proves the pipeline end-to-end. Forces every layer to actually work together. |
