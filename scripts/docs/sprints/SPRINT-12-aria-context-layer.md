# SPRINT-12: ARIA Context Layer

> **Goal**: Make primitives context-aware with runtime ARIA binding
> **Scope**: `interfaces/desktop/src/lib/design/`
> **Prerequisite**: SPRINT-11 (Tailwind v4) ✅ Complete

---

## Problem Statement

ColdLight contracts **define** ARIA requirements per primitive, but nothing **applies** them at runtime. The adapter layer exists architecturally but lacks implementations.

Current state:
- Contracts say "dialog needs `aria-modal`, `aria-labelledby`"
- Primitives render with `data-kind="dialog"` `data-slot="content"`
- But NO actual `role`, `aria-*` attributes get applied
- Blocks can't fulfill accessibility promises

---

## What "Context-Aware ARIA" Means

1. **State-driven** - ARIA attributes update reactively based on component state
2. **Relationship-aware** - `aria-labelledby`, `aria-describedby` auto-wire to sibling slots
3. **Provider-agnostic** - Works with MeltUI adapter OR native ColdLight adapter
4. **AI-readable** - Contracts are machine-parseable for tooling/LLMs

---

## Architecture Decision

Two approaches exist:

### Option A: Adapter Factory Pattern (Current Design)
- Each primitive kind has an adapter factory in `api/adapters/meltui/_internal/{kind}/`
- Factory returns ARIA-applying wrapper
- Block imports factory, wraps primitive

**Pros**: Clean separation, provider-swappable
**Cons**: 40+ factory files to write, indirection overhead

### Option B: Svelte Action Pattern (Simpler)
- Create `use:aria` action that reads contract and applies attributes
- Action queries taxonomy at mount time
- Single implementation, works on any primitive

**Pros**: One action, works everywhere
**Cons**: Runtime contract lookup, less explicit

### Decision: **Option B with Contract Preloading**

- Contracts are already static - load them at build time
- `use:aria={contract}` action applies attributes based on slot + state
- MeltUI primitives get pass-through (MeltUI already handles ARIA)
- ColdLight primitives get full ARIA application

---

## Phase 1: ARIA Action Core

### 1.1 Create aria action

**File**: `api/actions/aria.ts`

```typescript
import type { PrimitiveContract, SlotSpec } from "$lib/design/taxonomy/types.js";

interface AriaActionOptions {
  contract: PrimitiveContract;
  slot: string;
  state?: Record<string, boolean>;
}

export function aria(node: HTMLElement, options: AriaActionOptions) {
  const { contract, slot, state = {} } = options;

  // Get slot spec from contract
  const slotSpec = contract.slotSpec[slot];
  if (!slotSpec) return {};

  // Apply role if specified
  if (slotSpec.aria?.role) {
    node.setAttribute("role", slotSpec.aria.role);
  }

  // Apply required ARIA attributes
  for (const attr of slotSpec.aria?.required ?? []) {
    applyAriaAttr(node, attr, state);
  }

  // Return update function for reactivity
  return {
    update(newOptions: AriaActionOptions) {
      // Re-apply based on new state
      for (const attr of slotSpec.aria?.required ?? []) {
        applyAriaAttr(node, attr, newOptions.state ?? {});
      }
    },
    destroy() {
      // Cleanup if needed
    }
  };
}

function applyAriaAttr(
  node: HTMLElement,
  attr: string,
  state: Record<string, boolean>
) {
  // State-driven attributes
  if (attr === "aria-expanded") {
    node.setAttribute("aria-expanded", String(state.open ?? false));
  }
  if (attr === "aria-selected") {
    node.setAttribute("aria-selected", String(state.selected ?? false));
  }
  if (attr === "aria-checked") {
    node.setAttribute("aria-checked", String(state.checked ?? false));
  }
  if (attr === "aria-disabled") {
    node.setAttribute("aria-disabled", String(state.disabled ?? false));
  }
  if (attr === "aria-pressed") {
    node.setAttribute("aria-pressed", String(state.pressed ?? false));
  }
  if (attr === "aria-modal") {
    node.setAttribute("aria-modal", "true");
  }
  // ID-based attributes handled separately via aria-link
}
```

### 1.2 Create aria-link action for relationships

**File**: `api/actions/aria-link.ts`

```typescript
interface AriaLinkOptions {
  type: "labelledby" | "describedby" | "controls" | "owns";
  target: string; // CSS selector or slot name
}

export function ariaLink(node: HTMLElement, options: AriaLinkOptions) {
  const { type, target } = options;

  // Find target element
  const targetEl = document.querySelector(target)
    ?? node.closest(`[data-slot="${target}"]`);

  if (targetEl) {
    // Ensure target has ID
    if (!targetEl.id) {
      targetEl.id = `aria-${type}-${crypto.randomUUID().slice(0, 8)}`;
    }
    node.setAttribute(`aria-${type}`, targetEl.id);
  }

  return {
    update(newOptions: AriaLinkOptions) {
      // Re-link if target changes
    },
    destroy() {
      node.removeAttribute(`aria-${type}`);
    }
  };
}
```

---

## Phase 2: Contract Accessor

### 2.1 Contract getter with caching

**File**: `taxonomy/accessor.ts`

```typescript
import type { PrimitiveContract } from "./types.js";

const contractCache = new Map<string, PrimitiveContract>();

export async function getContract(kind: string): Promise<PrimitiveContract> {
  if (contractCache.has(kind)) {
    return contractCache.get(kind)!;
  }

  // Dynamic import from taxonomy
  const module = await import(`./kinds/primitives/${kind}/contract.js`);
  const contract = module.contract as PrimitiveContract;

  contractCache.set(kind, contract);
  return contract;
}

// Synchronous version for preloaded contracts
export function getContractSync(kind: string): PrimitiveContract | undefined {
  return contractCache.get(kind);
}

// Preload all contracts at app start
export async function preloadContracts(): Promise<void> {
  const kinds = [
    "accordion", "alert", "alert-dialog", "avatar", "badge", "breadcrumb",
    "button", "card", "checkbox", "collapsible", "combobox", "command",
    "context-menu", "dialog", "dropdown-menu", "hover-card", "input",
    "label", "menubar", "navigation-menu", "pagination", "pin-input",
    "popover", "progress", "radio-group", "scroll-area", "select",
    "separator", "sheet", "skeleton", "slider", "spinner", "switch",
    "tabs", "textarea", "toggle", "toggle-group", "toolbar", "tooltip",
    "visually-hidden"
  ];

  await Promise.all(kinds.map(getContract));
}
```

---

## Phase 3: Primitive Integration

### 3.1 Update primitive base pattern

Each primitive that needs ColdLight ARIA (not MeltUI-provided) uses the action:

**Example**: `primitives/button/Button.svelte`

```svelte
<script lang="ts">
  import { aria } from "$lib/design/api/actions/aria.js";
  import { contract } from "./contract.js";
  import type { ButtonProps } from "./types.js";

  let {
    disabled = false,
    pressed = false,
    loading = false,
    children,
    ...rest
  }: ButtonProps = $props();

  const state = $derived({
    disabled,
    pressed,
    loading
  });
</script>

<button
  data-kind="button"
  data-slot="root"
  use:aria={{ contract, slot: "root", state }}
  {...rest}
>
  {@render children?.()}
</button>
```

### 3.2 MeltUI primitives - pass-through

MeltUI already applies ARIA. For these primitives, we skip the action:

```svelte
<!-- MeltUI-backed primitive - ARIA handled by MeltUI -->
<div
  data-kind="dialog"
  data-slot="content"
  use:melt={dialog.content}
>
  <!-- MeltUI applies role="dialog" aria-modal="true" etc -->
</div>
```

---

## Phase 4: Block Consumption Pattern

### 4.1 Block template

**File**: `blocks/dialogs/ConfirmDialog.svelte`

```svelte
<script lang="ts">
  import * as Dialog from "$lib/design/primitives/dialog/index.js";
  import { getRecipe } from "$lib/design/recipes/index.js";

  let { open = $bindable(false), title, description } = $props();

  const recipe = getRecipe("dialog.glass.void");
  const classes = recipe.classes({ radius: "lg" });
</script>

<Dialog.Root bind:open>
  <Dialog.Overlay class={classes.overlay} />
  <Dialog.Content class={classes.content}>
    <Dialog.Header class={classes.header}>
      <Dialog.Title class={classes.title}>{title}</Dialog.Title>
      <Dialog.Description class={classes.description}>{description}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class={classes.footer}>
      <slot name="actions" />
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

---

## Phase 5: AI-Friendly Contract Export

### 5.1 Machine-readable manifest

**File**: `taxonomy/manifest.ts`

```typescript
import type { PrimitiveContract } from "./types.js";

export interface ColdLightManifest {
  version: string;
  primitives: Record<string, PrimitiveContract>;
  recipes: Record<string, { id: string; kind: string; slots: string[] }>;
  tokens: Record<string, string>;
}

export async function generateManifest(): Promise<ColdLightManifest> {
  // Generates JSON manifest for AI tooling / IDE plugins
}
```

This manifest enables:
- LLM code generation with accurate slot/state knowledge
- IDE autocomplete for recipe IDs
- Accessibility auditing tools
- Documentation generation

---

## Tasks

### Phase 1: Core Actions
- [ ] Create `api/actions/aria.ts` with state-driven ARIA application
- [ ] Create `api/actions/aria-link.ts` for relationship attributes
- [ ] Add barrel export in `api/actions/index.ts`

### Phase 2: Contract Accessor
- [ ] Create `taxonomy/accessor.ts` with cache + preload
- [ ] Add preloadContracts() call to app initialization
- [ ] Verify contracts load without circular deps

### Phase 3: Primitive Integration
- [ ] Add `use:aria` to Button primitive (ColdLight provider)
- [ ] Add `use:aria` to Card primitive (ColdLight provider)
- [ ] Add `use:aria` to Badge primitive (ColdLight provider)
- [ ] Verify MeltUI primitives still work (no action needed)

### Phase 4: Block Pattern
- [ ] Create example block: `blocks/dialogs/ConfirmDialog.svelte`
- [ ] Create example block: `blocks/cards/FeatureCard.svelte`
- [ ] Document block consumption pattern

### Phase 5: AI Manifest
- [ ] Create `taxonomy/manifest.ts` generator
- [ ] Add `pnpm coldlight:manifest` script
- [ ] Output to `.cowlevel/manifest.json`

### Phase 6: Verification
- [ ] Run `pnpm svelte-check` - 0 errors
- [ ] Run `pnpm vitest run` - all tests pass
- [ ] Manual test: Dialog opens with correct ARIA
- [ ] Manual test: Button states reflect in ARIA

---

## Success Criteria

1. **Context-aware**: ARIA attributes update when state changes
2. **Relationship-aware**: `aria-labelledby` auto-wires to title slots
3. **Provider-agnostic**: Works for both ColdLight and MeltUI primitives
4. **AI-readable**: Manifest exports full contract + recipe data
5. **Zero regressions**: All existing tests pass

---

## Notes

- This sprint focuses on the ARIA layer, not adding new primitives
- Recipes remain unchanged - they're styling only
- Contracts remain unchanged - they're already well-defined
- The gap was the RUNTIME binding, not the specification
