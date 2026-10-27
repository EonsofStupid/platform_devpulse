# Blueprints

> **Prebuilt assemblies. Slot wiring + defaults. The official way to build.**

---

## Definition

A Blueprint is a **pre-assembled canonical build** made from:
- Primitives
- Slot wiring
- Default props
- Default recipes

Blueprints prevent every developer from having to rebuild the same "correct assembly" manually.

---

## Blueprint vs Other Layers

| Layer | What It Is | Code? |
|-------|------------|-------|
| **Primitive** | Behavior only | Svelte component |
| **Recipe** | CSS appearance | CSS classes |
| **Semantic** | Primitive + Recipe | Svelte component |
| **Blueprint** | Prebuilt assembly | TypeScript definition |
| **Pattern** | Guidance | Documentation only |
| **Block** | VPB payload | JSON runtime |

---

## Blueprint Structure

```typescript
interface Blueprint {
  /** Unique blueprint identifier */
  id: string;

  /** Display name */
  name: string;

  /** Which primitive(s) this uses */
  primitive: string | string[];

  /** Which slots are wired */
  slots: string[];

  /** Default semantic preset class */
  recipe: string;

  /** Default variant key */
  variant: string;

  /** Default props */
  defaults: Record<string, unknown>;

  /** Optional slot configurations */
  slotConfig?: Record<string, SlotConfig>;
}

interface SlotConfig {
  /** Recipe for this slot */
  recipe?: string;
  /** Variant for this slot */
  variant?: string;
  /** Props for this slot */
  props?: Record<string, unknown>;
}
```

---

## Example: PrimaryButton Blueprint

```typescript
// blueprints/buttons/PrimaryButton.ts

import type { Blueprint } from '../types.js';

export const PrimaryButtonBlueprint: Blueprint = {
  id: 'button.primary',
  name: 'Primary Button',
  primitive: 'button',
  slots: ['root'],
  recipe: 'btn-main',
  variant: 'v-s1z2l3t1m2',
  defaults: {
    intent: 'primary',
    size: 'md',
  },
};
```

---

## Example: Dialog Blueprint

```typescript
// blueprints/dialogs/StandardDialog.ts

import type { Blueprint } from '../types.js';

export const StandardDialogBlueprint: Blueprint = {
  id: 'dialog.standard',
  name: 'Standard Dialog',
  primitive: 'dialog',
  slots: ['root', 'trigger', 'overlay', 'content', 'title', 'description', 'close'],
  recipe: 'panel-main',
  variant: 'v-s2z1l2t2m1',
  defaults: {
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },
  slotConfig: {
    trigger: {
      recipe: 'btn-main',
      variant: 'v-s1z2l3t1m2',
    },
    overlay: {
      recipe: 'overlay-main',
      variant: 'v-s1z1l1t2m0',
    },
    close: {
      recipe: 'btn-icon',
      variant: 'v-s0z0l1t1m0',
    },
  },
};
```

---

## Blueprint Registry

All blueprints register in taxonomy.

```typescript
// taxonomy/blueprintRegistry.ts

import { PrimaryButtonBlueprint } from '../blueprints/buttons/PrimaryButton.js';
import { StandardDialogBlueprint } from '../blueprints/dialogs/StandardDialog.js';

export const BlueprintRegistry = {
  'button.primary': PrimaryButtonBlueprint,
  'dialog.standard': StandardDialogBlueprint,
  // ... more blueprints
} as const;

export type BlueprintId = keyof typeof BlueprintRegistry;
```

---

## Using Blueprints

### In Code

```typescript
import { BlueprintRegistry } from '$lib/design/taxonomy/blueprintRegistry.js';

const buttonBlueprint = BlueprintRegistry['button.primary'];
// Use blueprint.recipe, blueprint.variant, blueprint.defaults
```

### In VPB (Visual Page Builder)

```json
{
  "kind": "button",
  "blueprint": "button.primary",
  "props": {
    "label": "Click Me"
  }
}
```

The VPB uses the blueprint to:
1. Look up primitive
2. Apply default recipe + variant
3. Merge provided props with defaults
4. Render the component

---

## Blueprint Categories

```
blueprints/
├── index.ts              # Registry export
├── types.ts              # Blueprint types
├── buttons/              # Button blueprints
│   ├── PrimaryButton.ts
│   ├── SecondaryButton.ts
│   └── GhostButton.ts
├── dialogs/              # Dialog blueprints
│   ├── StandardDialog.ts
│   ├── AlertDialog.ts
│   └── ConfirmDialog.ts
├── panels/               # Panel blueprints
│   ├── GlassPanel.ts
│   ├── MetalPanel.ts
│   └── MattePanel.ts
├── forms/                # Form blueprints
│   ├── LoginForm.ts
│   └── SearchForm.ts
└── navigation/           # Navigation blueprints
    ├── TopNav.ts
    └── SideNav.ts
```

---

## Checklist

### Before Adding a Blueprint

- [ ] Primitive exists in `primitives/`
- [ ] Primitive registered in taxonomy
- [ ] Recipe classes exist (`btn-main`, etc.)
- [ ] Variant key is valid format

### Blueprint Requirements

- [ ] Unique `id` in registry
- [ ] All slots match primitive slots
- [ ] Default recipe is valid
- [ ] Default variant matches `v-s{#}z{#}l{#}t{#}m{#}`
- [ ] Defaults are type-safe

### After Adding

- [ ] Register in `blueprintRegistry.ts`
- [ ] Export from `blueprints/index.ts`
- [ ] Document in Docusaurus

---

## Blueprint vs Semantic

| Aspect | Blueprint | Semantic |
|--------|-----------|----------|
| **Is it code?** | TypeScript definition | Svelte component |
| **Runtime?** | Build-time reference | Runtime component |
| **Styling?** | References recipes | Applies recipes |
| **Purpose** | Define the assembly | Be the assembly |

**Blueprint defines. Semantic implements.**

A semantic component can be generated FROM a blueprint definition.

---

## Auto-Generation

Blueprints enable code generation:

```typescript
// From blueprint definition...
const blueprint = BlueprintRegistry['button.primary'];

// ...generate semantic component
generateSemanticComponent(blueprint);
// Outputs: semantics/buttons/PrimaryButton.svelte
```

This is the path to no-code:
1. Define blueprint (or use wizard)
2. Generator creates semantic
3. VPB uses blueprint for runtime

---

**Blueprints are the canonical way to assemble ColdLight components.**
