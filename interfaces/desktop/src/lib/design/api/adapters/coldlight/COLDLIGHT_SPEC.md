# ColdLight Design System Specification

> **MASTER SSOT** — Schema-driven, contract-first, registry-based architecture.
>
> This document is the canonical specification for ColdLight.

---

## Core Principles

### 1. Schema-Driven Design System
Every artifact has a validated shape + allowed IDs/enums ("kinds").

### 2. Contract-First Design System
API + taxonomy + registries are locked BEFORE implementation.

### 3. Registry-Based Architecture
Canonical registries of allowed IDs for primitives/recipes/blocks/patterns/tokens.

### 4. Discriminated-Union Identity Model
`kind` is the discriminant (typed identity string).

### 5. Provider Adapter Layer
MeltUI/Ark/Skeleton supply behavior; ColdLight remains SSOT.

---

## ColdLight SSOT Rule (Provider-Backed)

- **ColdLight is the SSOT public API.**
- A provider (MeltUI now; later Ark/Skeleton) supplies ARIA + behavior/state.
- ColdLight wraps the provider via an adapter layer so consumers only touch ColdLight.

---

## Required Data Attributes

Every primitive element MUST emit exactly these three attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive identity (discriminant) | `"button"`, `"accordion"`, `"tabs"` |
| `data-slot` | Structural part within primitive | `"root"`, `"trigger"`, `"content"` |
| `data-state` | Space-separated state tokens | `"open focused"`, `"disabled"` |

### State Token Format (2026 Standard)

```html
data-state="open focused invalid"
```

CSS selection uses `~=` for token matching:
```css
[data-state~="open"] { ... }
[data-state~="disabled"] { ... }
```

---

## Slot Conventions

### Rules

1. **Slots represent structural parts, not styling choices.**
   - If a "slot" only exists to apply a visual effect, it belongs in recipes.

2. **Slots must be provider-agnostic.**
   - No `trigger`, `contentEl`, `melt-*` naming.
   - Use semantic names that work if MeltUI is replaced.

3. **Slots must be stable + additive.**
   - Can add optional slots later.
   - Removing/renaming slots is a breaking change.
   - Treat slot inventories like public API.

### Slot Naming Convention

- lowercase kebab-case
- semantic part names
- `root` is fine (it's a part identity, not a file name)
- Use `control` instead of `trigger` if preferred

### Common Slot Vocabulary

```
root, control, label, icon-leading, icon-trailing, indicator, panel,
helper, error, counter, badge, viewport, item, list, overflow
```

---

## State Token Conventions

### Format

- lowercase kebab-case tokens
- space-separated in `data-state`
- split into shared tokens + primitive-specific tokens

### Shared State Tokens (Reusable Everywhere)

| Category | Tokens |
|----------|--------|
| **Presence** | `present`, `hidden` |
| **Primary** | `open`, `closed`, `active`, `inactive`, `selected`, `unselected` |
| **Interaction** | `hovered`, `pressed` |
| **Focus** | `focused`, `focus-visible` |
| **Availability** | `disabled`, `readonly` |
| **Validation** | `valid`, `invalid` |
| **Lifecycle** | `dirty`, `pristine`, `touched`, `untouched` |
| **Drag** | `dragging`, `over-before`, `over-after` |
| **System** | `loading`, `pending`, `empty`, `filled` |

---

## Adapter Contract

Each provider MUST declare:

| Requirement | Description |
|-------------|-------------|
| **Supported Primitives** | List of `PrimitiveKind` values it handles |
| **State Mapping Rules** | Provider state → ColdLight state tokens |
| **Event Mapping Rules** | Provider events → ColdLight event handlers |
| **ARIA Responsibility Boundaries** | What the provider handles vs what ColdLight handles |
| **Version + Capability Flags** | Provider version and feature support |

### ARIA Responsibility Boundary

**Provider (MeltUI) Handles:**
- `role` attributes
- `aria-*` attributes
- `tabindex`
- Focus trap logic
- Keyboard handlers
- Positioning (Floating UI)

**ColdLight Handles:**
- `data-kind`
- `data-slot`
- `data-state`
- Props interface
- Rendered markup structure

---

## Primitive Families

### Family 1 — Layout Primitives (Non-ARIA, Structural)

```
Box, Stack, Flex, Cluster, Grid, Center, Bleed, AspectRatio,
ScrollArea, VisuallyHidden, Separator, Resizable/SplitView
```

### Family 2 — Behavior Primitives (ARIA/State Providers)

#### Inputs & Controls
```
Button, ButtonGroup, Input, Textarea, InputGroup, OTP, Checkbox,
RadioGroup, Switch, Slider, Select, Combobox, Form/Field
```

#### Navigation & Disclosure
```
Tabs, Accordion, Breadcrumb, Pagination, NavigationMenu, Sidebar
```

#### Overlays & Feedback
```
Dialog/Modal, Drawer/Sheet, Popover, Tooltip, ContextMenu, Toast
```

#### Data/Perf
```
VirtualList, VirtualGrid, DataGrid, Tree, Skeleton, Progress, Spinner
```

#### AI-Native
```
PromptInput, StreamableText, CopilotSuggestion, MarkdownRenderer,
FileTrigger, Dropzone
```

---

## Slot Inventory Scope

For each primitive, define:

| Level | Description |
|-------|-------------|
| **Required Slots** | Must exist when primitive renders |
| **Conditional Slots** | Exist only when feature enabled |
| **Forbidden Slots** | Never allowed |

### Slot Presence Levels

**Model:** All slots declared; DOM may omit.

---

## Tabs v1 Contract (Reference Example)

### Slots Registry

**Required:**
```
root, list, tab, panel
```

**Optional/Enhancements:**
```
indicator, icon, badge, close, overflow, scroll-prev, scroll-next,
contextmenu, drag-handle, ghost (conditional, drag-only)
```

### State Tokens

**Root/List (layout/mode + runtime):**
- Mode: `horizontal` | `vertical` (exactly one)
- Runtime: `overflowing` (when true), plus globals (`disabled`, etc.)

**Tab (item):**
- `active` | `inactive` (exactly one)
- `selected` | `unselected` (exactly one)
- Drag: `dragging`, `over`
- Focus: `focused`, `focus-visible`
- Interaction: `hovered`, `pressed`
- Availability: `disabled`
- Optional: `closable` (only if close slot enabled)

**Panel:**
- Active: `active present`
- Inactive: `hidden present inactive`

### Presence Discipline

- Panels are always mounted.
- Inactive panels are non-interactive (ARIA + keyboard) and visually hidden.
- Active panels are `active present`.

### Overflow Signals

When `overflowing`:
- Enable `scroll-prev`/`scroll-next` slots
- Enable `overflow` slot (more menu)

### Drag Reorder

Adapter provides:
- `dragging` — when dragging self
- `over` — when a dragged tab is over this tab
- `ghost` slot — placeholder or preview

### Keyboard Shortcuts

- `Ctrl+ArrowLeft/ArrowRight` (or Up/Down for vertical)
- `Alt+ArrowLeft/ArrowRight` as optional alias

---

## Utility Functions

### Fluid/Layout Math (Core)
```typescript
viewport.clamp()    // Viewport-based clamping
tru(px)             // True pixel conversion
fluid.text()        // Fluid typography
container.query()   // Container query helpers
math.lerp()         // Linear interpolation
```

### Motion + Environment (Core)
```typescript
motion.reduced()    // prefers-reduced-motion check
color.glass()       // Contrast sanity for overlays
layer.stack()       // Z-index governance
```

### Interaction + System (Core)
```typescript
keyboard.shortcut() // Keyboard shortcut registration
focus.ring()        // Accessible focus system
state.sync()        // Provider state → ColdLight state tokens
render.snippet()    // Svelte 5 projection helpers
```

### Performance + Debugging
```typescript
perf.monitor()      // Component-level marks
debug.wireframe()   // Strip recipes, keep semantics
```

---

## Svelte Utilities

### Class Merger
```typescript
cn() // Tailwind class merging (still valid in Svelte)
```

### Event Composition
```typescript
composeHandlers(...) // Chain event callbacks
```

### Action Composition
```typescript
mergeActions() // Chain multiple use: actions
```

### Safe Context
```typescript
createSafeContext() // Wrap getContext with hard error if missing
```

### Slot Polymorphism
Svelte 5 snippets / `@render` for child-as-control patterns.

---

## CSS Pseudo-Element Conventions

For visual effects (recipes, not slots):

```css
::glass-blur
::neu-convex
::neu-concave
::specular-highlight
::diffuse-shadow
::grain-overlay
::edge-glow
::scrim
::caustic-light
```

---

## Tailwind Integration

### Container Queries
```
@tailwindcss/container-queries
```

### Animation
```
tailwindcss-animate
```

### CVA
Class Variance Authority — still useful for TS + class generation.

### Data-State Variants
```css
data-[state=open]:...
```

Or custom plugin targeting `data-state~="open"` tokens.

---

## Directory Structure

### ColdLight SSOT Taxonomy (Root)
```
src/lib/design/taxonomy/coldlight/
├── coldlight.contract.ts  → Schema/validators for ColdLight artifact shapes
├── coldlight.registry.ts  → Canonical lists of IDs (kinds) that exist
├── types.ts               → Derived unions/types from registries
└── coldlight.manifest.ts  → Declares deps + exports for this hub
```

### Adapter: ColdLight (SSOT Adapter Surface)
```
src/lib/design/taxonomy/api/adapters/coldlight/
├── coldlight.contract.ts
├── coldlight.registry.ts
├── types.ts
└── _internal/             → Clear framework for all primitives
    ├── button.internal.ts
    ├── accordion.internal.ts
    ├── otp.internal.ts
    ├── input.internal.ts
    ├── tabs.internal.ts
    └── index.ts           → Export-only
```

### Adapter: MeltUI (Provider)
```
src/lib/design/taxonomy/api/adapters/meltui/
├── meltui.contract.ts
├── meltui.registry.ts
├── types.ts
├── meltui.manifest.ts
└── _internal/             → Mapping MeltUI → ColdLight one-to-one
    ├── button.internal.ts
    ├── accordion.internal.ts
    ├── otp.internal.ts
    ├── input.internal.ts
    ├── tabs.internal.ts
    └── index.ts           → Export-only
```

### Primitives (After Adapters Exist)
```
src/lib/design/primitives/<kind>/
├── <kind>.svelte
├── types.ts
└── index.ts               → Export-only
```

Every primitive outputs:
```html
data-kind="<kind>"
data-slot="..."
data-state="..."
```

---

## `_internal` File Format

Each `_internal/*.internal.ts` file MUST contain:

```typescript
/**
 * @file _internal/<kind>.internal.ts
 * @primitive <kind>
 */

// 1. Primitive Identity
export const KIND = '<kind>' as const;

// 2. Slot Inventory
export const SLOTS = {
  required: ['root', 'trigger', 'content'] as const,
  conditional: ['icon', 'badge'] as const,
  forbidden: [] as const,
} as const;

// 3. State Token Inventory
export const STATES = {
  shared: ['disabled', 'focused', 'focus-visible'] as const,
  specific: ['open', 'closed'] as const,
} as const;

// 4. Melt Builder (for MeltUI adapter)
export const MELT_BUILDER = 'createAccordion';

// 5. Element Map (Melt element → ColdLight slot)
export const ELEMENT_MAP = {
  root: 'root',
  item: 'item',
  trigger: 'trigger',
  content: 'content',
} as const;

// 6. State Map (Melt state → ColdLight state token)
export const STATE_MAP = {
  open: 'open',
  // Melt's boolean → ColdLight's 'open' | 'closed'
} as const;

// 7. What Melt Handles (passthrough)
export const MELT_HANDLES = [
  'role',
  'aria-expanded',
  'aria-controls',
  'aria-labelledby',
  'tabindex',
  'keyboard navigation',
  'focus management',
] as const;

// 8. What ColdLight Adds
export const COLDLIGHT_ADDS = [
  'data-kind',
  'data-slot',
  'data-state',
] as const;
```

---

## Artifact Identity Model

```typescript
export type ArtifactKind =
  | 'token'
  | 'recipe'
  | 'primitive'
  | 'compound'
  | 'block'
  | 'pattern'
  | 'adapter'
  | 'util';

// ID rules: stable strings, no renames without version bump
```

---

## Non-Negotiable Rules

1. **Taxonomy first** — If taxonomy doesn't know about it, it doesn't exist.
2. **Three data attributes only** — `data-kind`, `data-slot`, `data-state`.
3. **Provider passthrough** — Melt handles ARIA; ColdLight handles taxonomy.
4. **Slots are structural** — Not styling choices.
5. **States are composable** — Space-separated tokens.
6. **Contracts before code** — API locked before implementation.
7. **`_internal` files before primitives** — Mapping exists before component.

---

## Verification

```bash
cd interfaces/desktop
pnpm check
```

---

**This is the canonical ColdLight specification.**
