# ColdLight Primitives — Foundational Checklist

> **ColdLight is the SINGLE SOURCE OF TRUTH.**
> **NO CODE is written until this checklist is understood and approved.**

---

## CORE PRINCIPLE

# ColdLight OWNS EVERYTHING.

melt-ui is a behavior engine. Nothing more.

---

## WHAT MELT-UI PROVIDES (AND NOTHING ELSE)

| Behavior | Description |
|----------|-------------|
| Focus trapping | Tab key cycles within modal |
| Keyboard navigation | Arrow keys, Enter, Escape handling |
| Click outside detection | Fires callback |
| Escape key detection | Fires callback |
| Portal rendering | Teleports to body |
| Floating positioning | Side, align, offset, collision |
| Scroll lock | Prevents body scroll |

**That's it. Nothing else.**

---

## WHAT COLDLIGHT PROVIDES (EVERYTHING ELSE)

| Ownership | Description |
|-----------|-------------|
| **ALL IDs** | Generated with `useId()` - ColdLight links them |
| **ALL `role` attributes** | `role="dialog"`, `role="tooltip"`, etc. |
| **ALL `aria-*` attributes** | `aria-modal`, `aria-labelledby`, `aria-describedby`, etc. |
| **ALL `data-*` attributes** | `data-kind`, `data-slot`, `data-state`, `data-id` |
| **ALL ID linking** | Title ID → Content `aria-labelledby` |
| **ALL state derivation** | Computing open/closed from state |

---

## THE PATTERN

### ColdLight Content.svelte

```svelte
<script lang="ts">
  import { Dialog } from "melt-ui";
  import { useId } from "melt-ui";
  import { getContext } from "svelte";
  import type { DialogContentProps } from "./types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogContentProps = $props();

  // ColdLight generates IDs
  const contentId = useId();

  // ColdLight gets linked IDs from context (set by Title/Description)
  const titleId = getContext<string>("dialog-title-id");
  const descriptionId = getContext<string>("dialog-description-id");
</script>

<Dialog.Content
  onEscapeKeydown={handleEscapeKeydown}
  onInteractOutside={handleInteractOutside}
  trapFocus={true}
  preventScroll={true}
>
  {#snippet child({ open })}
    <!--
      ColdLight sets EVERY attribute.
      We do NOT spread melt-ui props.
    -->
    <div
      id={contentId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabindex={-1}
      class={className}
      data-kind="dialog"
      data-slot="content"
      data-state={open ? "open" : "closed"}
      data-id={dataId}
    >
      {@render children?.({ open })}
    </div>
  {/snippet}
</Dialog.Content>
```

### ColdLight Title.svelte

```svelte
<script lang="ts">
  import { Dialog } from "melt-ui";
  import { useId } from "melt-ui";
  import { setContext } from "svelte";

  const titleId = useId();

  // ColdLight shares ID via context for Content to link
  setContext("dialog-title-id", titleId);
</script>

<Dialog.Title>
  {#snippet child()}
    <h2
      id={titleId}
      data-kind="dialog"
      data-slot="title"
    >
      {@render children?.()}
    </h2>
  {/snippet}
</Dialog.Title>
```

---

## WHAT WE NEVER DO

- ❌ NEVER spread `{...props}` from melt-ui
- ❌ NEVER rely on melt-ui for `role` attributes
- ❌ NEVER rely on melt-ui for `aria-*` attributes
- ❌ NEVER rely on melt-ui for `id` attributes
- ❌ NEVER rely on melt-ui for ID linking

---

## WHAT WE ALWAYS DO

- ✅ ALWAYS generate IDs with `useId()`
- ✅ ALWAYS set `role` explicitly
- ✅ ALWAYS set `aria-*` explicitly
- ✅ ALWAYS set `data-kind`, `data-slot`, `data-state`
- ✅ ALWAYS link IDs via Svelte context
- ✅ ALWAYS use melt-ui ONLY for behavior

---

## ID LINKING PATTERN

```
Root.svelte
  └── setContext("dialog-ids", { titleId, descriptionId, contentId })

Title.svelte
  └── const { titleId } = getContext("dialog-ids")
  └── <h2 id={titleId}>

Description.svelte
  └── const { descriptionId } = getContext("dialog-ids")
  └── <p id={descriptionId}>

Content.svelte
  └── const { titleId, descriptionId, contentId } = getContext("dialog-ids")
  └── <div
        id={contentId}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
```

---

## ARIA REQUIREMENTS BY PRIMITIVE

### Dialog

| Attribute | Value | Set By |
|-----------|-------|--------|
| `role` | `"dialog"` | ColdLight |
| `aria-modal` | `"true"` | ColdLight |
| `aria-labelledby` | Title ID | ColdLight |
| `aria-describedby` | Description ID | ColdLight |
| `tabindex` | `-1` | ColdLight |

### AlertDialog

| Attribute | Value | Set By |
|-----------|-------|--------|
| `role` | `"alertdialog"` | ColdLight |
| `aria-modal` | `"true"` | ColdLight |
| `aria-labelledby` | Title ID | ColdLight |
| `aria-describedby` | Description ID | ColdLight |
| `tabindex` | `-1` | ColdLight |

### Tooltip

| Attribute | Value | Set By |
|-----------|-------|--------|
| `role` | `"tooltip"` | ColdLight |
| `id` | Generated | ColdLight |
| Trigger `aria-describedby` | Content ID | ColdLight |

### Popover

| Attribute | Value | Set By |
|-----------|-------|--------|
| Trigger `aria-haspopup` | `"dialog"` | ColdLight |
| Trigger `aria-expanded` | `"true"/"false"` | ColdLight |
| Trigger `aria-controls` | Content ID | ColdLight |

### Select

| Attribute | Value | Set By |
|-----------|-------|--------|
| Trigger `role` | `"combobox"` | ColdLight |
| Trigger `aria-haspopup` | `"listbox"` | ColdLight |
| Trigger `aria-expanded` | `"true"/"false"` | ColdLight |
| Content `role` | `"listbox"` | ColdLight |
| Item `role` | `"option"` | ColdLight |
| Item `aria-selected` | `"true"/"false"` | ColdLight |

### Tabs

| Attribute | Value | Set By |
|-----------|-------|--------|
| List `role` | `"tablist"` | ColdLight |
| Trigger `role` | `"tab"` | ColdLight |
| Trigger `aria-selected` | `"true"/"false"` | ColdLight |
| Trigger `aria-controls` | Panel ID | ColdLight |
| Content `role` | `"tabpanel"` | ColdLight |
| Content `aria-labelledby` | Tab ID | ColdLight |

---

## TEST REQUIREMENTS

Every primitive test file MUST include:

```typescript
describe("ARIA ownership", () => {
  it("ColdLight sets role attribute", async () => {
    // Verify role exists and has correct value
  });

  it("ColdLight sets aria-modal", async () => {
    // Verify aria-modal="true" for modals
  });

  it("ColdLight links aria-labelledby to Title", async () => {
    // Get title ID, verify content aria-labelledby matches
  });

  it("ColdLight links aria-describedby to Description", async () => {
    // Get description ID, verify content aria-describedby matches
  });

  it("IDs are generated by ColdLight", async () => {
    // Verify IDs exist and are ColdLight-generated format
  });
});
```

---

## PRE-FLIGHT CHECKLIST

Before writing ANY code for a primitive:

- [ ] Read WAI-ARIA APG for this pattern
- [ ] Document ALL required ARIA attributes in a11y.md
- [ ] Document ID linking requirements
- [ ] Understand what melt-ui behavior we need
- [ ] Plan context structure for ID sharing

---

## SPRINT TEMPLATE

### Sprint N: {Primitive}

**Pre-flight:**
- [ ] WAI-ARIA APG read
- [ ] a11y.md written
- [ ] ID linking planned

**Implementation:**
- [ ] types.ts - All types
- [ ] Root.svelte - Context + ID generation
- [ ] Trigger.svelte - With ARIA
- [ ] Content.svelte - With ARIA
- [ ] Title.svelte - ID sharing
- [ ] Description.svelte - ID sharing
- [ ] index.ts - Exports

**Verification:**
- [ ] `pnpm check` passes
- [ ] `pnpm test:run` passes
- [ ] All ARIA tests pass
- [ ] ID linking verified

---

## SIGN-OFF

Before marking complete:

1. Does ColdLight generate ALL IDs? **YES/NO**
2. Does ColdLight set ALL `role` attributes? **YES/NO**
3. Does ColdLight set ALL `aria-*` attributes? **YES/NO**
4. Does ColdLight link IDs via context? **YES/NO**
5. Is melt-ui used ONLY for behavior? **YES/NO**
6. Do ALL tests pass? **YES/NO**

**All must be YES.**

---

**ColdLight is the SINGLE SOURCE OF TRUTH. No exceptions.**
