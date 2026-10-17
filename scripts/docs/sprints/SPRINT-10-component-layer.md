# SPRINT 10: ColdLight Component Layer — Big 3

> **Status**: READY FOR EXECUTION
> **Scope**: `interfaces/desktop/src/lib/design/components/`
> **Prerequisites**: All 40 primitives + 1 utility complete (Sprint 01–09 verified)
> **Total Tasks**: 47 tasks across 9 phases
> **Total Files**: 47 new files
> **Compact Checkpoints**: After Phase 2a (task 10), After Phase 2c (task 26), After Phase 6 (task 38)
> **Gate**: `pnpm svelte-check` 0 errors, `pnpm test:run` all pass, `pnpm test:e2e` all pass, cloaking audit clean

---

## Goal

Establish the component layer for ColdLight with the Big 3 (Button, Dialog, Tabs). Components sit between primitives and semantics — they fulfill taxonomy contracts by adding ARIA, behavior, keyboard handling, and focus management to primitive shells. This sprint proves BOTH archetypes (ColdLight-owned + Adapter-backed) and sets the pattern for all remaining components.

---

## Hard Invariants

Re-read these BEFORE every phase. Violation = stop and fix before proceeding.

1. **ZERO** `@melt-ui/svelte` imports outside `api/adapters/meltui/_internal/`
2. **ZERO** occurrences of the word "melt" in component source files (imports, variables, comments)
3. **ColdLight is the ONLY brand** — consumer-facing errors, types, exports say "ColdLight"
4. MeltUI internal references gated to admin-level logging only
5. Components produce ARIA attributes — primitives remain structural shells (zero ARIA)
6. Every `.ts` import uses `.js` extension
7. Svelte 5 runes only — `$state`, `$derived`, `$effect`, `$bindable`. No `$:` reactive declarations
8. Stores confined to action internals — component script blocks use runes bridges

---

## Current State (Audit before execution)

```
src/lib/design/
├── primitives/              ✓ 40 primitives + 1 utility COMPLETE
├── taxonomy/                ✓ Contracts, types, vocabularies COMPLETE
├── api/adapters/meltui/
│   └── _internal/
│       ├── dialog/          ✓ factory.ts, types.ts, dialog.ts
│       ├── tabs/            ✓ factory.ts, types.ts, tabs.ts
│       └── _transport/      ✗ DOES NOT EXIST
├── components/              ✗ DOES NOT EXIST
└── recipes/                 ✓ EXISTS
```

**Verify before starting:**
- [ ] `pnpm svelte-check` passes with 0 errors on current codebase
- [ ] `api/adapters/meltui/_internal/dialog/factory.ts` exists and exports `createMeltDialog`
- [ ] `api/adapters/meltui/_internal/tabs/factory.ts` exists and exports `createMeltTabs`

---

## Phase 0: Package Installation

### Task 0.1: Install @playwright/test
- [ ] Run: `cd interfaces/desktop && pnpm add -D @playwright/test`
- [ ] Verify: `@playwright/test` appears in `package.json` devDependencies

### Task 0.2: Install msw
- [ ] Run: `cd interfaces/desktop && pnpm add -D msw`
- [ ] Verify: `msw` appears in `package.json` devDependencies

### Task 0.3: Install Playwright browsers
- [ ] Run: `cd interfaces/desktop && npx playwright install chromium`
- [ ] Verify: command exits successfully

### Task 0.4: Add test scripts to package.json
- [ ] Add `"test:e2e": "playwright test"` to scripts
- [ ] Add `"test:e2e:ui": "playwright test --ui"` to scripts
- [ ] Add `"test:all": "vitest run && playwright test"` to scripts
- [ ] Verify: `pnpm test:run` still works (existing vitest)

### Task 0.5: Create playwright.config.ts
- [ ] Create file: `interfaces/desktop/playwright.config.ts`
- [ ] Verify: file exists and TypeScript is valid

**File Content:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Phase 1: Shared Infrastructure

### Task 1.1: Create cloaking origin — `_internal/_transport/action.ts`
- [ ] Create file: `src/lib/design/api/dsadapters/meltui/_internal/_transport/action.ts`
- [ ] Verify: file imports from `@melt-ui/svelte` (this is inside `_internal/` — allowed)
- [ ] Verify: file exports `cold` (NOT `melt`, NOT `connectSlot`)

**File Content:**

```typescript
/**
 * @file ColdLight Action — Cloaking Origin
 * @description Re-exports MeltUI's melt action as cold.
 * use:cold is the 1:1 mirror of use:melt under ColdLight brand.
 * This file lives inside _internal/ — the cloaking boundary.
 */
import { melt } from "@melt-ui/svelte";
export { melt as cold };
```

### Task 1.2: Create transport endpoint — `components/_transport/action.ts`
- [ ] Create directory: `src/lib/design/components/_transport/`
- [ ] Create file: `src/lib/design/components/_transport/action.ts`
- [ ] Verify: imports from `_internal/_transport/action.js` (the cloaking origin)
- [ ] Verify: exports `cold`

**File Content:**

```typescript
/**
 * @file ColdLight Action — Transport Endpoint
 * @description Carries the cold action across the cloaking boundary.
 * Components import from here. Never from _internal.
 * use:cold={adapter.slots.trigger} — applies adapter-computed attributes to DOM.
 */
export { cold } from "$lib/design/api/dsadapters/meltui/_internal/_transport/action.js";
```

### Task 1.3: Create transport types — `components/_transport/types.ts`
- [ ] Create file: `src/lib/design/components/_transport/types.ts`
- [ ] Verify: TypeScript compiles

**File Content:**

```typescript
/**
 * @file Component Transport Types
 * @description Type utilities shared across all ColdLight components.
 */
import type { Readable } from "svelte/store";

/**
 * ColdLight adapter API shape.
 * Adapters return per-slot readable stores and per-state readable stores.
 * Components consume these through use:cold action and runes bridges.
 */
export interface AdapterApi<
  TSlots extends Record<string, Readable<Record<string, unknown>>>,
  TStates extends Record<string, Readable<unknown>>,
> {
  readonly slots: TSlots;
  readonly states: TStates;
}
```

### Task 1.4: Create dialog adapter — `_internal/dialog/adapter.ts`
- [ ] Create file: `src/lib/design/api/dsadapters/meltui/_internal/dialog/adapter.ts`
- [ ] Verify: imports from `./factory.js` (existing file)
- [ ] Verify: exports `DialogAdapterApi` type and `createDialogAdapter` function
- [ ] Verify: `createDialogAdapter` returns `{ slots: {...}, states: {...} }`

**File Content:**

```typescript
/**
 * @file MeltUI Dialog Adapter
 * @description Enhanced adapter — returns ColdLight-branded slot prop stores.
 * Component layer consumes this. Consumer never sees MeltUI types.
 */
import { createMeltDialog, type MeltDialogConfig } from "./factory.js";
import type { Readable } from "svelte/store";

export interface DialogAdapterApi {
  readonly slots: {
    readonly trigger: Readable<Record<string, unknown>>;
    readonly overlay: Readable<Record<string, unknown>>;
    readonly content: Readable<Record<string, unknown>>;
    readonly title: Readable<Record<string, unknown>>;
    readonly description: Readable<Record<string, unknown>>;
    readonly close: Readable<Record<string, unknown>>;
    readonly portal: Readable<Record<string, unknown>>;
  };
  readonly states: {
    readonly open: Readable<boolean>;
  };
}

export function createDialogAdapter(config?: MeltDialogConfig): DialogAdapterApi {
  const instance = createMeltDialog(config ?? {});
  return {
    slots: {
      trigger: instance.elements.trigger,
      overlay: instance.elements.overlay,
      content: instance.elements.content,
      title: instance.elements.title,
      description: instance.elements.description,
      close: instance.elements.close,
      portal: instance.elements.portalled,
    },
    states: {
      open: instance.states.open,
    },
  };
}
```

### Task 1.5: Create tabs adapter — `_internal/tabs/adapter.ts`
- [ ] Create file: `src/lib/design/api/dsadapters/meltui/_internal/tabs/adapter.ts`
- [ ] Verify: imports from `./factory.js` (existing file)
- [ ] Verify: `trigger` and `content` are FUNCTIONS returning stores (parameterized)
- [ ] Verify: exports `TabsAdapterApi` type and `createTabsAdapter` function

**File Content:**

```typescript
/**
 * @file MeltUI Tabs Adapter
 * @description Enhanced adapter — returns ColdLight-branded slot prop stores.
 * CRITICAL: trigger(value) and content(value) are FUNCTIONS, not direct stores.
 */
import { createMeltTabs, type MeltTabsConfig } from "./factory.js";
import type { Readable } from "svelte/store";

export interface TabsAdapterApi {
  readonly slots: {
    readonly root: Readable<Record<string, unknown>>;
    readonly list: Readable<Record<string, unknown>>;
    readonly trigger: (value: string) => Readable<Record<string, unknown>>;
    readonly content: (value: string) => Readable<Record<string, unknown>>;
  };
  readonly states: {
    readonly value: Readable<string>;
  };
}

export function createTabsAdapter(config?: MeltTabsConfig): TabsAdapterApi {
  const instance = createMeltTabs(config);
  return {
    slots: {
      root: instance.elements.root,
      list: instance.elements.list,
      trigger: (value: string) => instance.elements.trigger(value),
      content: (value: string) => instance.elements.content(value),
    },
    states: {
      value: instance.states.value,
    },
  };
}
```

### Phase 1 Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Verify `_internal/_transport/action.ts` is the ONLY file with `@melt-ui/svelte` import for the action
- [ ] Verify `components/_transport/action.ts` does NOT import `@melt-ui/svelte` directly

---

## Phase 2a: Button Component (ColdLight Archetype)

> Archetype A — no adapter. Component wraps primitive and adds ARIA directly.
> Contract: kind="button", ariaStateProvider="coldlight"

### Task 2a.1: Create button types — `components/button/types.ts`
- [ ] Create directory: `src/lib/design/components/button/`
- [ ] Create file: `src/lib/design/components/button/types.ts`
- [ ] Verify: extends `OmitStyle<HTMLButtonElement>` and `BaseProps`
- [ ] Verify: NO adapter imports (ColdLight archetype)

**File Content:**

```typescript
/**
 * @file Button Component Types
 * @description Component-level props for ColdLight Button.
 * Extends primitive props with behavioral/ARIA props.
 * Contract: kind="button", ariaStateProvider="coldlight"
 */
import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "$lib/design/primitives/types.js";

/** Button component props — primitive props + ARIA behavioral props */
export interface ButtonComponentProps extends OmitStyle<HTMLButtonElement>, BaseProps {
  /** HTML disabled state */
  disabled?: boolean;
  /** Toggle pressed state (aria-pressed) */
  pressed?: boolean;
  /** Loading state — disables interaction, sets aria-busy */
  loading?: boolean;
  /** Content */
  children?: Snippet;
}

/** ButtonIcon component props — adds aria-hidden */
export interface ButtonIconComponentProps extends OmitStyle<HTMLSpanElement>, BaseProps {
  children?: Snippet;
}

/** ButtonLabel component props — passthrough from primitive */
export interface ButtonLabelComponentProps extends OmitStyle<HTMLSpanElement>, BaseProps {
  children?: Snippet;
}
```

### Task 2a.2: Create Button.svelte
- [ ] Create file: `src/lib/design/components/button/Button.svelte`
- [ ] Verify: has `data-kind="button"` and `data-slot="root"`
- [ ] Verify: has `aria-pressed`, `aria-disabled`, `aria-busy`
- [ ] Verify: NO `use:cold` (ColdLight archetype — no adapter)
- [ ] Verify: uses `$derived` for effectiveDisabled (runes, not stores)

**File Content:**

```svelte
<!--
  @component Button
  @description ColdLight Button component. Wraps primitive, adds ARIA.
  Contract: kind="button", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import type { ButtonComponentProps } from "./types.js";

  let {
    disabled = false,
    pressed,
    loading = false,
    children,
    class: className,
    ...rest
  }: ButtonComponentProps = $props();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Button");

  const effectiveDisabled = $derived(disabled || loading);
</script>

<button
  {...rest}
  data-kind="button"
  data-slot="root"
  data-state={loading ? "loading" : pressed ? "pressed" : undefined}
  class={cn(className)}
  disabled={effectiveDisabled || undefined}
  aria-pressed={pressed}
  aria-disabled={effectiveDisabled || undefined}
  aria-busy={loading || undefined}
>
  {@render children?.()}
</button>
```

### Task 2a.3: Create ButtonIcon.svelte
- [ ] Create file: `src/lib/design/components/button/ButtonIcon.svelte`
- [ ] Verify: has `aria-hidden="true"`
- [ ] Verify: has `data-kind="button"` and `data-slot="icon"`

**File Content:**

```svelte
<!--
  @component ButtonIcon
  @description ColdLight ButtonIcon. Decorative — always aria-hidden.
  Contract: kind="button", slot="icon", ariaStateProvider="coldlight"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import type { ButtonIconComponentProps } from "./types.js";

  let { children, class: className, ...rest }: ButtonIconComponentProps = $props();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ButtonIcon");
</script>

<span
  {...rest}
  data-kind="button"
  data-slot="icon"
  class={cn(className)}
  aria-hidden="true"
>
  {@render children?.()}
</span>
```

### Task 2a.4: Create ButtonLabel.svelte
- [ ] Create file: `src/lib/design/components/button/ButtonLabel.svelte`
- [ ] Verify: has `data-kind="button"` and `data-slot="label"`
- [ ] Verify: NO aria-hidden (labels must be visible to screen readers)

**File Content:**

```svelte
<!--
  @component ButtonLabel
  @description ColdLight ButtonLabel. Text label — no ARIA needed.
  Contract: kind="button", slot="label", ariaStateProvider="coldlight"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import type { ButtonLabelComponentProps } from "./types.js";

  let { children, class: className, ...rest }: ButtonLabelComponentProps = $props();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ButtonLabel");
</script>

<span
  {...rest}
  data-kind="button"
  data-slot="label"
  class={cn(className)}
>
  {@render children?.()}
</span>
```

### Task 2a.5: Create button barrel — `components/button/index.ts`
- [ ] Create file: `src/lib/design/components/button/index.ts`
- [ ] Verify: exports all 3 components + all 3 types

**File Content:**

```typescript
/**
 * @file Button Component Barrel
 */
export { default as Button } from "./Button.svelte";
export { default as ButtonIcon } from "./ButtonIcon.svelte";
export { default as ButtonLabel } from "./ButtonLabel.svelte";
export type {
  ButtonComponentProps,
  ButtonIconComponentProps,
  ButtonLabelComponentProps,
} from "./types.js";
```

### Phase 2a Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `grep -r "melt" components/button/` — 0 results
- [ ] `grep -r "use:cold" components/button/` — 0 results (ColdLight archetype has no adapter)
- [ ] All 5 files exist: types.ts, Button.svelte, ButtonIcon.svelte, ButtonLabel.svelte, index.ts

> **COMPACT CHECKPOINT** — Pause, re-read invariants, verify gate, then proceed.

---

## Phase 2b: Dialog Component (MeltUI Archetype — Focus Trap)

> Archetype B — adapter-backed. Component renders own DOM with `use:cold`.
> Contract: kind="dialog", ariaStateProvider="meltui"
> Focus: trap. Dismiss: escape + outside click.

### Task 2b.1: Create dialog types — `components/dialog/types.ts`
- [ ] Create directory: `src/lib/design/components/dialog/`
- [ ] Create file: `src/lib/design/components/dialog/types.ts`
- [ ] Verify: NO adapter imports in types (types are clean)

**File Content:**

```typescript
/**
 * @file Dialog Component Types
 * @description Component-level props for ColdLight Dialog.
 * Contract: kind="dialog", ariaStateProvider="meltui"
 */
import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "$lib/design/primitives/types.js";

/** Dialog root — context provider, no DOM element */
export interface DialogComponentProps extends BaseProps {
  /** Controlled open state (bindable) */
  open?: boolean;
  children?: Snippet;
}

/** DialogTrigger — opens the dialog */
export interface DialogTriggerComponentProps extends OmitStyle<HTMLButtonElement>, BaseProps {
  children?: Snippet;
}

/** DialogPortal — teleports content */
export interface DialogPortalComponentProps extends OmitStyle<HTMLDivElement>, BaseProps {
  children?: Snippet;
}

/** DialogOverlay — backdrop */
export interface DialogOverlayComponentProps extends OmitStyle<HTMLDivElement>, BaseProps {
  children?: Snippet;
}

/** DialogContent — main panel (focus trap target) */
export interface DialogContentComponentProps extends OmitStyle<HTMLDivElement>, BaseProps {
  children?: Snippet;
}

/** DialogTitle — accessible heading */
export interface DialogTitleComponentProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
  children?: Snippet;
}

/** DialogDescription — accessible description */
export interface DialogDescriptionComponentProps extends OmitStyle<HTMLParagraphElement>, BaseProps {
  children?: Snippet;
}

/** DialogClose — close button */
export interface DialogCloseComponentProps extends OmitStyle<HTMLButtonElement>, BaseProps {
  children?: Snippet;
}
```

### Task 2b.2: Create dialog context — `components/dialog/context.ts`
- [ ] Create file: `src/lib/design/components/dialog/context.ts`
- [ ] Verify: uses `Symbol("coldlight:component:dialog")` (component prefix, not primitive)
- [ ] Verify: type-only import of `DialogAdapterApi` from `_internal/` (erased at build)

**File Content:**

```typescript
/**
 * @file Dialog Component Context
 * @description Svelte context for compound dialog component coordination.
 * Holds the ColdLight adapter API — sub-components read slot stores from here.
 */
import { getContext, setContext } from "svelte";
import type { DialogAdapterApi } from "$lib/design/api/dsadapters/meltui/_internal/dialog/adapter.js";

const CTX_KEY = Symbol("coldlight:component:dialog");

export type DialogComponentContext = {
  readonly adapter: DialogAdapterApi;
};

export function setDialogComponentContext(ctx: DialogComponentContext): void {
  setContext(CTX_KEY, ctx);
}

export function getDialogComponentContext(): DialogComponentContext {
  return getContext<DialogComponentContext>(CTX_KEY);
}
```

### Task 2b.3: Create Dialog.svelte (root)
- [ ] Create file: `src/lib/design/components/dialog/Dialog.svelte`
- [ ] Verify: creates adapter via `createDialogAdapter`
- [ ] Verify: sets component context
- [ ] Verify: renderless (no DOM element — `{@render children?.()}` only)
- [ ] Verify: `open` is `$bindable`

**File Content:**

```svelte
<!--
  @component Dialog
  @description ColdLight Dialog root. Creates adapter, provides context.
  Contract: kind="dialog", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
  import type { DialogComponentProps } from "./types.js";
  import { setDialogComponentContext } from "./context.js";
  import { createDialogAdapter } from "$lib/design/api/dsadapters/meltui/_internal/dialog/adapter.js";

  let { open = $bindable(false), children }: DialogComponentProps = $props();

  const adapter = createDialogAdapter({
    defaultOpen: open,
  });

  setDialogComponentContext({ adapter });
</script>

{@render children?.()}
```

### Task 2b.4: Create DialogTrigger.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogTrigger.svelte`
- [ ] Verify: `use:cold={adapter.slots.trigger}` — NOT `use:melt`
- [ ] Verify: imports `cold` from `../_transport/action.js` — NOT from `@melt-ui/svelte`
- [ ] Verify: has `data-kind="dialog"` and `data-slot="trigger"`

**File Content:**

```svelte
<!--
  @component DialogTrigger
  @description ColdLight DialogTrigger. Adapter provides ARIA + click handler.
  Contract: kind="dialog", slot="trigger", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogTriggerComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogTriggerComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogTrigger");
</script>

<button
  use:cold={adapter.slots.trigger}
  {...rest}
  data-kind="dialog"
  data-slot="trigger"
  class={cn(className)}
>
  {@render children?.()}
</button>
```

### Task 2b.5: Create DialogPortal.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogPortal.svelte`
- [ ] Verify: `use:cold={adapter.slots.portal}`
- [ ] Verify: imports `cold` from `../_transport/action.js`

**File Content:**

```svelte
<!--
  @component DialogPortal
  @description ColdLight DialogPortal. Teleport container.
  Contract: kind="dialog", slot="portal", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogPortalComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogPortalComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogPortal");
</script>

<div
  use:cold={adapter.slots.portal}
  {...rest}
  data-kind="dialog"
  data-slot="portal"
  class={cn(className)}
>
  {@render children?.()}
</div>
```

### Task 2b.6: Create DialogOverlay.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogOverlay.svelte`
- [ ] Verify: `use:cold={adapter.slots.overlay}`

**File Content:**

```svelte
<!--
  @component DialogOverlay
  @description ColdLight DialogOverlay. Backdrop behind dialog.
  Contract: kind="dialog", slot="overlay", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogOverlayComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogOverlayComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogOverlay");
</script>

<div
  use:cold={adapter.slots.overlay}
  {...rest}
  data-kind="dialog"
  data-slot="overlay"
  class={cn(className)}
>
  {@render children?.()}
</div>
```

### Task 2b.7: Create DialogContent.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogContent.svelte`
- [ ] Verify: `use:cold={adapter.slots.content}` — this is the focus trap target

**File Content:**

```svelte
<!--
  @component DialogContent
  @description ColdLight DialogContent. Focus trap target. Adapter provides role="dialog", aria-modal, etc.
  Contract: kind="dialog", slot="content", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogContentComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogContentComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogContent");
</script>

<div
  use:cold={adapter.slots.content}
  {...rest}
  data-kind="dialog"
  data-slot="content"
  class={cn(className)}
>
  {@render children?.()}
</div>
```

### Task 2b.8: Create DialogTitle.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogTitle.svelte`
- [ ] Verify: `use:cold={adapter.slots.title}`
- [ ] Verify: renders `<h2>` element

**File Content:**

```svelte
<!--
  @component DialogTitle
  @description ColdLight DialogTitle. Accessible heading for dialog.
  Contract: kind="dialog", slot="title", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogTitleComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogTitleComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogTitle");
</script>

<h2
  use:cold={adapter.slots.title}
  {...rest}
  data-kind="dialog"
  data-slot="title"
  class={cn(className)}
>
  {@render children?.()}
</h2>
```

### Task 2b.9: Create DialogDescription.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogDescription.svelte`
- [ ] Verify: `use:cold={adapter.slots.description}`
- [ ] Verify: renders `<p>` element

**File Content:**

```svelte
<!--
  @component DialogDescription
  @description ColdLight DialogDescription. Accessible description for dialog.
  Contract: kind="dialog", slot="description", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogDescriptionComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogDescriptionComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogDescription");
</script>

<p
  use:cold={adapter.slots.description}
  {...rest}
  data-kind="dialog"
  data-slot="description"
  class={cn(className)}
>
  {@render children?.()}
</p>
```

### Task 2b.10: Create DialogClose.svelte
- [ ] Create file: `src/lib/design/components/dialog/DialogClose.svelte`
- [ ] Verify: `use:cold={adapter.slots.close}`
- [ ] Verify: renders `<button>` element

**File Content:**

```svelte
<!--
  @component DialogClose
  @description ColdLight DialogClose. Close button for dialog.
  Contract: kind="dialog", slot="close", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getDialogComponentContext } from "./context.js";
  import type { DialogCloseComponentProps } from "./types.js";

  let { children, class: className, ...rest }: DialogCloseComponentProps = $props();
  const { adapter } = getDialogComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogClose");
</script>

<button
  use:cold={adapter.slots.close}
  {...rest}
  data-kind="dialog"
  data-slot="close"
  class={cn(className)}
>
  {@render children?.()}
</button>
```

### Task 2b.11: Create dialog barrel — `components/dialog/index.ts`
- [ ] Create file: `src/lib/design/components/dialog/index.ts`
- [ ] Verify: exports all 8 components + all 8 types

**File Content:**

```typescript
/**
 * @file Dialog Component Barrel
 */
export { default as Dialog } from "./Dialog.svelte";
export { default as DialogTrigger } from "./DialogTrigger.svelte";
export { default as DialogPortal } from "./DialogPortal.svelte";
export { default as DialogOverlay } from "./DialogOverlay.svelte";
export { default as DialogContent } from "./DialogContent.svelte";
export { default as DialogTitle } from "./DialogTitle.svelte";
export { default as DialogDescription } from "./DialogDescription.svelte";
export { default as DialogClose } from "./DialogClose.svelte";
export type {
  DialogComponentProps,
  DialogTriggerComponentProps,
  DialogPortalComponentProps,
  DialogOverlayComponentProps,
  DialogContentComponentProps,
  DialogTitleComponentProps,
  DialogDescriptionComponentProps,
  DialogCloseComponentProps,
} from "./types.js";
```

### Phase 2b Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `grep -r "@melt-ui/svelte" components/dialog/` — 0 results
- [ ] `grep -ri "melt" components/dialog/*.svelte` — 0 results
- [ ] Every `.svelte` file in dialog/ has `use:cold` (except Dialog.svelte which is renderless)
- [ ] All 11 files exist: types.ts, context.ts, Dialog.svelte, DialogTrigger.svelte, DialogPortal.svelte, DialogOverlay.svelte, DialogContent.svelte, DialogTitle.svelte, DialogDescription.svelte, DialogClose.svelte, index.ts

---

## Phase 2c: Tabs Component (MeltUI Archetype — Roving Focus)

> Archetype B — adapter-backed with PARAMETERIZED slots.
> Contract: kind="tabs", ariaStateProvider="meltui"
> Focus: roving tabindex. Orientation: horizontal.
> CRITICAL: trigger(value) and content(value) are functions.

### Task 2c.1: Create tabs types — `components/tabs/types.ts`
- [ ] Create directory: `src/lib/design/components/tabs/`
- [ ] Create file: `src/lib/design/components/tabs/types.ts`
- [ ] Verify: `TabsTriggerComponentProps` has `value: string` (required)
- [ ] Verify: `TabsContentComponentProps` has `value: string` (required)

**File Content:**

```typescript
/**
 * @file Tabs Component Types
 * @description Component-level props for ColdLight Tabs.
 * Contract: kind="tabs", ariaStateProvider="meltui"
 */
import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "$lib/design/primitives/types.js";

/** Tabs root — container and context provider */
export interface TabsComponentProps extends OmitStyle<HTMLDivElement>, BaseProps {
  /** Default selected tab value (bindable) */
  value?: string;
  children?: Snippet;
}

/** TabsList — container for tab triggers (role=tablist) */
export interface TabsListComponentProps extends OmitStyle<HTMLDivElement>, BaseProps {
  children?: Snippet;
}

/** TabsTrigger — selects a tab (role=tab) */
export interface TabsTriggerComponentProps extends OmitStyle<HTMLButtonElement>, BaseProps {
  /** Tab identifier — matches TabsContent value */
  value: string;
  /** Disabled state */
  disabled?: boolean;
  children?: Snippet;
}

/** TabsContent — panel for tab content (role=tabpanel) */
export interface TabsContentComponentProps extends OmitStyle<HTMLDivElement>, BaseProps {
  /** Tab identifier — matches TabsTrigger value */
  value: string;
  children?: Snippet;
}
```

### Task 2c.2: Create tabs context — `components/tabs/context.ts`
- [ ] Create file: `src/lib/design/components/tabs/context.ts`
- [ ] Verify: uses `Symbol("coldlight:component:tabs")`

**File Content:**

```typescript
/**
 * @file Tabs Component Context
 * @description Svelte context for compound tabs component coordination.
 * Holds the ColdLight adapter API.
 */
import { getContext, setContext } from "svelte";
import type { TabsAdapterApi } from "$lib/design/api/dsadapters/meltui/_internal/tabs/adapter.js";

const CTX_KEY = Symbol("coldlight:component:tabs");

export type TabsComponentContext = {
  readonly adapter: TabsAdapterApi;
};

export function setTabsComponentContext(ctx: TabsComponentContext): void {
  setContext(CTX_KEY, ctx);
}

export function getTabsComponentContext(): TabsComponentContext {
  return getContext<TabsComponentContext>(CTX_KEY);
}
```

### Task 2c.3: Create Tabs.svelte (root)
- [ ] Create file: `src/lib/design/components/tabs/Tabs.svelte`
- [ ] Verify: `use:cold={adapter.slots.root}` — root has direct store (not parameterized)
- [ ] Verify: `value` is `$bindable`
- [ ] Verify: creates adapter and sets context

**File Content:**

```svelte
<!--
  @component Tabs
  @description ColdLight Tabs root. Creates adapter, provides context.
  Contract: kind="tabs", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { setTabsComponentContext } from "./context.js";
  import { createTabsAdapter } from "$lib/design/api/dsadapters/meltui/_internal/tabs/adapter.js";
  import type { TabsComponentProps } from "./types.js";

  let { value = $bindable(""), children, class: className, ...rest }: TabsComponentProps = $props();

  const adapter = createTabsAdapter({
    defaultValue: value,
  });

  setTabsComponentContext({ adapter });

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Tabs");
</script>

<div
  use:cold={adapter.slots.root}
  {...rest}
  data-kind="tabs"
  data-slot="root"
  class={cn(className)}
>
  {@render children?.()}
</div>
```

### Task 2c.4: Create TabsList.svelte
- [ ] Create file: `src/lib/design/components/tabs/TabsList.svelte`
- [ ] Verify: `use:cold={adapter.slots.list}` — direct store (not parameterized)

**File Content:**

```svelte
<!--
  @component TabsList
  @description ColdLight TabsList. Container for tab triggers (role=tablist).
  Contract: kind="tabs", slot="list", ariaStateProvider="meltui"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getTabsComponentContext } from "./context.js";
  import type { TabsListComponentProps } from "./types.js";

  let { children, class: className, ...rest }: TabsListComponentProps = $props();
  const { adapter } = getTabsComponentContext();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TabsList");
</script>

<div
  use:cold={adapter.slots.list}
  {...rest}
  data-kind="tabs"
  data-slot="list"
  class={cn(className)}
>
  {@render children?.()}
</div>
```

### Task 2c.5: Create TabsTrigger.svelte
- [ ] Create file: `src/lib/design/components/tabs/TabsTrigger.svelte`
- [ ] Verify: `adapter.slots.trigger(value)` — PARAMETERIZED (function call, not direct store)
- [ ] Verify: `$derived(adapter.slots.trigger(value))` — runes bridge
- [ ] Verify: `use:cold={triggerStore}` — passes derived result

**File Content:**

```svelte
<!--
  @component TabsTrigger
  @description ColdLight TabsTrigger. Selects a tab (role=tab, roving tabindex).
  Contract: kind="tabs", slot="trigger", ariaStateProvider="meltui"
  NOTE: trigger is parameterized — adapter.slots.trigger(value) returns the store.
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getTabsComponentContext } from "./context.js";
  import type { TabsTriggerComponentProps } from "./types.js";

  let { value, disabled = false, children, class: className, ...rest }: TabsTriggerComponentProps = $props();
  const { adapter } = getTabsComponentContext();

  const triggerStore = $derived(adapter.slots.trigger(value));

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TabsTrigger");
</script>

<button
  use:cold={triggerStore}
  {...rest}
  data-kind="tabs"
  data-slot="trigger"
  class={cn(className)}
  disabled={disabled || undefined}
>
  {@render children?.()}
</button>
```

### Task 2c.6: Create TabsContent.svelte
- [ ] Create file: `src/lib/design/components/tabs/TabsContent.svelte`
- [ ] Verify: `adapter.slots.content(value)` — PARAMETERIZED
- [ ] Verify: `$derived(adapter.slots.content(value))` — runes bridge

**File Content:**

```svelte
<!--
  @component TabsContent
  @description ColdLight TabsContent. Panel for tab content (role=tabpanel).
  Contract: kind="tabs", slot="content", ariaStateProvider="meltui"
  NOTE: content is parameterized — adapter.slots.content(value) returns the store.
-->
<script lang="ts">
  import { cn, stripStyleProp } from "$lib/design/primitives/types.js";
  import { cold } from "../_transport/action.js";
  import { getTabsComponentContext } from "./context.js";
  import type { TabsContentComponentProps } from "./types.js";

  let { value, children, class: className, ...rest }: TabsContentComponentProps = $props();
  const { adapter } = getTabsComponentContext();

  const contentStore = $derived(adapter.slots.content(value));

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TabsContent");
</script>

<div
  use:cold={contentStore}
  {...rest}
  data-kind="tabs"
  data-slot="content"
  class={cn(className)}
>
  {@render children?.()}
</div>
```

### Task 2c.7: Create tabs barrel — `components/tabs/index.ts`
- [ ] Create file: `src/lib/design/components/tabs/index.ts`
- [ ] Verify: exports all 4 components + all 4 types

**File Content:**

```typescript
/**
 * @file Tabs Component Barrel
 */
export { default as Tabs } from "./Tabs.svelte";
export { default as TabsList } from "./TabsList.svelte";
export { default as TabsTrigger } from "./TabsTrigger.svelte";
export { default as TabsContent } from "./TabsContent.svelte";
export type {
  TabsComponentProps,
  TabsListComponentProps,
  TabsTriggerComponentProps,
  TabsContentComponentProps,
} from "./types.js";
```

### Phase 2c Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `grep -r "@melt-ui/svelte" components/tabs/` — 0 results
- [ ] `grep -ri "melt" components/tabs/*.svelte` — 0 results
- [ ] TabsTrigger and TabsContent use `$derived()` for parameterized stores
- [ ] All 7 files exist

> **COMPACT CHECKPOINT** — Pause, re-read invariants, verify gates for 2a+2b+2c, then proceed.

---

## Phase 3: Barrel Registration

### Task 3.1: Create components barrel — `components/index.ts`
- [ ] Create file: `src/lib/design/components/index.ts`
- [ ] Verify: re-exports all 3 component barrels

**File Content:**

```typescript
/**
 * @file ColdLight Components Barrel
 * @description Accessible component layer — primitives + ARIA + behavior.
 */
export * from "./button/index.js";
export * from "./dialog/index.js";
export * from "./tabs/index.js";
```

### Phase 3 Gate
- [ ] `pnpm svelte-check` — 0 errors (full project)

---

## Phase 4: Full Cloaking Audit

### Task 4.1: Source-level cloaking audit
- [ ] `grep -r "@melt-ui/svelte" src/lib/design/components/` → 0 results
- [ ] `grep -ri "melt" src/lib/design/components/**/*.svelte` → 0 results
- [ ] `grep -r "use:melt" src/lib/design/components/` → 0 results
- [ ] `grep -r "use:cold" src/lib/design/components/button/` → 0 results (ColdLight archetype)
- [ ] `grep -r "use:cold" src/lib/design/components/dialog/` → results ONLY in .svelte files (adapter archetype)
- [ ] `grep -r "use:cold" src/lib/design/components/tabs/` → results ONLY in .svelte files (adapter archetype)

### Task 4.2: Import chain audit
- [ ] `components/_transport/action.ts` imports from `_internal/_transport/action.js` ✓
- [ ] All dialog `.svelte` files import `cold` from `../_transport/action.js` ✓
- [ ] All tabs `.svelte` files import `cold` from `../_transport/action.js` ✓
- [ ] ZERO direct imports from `@melt-ui/svelte` in any component file ✓

---

## Phase 5: Test Infrastructure

### Task 5.1: Create contract compliance harness — `_test/harness.ts`
- [ ] Create directory: `src/lib/design/components/_test/`
- [ ] Create file: `src/lib/design/components/_test/harness.ts`
- [ ] Verify: exports `assertContractCompliance` function
- [ ] Verify: takes a contract + container, verifies data-kind, data-slot, element tags

### Task 5.2: Create cloaking test — `_test/cloaking.test.ts`
- [ ] Create file: `src/lib/design/components/_test/cloaking.test.ts`
- [ ] Verify: reads component source files
- [ ] Verify: asserts zero `@melt-ui/svelte` and zero `melt` in `.svelte` files

### Task 5.3: Create MSW handlers — `_test/msw/handlers.ts`
- [ ] Create directory: `src/lib/design/components/_test/msw/`
- [ ] Create file: `src/lib/design/components/_test/msw/handlers.ts`

### Task 5.4: Create MSW server — `_test/msw/server.ts`
- [ ] Create file: `src/lib/design/components/_test/msw/server.ts`

### Task 5.5: Create MSW browser — `_test/msw/browser.ts`
- [ ] Create file: `src/lib/design/components/_test/msw/browser.ts`

### Phase 5 Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 5 test infrastructure files exist

---

## Phase 6: Vitest Tests

### Task 6.1: Create Button test wrapper — `Button.test.svelte`
- [ ] Create file: `src/lib/design/components/button/Button.test.svelte`

### Task 6.2: Create Button tests — `Button.test.ts`
- [ ] Create file: `src/lib/design/components/button/Button.test.ts`
- [ ] Tests cover: contract compliance, ARIA (pressed, disabled, busy), prop forwarding, state, disabled+loading

### Task 6.3: Create Dialog test wrapper — `Dialog.test.svelte`
- [ ] Create file: `src/lib/design/components/dialog/Dialog.test.svelte`
- [ ] Full composition: Dialog > DialogTrigger + DialogPortal > DialogOverlay + DialogContent > DialogTitle + DialogDescription + DialogClose

### Task 6.4: Create Dialog tests — `Dialog.test.ts`
- [ ] Create file: `src/lib/design/components/dialog/Dialog.test.ts`
- [ ] Tests cover: contract compliance, ARIA (role=dialog, aria-modal), ID linking, composition, missing optional slots, bindable state, context isolation

### Task 6.5: Create Tabs test wrapper — `Tabs.test.svelte`
- [ ] Create file: `src/lib/design/components/tabs/Tabs.test.svelte`
- [ ] Full composition: Tabs > TabsList > TabsTrigger(value) + TabsContent(value)

### Task 6.6: Create Tabs tests — `Tabs.test.ts`
- [ ] Create file: `src/lib/design/components/tabs/Tabs.test.ts`
- [ ] Tests cover: contract compliance, ARIA (tablist, tab, tabpanel, aria-selected), parameterized slots, bindable state, content visibility, context isolation

### Phase 6 Gate
- [ ] `pnpm test:run` — all Vitest tests pass
- [ ] 0 test failures

> **COMPACT CHECKPOINT** — Pause, re-read invariants, verify all gates, then proceed to e2e.

---

## Phase 7: E2E Test Pages

### Task 7.1: Create e2e directory structure
- [ ] Create directory: `interfaces/desktop/e2e/components/`
- [ ] Create directory: `interfaces/desktop/e2e/components/fixtures/`

### Task 7.2: Create test route — `/test/components`
- [ ] Create route: `src/routes/(test)/test/components/+page.svelte` (dev-only)
- [ ] Links to sub-routes: button, dialog, tabs

### Task 7.3: Create button test page
- [ ] Create route: `src/routes/(test)/test/components/button/+page.svelte`
- [ ] Renders: default button, disabled button, loading button, pressed button

### Task 7.4: Create dialog test page
- [ ] Create route: `src/routes/(test)/test/components/dialog/+page.svelte`
- [ ] Renders: full dialog, dialog without title, nested dialog

### Task 7.5: Create tabs test page
- [ ] Create route: `src/routes/(test)/test/components/tabs/+page.svelte`
- [ ] Renders: 3-tab group, tabs with disabled trigger, two separate tab groups

---

## Phase 8: Playwright E2E Tests

### Task 8.1: Create button e2e test
- [ ] Create file: `interfaces/desktop/e2e/components/button.spec.ts`
- [ ] Tests: click, Enter, Space, disabled, loading, focus

### Task 8.2: Create dialog e2e test
- [ ] Create file: `interfaces/desktop/e2e/components/dialog.spec.ts`
- [ ] Tests: trigger opens, Escape closes, outside click, focus trap, Shift+Tab, nested, open on mount

### Task 8.3: Create tabs e2e test
- [ ] Create file: `interfaces/desktop/e2e/components/tabs.spec.ts`
- [ ] Tests: click select, ArrowRight/Left, Home/End, disabled skip, Tab flow, multi-group isolation

### Phase 8 Gate
- [ ] `pnpm test:e2e` — all Playwright tests pass
- [ ] 0 test failures

---

## Phase 9: Final Verification

### Task 9.1: Full gate check
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `pnpm test:run` — all Vitest tests pass
- [ ] `pnpm test:e2e` — all Playwright tests pass
- [ ] Cloaking audit clean (Task 4.1 + 4.2 re-verified)

### Task 9.2: File count verification
- [ ] `components/_transport/` — 2 files (action.ts, types.ts)
- [ ] `components/_test/` — 5 files (harness.ts, cloaking.test.ts, msw/handlers.ts, msw/server.ts, msw/browser.ts)
- [ ] `components/button/` — 7 files (3 .svelte + types + index + test + test.svelte)
- [ ] `components/dialog/` — 13 files (8 .svelte + context + types + index + test + test.svelte)
- [ ] `components/tabs/` — 9 files (4 .svelte + context + types + index + test + test.svelte)
- [ ] `components/index.ts` — 1 file
- [ ] `_internal/_transport/action.ts` — 1 file
- [ ] `_internal/dialog/adapter.ts` — 1 file
- [ ] `_internal/tabs/adapter.ts` — 1 file
- [ ] e2e tests — 3 .spec.ts + 3 test pages + 1 index page
- [ ] playwright.config.ts — 1 file

### Task 9.3: Sprint complete
- [ ] All checkboxes in this sprint file are checked
- [ ] No drift from plan — re-read each phase gate and confirm
- [ ] Ready for semantics layer (FUTURE)
