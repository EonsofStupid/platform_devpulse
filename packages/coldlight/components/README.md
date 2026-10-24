# Semantics

> **Layer 4: Primitives + Recipes = Styled Components**

---

## Definition

Semantics are **user-facing styled components** created by combining:

- **Primitive** (ColdLight-owned behavior — ARIA, focus, keyboard)
- **Semantic preset** (`.btn-main`, etc.)
- **Variant payload** (`.v-s1z2l3t1m2`)

```svelte
<!-- Semantic = Primitive + Semantic preset + Variant -->
<button class="btn-main v-s1z2l3t1m2" data-kind="button" data-slot="root" data-state="idle">
  Primary Button
</button>
```

---

## Role in Architecture

| Layer | What It Is | Semantics Role |
|-------|------------|----------------|
| Primitive | Behavior | Provides `data-kind`, `data-slot`, `data-state` |
| Recipe | CSS rules | Provides styling via class |
| **Semantic** | Styled component | Combines primitive + recipe |
| Blueprint | Prebuilt assembly | Defines the semantic |

**Semantics apply recipes. They don't define them.**

---

## Categories

| Category | Description | Examples |
|----------|-------------|----------|
| [buttons/](./buttons/) | Button semantics | MainButton, GhostButton |
| [inputs/](./inputs/) | Input/form semantics | TextInput, SearchInput |
| [panels/](./panels/) | Panel semantics | GlassPanel, MetalPanel |
| [cards/](./cards/) | Card semantics | FeatureCard, StatCard |

---

## Semantic Structure

```svelte
<!-- semantics/buttons/MainButton.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Variant payload (default: v-s1z2l3t1m2) */
    variant?: string;
    /** Button intent */
    intent?: 'primary' | 'secondary' | 'ghost';
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Click handler */
    onclick?: () => void;
    /** Button content */
    children?: Snippet;
  }

  let {
    variant = 'v-s1z2l3t1m2',
    intent = 'primary',
    size = 'md',
    onclick,
    children,
  }: Props = $props();
</script>

<button
  class="btn-main {variant}"
  data-kind="button"
  data-slot="root"
  data-state="idle"
  data-intent={intent}
  data-size={size}
  {onclick}
>
  {#if children}
    {@render children()}
  {/if}
</button>
```

---

## Checklist

### Before Adding a Semantic

- [ ] Primitive exists in `taxonomy/primitiveKinds.ts`
- [ ] Slots exist in `taxonomy/primitiveRegistry.ts`
- [ ] Semantic preset class exists (`.btn-main`, etc.)
- [ ] Determine correct category folder

### File Requirements

- [ ] `{Name}.svelte` — Component file (PascalCase)
- [ ] Category `index.ts` updated with export
- [ ] Root `index.ts` updated if new category
- [ ] Uses semantic preset class (`btn-main`, `panel-main`)
- [ ] Uses variant payload class (`v-s1z2l3t1m2`)
- [ ] No inline styles or raw colors
- [ ] No `<style>` blocks

### Export Requirements

- [ ] Exported from category `index.ts`
- [ ] Exported from `semantics/index.ts`
- [ ] Types exported if any

---

## SSOT

This folder's SSOT is `semantics/index.ts`.

```typescript
// semantics/index.ts

export * from './buttons/index.js';
export * from './inputs/index.js';
export * from './panels/index.js';
export * from './cards/index.js';
```

All imports should go through:

```typescript
import { MainButton, GlassPanel, TextInput } from '#coldlight/semantics';
```

---

## Variant Override Pattern

Semantics accept variant prop to override defaults:

```svelte
<script>
  import { MainButton } from '#coldlight/semantics';
</script>

<!-- Default variant -->
<MainButton>Default</MainButton>

<!-- Custom variant -->
<MainButton variant="v-s2z3l2t2m1">Custom</MainButton>
```

---

## Blueprint Connection

Semantics can be generated FROM blueprints:

```
Blueprint definition → Generator → Semantic component
```

```typescript
// This blueprint...
const PrimaryButtonBlueprint = {
  primitive: 'button',
  recipe: 'btn-main',
  variant: 'v-s1z2l3t1m2',
};

// ...generates this semantic
// semantics/buttons/PrimaryButton.svelte
```

---

## Forbidden Patterns

| Pattern | Why Forbidden |
|---------|---------------|
| `<style>` blocks | Use recipe classes |
| Inline `style=""` | Use variant classes |
| Raw colors | Use tokens via recipes |
| Third-party headless imports | Use ColdLight primitives / hooks only |

---

## Adding a New Semantic

1. Identify category (buttons, inputs, panels, cards)
2. Check blueprint exists (or create one)
3. Create file: `{category}/{Name}.svelte`
4. Use semantic preset + variant pattern
5. Export from category `index.ts`
6. Export from root `index.ts`
7. Run `pnpm check` to verify types
8. Commit when passing

---

**Semantics are styled components. Recipe + Primitive = Semantic.**
