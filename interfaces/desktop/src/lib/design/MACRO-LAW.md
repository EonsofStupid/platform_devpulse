# ColdLight Enterprise Macro Law
## Final Architectural Specification — March 2026

This document defines the immutable rules governing how every ColdLight component
is styled, resolved, and composed. No exceptions. No "v2 migrations." No hedging.

These rules exist so that:

- Every component follows one pattern
- AI systems generating components produce consistent output
- Contributors have zero ambiguity about how styling works
- The system is inspectable, teachable, and predictable at 145+ components
- Layman users can learn the system by inspecting the DOM

---

## Law 1: One Public Styling Path — The Pure Resolver

### Rule

Every component calls `resolveMacro()`. There is no second path.

### Contract

```typescript
// ── Input: what the component provides ──────────────────
interface MacroInput {
  kind: string;           // scoped kind string (see Law 3)
  preset?: string;        // defaults to 'default'
  state?: MacroState;     // runtime state only
}

type MacroState = 'default' | 'disabled' | 'active';

// ── Output: sealed contract, no escape hatches ──────────
interface ResolvedMacro {
  kind: string;
  dataAttrs: {
    'data-kind': string;
    [key: `data-cl-${string}`]: '';  // family markers
  };
  cssVars: Record<`--cl-${string}`, string>;
}

function resolveMacro(input: MacroInput): ResolvedMacro;
```

### Why No Axis Props on Components

Components do NOT accept `intent`, `tone`, `density`, or `emphasis` as individual
props. Those axes exist at the preset authoring layer (build time, token definitions).
The component selects a preset by name. The preset IS the pre-composed recipe.

```svelte
<!-- WRONG: component decomposes visual axes -->
<Button intent="teal" density="compact" tone="muted" emphasis="high">Save</Button>

<!-- RIGHT: component selects a preset -->
<Button preset="compact-teal-muted">Save</Button>

<!-- RIGHT: default preset -->
<Button>Save</Button>
```

The axes don't disappear — they're how you AUTHOR presets in the token layer.
They move from runtime component concerns to build-time authoring concerns.

### Preset Naming Convention

Composition order: `density-intent-tone` (most significant first)

```
compact                 → compact sizing, default intent, default tone
compact-teal            → compact sizing, teal intent, default tone
compact-teal-glass      → compact sizing, teal intent, glass tone
teal                    → default sizing, teal intent, default tone
glass                   → default sizing, default intent, glass tone
```

Single axis values work as presets — the resolver applies them as partial
overrides on the kind's default preset.

### Why No Attachment / Action as Public API

Once AI sees two valid patterns, it will use both. Over 145 components:
~70 use the attachment, ~60 use the function, ~15 use some hybrid.
That's not theoretical — it's inevitable.

If an internal attachment helper is later created for reducing boilerplate,
it is INTERNAL ONLY — never documented, never in examples, never in templates
that AI trains on.

### Canonical Component Pattern

Every ColdLight component follows this exact structure:

```svelte
<script lang="ts">
  import { resolveMacro, cssVarString } from '$lib/style-macro';

  interface Props {
    preset?: string;
    disabled?: boolean;
    children: import('svelte').Snippet;
  }

  let { preset = 'default', disabled = false, children }: Props = $props();
  const state = $derived(disabled ? 'disabled' : 'default');
  const m = $derived(resolveMacro({ kind: 'button', preset, state }));
</script>

<button {...m.dataAttrs} style={cssVarString(m.cssVars)} {disabled}>
  {@render children()}
</button>
```

### The Format Helper

```typescript
/**
 * Serialize a CSS variable map to an inline style string.
 * This is the ONLY bridge between resolver output and the DOM.
 * Pure format function. Not a component. Not an attachment.
 */
export function cssVarString(vars: Record<string, string>): string {
  let s = '';
  for (const k in vars) {
    if (s) s += ';';
    s += `${k}:${vars[k]}`;
  }
  return s;
}
```

### What Components MUST NOT Do

```svelte
<!-- FORBIDDEN: style prop passthrough -->
<script>
  let { style, ...rest } = $props(); // NO
</script>
<button style="{cssVarString(m.cssVars)}; {style}">  <!-- NO -->

<!-- FORBIDDEN: arbitrary CSS variable injection -->
<Button preset="teal" style="-bg: red;">  <!-- NO -->

<!-- FORBIDDEN: className override -->
<Button preset="teal" class="my-custom-bg">  <!-- NO -->
```

The component's style attribute contains ONLY what the resolver returned.
Nothing else gets in. The system is closed to runtime visual injection.

---

## Law 2: No Wrapper Elements. Ever.

### Rule

The styled element IS the semantic root. No exceptions.

```
✓ <button data-kind="button" style="-bg:...">
✓ <a data-kind="link" style="--cl-fg:...">
✓ <dialog data-kind="dialog" style="-bg:...">
✓ <nav data-kind="nav-rail" style="-bg:...">
✓ <input data-kind="input" style="--cl-border:...">

✗ <div class="button-wrapper"><button>...</button></div>
✗ <div class="dialog-chrome"><dialog>...</dialog></div>
✗ <div data-kind="card"><article>...</article></div>
```

### Consequences

- `data-kind` goes on the semantic root
- `data-cl-*` family markers go on the semantic root
- CSS custom properties go on the semantic root
- State selectors (`:hover`, `:focus-visible`, `:disabled`) target the semantic root
- Layout parent sees the semantic root directly

### Complex Shells

If a component needs layered chrome, the layers are CHILD elements inside
the semantic root, not a wrapper around it:

```svelte
<!-- CORRECT: dialog is the root, chrome is a child -->
<dialog {...m.dataAttrs} style={cssVarString(m.cssVars)}>
  <div class="dialog-frame">
    <header class="dialog-header">
      {@render header?.()}
    </header>
    <div class="dialog-body">
      {@render children()}
    </div>
  </div>
</dialog>
```

### Browser Pseudo-Elements

`<dialog>::backdrop`, `<details>::marker`, etc. are handled via CSS selectors
in the glue layer, not wrapper elements:

```css
[data-kind="dialog"]::backdrop {
  background: var(--cl-backdrop-bg, oklch(0 0 0 / 0.5));
}
```

These don't violate Law 2 — they're pseudo-elements, not authored DOM nodes.

---

## Law 3: One Root = One Resolved Preset

### Rule

A component gets one root, one `resolveMacro()` call, one visual contract.

### Scoped Kind Strings

At 145+ components, flat names collide. Kinds use scoped naming:

- Top-level components: simple name (`button`, `badge`, `separator`)
- Sub-components: parent/element (`card/header`, `card/body`, `card/footer`)

```typescript
// Top-level kinds
type PrimitiveKind =
  | 'button' | 'badge' | 'link' | 'input' | 'toggle'
  | 'card' | 'panel' | 'dialog' | 'drawer' | 'popover'
  | 'nav-rail' | 'toolbar' | 'tab-bar'
  | 'separator' | 'skeleton' | 'spinner';

// Sub-element kinds (slash separator — unambiguous)
type SubElementKind = `${string}/${string}`;

type KindString = PrimitiveKind | SubElementKind;
```

Example in the DOM:

```html
<article data-kind="card" data-cl-surface data-cl-frame>
  <header data-kind="card/header" data-cl-text>
    ...
  </header>
</article>
```

### Composite Components

Each sub-element is independently resolved:

```
Card          → resolveMacro({ kind: 'card' })
CardHeader    → resolveMacro({ kind: 'card/header' })
CardBody      → resolveMacro({ kind: 'card/body' })
CardFooter    → resolveMacro({ kind: 'card/footer' })
```

The Card composes them with explicit prop forwarding:

```svelte
<script lang="ts">
  import { resolveMacro, cssVarString } from '$lib/style-macro';
  import CardHeader from './CardHeader.svelte';
  import CardBody from './CardBody.svelte';

  let { preset = 'default', header, children }: Props = $props();
  const m = $derived(resolveMacro({ kind: 'card', preset }));
</script>

<article {...m.dataAttrs} style={cssVarString(m.cssVars)}>
  {#if header}
    <CardHeader {preset}>
      {@render header()}
    </CardHeader>
  {/if}
  <CardBody {preset}>
    {@render children()}
  </CardBody>
</article>
```

The resolver NEVER knows internal DOM structure. It resolves one preset at a time.

---

## Law 4: No Visual Context Inheritance

### Rule

A parent component NEVER implicitly influences a child's visual resolution.
Every component resolves itself from its own explicit props.

### What This Forbids

```typescript
// FORBIDDEN: parent sets visual context children silently read
setContext('visual-env', { surface: 'glass', density: 'compact' });

// FORBIDDEN: child reads ancestor context for styling
const env = getContext('visual-env');
const m = resolveMacro({ kind: 'badge', ...env });
```

### The Density Pattern — Snippet Parameter Forwarding

Density (and preset generally) flows through snippet parameters, not context:

```svelte
<!-- Toolbar.svelte -->
<script lang="ts">
  import { resolveMacro, cssVarString } from '$lib/style-macro';

  interface Props {
    preset?: string;
    children: import('svelte').Snippet<[{ preset: string }]>;
  }

  let { preset = 'default', children }: Props = $props();
  const m = $derived(resolveMacro({ kind: 'toolbar', preset }));
</script>

<div {...m.dataAttrs} style={cssVarString(m.cssVars)} role="toolbar">
  {@render children({ preset })}
</div>
```

```svelte
<!-- Usage: preset flows through snippet params — explicit, visible -->
<Toolbar preset="compact">
  {#snippet children({ preset })}
    <Button {preset}>Cut</Button>
    <Button {preset}>Copy</Button>
    <Button {preset}>Paste</Button>
    <Separator {preset} />
  {/snippet}
</Toolbar>
```

This is explicit. The preset value is visible in the template. It's not hidden
in context. It's not cascading through CSS. Each child's appearance is fully
determined by its own props.

### Context Is Fine For Behavior

Context can carry behavioral concerns:

- Form validation state
- Disclosure / accordion open state
- Navigation active route
- Keyboard navigation scope

Context must NOT carry visual styling dependencies.

---

## Law 5: Family-Split Glue CSS (Derived)

### Rule

CSS property binding is split by visual family. Every component receives
only the families its preset actually uses. Families are derived at
build time — never hand-authored per component.

### The Families

```css
/* ── Universal: every [data-kind] element ──────────────── */
[data-kind] {
  box-sizing: border-box;
  transition-duration: var(--cl-transition-duration, 150ms);
  transition-timing-function: var(--cl-transition-easing, ease-out);
}

/* ── Surface: background, borders, shadows ─────────────── */
[data-cl-surface] {
  background: var(-bg);
  border-color: var(--cl-border);
  box-shadow: var(--box-shadow);
}

/* ── Text: typography properties ───────────────────────── */
[data-cl-text] {
  color: var(--cl-fg);
  font-family: var(--font-family);
  font-size: var(--font-size);
  letter-spacing: var(--cl-tracking);
  line-height: var(--cl-leading);
}

/* ── Frame: dimensional properties ─────────────────────── */
[data-cl-frame] {
  border-radius: var(--border-radius);
  border-width: var(--border-width);
  border-style: var(--border-style, solid);
  padding: var(--cl-padding-y) var(--cl-padding-x);
}

/* ── Interactive: behavioral visual properties ─────────── */
[data-cl-interactive] {
  cursor: pointer;
  outline-offset: var(--cl-focus-offset, 2px);
  -webkit-tap-highlight-color: transparent;
}
[data-cl-interactive]:focus-visible {
  outline: 2px solid var(--cl-focus-ring, currentColor);
  outline-offset: var(--cl-focus-offset, 2px);
}
[data-cl-interactive]:disabled,
[data-cl-interactive][aria-disabled="true"] {
  cursor: not-allowed;
  pointer-events: none;
}
[data-cl-interactive]:hover {
  filter: var(--cl-hover-filter, brightness(1.1));
}
[data-cl-interactive]:active {
  filter: var(--cl-active-filter, brightness(0.9));
}

/* ── Layout: spacing and flow ──────────────────────────── */
[data-cl-layout] {
  gap: var(--cl-gap);
}

/* ── Overlay: layering and backdrop ────────────────────── */
[data-cl-overlay] {
  backdrop-filter: var(--cl-backdrop);
  z-index: var(--cl-z);
  isolation: isolate;
}
```

---

## Law 6: Shared Intent Resolution

### Rule

One `resolveIntent()` function. One `INTENT_MAP`. All renderers import it.

Both HTML and SVG resolvers import from this single module.
When the pipeline matures, `INTENT_MAP` becomes a generated artifact from
Style Dictionary — the shape stays the same, the source changes.

---

## State Handling

### Split Responsibility

| Concern | Owner | Why |
|---------|-------|-----|
| Colors, shadows, glows, borders | Resolver (per-preset, per-state) | Design decisions that vary by intent |
| Cursor, pointer-events, outline | CSS (universal) | Behavioral, identical for all presets |
| Hover brightness / filter | CSS (with optional var override) | CSS-only state, customizable via --cl-hover-filter |
| Focus ring | CSS (with var for color) | Browser manages focus, CSS styles it |
| Disabled appearance | Resolver (authored palette) | NOT opacity: 0.4 — real authored disabled colors |

---

## Build Pipeline

### Sequential DAG — One Command

```bash
pnpm ds:tokens:build
```

```
Step 1: generate-scales.mjs → fluid clamp DTCG tokens
Step 2: enrich-presets.mjs → axis defaults + typography per kind
Step 3: deriveKindFamilies() → kind → family[] mapping
Step 4: SD5 transforms + platforms → CSS vars, theme, types
Step 5: Glue CSS generation → macro-base.css with family-split selectors
```

---

## Summary

| # | Law | Absolute? |
|---|-----|-----------|
| 1 | One public path: pure resolver, preset-only model | Yes |
| 2 | No wrapper elements | Yes |
| 3 | One root = one preset, scoped kind strings | Yes |
| 4 | No visual context inheritance, snippet param forwarding | Yes |
| 5 | Family-split glue CSS, derived from presets | Yes |
| 6 | Shared intent resolution, single source of truth | Yes |

No exceptions. No "v2 migration." No escape hatches.
