# SPRINT: Kind Registry — Populate All Component Kinds

**Status**: PLANNED
**Priority**: P1 — The registry feeds A2UI catalog, VPB manifest, and preset resolution.
**Prerequisites**: SPRINT-PIPELINE-VALIDATION, SPRINT-TABS-FIX
**Category**: ColdLight / Registry

---

## Problem Statement

The kind-definitions registry has a complete Zod schema and registration function, but only 2 kinds are registered (button, card). There are 89 component folders on disk. Each needs a kind definition so the system knows: which engine owns ARIA, what the default preset is, what recipe to use, what block category it belongs to, and what 8-axis properties are required. Without this, the A2UI catalog has no component inventory, VPB can't generate controls, and preset resolution falls back to defaults.

---

## Pre-Execution Research (Verified 2026-03-21)

### What Exists (Verified on Disk)

| Asset | Status |
|-------|--------|
| Kind definition schema | `registry/kind-definitions.ts` — Zod schema complete |
| Registration function | `define()` in kind-definitions.ts |
| Registered kinds | **2 only**: button, card |
| Component folders | **89** in `components/` |
| Primitive folders | **92** in `primitives/` |
| Recipe folders | **32+** in `recipes/components/` |
| Preset entries | **60+** in `registry/presets.ts` |

### Kind Definition Schema (from disk)

```typescript
z.object({
  kind: z.string(),              // "button"
  label: z.string(),             // "Button"
  engine: z.enum(["coldlight", "meltui"]),
  defaultPreset: z.string(),     // "btn-primary"
  defaultRecipe: z.string(),     // "button.glass.void"
  blockCategory: z.enum([...]),  // "interactions"
  requiredAxes: z.array(...),    // ["surface", "depth", "transition"]
  compound: z.boolean(),         // has child slots?
  container: z.boolean(),        // can contain blocks in VPB?
  containerSlots: z.array(z.string()).optional(),
})
```

### Block Categories (from blocks/kinds.ts)

Verified categories: surfaces, interactions, navigation, data, layout, feedback, media, widgets

### What This Enables

1. **A2UI catalog** — each registered kind = one component the AI can reference
2. **VPB manifest** — VPB reads kind-definitions to know what components exist and what controls to generate
3. **Preset resolution** — `resolve-visual.ts` uses kind definition to find defaults
4. **Component validation** — schema enforcement at build time

---

## Tasks

### Task 1: Inventory all 89 component folders
List every folder in `components/`, check if it has: `.svelte` file, `contract.ts`, `types.ts`, `index.ts`, recipe in `recipes/components/`.

### Task 2: Cross-reference with primitives
For each component, check if a matching primitive exists in `primitives/`. This determines `engine`:
- Has ColdLight primitive with ARIA → `engine: "coldlight"`
- Uses MeltUI adapter → `engine: "meltui"`
- No primitive (block-level) → `engine: "coldlight"`

### Task 3: Cross-reference with recipes
For each component, check if a recipe exists in `recipes/components/{kind}/`. Extract the recipe name for `defaultRecipe`.

### Task 4: Cross-reference with presets
For each component, check if presets exist in `registry/presets.ts`. Extract the first preset name for `defaultPreset`.

### Task 5: Register all kinds
Add `define()` calls for every component kind. Each must have real values — no placeholders, no "TODO".

### Task 6: Validate
Run the kind-definitions module — the runtime sync assertion will catch any mismatches.

---

## Execution Pattern

This is mechanical but must be accurate. For each of the 89 component folders:
1. Read the folder contents
2. Determine engine from primitive
3. Find recipe name
4. Find preset name
5. Determine block category
6. Determine required axes from the component's visual usage
7. Add `define()` call

Batch in groups of 10-15 to keep compilation checks manageable.

---

## Exit Criteria

- All 89 component kinds registered in kind-definitions.ts
- Each registration has real values (engine, preset, recipe, category, axes)
- `kind-definitions.ts` module loads without assertion errors
- A2UI catalog has full component inventory
- VPB manifest reflects all kinds

---

## Files Changed

| File | Action |
|------|--------|
| `registry/kind-definitions.ts` | MODIFY — add ~87 more `define()` calls |
