# Taxonomy

> **The SSOT backbone. Everything derives from here.**

---

## The One Rule

> **If taxonomy doesn't know about it, it doesn't exist in ColdLight.**

---

## Purpose

Taxonomy is the **single source of truth** for:

1. **Primitive Kinds** — All `data-kind` values
2. **Primitive Slots** — Slots per primitive
3. **State Enums** — Valid `data-state` values
4. **Blueprint Registry** — All prebuilt assemblies
5. **Contracts** — Zod schemas for prop validation
6. **Variant Keys** — Allowed surfaces, materials, layers

---

## Generator Role

Taxonomy is **machine-readable**. It generates:

| Output | Generated From |
|--------|----------------|
| Registry manifest | `primitiveKinds.ts` + `primitiveRegistry.ts` |
| API documentation | Taxonomy + JSDoc |
| Type definitions | `contracts.ts` |
| Diagrams | Taxonomy structure |
| Validation rules | Contracts + registries |

**Taxonomy → Vite Plugin → Generated Files**

---

## Files

| File | Purpose | Editable? |
|------|---------|-----------|
| `primitiveKinds.ts` | All primitive kind values | ✅ SSOT |
| `primitiveRegistry.ts` | Slots + metadata per primitive | ✅ SSOT |
| `blueprintRegistry.ts` | All blueprint definitions | ✅ SSOT |
| `variantKeys.ts` | Allowed s/z/l/t/m values | ✅ SSOT |
| `contracts.ts` | Prop schemas (Zod) | ✅ SSOT |
| `kinds.ts` | Block kind definitions | ✅ SSOT |
| `slots.ts` | Block slot definitions | ✅ SSOT |
| `index.ts` | Barrel export (SSOT) | ✅ Export only |

---

## Taxonomy First Principle

**Before writing ANY code:**

1. ✅ Verify kind exists in `primitiveKinds.ts`
2. ✅ Verify slots exist in `primitiveRegistry.ts`
3. ✅ Verify state enum exists (if stateful)
4. ✅ THEN write the component

**Violation = Audit failure at commit time.**

---

## Primitive Kinds (43 total)

### Buttons & Toggles
`button`, `toggle`, `toggleGroup`, `switch`

### Inputs & Forms
`checkbox`, `radioGroup`, `slider`, `label`, `input`, `textarea`, `select`, `combobox`

### Date & Time
`calendar`, `dateField`, `datePicker`, `timeField`

### Dialogs & Overlays
`dialog`, `alertDialog`, `popover`, `hoverCard`, `tooltip`, `contextMenu`, `dropdownMenu`

### Navigation
`tabs`, `accordion`, `collapsible`, `navigationMenu`, `menubar`, `pagination`, `breadcrumb`

### Layout & Display
`aspectRatio`, `avatar`, `separator`, `scrollArea`, `progress`

### Feedback
`toast`, `alert`, `badge`, `skeleton`, `spinner`

### Utilities
`portal`, `presence`, `focusTrap`, `visuallyHidden`, `liveStatus`, `kbd`

### Data Display
`dataTable`, `chart`, `command`

---

## Variant Key Registry

Taxonomy owns allowed values for variant encoding.

```typescript
// taxonomy/variantKeys.ts

export const SurfaceValues = [1, 2, 3, 4, 5] as const;
export const MaterialValues = [1, 2, 3, 4, 5] as const;
export const LayerValues = [1, 2, 3, 4, 5] as const;
export const TransitionValues = [0, 1, 2, 3] as const;
export const MotionValues = [0, 1, 2, 3] as const;

export type Surface = typeof SurfaceValues[number];
export type Material = typeof MaterialValues[number];
export type Layers = typeof LayerValues[number];
export type Transition = typeof TransitionValues[number];
export type Motion = typeof MotionValues[number];
```

Codegen validates against these. Invalid variants fail at build.

---

## Checklist

### Before Adding a Primitive Kind

- [ ] Kind name is lowercase, camelCase
- [ ] Added to `primitiveKinds.ts`
- [ ] Slots defined in `primitiveRegistry.ts`
- [ ] Metadata added (description, meltBuilder, etc.)
- [ ] State enum created if stateful
- [ ] Contract added to `contracts.ts`

### Before Adding a Blueprint

- [ ] Primitive exists and is registered
- [ ] Blueprint ID is unique (`kind.variant` format)
- [ ] Added to `blueprintRegistry.ts`
- [ ] Variant key is valid

### Before Adding Variant Values

- [ ] Added to `variantKeys.ts`
- [ ] Recipe CSS supports the value
- [ ] Documented in TERMINOLOGY.md

### Validation

- [ ] `pnpm check` passes
- [ ] `pnpm audit:taxonomy` passes
- [ ] No duplicate kind names
- [ ] All slots are unique per kind

---

## Audit Pipeline

```bash
# Run taxonomy audit
pnpm audit:taxonomy

# Checks:
# ✅ All primitives have kinds
# ✅ All kinds have slots
# ✅ All blueprints reference valid primitives
# ✅ All variant keys are valid
# ✅ No orphaned files
```

Audit runs automatically via lefthook at commit time.

---

## Auto-Documentation

When taxonomy changes:

1. Audit scans registry files
2. Validates all primitives have metadata
3. Generates `docs/api/taxonomy.md`
4. Updates diagrams
5. Docusaurus picks up changes

**No manual documentation edits.**

---

## Index Export Pattern

```typescript
// taxonomy/index.ts

// Kinds
export { PrimitiveKinds } from './primitiveKinds.js';
export type { PrimitiveKind } from './primitiveKinds.js';

// Registry
export { PrimitiveRegistry } from './primitiveRegistry.js';
export type { PrimitiveEntry, SlotEntry } from './primitiveRegistry.js';

// Blueprints
export { BlueprintRegistry } from './blueprintRegistry.js';
export type { Blueprint, BlueprintId } from './blueprintRegistry.js';

// Variants
export { SurfaceValues, MaterialValues, LayerValues, TransitionValues, MotionValues } from './variantKeys.js';
export type { Surface, Material, Layers, Transition, Motion } from './variantKeys.js';

// Contracts
export { DialogPropsSchema, ButtonPropsSchema } from './contracts.js';

// Block kinds
export { BlockKinds } from './kinds.js';
export { BlockSlots } from './slots.js';
```

---

## Forbidden Patterns

| Pattern | Why Forbidden |
|---------|---------------|
| Bypass taxonomy import | Creates orphaned components |
| Hand-edit generated files | Overwrites on next build |
| Duplicate kind names | Audit failure |
| Invalid variant keys | Build failure |
| Missing slot definitions | Runtime errors |

---

**Taxonomy is the spine of ColdLight. Everything else is derived.**
