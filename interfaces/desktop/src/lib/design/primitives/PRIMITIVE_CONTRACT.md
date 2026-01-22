# ColdLight Primitive Contract

> **NO WIGGLE ROOM** — These rules are absolute.

---

## Core Principle

**ColdLight explicitly owns all accessibility.**

bits-ui is a behavior engine. It provides:
- Positioning (Floating UI)
- Focus trapping
- Keyboard navigation
- Click outside detection
- Escape key handling
- Portal rendering

bits-ui does NOT own:
- ARIA attributes (we set them)
- Data attributes (we set them)
- Props interface (we define it)
- Rendered markup structure (we control it)

---

## Data Attribute Contract

Every primitive component MUST set these attributes:

### Required Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Identifies the primitive family | `"select"`, `"dialog"`, `"tooltip"` |
| `data-slot` | Identifies the slot within primitive | `"trigger"`, `"content"`, `"item"` |

### Conditional Attributes

| Attribute | When | Values |
|-----------|------|--------|
| `data-state` | Component has open/closed or active/inactive state | `"open"`, `"closed"`, `"active"`, `"inactive"` |
| `data-selected` | Item can be selected | Present when selected, absent when not |
| `data-highlighted` | Item can be highlighted/focused | Present when highlighted, absent when not |
| `data-disabled` | Component can be disabled | Present when disabled, absent when not |
| `data-side` | Positioned content (popover, tooltip) | `"top"`, `"right"`, `"bottom"`, `"left"` |

### Optional Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-id` | User-defined stable ID for testing/styling |

### Legacy Attributes (for bits-ui compatibility)

Some bits-ui CSS relies on these. Include them but consider deprecated:
- `data-select-arrow=""`, `data-popover-arrow=""`, etc.

---

## Props Contract

### What ColdLight Props Include

```typescript
interface PrimitiveProps {
  // Class for styling
  class?: string;

  // User-defined stable ID
  "data-id"?: string;

  // Children snippet
  children?: Snippet;

  // Component-specific props (documented per primitive)
  // ...
}
```

### What ColdLight Props EXCLUDE

```typescript
// ❌ NEVER in ColdLight props
interface Forbidden {
  style?: never;        // No inline styles - use class
  id?: never;           // Use data-id instead (bits-ui manages id)
  ref?: never;          // Only on specific components that need it
}
```

### Type Pattern

```typescript
// ✅ CORRECT - Explicit props, no HTML attribute spreading
export interface SelectTriggerProps {
  class?: string;
  "data-id"?: string;
  disabled?: boolean;
  children?: Snippet;
}

// ❌ WRONG - Extends HTML attributes (causes null vs undefined issues)
export interface SelectTriggerProps extends HTMLButtonAttributes {
  // ...
}
```

---

## ARIA Ownership

ColdLight sets ARIA attributes explicitly. We do NOT rely on bits-ui spreading them.

### Pattern for Content Components

```svelte
<BitsComponent {...rest}>
  {#snippet child({ props, open })}
    <div
      {...props}
      role="dialog"              <!-- ColdLight sets this -->
      aria-modal="true"          <!-- ColdLight sets this -->
      aria-labelledby={titleId}  <!-- ColdLight sets this -->
      data-kind="dialog"
      data-slot="content"
      data-state={open ? "open" : "closed"}
    >
      {@render children()}
    </div>
  {/snippet}
</BitsComponent>
```

### ARIA Reference by Primitive

| Primitive | Slot | ARIA |
|-----------|------|------|
| Dialog | content | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| AlertDialog | content | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Select | trigger | `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"` |
| Select | content | `role="listbox"` |
| Select | item | `role="option"`, `aria-selected` |
| Tooltip | content | `role="tooltip"` |
| Tabs | list | `role="tablist"` |
| Tabs | trigger | `role="tab"`, `aria-selected`, `aria-controls` |
| Tabs | content | `role="tabpanel"`, `aria-labelledby` |

---

## File Structure per Primitive

```
primitives/
├── select/
│   ├── index.ts              # Re-exports all components
│   ├── types.ts              # Type definitions
│   ├── Root.svelte
│   ├── Trigger.svelte
│   ├── Content.svelte
│   ├── Item.svelte
│   ├── ItemText.svelte       # ColdLight-owned (no bits-ui equivalent)
│   ├── ItemGroup.svelte
│   ├── GroupLabel.svelte
│   ├── Separator.svelte
│   ├── ScrollUp.svelte
│   ├── ScrollDown.svelte
│   ├── Arrow.svelte          # Uses FloatingLayerArrow from _internal
│   ├── Portal.svelte
│   ├── a11y.md               # Accessibility documentation
│   └── [Primitive].test.ts   # Tests
```

---

## Component Template

```svelte
<!--
  @file primitives/[primitive]/[Slot].svelte
  @layer primitives

  [Description of component purpose]

  Data Attributes:
  - data-kind="[primitive]"
  - data-slot="[slot]"
  - data-state="[states if applicable]"

  ARIA:
  - role="[role]"
  - aria-[attribute]="[value]"
-->
<script lang="ts">
  import { [BitsComponent] } from "bits-ui";
  import type { [Props] } from "./types.js";

  let {
    class: className = "",
    "data-id": dataId,
    children,
    ...rest
  }: [Props] = $props();
</script>

<[BitsComponent] {...rest}>
  {#snippet child({ props, [state] })}
    <[element]
      {...props}
      class={className}
      role="[role]"
      aria-[attribute]="[value]"
      data-kind="[primitive]"
      data-slot="[slot]"
      data-state={[state]}
      data-id={dataId}
    >
      {#if children}
        {@render children()}
      {/if}
    </[element]>
  {/snippet}
</[BitsComponent]>
```

---

## Testing Requirements

Every primitive MUST have:

1. **Unit tests** (`[Primitive].test.ts`)
   - Renders without error
   - Has correct data attributes
   - Has correct ARIA attributes
   - Keyboard navigation works

2. **Accessibility tests**
   - aXe or similar a11y audit passes
   - Screen reader announcement is correct

3. **Visual test** (`[Primitive].test.svelte`)
   - Renders all states
   - Used for visual regression

---

## Checklist for New Primitive

- [ ] Create folder `primitives/[name]/`
- [ ] Create `types.ts` with explicit props (no HTML attribute extension)
- [ ] Create all slot components
- [ ] Every component has `data-kind` and `data-slot`
- [ ] ARIA attributes are explicitly set (not inherited from bits-ui)
- [ ] Uses `_internal` for any bits-ui utilities
- [ ] Create `a11y.md` documenting accessibility features
- [ ] Create `index.ts` re-exporting all components
- [ ] Create tests
- [ ] Add to `primitives/index.ts` barrel export
- [ ] Document in `primitives/PRIMITIVES.md`
