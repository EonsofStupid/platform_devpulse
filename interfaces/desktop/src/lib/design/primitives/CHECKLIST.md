# Primitives Checklist

> Primitives = **complete accessible foundation**. All ARIA, roles, keyboard handling, semantic HTML baked in.
> When you pull a primitive, accessibility is DONE. You just apply recipes/presets for visuals.

---

## Architecture

```
PRIMITIVE (this layer)          RECIPE (styling layer)
├── Semantic HTML               ├── data-surface="glass"
├── ARIA attributes             ├── data-motion="pulse"
├── Keyboard handling           ├── dp-* classes
├── Roles                       └── Presets/custom config
└── Focus management
```

**Primitive = behavior + accessibility + semantics (NO styling)**
**Recipe = visual styling via data-* attributes and classes**

---

## File Pattern

### Bits UI Wrapper (complex interactions)
```svelte
<!--
  @file primitives/{Name}.svelte
  @layer primitives
  Bits UI handles: keyboard, focus, ARIA
-->
<script lang="ts" module>
  // Re-export all sub-components
  export { Root, Trigger, Content, Item, ... } from "bits-ui/{name}";
</script>
```

### Custom Primitive (simple semantic HTML)
```svelte
<!--
  @file primitives/{Name}.svelte
  @layer primitives
  WE handle: semantic HTML, ARIA, roles
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
    // primitive-specific props
  }

  let { children, ...rest }: Props = $props();
</script>

<element role="..." aria-...="..." {...rest}>
  {@render children?.()}
</element>
```

### Smart Primitive (route-aware, data-driven)
```svelte
<!--
  @file primitives/{Name}.svelte
  @layer primitives
  Svelte 5 runes, route-aware, dual-mode (auto/manual)
-->
<script lang="ts" module>
  // Type exports for page module integration
  export type { Crumb, ModuleData };
</script>

<script lang="ts">
  import { page } from '$app/stores';

  interface Props {
    // Auto mode (reads from routes)
    url?: URL;
    routeId?: string | null;
    pageData?: any;
    // Manual mode (explicit items)
    items?: Crumb[];
    // Config
    separator?: Snippet;
  }

  let { url, routeId, pageData, items, separator, ...rest }: Props = $props();

  // Svelte 5 runes for reactive computation
  let crumbs = $derived(items ?? computeFromRoutes(url, routeId, pageData));
</script>

<nav aria-label="Breadcrumb" {...rest}>
  <ol role="list">
    {#each crumbs as crumb, i}
      <li>
        {#if crumb.current}
          <span aria-current="page">{crumb.title}</span>
        {:else}
          <a href={crumb.url}>{crumb.title}</a>
        {/if}
      </li>
      {#if i < crumbs.length - 1}
        {@render separator?.() ?? <span aria-hidden="true">/</span>}
      {/if}
    {/each}
  </ol>
</nav>
```

**Page integration (module exports):**
```svelte
<!-- In any +page.svelte -->
<script module lang="ts">
  // Static title
  export const pageTitle = 'Products';

  // OR dynamic from page data
  export function getPageTitle(data: any) {
    return data.product?.name ?? 'Product';
  }
</script>
```

---

## Data Attribute Conventions (applied at recipe layer, NOT here)

- `data-surface` - glass | liquid | solid | matte
- `data-motion` - breathe | pulse | scan | flow | shimmer | ripple | sparkle | wave | drip
- `data-hover` - glow | lift | highlight | pulse
- `data-press` - sink | flash | ripple
- `data-focus` - ring | glow

---

## Primitives (57 total)

### Bits UI Re-exports (Bits handles accessibility)

| Primitive | Bits UI Component | Status |
|-----------|-------------------|--------|
| Accordion | accordion | ✓ EXISTS |
| Alert Dialog | alert-dialog | [ ] |
| Aspect Ratio | aspect-ratio | [ ] |
| Avatar | avatar | [ ] |
| Button | button | ✓ EXISTS |
| Calendar | calendar | [ ] |
| Checkbox | checkbox | [ ] |
| Collapsible | collapsible | [ ] |
| Combobox | combobox | [ ] |
| Command | command | [ ] |
| Context Menu | context-menu | [ ] |
| Date Picker | date-picker | [ ] |
| Dialog | dialog | ✓ EXISTS |
| Drawer | dialog (variant) | [ ] |
| Dropdown Menu | dropdown-menu | [ ] |
| Hover Card | hover-card | [ ] |
| Label | label | [ ] |
| Menubar | menubar | [ ] |
| Navigation Menu | navigation-menu | [ ] |
| Pagination | pagination | [ ] |
| Popover | popover | ✓ EXISTS |
| Progress | progress | [ ] |
| Radio Group | radio-group | [ ] |
| Resizable | resizable | [ ] |
| Scroll Area | scroll-area | [ ] |
| Select | select | ✓ EXISTS |
| Separator | separator | [ ] |
| Slider | slider | [ ] |
| Switch | switch | [ ] |
| Tabs | tabs | ✓ EXISTS |
| Toggle | toggle | ✓ EXISTS |
| Toggle Group | toggle-group | [ ] |
| Tooltip | tooltip | [ ] |

### Smart Primitives (route-aware / data-driven)

| Primitive | Pattern | Features | Status |
|-----------|---------|----------|--------|
| Breadcrumb | Route-aware | Auto from routes OR manual items, `aria-current`, `<nav>/<ol>` | [ ] |
| Sidebar | Route-aware | Auto-highlight current route, collapsible sections, keyboard nav | [ ] |
| Navigation Menu | Route-aware | Auto-active states, keyboard nav, `aria-current` | [ ] |
| Data Table | Data-driven | Sortable headers `aria-sort`, row selection, keyboard nav | [ ] |
| Carousel | Data-driven | Keyboard (←→), scroll, `aria-roledescription`, live region | [ ] |

### Custom Primitives (simple semantic HTML + ARIA)

| Primitive | Base Element | ARIA/Role | Status |
|-----------|--------------|-----------|--------|
| Alert | `<div>` | `role="alert"` `aria-live="assertive"` | [ ] |
| Badge | `<span>` | `role="status"` `aria-live="polite"` | [ ] |
| Button Group | `<div>` | `role="group"` `aria-label` | [ ] |
| Card | `<article>` | semantic, optional `aria-labelledby` | [ ] |
| Chart | `<figure>` | `role="img"` `aria-label` | [ ] |
| Empty | `<div>` | `role="status"` `aria-live="polite"` | [ ] |
| Field | `<div>` | wrapper for label+input+error, `aria-describedby` | [ ] |
| Form | `<form>` | `aria-describedby` for errors | [ ] |
| Input | `<input>` | `aria-invalid` `aria-describedby` | [ ] |
| Input Group | `<div>` | `role="group"` | [ ] |
| Input OTP | `<div>` | `role="group"` + hidden input pattern | [ ] |
| Item | `<div>` | generic container | [ ] |
| Kbd | `<kbd>` | semantic | [ ] |
| Native Select | `<select>` | native accessibility | [ ] |
| Sheet | Bits Dialog | same as Dialog (slide-in variant) | [ ] |
| Skeleton | `<div>` | `aria-hidden="true"` `aria-busy` on parent | [ ] |
| Sonner | toast lib | library handles | [ ] |
| Spinner | `<span>` | `role="status"` `aria-label="Loading"` | [ ] |
| Table | `<table>` | full table semantics, `<caption>`, `<th scope>` | [ ] |
| Textarea | `<textarea>` | `aria-invalid` `aria-describedby` | [ ] |
| Toast | `<div>` | `role="alert"` `aria-live="polite"` | [ ] |
| Typography | `<p>`/`<h1-6>`/`<span>` | semantic elements | [ ] |

---

## Summary

| Category | Count | Pattern |
|----------|-------|---------|
| Bits UI Re-exports | 33 | Re-export, Bits handles a11y |
| Smart Primitives | 5 | Route-aware, data-driven, Svelte 5 runes |
| Custom Primitives | 19 | Semantic HTML + ARIA |
| **Total** | **57** | |
| **Existing** | **7** | Accordion, Button, Dialog, Popover, Select, Tabs, Toggle |
| **Remaining** | **50** | |
