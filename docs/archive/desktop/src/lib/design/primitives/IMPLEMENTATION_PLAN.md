# Primitives Implementation Plan

> **STATUS**: AWAITING APPROVAL - No code will be written until you approve this plan.

---

## Decisions Made (From Your Answers)

| Question | Your Answer |
|----------|-------------|
| Bits UI sub-components | **Namespace re-export** - Export entire namespace (Dialog, not Dialog.Root separately) |
| ARIA attributes | **Baked into primitive** - Alert always has role="alert", enforced |
| Keyboard handling | **Bits UI first** - Only add custom for non-Bits primitives |
| Route data for smart primitives | **Both modes** - Route metadata registry + manual prop override |
| Toast library | **svelte-sonner** - Wrap with your styling system |
| Data Table scope | **Full TanStack integration** - Feature primitive (owns a11y wiring) |
| Loading states | **Both** - Skeleton primitive + loading props on common primitives |
| Input granularity | **Specialized** - InputText, InputEmail, InputPassword, InputNumber, etc. |
| Focus management | **Both** - Bits UI handles its own + FocusTrap primitive for custom |
| Ref exposure | **Only when needed** - Input, Button, Canvas, etc. (strict approach) |
| Extra primitives | **VisuallyHidden, Portal, Presence** - All three (SSR-safe) |
| Taxonomy link | **Primitives are taxonomy-agnostic** - Renderers handle contracts |

---

## Critical Rules (Senior Constraints)

### Rule 1: Namespace Re-exports, Not Reshaped APIs
Bits UI uses namespaced objects (`Dialog.Root`, `Dialog.Trigger`). We re-export the **namespace**, not fake named exports. This maintains:
- Composition expectations
- Docs alignment with Bits UI
- Upgrade compatibility
- Developer muscle memory

**Important Limitation**: Bits UI namespace re-exports do NOT carry our `data-*` targeting attributes. Click-to-edit tooling should primarily target Blocks/Components, not raw Bits primitives. If sub-part instrumentation is needed, wrap at the component layer.

### Rule 2: Props Spreading Security
All primitives using `...rest` must:
- **BAN** the `style` prop at type level (prevents inline style injection)
- **BAN** the `style` prop at runtime in DEV (strip + console.warn)
- **ALLOW** `data-*` attributes
- **ALLOW** ARIA props

```typescript
// DEV-only runtime enforcement (types alone don't stop JS/any)
if (import.meta.env.DEV && 'style' in rest) {
  console.warn(`[ColdLight] Inline style prop stripped from ${componentName}`);
  delete (rest as Record<string, unknown>).style;
}
```

### Rule 3: Route Intelligence via Dependency Injection
Smart primitives **NEVER infer labels from raw URL segments**. This breaks i18n, dynamic routes, and human-readable names.

**Injection Pattern** (primitives remain portable, not SvelteKit-bound):
- Primitives export **types + access API only**
- App **owns** the registry data and **injects** it (context/store/setter)
- This prevents cross-domain coupling and import cycles

```typescript
// ❌ WRONG - primitives module owns data (creates coupling)
export const routeRegistry = { "/": { label: "Home" } };

// ✅ CORRECT - primitives export types + access function
export interface RouteMetadata { label: string; icon?: string; }
export function getRouteMetadata(path: string): RouteMetadata | undefined {
  return _injectedRegistry[path];
}
export function setRouteRegistry(registry: Record<string, RouteMetadata>) {
  _injectedRegistry = registry;
}
let _injectedRegistry: Record<string, RouteMetadata> = {};
```

**Priority Order**:
1. Manual `items` prop (always wins)
2. Injected route metadata registry lookup
3. Fallback: "Untitled" (never guess from URL)

### Rule 4: Stable DOM Targeting Hooks (Internal, Not User-Overridable)

Every primitive has **fixed** DOM targeting attributes:

| Attribute | Purpose | User Override? |
|-----------|---------|----------------|
| `data-kind="primitive"` | Layer identification | **NO** - fixed |
| `data-name="Alert"` | Component name | **NO** - fixed |
| `data-part="root\|title\|..."` | Sub-part targeting | **NO** - fixed internally |
| `data-id` | User-defined stable id | **YES** - optional user prop |

**Why internal?** If users can override `data-part`, your click-to-edit tooling becomes unreliable. The tooling needs guaranteed invariants.

**Namespace-Ready Architecture**: Attribute names come from a single constant. Start clean, add prefix later if collisions arise.

```typescript
// types.ts - single source of truth for attribute names
const NS = ""; // Empty now, can become "cl-" later if needed

export const DATA_ATTRS = {
  part: `data-${NS}part`,   // "data-part" now, "data-cl-part" later
  name: `data-${NS}name`,
  kind: `data-${NS}kind`,
  id: `data-${NS}id`,
} as const;
```

```svelte
<!-- Usage (CANNOT be changed by user) -->
<div
  data-kind="primitive"
  data-name="Alert"
  data-part="root"
  data-id={id}  <!-- Optional user-provided id -->
>
```

### Rule 5: SSR Safety + Reduced Motion
- **Portal**: No-op on server, activates only in browser
- **Presence**: Deterministic lifecycle (entered → exiting → removed)
  - Respect `prefers-reduced-motion` (instant removal, no animation)
  - Never leave "ghost nodes" in DOM
  - Must complete exit animation before DOM removal
- **Smart primitives**: Use SSR-safe patterns, avoid store subscription boilerplate

---

## Primitive Categories

### Category 1: Bits UI Namespace Re-exports (33 total, 7 exist, 26 to create)

**Pattern**: Re-export the Bits UI namespace object directly. NO reshaping the API.

```typescript
// ✅ CORRECT - namespace re-export
export { Dialog } from "bits-ui";
// Usage: <Dialog.Root>, <Dialog.Trigger>, etc.

// ❌ WRONG - do not reshape
export { Dialog as Root } from "bits-ui"; // This doesn't even work
```

**Existing (7)**:
- [x] Accordion
- [x] Button
- [x] Dialog
- [x] Popover
- [x] Select
- [x] Tabs
- [x] Toggle

**To Create (26)**:
| Primitive | Bits UI Component | Sub-components to Export |
|-----------|-------------------|-------------------------|
| AlertDialog | alert-dialog | Root, Trigger, Portal, Overlay, Content, Title, Description, Action, Cancel |
| AspectRatio | aspect-ratio | Root |
| Avatar | avatar | Root, Image, Fallback |
| Calendar | calendar | Root, Header, Heading, PrevButton, NextButton, Grid, GridHead, GridBody, GridRow, HeadCell, Cell, Day |
| Checkbox | checkbox | Root, Indicator |
| Collapsible | collapsible | Root, Trigger, Content |
| Combobox | combobox | Root, Input, Trigger, Portal, Content, Group, Label, Item, ItemIndicator, Separator |
| Command | command | Root, Input, List, Group, Item, Separator, Empty |
| ContextMenu | context-menu | Root, Trigger, Portal, Content, Group, Label, Item, CheckboxItem, RadioGroup, RadioItem, Separator, Sub, SubTrigger, SubContent |
| DatePicker | date-picker | Root, Label, Input, Segment, Trigger, Content, Calendar (+ all Calendar sub) |
| DropdownMenu | dropdown-menu | Root, Trigger, Portal, Content, Group, Label, Item, CheckboxItem, RadioGroup, RadioItem, Separator, Sub, SubTrigger, SubContent |
| HoverCard | hover-card | Root, Trigger, Portal, Content, Arrow |
| Label | label | Root |
| Menubar | menubar | Root, Menu, Trigger, Portal, Content, Group, Label, Item, CheckboxItem, RadioGroup, RadioItem, Separator, Sub, SubTrigger, SubContent |
| NavigationMenu | navigation-menu | Root, List, Item, Trigger, Content, Link, Viewport, Indicator |
| Pagination | pagination | Root, PrevButton, NextButton, Page, Ellipsis |
| Progress | progress | Root |
| RadioGroup | radio-group | Root, Item, Indicator |
| ScrollArea | scroll-area | Root, Viewport, Scrollbar, Thumb, Corner |
| Separator | separator | Root |
| Slider | slider | Root, Track, Range, Thumb |
| Switch | switch | Root, Thumb |
| ToggleGroup | toggle-group | Root, Item |
| Tooltip | tooltip | Root, Trigger, Portal, Content, Arrow |
| DateField | date-field | Root, Input, Segment |
| TimeField | time-field | Root, Input, Segment |

---

### Category 2: Utility Primitives (3 to create)

**Pattern**: Essential accessibility/animation utilities that smart designers always have.

| Primitive | Purpose | Implementation |
|-----------|---------|----------------|
| VisuallyHidden | Screen-reader-only content | `<span>` with sr-only styles, NO display:none |
| Portal | Render outside DOM hierarchy | **SSR-safe**: No-op on server, Bits UI Portal on client |
| Presence | Mount/unmount with animations | **Lifecycle**: entered → exiting → removed (finish transitions before detach) |

#### SSR Safety Requirements

```typescript
// Portal - browser-only activation
if (typeof window !== "undefined") {
  // activate portal
}

// Presence - deterministic lifecycle
type PresenceState = "entered" | "exiting" | "removed";
// Must complete exit animation before DOM removal
```

---

### Category 3: Custom Primitives with Baked ARIA (23 to create)

**Pattern**: Semantic HTML + ARIA attributes baked in. NO styling.

#### ARIA Gotchas (Critical Fixes Applied)

| Issue | Wrong | Correct |
|-------|-------|---------|
| Alert double-announce | `role="alert"` + `aria-live="assertive"` | `role="alert"` only (implies live region) |
| Badge misuse | `role="status"` on visual labels | Badge = visual label (no role), LiveStatus = `role="status"` |
| Spinner unlabeled | `role="status"` without label | `role="status"` + guaranteed `aria-label` |
| Skeleton focusable | Just `aria-hidden` | `aria-hidden` + `tabindex="-1"` + non-focusable |

#### Primitive Specifications

| Primitive | Element | Baked ARIA | Ref Exposed? |
|-----------|---------|------------|--------------|
| Alert | `<div>` | `role="alert"` `aria-atomic="true"` (NO aria-live - role implies it) | No |
| Badge | `<span>` | NO role (visual label only, not a live region) | No |
| LiveStatus | `<span>` | `role="status"` (use ONLY when content changes should announce) | No |
| ButtonGroup | `<div>` | `role="group"` `aria-label` (required prop) | No |
| Card | `<article>` | `aria-labelledby` (auto-linked to heading) | No |
| Chart | `<figure>` | `role="img"` `aria-label` (required prop) | No |
| Empty | `<div>` | `role="status"` `aria-live="polite"` | No |
| Field | `<div>` | wrapper, auto-links label/input/error via `aria-describedby` | No |
| Form | `<form>` | `aria-describedby` for error summary | Yes (for submit) |
| FocusTrap | `<div>` | Traps focus within, handles Escape | No |
| InputText | `<input type="text">` | `aria-invalid` `aria-describedby` | Yes |
| InputEmail | `<input type="email">` | `aria-invalid` `aria-describedby` | Yes |
| InputPassword | `<input type="password">` | `aria-invalid` `aria-describedby` + show/hide | Yes |
| InputNumber | `<input type="number">` | `aria-invalid` `aria-describedby` | Yes |
| InputGroup | `<div>` | `role="group"` | No |
| InputOTP | `<div>` | `role="group"` + hidden input for form | Yes (hidden input) |
| Kbd | `<kbd>` | semantic | No |
| NativeSelect | `<select>` | native accessibility | Yes |
| Skeleton | `<div>` | `aria-hidden="true"` `tabindex="-1"` (never focusable, parent gets `aria-busy`) | No |
| Spinner | `<span>` | `role="status"` + **required** `aria-label` prop (default: "Loading") | No |
| Table | `<table>` | `<caption>`, `<th scope>` | No |
| Textarea | `<textarea>` | `aria-invalid` `aria-describedby` | Yes |
| Typography | element varies | semantic `<p>`, `<h1-6>`, `<span>` | No |

---

### Category 4: Smart/Route-Aware Primitives (5 to create)

**Pattern**: Svelte 5 runes, dual-mode (route metadata registry OR manual props), data-driven.

#### Critical Constraint: No URL Guessing

```typescript
// ❌ NEVER DO THIS - breaks i18n, dynamic routes, human-readable names
const label = pathname.split("/").pop(); // "user-123" is not a label

// ✅ ALWAYS DO THIS - explicit route metadata
const label = routeMetadata[pathname]?.label ?? "Untitled";
```

| Primitive | Features | Data Source |
|-----------|----------|-------------|
| Breadcrumb | `aria-current="page"`, `<nav>/<ol>`, auto-generate from routes | Route metadata registry OR `items` prop |
| Sidebar | Auto-highlight current route, collapsible sections, keyboard nav | Route metadata registry OR `items` prop |
| NavMenu | Auto-active states, keyboard nav, `aria-current` | Route metadata registry OR `items` prop |
| DataTable | TanStack Table wrapper, `aria-sort`, row selection, keyboard nav | TanStack Table instance |
| Carousel | Keyboard (arrows), scroll, `aria-roledescription`, live region | `items` prop |

#### Route Metadata Registry (To Be Created)

```typescript
// src/lib/design/primitives/route-metadata.ts
export interface RouteMetadata {
  label: string;       // Human-readable, i18n-ready
  icon?: string;       // Optional icon identifier
  parent?: string;     // Parent route for breadcrumb hierarchy
  hidden?: boolean;    // Exclude from nav
}

export const routeRegistry: Record<string, RouteMetadata> = {
  "/": { label: "Home" },
  "/dashboard": { label: "Dashboard", parent: "/" },
  // ... populated by app, not primitives
};
```

#### Priority Order
1. Manual `items` prop (always wins)
2. Route metadata registry lookup
3. Fallback: "Untitled" (never guess from URL)

---

### Category 5: Integration Primitives (2 to create)

**Pattern**: Wrap external libraries with your styling system.

| Primitive | Library | Notes |
|-----------|---------|-------|
| Toast/Sonner | svelte-sonner | Wrap toaster with your tokens/recipes |
| Sheet | Bits UI Dialog | Slide-in variant of Dialog |

---

### Special Note: DataTable is a Feature Primitive

DataTable is NOT a thin wrapper. TanStack Table is headless - **we own accessibility compliance**.

#### CRITICAL: Do NOT Lie About role="grid"

**The Trap**: If you set `role="grid"`, screen readers expect a **full grid keyboard interaction model**:
- Arrow key cell navigation (up/down/left/right)
- Roving tabindex patterns
- Home/End for row start/end
- Ctrl+Home/End for table start/end
- Focus management across cells

**If you're not implementing that fully, don't claim grid.**

**Our Approach**:
1. **Default**: Use native `<table>` semantics (no `role="grid"`)
2. **Graduate**: Only add `role="grid"` when we ship the full navigation contract
3. **Start conservative**: `aria-sort`, correct `<th scope>`, captions = good enough for most use cases

#### Required Accessibility Wiring (Our Responsibility)

| Feature | Implementation | Required for role="grid"? |
|---------|---------------|--------------------------|
| Column headers | `<th scope="col">` | No (native semantics) |
| Row headers | `<th scope="row">` when applicable | No (native semantics) |
| Sortable columns | `aria-sort="ascending\|descending\|none"` | No |
| Caption | `<caption>` element | No |
| Row selection | `aria-selected` | Yes (if interactive) |
| Arrow key navigation | Roving tabindex | **YES** (grid contract) |
| Focus management | Cell-level focus | **YES** (grid contract) |

```svelte
<!-- DataTable - NATIVE TABLE SEMANTICS (no role="grid" yet) -->
<table aria-labelledby={captionId}>
  <caption id={captionId}>{caption}</caption>
  <thead>
    <tr>
      {#each columns as col}
        <th scope="col" aria-sort={col.sortDirection}>
          {col.header}
        </th>
      {/each}
    </tr>
  </thead>
  <!-- ... -->
</table>

<!-- Only upgrade to role="grid" when full keyboard navigation is implemented -->
```

---

## File Structure

```
primitives/
├── CHECKLIST.md              # Progress tracking
├── IMPLEMENTATION_PLAN.md    # This file
├── index.ts                  # Barrel export
├── route-metadata.ts         # Route registry types (app populates)
├── types.ts                  # Shared primitive types (OmitStyle, etc.)
│
├── # Bits UI Namespace Re-exports
├── AlertDialog.ts            # export { AlertDialog } from "bits-ui"
├── AspectRatio.ts
├── Avatar.ts
├── Calendar.ts
├── Checkbox.ts
├── Collapsible.ts
├── Combobox.ts
├── Command.ts
├── ContextMenu.ts
├── DateField.ts
├── DatePicker.ts
├── DropdownMenu.ts
├── HoverCard.ts
├── Label.ts
├── Menubar.ts
├── NavigationMenu.ts
├── Pagination.ts
├── Progress.ts
├── RadioGroup.ts
├── ScrollArea.ts
├── Separator.ts
├── Slider.ts
├── Switch.ts
├── TimeField.ts
├── ToggleGroup.ts
├── Tooltip.ts
│
├── # Utility Primitives
├── VisuallyHidden.svelte
├── Portal.svelte             # SSR-safe
├── Presence.svelte           # Lifecycle-safe
│
├── # Custom ARIA Primitives
├── Alert.svelte
├── Badge.svelte              # Visual label only (no role)
├── LiveStatus.svelte         # role="status" for announcements
├── ButtonGroup.svelte
├── Card.svelte
├── Chart.svelte
├── Empty.svelte
├── Field.svelte
├── Form.svelte
├── FocusTrap.svelte
├── InputText.svelte
├── InputEmail.svelte
├── InputPassword.svelte
├── InputNumber.svelte
├── InputGroup.svelte
├── InputOTP.svelte
├── Kbd.svelte
├── NativeSelect.svelte
├── Skeleton.svelte           # Non-focusable
├── Spinner.svelte            # Required aria-label
├── Table.svelte
├── Textarea.svelte
├── Typography.svelte
│
├── # Smart/Route-Aware Primitives
├── Breadcrumb.svelte         # Uses route-metadata.ts
├── Sidebar.svelte
├── NavMenu.svelte
├── DataTable.svelte          # Feature primitive (owns a11y)
├── Carousel.svelte
│
├── # Integration Primitives
├── Toast.svelte
└── Sheet.svelte
```

---

## Primitive Template: Bits UI Namespace Re-export

Bits UI re-exports are **TypeScript files**, not Svelte components. We re-export the namespace directly.

```typescript
// primitives/Dialog.ts
// @layer primitives
// Bits UI Dialog namespace re-export. Styling from recipes.

export { Dialog } from "bits-ui";

// Usage in components:
// import { Dialog } from "$lib/design/primitives";
// <Dialog.Root>
//   <Dialog.Trigger>...</Dialog.Trigger>
//   <Dialog.Portal>
//     <Dialog.Overlay />
//     <Dialog.Content>...</Dialog.Content>
//   </Dialog.Portal>
// </Dialog.Root>
```

**Why this pattern?**
- Maintains Bits UI's composition model
- Docs alignment (no learning new API)
- Upgrade-safe (Bits UI changes don't require rewrites)
- Tree-shakeable (unused sub-components stripped)

---

## Primitive Template: Custom ARIA

```svelte
<!--
  @file primitives/{Name}.svelte
  @layer primitives
  Custom primitive with baked-in ARIA.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    children?: Snippet;
    // primitive-specific props
  }

  let {
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  // DEV: Strip inline styles that bypass type checking
  stripStyleProp(rest, "Alert");
</script>

<!-- data-kind, data-name, data-part are INTERNAL (not user-overridable) -->
<div
  role="alert"
  aria-atomic="true"
  class={className}
  data-kind="primitive"
  data-name="Alert"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</div>
```

---

## Shared Types: types.ts

```typescript
// primitives/types.ts
// Shared type utilities for primitives

import type { HTMLAttributes } from "svelte/elements";

// ============================================
// NAMESPACE-READY DATA ATTRIBUTES
// ============================================
// Single source of truth. Change NS to add prefix later if collisions arise.
const NS = ""; // Empty now, can become "cl-" later

export const DATA_ATTRS = {
  part: `data-${NS}part`,
  name: `data-${NS}name`,
  kind: `data-${NS}kind`,
  id: `data-${NS}id`,
} as const;

// ============================================
// TYPE UTILITIES
// ============================================

/**
 * Omit 'style' prop from HTML attributes to prevent inline style injection.
 * This enforces "no inline styles" at the type level.
 */
export type OmitStyle<T extends HTMLElement> = Omit<
  HTMLAttributes<T>,
  "style"
>;

/**
 * Props that all primitives accept.
 * NOTE: data-kind, data-name, data-part are INTERNAL (not in props).
 */
export interface BaseProps {
  /** Recipe styling hook */
  class?: string;
  /** User-defined stable ID for tooling (optional) */
  "data-id"?: string;
}

// ============================================
// RUNTIME ENFORCEMENT
// ============================================

/**
 * DEV-only: Strip style prop from rest and warn.
 * Types alone don't stop JS/any usage.
 */
export function stripStyleProp(
  rest: Record<string, unknown>,
  componentName: string
): void {
  if (import.meta.env.DEV && "style" in rest) {
    console.warn(
      `[ColdLight] Inline style prop stripped from <${componentName}>. ` +
      `Use recipe classes instead.`
    );
    delete rest.style;
  }
}
```

---

## Primitive Template: Smart/Route-Aware

```svelte
<!--
  @file primitives/{Name}.svelte
  @layer primitives
  Route-aware primitive with dual-mode data source.

  CRITICAL: Never infer labels from URL segments.
  Uses injected route metadata registry for auto-mode.
-->
<script lang="ts" module>
  export interface BreadcrumbItem {
    label: string;      // Human-readable, i18n-ready
    href: string;
    current?: boolean;  // aria-current="page"
  }
</script>

<script lang="ts">
  import { page } from "$app/state";
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";
  import { getRouteMetadata } from "./route-metadata.js";

  interface Props extends OmitStyle<HTMLElement>, BaseProps {
    /** Manual mode: explicitly provide items (always wins) */
    items?: BreadcrumbItem[];
    /** Auto mode config: route metadata lookup */
    useRouteMetadata?: boolean;
    /** Fallback label when metadata missing */
    fallbackLabel?: string;
  }

  let {
    items,
    useRouteMetadata = true,
    fallbackLabel = "Untitled",
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Breadcrumb");

  // Priority: manual items > route metadata > fallback
  let resolvedItems = $derived.by(() => {
    // Manual mode always wins
    if (items) return items;

    // Auto mode: use injected route metadata registry
    if (!useRouteMetadata) return [];

    const pathname = page.url.pathname;
    return buildFromRouteMetadata(pathname, fallbackLabel);
  });

  function buildFromRouteMetadata(
    pathname: string,
    fallback: string
  ): BreadcrumbItem[] {
    const segments = pathname.split("/").filter(Boolean);
    const result: BreadcrumbItem[] = [];
    let currentPath = "";

    for (const segment of segments) {
      currentPath += `/${segment}`;
      const metadata = getRouteMetadata(currentPath);

      result.push({
        // NEVER guess from URL segment
        label: metadata?.label ?? fallback,
        href: currentPath,
        current: currentPath === pathname,
      });
    }

    return result;
  }
</script>

<nav
  aria-label="Breadcrumb"
  class={className}
  data-kind="primitive"
  data-name="Breadcrumb"
  data-part="root"
  data-id={id}
  {...rest}
>
  <ol>
    {#each resolvedItems as item, i}
      <li data-part="item">
        {#if item.current}
          <span aria-current="page">{item.label}</span>
        {:else}
          <a href={item.href}>{item.label}</a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
```

---

## Enforcement Checklist (Self-Verification)

Before creating ANY primitive, I MUST verify:

### Existence & Coverage
- [ ] Does this primitive already exist? (check index.ts)
- [ ] Is this covered by Bits UI? (use namespace re-export if yes)

### ARIA Requirements
- [ ] What ARIA attributes are REQUIRED? (bake them in)
- [ ] Is `role="alert"` used? (NO redundant aria-live)
- [ ] Is `role="status"` used? (ONLY for live announcements, not visual labels)
- [ ] Does it have required aria-label? (Spinner, Chart, ButtonGroup)
- [ ] Is it a Skeleton? (must be non-focusable with tabindex="-1")

### Props & Types
- [ ] Does it use `OmitStyle<T>` type? (ban inline styles at type level)
- [ ] Does it call `stripStyleProp()` in script? (DEV runtime enforcement)
- [ ] Does it have internal `data-kind`, `data-name`, `data-part`? (NOT user-overridable)
- [ ] Does it expose `data-id` prop? (optional user-defined stable id)
- [ ] Does it need ref exposure? (only if in the approved list above)
- [ ] Does it have a loading state? (add loading prop if common primitive)

### Style Rules (Zero Tolerance)
- [ ] NO `<style>` blocks
- [ ] NO arbitrary Tailwind values `[...]`
- [ ] NO inline styles (enforced at type level)
- [ ] NO CSS variable definitions
- [ ] All classes come from `class` prop (recipe layer)

### Smart Primitive Rules
- [ ] Uses route metadata registry (NEVER guesses from URL)
- [ ] Manual `items` prop always wins
- [ ] Fallback label is "Untitled" (never raw segment)
- [ ] SSR-safe (no document/window access on server)

---

## Execution Order

### Phase 0: Lock Tooling (BEFORE any code)
- [ ] Pin Bits UI version (confirm 2.15.4+)
- [ ] Pin Svelte/SvelteKit versions
- [ ] Confirm runes mode expectations
- [ ] Verify $app/state availability

### Phase 1: Foundation Files
- [ ] Create `types.ts` (OmitStyle, BaseProps)
- [ ] Create `route-metadata.ts` (RouteMetadata interface, getRouteMetadata)

### Phase 2: Utility Primitives (Other primitives depend on these)
- [ ] VisuallyHidden
- [ ] Portal (SSR-safe)
- [ ] Presence (lifecycle-safe)

### Phase 3: Bits UI Namespace Re-exports
- [ ] All 26 namespace re-exports as .ts files
- [ ] Update existing 7 to match namespace pattern if needed

### Phase 4: Custom ARIA Primitives
- [ ] Alert (role only, no aria-live)
- [ ] Badge (no role - visual label)
- [ ] LiveStatus (role="status" for announcements)
- [ ] Skeleton (non-focusable)
- [ ] Spinner (required aria-label)
- [ ] All other 18 primitives

### Phase 5: Smart Primitives
- [ ] Breadcrumb (route metadata, manual override)
- [ ] Sidebar (route metadata, manual override)
- [ ] NavMenu (route metadata, manual override)
- [ ] Carousel

### Phase 6: Feature Primitives (complex, own a11y)
- [ ] DataTable (TanStack + full a11y wiring)

### Phase 7: Integration Primitives
- [ ] Toast (svelte-sonner wrapper)
- [ ] Sheet (Dialog variant)

### Phase 8: Barrel Export
- [ ] Update index.ts with all exports

---

## Dependencies to Verify

Before starting, I need to confirm:

1. **svelte-sonner** - Is it installed? `pnpm ls svelte-sonner`
2. **@tanstack/svelte-table** - Is it installed? `pnpm ls @tanstack/svelte-table`
3. **bits-ui version** - Confirm 2.15.4+ for all components

---

## Approval Required

**Do NOT proceed until you confirm:**

1. Is this plan aligned with your vision?
2. Any primitives to add or remove?
3. Any patterns to change?
4. Ready to check dependencies and start execution?

---

## Post-Implementation Verification

After ALL primitives are created:

### Build Verification
1. Run `pnpm dev` - Vite plugin should NOT show violations
2. Run `pnpm build` - Build should succeed
3. Run `pnpm check` - TypeScript strict checks pass

### Per-Primitive Verification
Each primitive should:
- [ ] Have proper ARIA baked in (per spec above)
- [ ] Accept `class` prop for styling
- [ ] Have internal `data-kind`, `data-name`, `data-part` attributes (NOT user-overridable)
- [ ] Expose `data-id` prop for user-defined stable ids
- [ ] Call `stripStyleProp()` for DEV runtime enforcement
- [ ] Work without any styling (unstyled by default)
- [ ] Pass TypeScript strict checks
- [ ] Use `OmitStyle<T>` to ban inline styles at type level

---

## A11y Scenario Checklist (Per Primitive)

This catches what linting never will. Run these tests for EACH primitive:

| Test | How to Verify |
|------|---------------|
| Keyboard only | Navigate using only Tab/Shift+Tab/Enter/Space/Arrows |
| Screen reader | Quick test with NVDA/VoiceOver - no double announcements |
| Focus ring visible | Focus outline appears on every interactive element |
| Tab order stable | Tabbing follows logical visual order |
| ARIA labels correct | Screen reader announces meaningful labels |
| No duplicate announcements | Alert doesn't announce twice |
| No hidden focus traps | Can Tab out of every component |
| Loading states announced | Spinner/Skeleton announce appropriately |

### Critical A11y Rules

```
Alert: role="alert" (NO redundant aria-live)
Badge: NO role (visual label only)
LiveStatus: role="status" (for SR announcements)
Spinner: role="status" + required aria-label
Skeleton: aria-hidden + tabindex="-1"
Breadcrumb: aria-current="page" on current item
DataTable: aria-sort on sortable columns
```

---

## A11y Acceptance Criteria (Non-Negotiable)

These are **acceptance criteria**, not documentation. A primitive is NOT complete until it passes.

| Primitive | Acceptance Criteria |
|-----------|---------------------|
| Alert | Announces ONCE (not twice), SR reads role="alert" |
| Badge | SR treats as normal text (no live region announcement) |
| LiveStatus | SR announces content changes politely |
| Spinner | SR announces "Loading" (or custom label) - NEVER empty |
| Skeleton | NOT reachable by Tab, NOT announced by SR |
| Breadcrumb | Current page has aria-current="page", is NOT a link |
| NavMenu | Active route has aria-current="page" |
| Field | Input ALWAYS linked to error/help by aria-describedby |
| ButtonGroup | SR announces as group with label |
| DataTable | Column sort state announced on sort change |
| FocusTrap | Can exit with Escape, focus returns to trigger |
| InputPassword | Show/hide toggle announced to SR |
| Form | Error summary linked via aria-describedby |
| Carousel | Arrow keys navigate, current slide announced |

**How to verify**: Quick test with NVDA/VoiceOver. If it doesn't match criteria, it's not done.
