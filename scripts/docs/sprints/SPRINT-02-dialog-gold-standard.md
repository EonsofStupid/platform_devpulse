# SPRINT 02: Dialog Gold Standard — ColdLight-Native

> **Status**: READY FOR EXECUTION
> **Scope**: `interfaces/desktop/src/lib/design/{api/adapters/coldlight,components/dialog}`
> **Depends On**: Taxonomy contracts (complete), Primitives (complete), Recipes (complete), Blueprints (complete), Component shell (complete)
> **Goal**: ColdLight owns Dialog natively. First ColdLight-owned primitive. Gold standard pattern.

---

## Context

Phases 2–5 of the original sprint are DONE. Recipes, blueprints, component shell, barrels — all exist and compile. What's broken is Phase 1: the transport layer. The old meltui Dialog adapter imports from `@melt-ui/svelte` (dead package name). We upgraded to `melt ^0.44.0` but melt's Dialog builder is ~140 lines wrapping native `<dialog>` with only 3 slots. Not worth the dependency. ColdLight owns Dialog.

ColdLight-native Dialog is just another adapter. Same `_transport/` vocabulary. Same cloaking via `imports.gen.ts`. Components never know the difference. The meltui adapter stays for primitives that need it (Combobox, Select, Tabs).

---

## Critical Decisions (LOCKED)

1. **ColdLight-native Dialog is an adapter** — Lives at `api/adapters/coldlight/_internal/`. Same transport pattern as meltui. `imports.gen.ts` routes Dialog → coldlight, Tabs → meltui. Components are zero changes to the cloaking interface.

2. **Native `<dialog>` element** — Content renders as `<dialog>` using `showModal()`. Gets `role="dialog"`, `aria-modal="true"`, focus containment, top layer, Escape (`cancel` event), `::backdrop` for free.

3. **Behavioral utilities in `coldlight/_internal/_transport/`** — Scroll lock, dismiss layer, escape layer, presence, ARIA IDs, platform detection. Reused by future ColdLight-native primitives (AlertDialog, Sheet, Drawer).

4. **Svelte 5 runes only** — `$state`, `$derived`, `$effect`. No legacy stores. Transport state uses getter/setter pattern (same as melt 0.44.0).

5. **Transport interface updated** — No more `Readable`/`Writable` stores. Slots return attribute objects (spread pattern). States are getter/setter. `connectSlot` action replaced by direct spread.

6. **Component layer updates minimally** — Remove `use:connectSlot`, spread slot attrs directly. Remove store subscriptions, use getter/setter for state sync. Same context pattern, same recipe resolution.

7. **Old meltui dialog adapter stays but is dead code** — Not deleted this sprint. `imports.gen.ts` routes away from it. Clean up in a future sprint.

8. **Existing phases 2–5 untouched** — Recipes, blueprints, component types, barrels, design barrel — all done. This sprint only touches: adapter layer, transport types, `imports.gen.ts`, and component `.svelte` files.

---

## Current State

### What's DONE (from original sprint)

- `recipes/types.ts`, `recipes/index.ts`, `recipes/utils.ts`, `recipes/dialog.recipe.ts` — DONE
- `blueprints/types.ts`, `blueprints/index.ts`, `blueprints/dialog.blueprint.ts` — DONE
- `components/types.ts`, `components/dialog/types.ts`, `components/dialog/context.ts` — DONE
- `components/dialog/index.ts`, `components/index.ts`, `design/index.ts` — DONE
- All 10 Dialog component `.svelte` files — EXIST but broken (use `connectSlot` + store subscriptions)
- Taxonomy contracts — DONE

### What's BROKEN

- `meltui/_internal/_transport/action.ts` — imports from `@melt-ui/svelte` (dead)
- `meltui/_internal/_transport/types.ts` — uses `Readable`/`Writable` from `svelte/store` (legacy)
- `meltui/_internal/dialog/factory.ts` — imports `createDialog` from `@melt-ui/svelte` (dead)
- `meltui/_internal/dialog/_transport/*` — maps old melt API (7 element stores, Writable states)
- `imports.gen.ts` — routes Dialog → broken meltui adapter, exports dead `connectSlot`
- All component `.svelte` files — use `connectSlot` action + `$store` subscription syntax

### What NEEDS TO EXIST

```
api/adapters/coldlight/_internal/
├── _transport/                    # ColdLight behavioral engine (shared)
│   ├── platform.ts                # isIOS(), isWebKit()
│   ├── scroll-lock.svelte.ts      # Ref-counted singleton
│   ├── dismiss-layer.svelte.ts    # Click-outside + layer stack
│   ├── escape-layer.svelte.ts     # Escape with layered priority
│   ├── presence.svelte.ts         # Animation-aware mount/unmount
│   ├── ids.ts                     # Stable ARIA ID generation
│   ├── types.ts                   # MaybeGetter<T>, shared behavioral types
│   └── index.ts
├── dialog/
│   ├── dialog.svelte.ts           # ColdLightDialog class (all behavior)
│   ├── _transport/
│   │   ├── types.ts               # DialogTransport, DialogTransportConfig
│   │   ├── factory.ts             # createDialogTransport()
│   │   └── index.ts
│   └── index.ts
```

---

## Phase 1: ColdLight Behavioral Engine

Shared utilities in `api/adapters/coldlight/_internal/_transport/`. Every ColdLight-native primitive reuses these.

### Task 1.1: Create shared types

**File**: `api/adapters/coldlight/_internal/_transport/types.ts`

```typescript
/** Value or getter — reactive when getter, static when value */
export type MaybeGetter<T> = T | (() => T);

/** Extract value from MaybeGetter */
export function extract<T>(value: MaybeGetter<T>): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback: T): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback?: T): T | undefined {
  const v = typeof value === "function" ? (value as () => T)() : value;
  return v ?? fallback;
}

/** Slot attribute object — spread onto element */
export type SlotAttrs = Record<string, unknown>;

/** Transport adapter interface — all adapters satisfy this */
export interface TransportAdapter<TSlot extends string, TStates> {
  readonly slots: { readonly [K in TSlot]: SlotAttrs };
  readonly states: TStates;
}
```

- [ ] Compiles

### Task 1.2: Create platform detection

**File**: `api/adapters/coldlight/_internal/_transport/platform.ts`

Detects iOS and WebKit for scroll lock edge cases. Pattern from melt's `platform.js`.

```typescript
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isWebKit(): boolean {
  return /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}
```

- [ ] Compiles

### Task 1.3: Create ARIA ID generation

**File**: `api/adapters/coldlight/_internal/_transport/ids.ts`

Deterministic ARIA IDs for `aria-labelledby` / `aria-describedby` linking.

```typescript
let counter = 0;

export function generateId(prefix = "cl"): string {
  return `${prefix}-${++counter}`;
}

export interface DialogIds {
  content: string;
  title: string;
  description: string;
}

export function createDialogIds(): DialogIds {
  const base = generateId("dlg");
  return {
    content: `${base}-content`,
    title: `${base}-title`,
    description: `${base}-desc`,
  };
}
```

- [ ] Compiles

### Task 1.4: Create scroll lock

**File**: `api/adapters/coldlight/_internal/_transport/scroll-lock.svelte.ts`

Ref-counted singleton. Multiple overlays can request scroll lock — body unlocks only when all release. Handles iOS quirks.

```typescript
// Singleton ref-counted scroll lock.
// acquire() locks body scroll, release() decrements.
// Body unlocks when refcount hits 0.
// iOS: uses position:fixed + scroll offset preservation.
// Standard: uses overflow:hidden + scrollbar-gutter:stable.

class ScrollLocker {
  #refCount = 0;
  #scrollY = 0;
  #originalStyles = "";

  acquire(): void { /* increment ref, lock if first */ }
  release(): void { /* decrement ref, unlock if last */ }
}

export const scrollLocker = new ScrollLocker();
export function useScrollLock(active: boolean): void { /* $effect wrapper */ }
```

Full implementation handles:
- Ref counting for nested overlays
- iOS `position:fixed` + scroll offset preservation
- `scrollbar-gutter: stable` to prevent layout shift
- WebKit zoom detection bailout
- Cleanup on `$effect` destroy

- [ ] Compiles
- [ ] Handles nested overlays (ref counting)

### Task 1.5: Create dismiss layer

**File**: `api/adapters/coldlight/_internal/_transport/dismiss-layer.svelte.ts`

Click-outside detection with layer stack for nested overlays. Ignores clicks during text selection. Checks for child dialogs.

```typescript
// Layer stack: each open overlay registers itself.
// Click-outside only fires on the TOP layer.
// Handles: text selection awareness, child dialog detection,
// bounding rect check (same pattern as melt's Dialog).

export function useDismissLayer(config: {
  enabled: MaybeGetter<boolean>;
  node: () => HTMLElement | null;
  onDismiss: () => void;
}): void { /* $effect wrapper */ }
```

- [ ] Compiles
- [ ] Layer stack prevents inner overlay clicks from closing outer

### Task 1.6: Create escape layer

**File**: `api/adapters/coldlight/_internal/_transport/escape-layer.svelte.ts`

For non-`<dialog>` elements. `<dialog>` gets Escape for free via the `cancel` event, so this is for Sheet/Popover/etc. Still needed in the shared engine.

```typescript
// Layer stack for Escape key priority.
// Only the topmost registered layer handles Escape.
// <dialog> elements handle their own cancel event — this is for non-dialog overlays.

export function useEscapeLayer(config: {
  enabled: MaybeGetter<boolean>;
  onEscape: () => void;
}): void { /* $effect wrapper */ }
```

- [ ] Compiles

### Task 1.7: Create presence utility

**File**: `api/adapters/coldlight/_internal/_transport/presence.svelte.ts`

Animation-aware mount/unmount. Waits for CSS transitions to complete before removing from DOM.

```typescript
// Tracks element visibility state with transition awareness.
// open=true: immediately show (add data-state="open")
// open=false: set data-state="closed", wait for transitionend, THEN hide/close
// Handles: no-transition fast path, animation cancellation

export function usePresence(config: {
  open: MaybeGetter<boolean>;
  node: () => HTMLElement | null;
  onExitComplete?: () => void;
}): { readonly present: boolean } { /* reactive presence state */ }
```

- [ ] Compiles
- [ ] No-transition fast path (instant hide when no CSS transition)

### Task 1.8: Create barrel

**File**: `api/adapters/coldlight/_internal/_transport/index.ts`

```typescript
export { extract, type MaybeGetter, type SlotAttrs, type TransportAdapter } from "./types.js";
export { isIOS, isWebKit } from "./platform.js";
export { generateId, createDialogIds, type DialogIds } from "./ids.js";
export { scrollLocker, useScrollLock } from "./scroll-lock.svelte.js";
export { useDismissLayer } from "./dismiss-layer.svelte.js";
export { useEscapeLayer } from "./escape-layer.svelte.js";
export { usePresence } from "./presence.svelte.js";
```

- [ ] All exports resolve

---

## COMPACT CHECKPOINT #1

After Phase 1:

- [ ] `api/adapters/coldlight/_internal/_transport/` — all 8 files exist
- [ ] `pnpm svelte-check` passes — zero type errors in transport utilities
- [ ] No imports from `@melt-ui/svelte` or `melt` in coldlight adapter

---

## Phase 2: ColdLight-Native Dialog

### Task 2.1: Create Dialog state machine

**File**: `api/adapters/coldlight/_internal/dialog/dialog.svelte.ts`

The core. Class-based Svelte 5 runes. Manages open state, ARIA IDs, slot attribute objects, and all behavioral coordination.

```typescript
import { createDialogIds } from "../_transport/ids.js";
import { useScrollLock } from "../_transport/scroll-lock.svelte.js";
import { useDismissLayer } from "../_transport/dismiss-layer.svelte.js";
import { usePresence } from "../_transport/presence.svelte.js";
import { extract, type MaybeGetter, type SlotAttrs } from "../_transport/types.js";
import { tick } from "svelte";

export interface ColdLightDialogConfig {
  open?: MaybeGetter<boolean>;
  onOpenChange?: (value: boolean) => void;
  closeOnEscape?: MaybeGetter<boolean>;
  closeOnOutsideClick?: MaybeGetter<boolean>;
  preventScroll?: MaybeGetter<boolean>;
}

export class ColdLightDialog {
  // --- Config ---
  #config: ColdLightDialogConfig;
  #closeOnEscape = $derived(extract(this.#config.closeOnEscape, true));
  #closeOnOutsideClick = $derived(extract(this.#config.closeOnOutsideClick, true));
  #preventScroll = $derived(extract(this.#config.preventScroll, true));

  // --- State ---
  #open = $state(false);
  #ids = createDialogIds();
  #contentEl: HTMLDialogElement | null = null;
  #overlayEl: HTMLElement | null = null;
  #triggerEl: HTMLElement | null = null;

  constructor(config: ColdLightDialogConfig = {}) {
    this.#config = config;
    // Controlled mode: sync from getter
    const initial = extract(config.open, false);
    this.#open = initial;
  }

  // --- Open state ---
  get open(): boolean { return this.#open; }
  set open(v: boolean) {
    if (v === this.#open) return;
    if (v) {
      this.#overlayEl?.showPopover?.();
      this.#contentEl?.showModal?.();
      tick().then(() => {
        this.#open = v;
        this.#config.onOpenChange?.(v);
      });
    } else {
      this.#open = v;
      this.#config.onOpenChange?.(v);
      // presence utility handles transitionend → close()
    }
  }

  // --- Slot attrs ---
  get trigger(): SlotAttrs {
    return {
      type: "button",
      "aria-haspopup": "dialog",
      "aria-expanded": this.#open,
      "aria-controls": this.#ids.content,
      "data-open": this.#open ? "" : undefined,
      onclick: () => { this.open = !this.open; },
    };
  }

  get content(): SlotAttrs {
    return {
      id: this.#ids.content,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": this.#ids.title,
      "aria-describedby": this.#ids.description,
      "data-open": this.#open ? "" : undefined,
      onclose: () => { this.open = false; },
      oncancel: (e: Event) => {
        e.preventDefault();
        if (this.#closeOnEscape) this.open = false;
      },
    };
  }

  get overlay(): SlotAttrs {
    return {
      "aria-hidden": "true",
      popover: "manual",
      "data-open": this.#open ? "" : undefined,
    };
  }

  get portal(): SlotAttrs { return {}; }

  get title(): SlotAttrs {
    return { id: this.#ids.title };
  }

  get description(): SlotAttrs {
    return { id: this.#ids.description };
  }

  get close(): SlotAttrs {
    return {
      type: "button",
      onclick: () => { this.open = false; },
    };
  }

  // --- Attachment for content element ---
  // Components call this in an action or onMount to wire up
  // scroll lock, dismiss layer, presence, ref tracking.
  attachContent(node: HTMLDialogElement): () => void { /* ... */ }
  attachOverlay(node: HTMLElement): () => void { /* ... */ }
  attachTrigger(node: HTMLElement): () => void { /* ... */ }
}
```

Key behaviors:
- `showModal()` for native `<dialog>` (focus trap, top layer, `::backdrop`)
- `cancel` event interception for Escape control
- Overlay uses Popover API (`popover="manual"`) for animated backdrop (bypasses `::backdrop` limitation)
- Click-outside via `useDismissLayer` wired in `attachContent`
- Scroll lock via `useScrollLock` wired in `attachContent`
- Presence via `usePresence` for transition-aware close
- ARIA IDs auto-wired: `aria-labelledby` → title `id`, `aria-describedby` → description `id`

- [ ] Compiles
- [ ] All 7 contract slots produce correct attributes
- [ ] ARIA attributes match taxonomy contract

### Task 2.2: Create dialog transport types

**File**: `api/adapters/coldlight/_internal/dialog/_transport/types.ts`

```typescript
import type { DialogSlot } from "$lib/design/taxonomy/kinds/primitives/dialog/types.js";
import type { SlotAttrs, TransportAdapter } from "../../_transport/types.js";

export interface DialogTransportStates {
  open: boolean; // getter + setter
}

export type DialogTransport = TransportAdapter<
  Exclude<DialogSlot, "root">,
  DialogTransportStates
>;

export interface DialogTransportConfig {
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  preventScroll?: boolean;
}

/** Attachment functions for behavioral wiring */
export interface DialogAttachments {
  attachContent: (node: HTMLDialogElement) => () => void;
  attachOverlay: (node: HTMLElement) => () => void;
  attachTrigger: (node: HTMLElement) => () => void;
}
```

- [ ] Types reference taxonomy `DialogSlot`
- [ ] Uses `TransportAdapter` from shared types

### Task 2.3: Create dialog transport factory

**File**: `api/adapters/coldlight/_internal/dialog/_transport/factory.ts`

```typescript
import { ColdLightDialog } from "../dialog.svelte.js";
import type { DialogTransport, DialogTransportConfig, DialogAttachments } from "./types.js";

export function createDialogTransport(
  config?: DialogTransportConfig,
): DialogTransport & DialogAttachments {
  const dialog = new ColdLightDialog({
    open: config?.open ? () => config.open! : undefined,
    onOpenChange: config?.onOpenChange,
    closeOnEscape: config?.closeOnEscape,
    closeOnOutsideClick: config?.closeOnOutsideClick,
    preventScroll: config?.preventScroll,
  });

  return {
    slots: {
      get trigger() { return dialog.trigger; },
      get content() { return dialog.content; },
      get overlay() { return dialog.overlay; },
      get portal() { return dialog.portal; },
      get title() { return dialog.title; },
      get description() { return dialog.description; },
      get close() { return dialog.close; },
    },
    states: {
      get open() { return dialog.open; },
      set open(v: boolean) { dialog.open = v; },
    },
    attachContent: (node) => dialog.attachContent(node),
    attachOverlay: (node) => dialog.attachOverlay(node),
    attachTrigger: (node) => dialog.attachTrigger(node),
  };
}
```

- [ ] Returns typed `DialogTransport` + attachments
- [ ] Reactive getters on slots (re-evaluate when state changes)

### Task 2.4: Create dialog transport barrel

**File**: `api/adapters/coldlight/_internal/dialog/_transport/index.ts`

```typescript
export type { DialogTransport, DialogTransportConfig, DialogTransportStates, DialogAttachments } from "./types.js";
export { createDialogTransport } from "./factory.js";
```

- [ ] Clean barrel

### Task 2.5: Create dialog barrel

**File**: `api/adapters/coldlight/_internal/dialog/index.ts`

```typescript
export { ColdLightDialog, type ColdLightDialogConfig } from "./dialog.svelte.js";
export {
  createDialogTransport,
  type DialogTransport,
  type DialogTransportConfig,
  type DialogAttachments,
} from "./_transport/index.js";
```

- [ ] Clean barrel

---

## COMPACT CHECKPOINT #2

After Phase 2:

- [ ] `api/adapters/coldlight/_internal/dialog/` — all files exist
- [ ] `ColdLightDialog` class compiles with runes
- [ ] `createDialogTransport()` returns typed transport
- [ ] Transport satisfies `TransportAdapter<Exclude<DialogSlot, "root">, DialogTransportStates>`
- [ ] `pnpm svelte-check` passes

---

## Phase 3: Cloak Update

### Task 3.1: Update imports.gen.ts

**File**: `taxonomy/.generated/imports.gen.ts`

Route Dialog → coldlight adapter. Remove `connectSlot` (no longer needed — spread pattern replaces it).

```typescript
/**
 * AUTO-GENERATED by coldlight:generate — DO NOT EDIT
 *
 * ColdLight Import Cloak
 * Maps adapter-specific factories to ColdLight-generic names.
 * Components import ONLY from this file. Zero adapter awareness.
 *
 * Active adapters: coldlight (dialog), meltui (tabs)
 */

// =============================================================================
// dialog — ColdLight-native
// =============================================================================

export { createDialogTransport as createDialog } from "$lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/factory.js";
export type { DialogTransport as DialogInstance } from "$lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/types.js";
export type { DialogTransportConfig as DialogConfig } from "$lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/types.js";
export type { DialogAttachments } from "$lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/types.js";

// =============================================================================
// tabs — meltui
// =============================================================================

export { createMeltTabs as createTabs } from "$lib/design/api/dsadapters/meltui/_internal/tabs/factory.js";
export type { MeltTabsInstance as TabsInstance } from "$lib/design/api/dsadapters/meltui/_internal/tabs/factory.js";
export type { MeltTabsConfig as TabsConfig } from "$lib/design/api/dsadapters/meltui/_internal/tabs/factory.js";
```

Changes:
- Dialog routes to `coldlight` adapter
- `connectSlot` REMOVED — spread pattern replaces it
- `DialogAttachments` type exported for component behavioral wiring

- [ ] Dialog → coldlight
- [ ] Tabs → meltui (unchanged)
- [ ] No more `connectSlot`

### Task 3.2: Update component context type

**File**: `components/dialog/context.ts`

Update `DialogComponentContext` to include attachments.

```typescript
import { getContext, setContext } from "svelte";
import type { DialogInstance, DialogAttachments } from "$lib/design/taxonomy/.generated/imports.gen.js";

const CTX_KEY = Symbol("coldlight:components:dialog");

export interface DialogComponentContext {
  readonly transport: DialogInstance & DialogAttachments;
  readonly classes: Record<string, string>;
}

export function setDialogComponentContext(ctx: DialogComponentContext): void {
  setContext(CTX_KEY, ctx);
}

export function getDialogComponentContext(): DialogComponentContext {
  return getContext<DialogComponentContext>(CTX_KEY);
}
```

- [ ] Context type includes attachments
- [ ] Still imports from `imports.gen.ts` only

---

## Phase 4: Update Component .svelte Files

All components already exist. Update each to: remove `connectSlot`, spread slot attrs, use attachment functions, remove store syntax.

### Task 4.1: Update Dialog.svelte (Root)

Remove store subscription. Use getter/setter for open sync. Pass `onOpenChange` to transport.

```svelte
<script lang="ts">
  import type { DialogProps } from "./types.js";
  import { setDialogComponentContext } from "./context.js";
  import { createDialog } from "$lib/design/taxonomy/.generated/imports.gen.js";
  import { getRecipe } from "$lib/design/recipes/index.js";
  import { getBlueprint } from "$lib/design/blueprints/index.js";
  import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

  let {
    open = $bindable(false),
    defaultOpen,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    preventScroll = true,
    recipe: recipeId,
    accent, surface, variant, size, radius, depth, glow, bevel,
    children,
  }: DialogProps = $props();

  const blueprint = getBlueprint("dialog.default");
  const defaults = blueprint?.defaultProps ?? {};

  const transport = createDialog({
    open: defaultOpen ?? open,
    onOpenChange: (v: boolean) => { open = v; },
    closeOnEscape,
    closeOnOutsideClick,
    preventScroll,
  });

  // Prop → transport (consumer sets open programmatically)
  $effect(() => { transport.states.open = open; });

  const resolvedRecipe = getRecipe(recipeId ?? blueprint?.defaultRecipe ?? "dialog.glass.void");

  const resolvedProps: DsSurfaceProps = {
    accent: accent ?? defaults.accent ?? "teal",
    surface: surface ?? defaults.surface ?? "glass",
    variant: variant ?? defaults.variant ?? "void",
    size: size ?? defaults.size ?? "md",
    radius: radius ?? defaults.radius ?? "lg",
    depth: depth ?? defaults.depth ?? 3,
    glow: glow ?? defaults.glow ?? "teal",
    bevel: bevel ?? defaults.bevel ?? "soft",
  };

  const classes = resolvedRecipe?.classes(resolvedProps) ?? {};

  setDialogComponentContext({ transport, classes });
</script>

{@render children?.()}
```

Key changes:
- No more `transport.states.open.subscribe()` — `onOpenChange` callback
- No more `transport.states.open.set()` — direct assignment
- `createDialog` returns transport with attachments

- [ ] No store imports
- [ ] Bidirectional sync via `onOpenChange` + `$effect`

### Task 4.2: Update DialogTrigger.svelte

```svelte
<script lang="ts">
  import type { DialogTriggerProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogTriggerProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<button
  {...transport.slots.trigger}
  {...rest}
  data-kind="dialog"
  data-slot="trigger"
  class={cn(classes.trigger, className)}
  use:transport.attachTrigger
>
  {@render children?.()}
</button>
```

- [ ] `{...transport.slots.trigger}` replaces `use:connectSlot={$trigger}`
- [ ] `use:transport.attachTrigger` for ref tracking

### Task 4.3: Update DialogContent.svelte

```svelte
<script lang="ts">
  import type { DialogContentProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogContentProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<dialog
  {...transport.slots.content}
  {...rest}
  data-kind="dialog"
  data-slot="content"
  data-state={transport.states.open ? "open" : "closed"}
  class={cn(classes.content, className)}
  use:transport.attachContent
>
  {@render children?.()}
</dialog>
```

Key changes:
- `<div>` → `<dialog>` (native dialog element)
- `use:transport.attachContent` wires scroll lock, dismiss layer, presence
- `transport.states.open` is a boolean getter, not `$open` store

- [ ] `<dialog>` element, not `<div>`
- [ ] Behavioral attachment wired

### Task 4.4: Update DialogOverlay.svelte

```svelte
<script lang="ts">
  import type { DialogOverlayProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogOverlayProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<div
  {...transport.slots.overlay}
  {...rest}
  data-kind="dialog"
  data-slot="overlay"
  data-state={transport.states.open ? "open" : "closed"}
  class={cn(classes.overlay, className)}
  use:transport.attachOverlay
>
  {@render children?.()}
</div>
```

- [ ] Overlay uses Popover API (attrs from transport)
- [ ] Attachment wired

### Task 4.5: Update DialogPortal.svelte

```svelte
<script lang="ts">
  import type { DialogPortalProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogPortalProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<div
  {...transport.slots.portal}
  {...rest}
  data-kind="dialog"
  data-slot="portal"
  class={cn(classes.portal, className)}
>
  {@render children?.()}
</div>
```

- [ ] Structural only — no attachment needed

### Task 4.6: Update DialogTitle.svelte

```svelte
<script lang="ts">
  import type { DialogTitleProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogTitleProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<h2
  {...transport.slots.title}
  {...rest}
  data-kind="dialog"
  data-slot="title"
  class={cn(classes.title, className)}
>
  {@render children?.()}
</h2>
```

- [ ] `id` comes from transport slot attrs (ARIA linking)

### Task 4.7: Update DialogDescription.svelte

```svelte
<script lang="ts">
  import type { DialogDescriptionProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogDescriptionProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<p
  {...transport.slots.description}
  {...rest}
  data-kind="dialog"
  data-slot="description"
  class={cn(classes.description, className)}
>
  {@render children?.()}
</p>
```

- [ ] `id` comes from transport slot attrs (ARIA linking)

### Task 4.8: Update DialogClose.svelte

```svelte
<script lang="ts">
  import type { DialogCloseProps } from "./types.js";
  import { getDialogComponentContext } from "./context.js";
  import { cn } from "$lib/design/primitives/types.js";

  let { children, class: className, ...rest }: DialogCloseProps = $props();
  const { transport, classes } = getDialogComponentContext();
</script>

<button
  {...transport.slots.close}
  {...rest}
  data-kind="dialog"
  data-slot="close"
  class={cn(classes.close, className)}
>
  {@render children?.()}
</button>
```

- [ ] `onclick` comes from transport slot attrs

### Task 4.9: DialogHeader.svelte + DialogFooter.svelte

**NO CHANGES** — layout only, no transport. Already correct.

- [ ] Confirmed no changes needed

---

## COMPACT CHECKPOINT #3

After Phases 3-4:

- [ ] `imports.gen.ts` routes Dialog → coldlight
- [ ] No `connectSlot` anywhere in components
- [ ] No `svelte/store` imports anywhere in components
- [ ] All component `.svelte` files updated
- [ ] `<dialog>` element used for content (not `<div>`)
- [ ] `pnpm svelte-check` passes

---

## Phase 5: Tests

### Task 5.1: Update Dialog test wrapper

**File**: `components/dialog/Dialog.test.svelte`

Already exists — may need minor updates for the new API (e.g., if prop names changed).

- [ ] Test wrapper renders without errors

### Task 5.2: Update Dialog vitest suite

**File**: `components/dialog/Dialog.test.ts`

Test categories:

1. **Contract satisfaction** — `data-kind="dialog"`, `data-slot` on all slots, `data-state`
2. **ARIA** (ColdLight provides natively) — `role=dialog`, `aria-modal=true`, `aria-labelledby` → title ID, `aria-describedby` → description ID, `aria-haspopup=dialog` on trigger, `aria-expanded`
3. **Recipe application** — glass-void classes on content, blur on overlay
4. **Open/close behavior** — trigger click, close click, Escape, `closeOnEscape=false`
5. **Keyboard** — Enter/Space on trigger
6. **Focus management** — focus moves into dialog, native `<dialog>` containment
7. **Scroll lock** — body overflow hidden when open, restored when closed
8. **Nested overlays** — ref-counted scroll lock, dismiss layer stack

- [ ] All test categories covered
- [ ] Tests pass

### Task 5.3: Create test demo route

**File**: `src/routes/(app)/test-components/+page.svelte`

- [ ] Route loads
- [ ] Dialog opens/closes

---

## Phase 6: Verification

### Task 6.1: Type check

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] Zero type errors

### Task 6.2: Vitest browser tests

```bash
cd interfaces/desktop && pnpm test:run
```

- [ ] All Dialog tests pass

### Task 6.3: Cloaking audit

- [ ] Zero `@melt-ui/svelte` imports outside `meltui/_internal/`
- [ ] Zero `connectSlot` in component files
- [ ] Zero `svelte/store` in component files
- [ ] `melt` package imports only in `meltui/_internal/` (tabs etc.)
- [ ] `coldlight/_internal/` has zero melt imports

### Task 6.4: Contract audit

- [ ] `<dialog>` has `role="dialog"` (native)
- [ ] `<dialog>` has `aria-modal="true"` (via showModal)
- [ ] `aria-labelledby` → title `id` (transport wires)
- [ ] `aria-describedby` → description `id` (transport wires)
- [ ] Trigger has `aria-haspopup="dialog"` + `aria-expanded`
- [ ] All slots have `data-kind="dialog"` + `data-slot="<name>"`

---

## Files Summary

### New Files

```
api/adapters/coldlight/_internal/_transport/types.ts
api/adapters/coldlight/_internal/_transport/platform.ts
api/adapters/coldlight/_internal/_transport/ids.ts
api/adapters/coldlight/_internal/_transport/scroll-lock.svelte.ts
api/adapters/coldlight/_internal/_transport/dismiss-layer.svelte.ts
api/adapters/coldlight/_internal/_transport/escape-layer.svelte.ts
api/adapters/coldlight/_internal/_transport/presence.svelte.ts
api/adapters/coldlight/_internal/_transport/index.ts
api/adapters/coldlight/_internal/dialog/dialog.svelte.ts
api/adapters/coldlight/_internal/dialog/_transport/types.ts
api/adapters/coldlight/_internal/dialog/_transport/factory.ts
api/adapters/coldlight/_internal/dialog/_transport/index.ts
api/adapters/coldlight/_internal/dialog/index.ts
```

### Modified Files

```
taxonomy/.generated/imports.gen.ts          — route Dialog → coldlight
components/dialog/context.ts                — add DialogAttachments to context type
components/dialog/Dialog.svelte             — runes-based state sync
components/dialog/DialogTrigger.svelte      — spread + attachment
components/dialog/DialogContent.svelte      — <dialog> + spread + attachment
components/dialog/DialogOverlay.svelte      — spread + attachment
components/dialog/DialogPortal.svelte       — spread (no connectSlot)
components/dialog/DialogTitle.svelte        — spread (ARIA id from transport)
components/dialog/DialogDescription.svelte  — spread (ARIA id from transport)
components/dialog/DialogClose.svelte        — spread (onclick from transport)
components/dialog/Dialog.test.svelte        — minor updates if needed
components/dialog/Dialog.test.ts            — updated for new behavior
```

### Untouched Files

```
recipes/*                   — DONE, no changes
blueprints/*                — DONE, no changes
components/dialog/types.ts  — DONE, no changes
components/dialog/index.ts  — DONE, no changes
components/index.ts         — DONE, no changes
design/index.ts             — DONE, no changes
DialogHeader.svelte         — layout only, no changes
DialogFooter.svelte         — layout only, no changes
meltui/_internal/tabs/*     — not touched this sprint
```

### Dead Code (NOT deleted this sprint)

```
meltui/_internal/dialog/*              — old adapter, imports.gen.ts routes away
meltui/_internal/_transport/action.ts  — connectSlot (dead import)
```
