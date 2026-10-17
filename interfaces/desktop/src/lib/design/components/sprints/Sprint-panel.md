# Sprint: Panel Component Layer

> **Scope**: `interfaces/desktop/src/lib/design/{recipes,blueprints,components}/panel`
> **Depends On**: VPB taxonomy (complete), tokens (complete)
> **Goal**: Styled panel container components — glass, matte, metal variants with header/body/footer slots.

---

## Current State Audit

| Layer | Status | Notes |
|---|---|---|
| VPB taxonomy | Done | `surfaceKinds.panel`: slots header/body/footer, flex layout |
| VPB contract | Done | Props: padding (none/sm/md/lg), variant (default/glass/solid) |
| Recipe | Missing | No `panel.recipe.ts` |
| Blueprint | Missing | No `panel.blueprint.ts` |
| Components | Missing | Only README.md migration checklist exists |
| Tests | Missing | No test files |

---

## Architecture

Panel is a **VPB surface block**, not an interactive primitive. No melt dependency. No ARIA state management needed. Pure visual container with layout slots.

### What Panel IS

A styled container with three optional slots:
- `header` — top section (titles, actions, controls)
- `body` — main content area (scrollable)
- `footer` — bottom section (actions, status)

### What Panel IS NOT

- Not a primitive (no melt, no ARIA behavior)
- Not a collapsible/resizable panel (that would be a separate primitive)
- Not a dialog/sheet (those have their own primitives)

### Component API

```svelte
<Panel accent="teal" surface="glass" variant="void">
  <Panel.Header>Dashboard</Panel.Header>
  <Panel.Body>
    <!-- content -->
  </Panel.Body>
  <Panel.Footer>
    <Button>Save</Button>
  </Panel.Footer>
</Panel>
```

Shorthand without explicit slots:
```svelte
<Panel>
  <!-- everything goes in body -->
</Panel>
```

### Variants

| Variant | Surface | Visual | Use Case |
|---|---|---|---|
| `panel.glass.void` | glass | Glass morphism, border-white/8, backdrop-blur | Default content panel |
| `panel.glass.tint` | glass | Tinted glass, accent color wash | Accent sections |
| `panel.matte.flat` | matte | Solid dark, no blur, subtle border | Dense data layouts |
| `panel.metal.chrome` | metal | Liquid metal gradient, bevel, glow | Hero/feature panels |

---

## Phase 1: Recipe

### 1.1: Panel recipe

**File**: `recipes/panel.recipe.ts`

Register multiple recipes under `panel.*` prefix.

**Glass Void** (`panel.glass.void`):
```
root:   glass-void, rounded-lg, border border-white/8, overflow-hidden, flex flex-col
header: px-4 py-3, border-b border-white/6, text-sm font-medium text-white/90
body:   px-4 py-3, flex-1, overflow-auto, text-white/80
footer: px-4 py-3, border-t border-white/6
```

**Glass Tint** (`panel.glass.tint`):
```
root:   glass-tint-{accent}, rounded-lg, border border-{accent}/15, overflow-hidden, flex flex-col
header: px-4 py-3, border-b border-{accent}/10, text-{accent}-300
body:   px-4 py-3, flex-1, overflow-auto
footer: px-4 py-3, border-t border-{accent}/10
```

**Matte Flat** (`panel.matte.flat`):
```
root:   bg-zinc-900/80, rounded-md, border border-white/5, overflow-hidden, flex flex-col
header: px-4 py-3, border-b border-white/5, text-sm text-white/70
body:   px-4 py-3, flex-1, overflow-auto
footer: px-4 py-3, border-t border-white/5
```

**Metal Chrome** (`panel.metal.chrome`):
```
root:   metal-chrome, rounded-xl, overflow-hidden, flex flex-col, shadow-lg, bevel-{bevel}
header: px-5 py-4, border-b border-white/10, text-white font-semibold
body:   px-5 py-4, flex-1, overflow-auto
footer: px-5 py-4, border-t border-white/10
```

---

## Phase 2: Blueprint

### 2.1: Panel blueprint

**File**: `blueprints/panel.blueprint.ts`

```typescript
registerBlueprint({
  id: "panel.default",
  kind: "panel",
  label: "Default Panel",
  defaultRecipe: "panel.glass.void",
  defaultProps: {
    accent: "teal",
    surface: "glass",
    variant: "void",
    radius: "lg",
    depth: 2,
    glow: "none",
    bevel: "none",
  },
  slots: {
    header: { required: false },
    body: { required: true },
    footer: { required: false },
  },
});
```

---

## Phase 3: Component Layer

### 3.1: Component types

**File**: `components/panel/types.ts`

```typescript
interface PanelProps extends ComponentSurfaceProps, BaseProps {
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  children?: Snippet;
}

interface PanelHeaderProps extends BaseProps {
  children?: Snippet;
  class?: string;
}

interface PanelBodyProps extends BaseProps {
  children?: Snippet;
  class?: string;
}

interface PanelFooterProps extends BaseProps {
  children?: Snippet;
  class?: string;
}
```

### 3.2: Component context

**File**: `components/panel/context.ts`

```typescript
interface PanelComponentContext {
  readonly classes: Record<string, string>;
}
```

No transport needed — panel has no interactive state.

### 3.3: Root — `Panel.svelte`

Resolves recipe, sets context, renders root `<div>` with recipe root class.
Applies `data-kind="panel"` and `data-slot="root"`.
When children are provided without explicit Header/Body/Footer, wraps them in body semantics.

### 3.4: Sub-components

| File | Slot | Element | Notes |
|---|---|---|---|
| `PanelHeader.svelte` | header | `<div>` | `data-kind="panel"` `data-slot="header"`, recipe header class |
| `PanelBody.svelte` | body | `<div>` | `data-kind="panel"` `data-slot="body"`, recipe body class, flex-1 |
| `PanelFooter.svelte` | footer | `<div>` | `data-kind="panel"` `data-slot="footer"`, recipe footer class |

### 3.5: Barrel + registration

**File**: `components/panel/index.ts` — Root, Header, Body, Footer
**Update**: `components/index.ts` — add `export * as Panel` + side-effect imports

---

## Phase 4: Tests

### 4.1: Test harness

**File**: `components/panel/Panel.test.svelte`

Panel with all three slots populated: header text, body content, footer with button.

### 4.2: Test suite

**File**: `components/panel/Panel.test.ts`

**Categories**:

1. **Contract** — `data-kind="panel"`, `data-slot` on root/header/body/footer
2. **Recipe classes** — glass-void styling applied to all slots
3. **Structure** — header/body/footer render in correct order, all optional
4. **Slot rendering** — header content renders, body content renders, footer content renders
5. **Padding** — padding prop applies correct spacing class
6. **Recipe override** — custom recipe prop applies different styling
7. **Surface props** — accent/surface/variant/radius/depth/glow/bevel forwarded to recipe

---

## Phase 5: Verification

- [ ] `pnpm svelte-check` — zero type errors
- [ ] `pnpm vitest run` — all panel tests pass (plus existing dialog/combobox tests)
- [ ] `components/index.ts` exports Panel
- [ ] Panel renders correctly with each recipe variant

---

## Files Changed

### New Files
```
recipes/panel.recipe.ts
blueprints/panel.blueprint.ts
components/panel/types.ts
components/panel/context.ts
components/panel/Panel.svelte
components/panel/PanelHeader.svelte
components/panel/PanelBody.svelte
components/panel/PanelFooter.svelte
components/panel/index.ts
components/panel/Panel.test.svelte
components/panel/Panel.test.ts
```

### Modified Files
```
components/index.ts  — add Panel export + side-effect imports
```

### Removed Files
```
components/panel/README.md  — replaced by actual implementation
```
