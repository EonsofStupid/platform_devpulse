# Sprint: Tabs Component Layer

> **Scope**: `interfaces/desktop/src/lib/design/{api/adapters,recipes,blueprints,components}/tabs`
> **Depends On**: Tabs taxonomy (complete), Tabs primitive (complete)
> **Goal**: Full component layer for tabs — recipe, blueprint, component, tests.

---

## Current State Audit

| Layer | Status | Notes |
|---|---|---|
| Taxonomy contract | Done | kind="tabs", slots: root/list/trigger/content, states defined |
| Primitives | Done | Bare structural components, no ARIA (ariaStateProvider: "meltui") |
| MeltUI adapter (old) | Exists | Uses `@melt-ui/svelte` (Svelte 4 stores). No transport layer. |
| Transport layer | Missing | No `_transport/` like combobox has |
| Recipe | Missing | No `tabs.recipe.ts` |
| Blueprint | Missing | No `tabs.blueprint.ts` |
| Components | Missing | `components/tabs/` directory is empty |
| Tests | Missing | No test files |

---

## Key Decision: ColdLight-Owned vs @melt-ui/svelte

**Problem**: `melt` v0.44 (Svelte 5 runes-native, used by combobox) does NOT have a Tabs builder. The existing adapter uses `@melt-ui/svelte` (Svelte 4 stores API).

**Decision**: Build a **ColdLight-native tabs transport** (same pattern as Dialog).

**Reasoning**:
1. Tabs ARIA is well-defined and not complex — `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, roving tabindex
2. Avoids coupling to legacy `@melt-ui/svelte` store API on a Svelte 5 runes project
3. Aligns with ColdLight-native pattern (Dialog already does this)
4. If `melt` adds Tabs later, swap the transport without touching the component layer
5. The keyboard handler (roving tabindex + arrow keys) is a reusable utility

---

## Architecture

### Slots

| ColdLight Slot | ARIA | Element | Notes |
|---|---|---|---|
| `root` | — | `<div>` | Container, `data-orientation` |
| `list` | `role="tablist"`, `aria-orientation` | `<div>` | Trigger container |
| `trigger` | `role="tab"`, `aria-selected`, `aria-controls`, `tabindex` | `<button>` | Per-tab, parameterized by value |
| `content` | `role="tabpanel"`, `aria-labelledby`, `tabindex="0"` | `<div>` | Per-tab, parameterized by value |

### Transport Interface

```typescript
interface TabsTransportStates {
  value: string;
  orientation: "horizontal" | "vertical";
}

type TabsTransport = TransportAdapter<
  "root" | "list",
  TabsTransportStates
>;

interface TabsActions {
  getTrigger(value: string, disabled?: boolean): SlotAttrs;
  getContent(value: string): SlotAttrs;
}
```

Key: `getTrigger` and `getContent` are parameterized per-tab (like combobox's `getOption`).

### Roving Tabindex

Only the selected trigger gets `tabindex="0"`. All others get `tabindex="-1"`.
Arrow keys move focus between triggers, skipping disabled ones.
Home/End jump to first/last enabled trigger.
If `activateOnFocus` is true (default), focusing a trigger selects it.

### Component API

```svelte
<Tabs.Root bind:value>
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
    <Tabs.Trigger value="tab3" disabled>Tab 3</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
  <Tabs.Content value="tab3">Content 3</Tabs.Content>
</Tabs.Root>
```

---

## Phase 1: ColdLight Tabs Transport

### 1.1: Transport types

**File**: `api/adapters/coldlight/_internal/tabs/_transport/types.ts`

```typescript
import type { SlotAttrs, TransportAdapter } from "../../_transport/types.js";

export interface TabsTransportStates {
  value: string;
  orientation: "horizontal" | "vertical";
}

export type TabsTransport = TransportAdapter<
  "root" | "list",
  TabsTransportStates
>;

export interface TabsActions {
  getTrigger(value: string, disabled?: boolean): SlotAttrs;
  getContent(value: string): SlotAttrs;
}

export interface TabsTransportConfig {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  activateOnFocus?: boolean;
  loop?: boolean;
}
```

### 1.2: Transport factory

**File**: `api/adapters/coldlight/_internal/tabs/_transport/factory.ts`

ColdLight-owned implementation:
- Generates unique IDs per instance (trigger-{id}-{value}, panel-{id}-{value})
- Manages roving tabindex via internal tracking of registered triggers
- `getTrigger(value, disabled?)` returns spread-ready attrs with:
  - `role: "tab"`, `aria-selected`, `aria-controls`, `tabindex`, `id`
  - `onclick` handler (select tab)
  - `onkeydown` handler (arrow navigation, Home/End)
  - `data-state: "active" | "inactive"`
  - `data-disabled` if disabled
- `getContent(value)` returns spread-ready attrs with:
  - `role: "tabpanel"`, `aria-labelledby`, `tabindex: 0`, `id`
  - `hidden` when not selected
  - `data-state: "visible" | "hidden"`

### 1.3: Barrel exports

**File**: `api/adapters/coldlight/_internal/tabs/_transport/index.ts`
**File**: `api/adapters/coldlight/_internal/tabs/index.ts`

### 1.4: Update imports.gen.ts

Replace the old meltui tabs routing with coldlight tabs routing:

```typescript
// tabs — ColdLight-native
export { createTabsTransport as createTabs } from "$lib/design/api/adapters/coldlight/_internal/tabs/_transport/factory.js";
export type { TabsTransport as TabsInstance } from "$lib/design/api/adapters/coldlight/_internal/tabs/_transport/types.js";
export type { TabsTransportConfig as TabsConfig } from "$lib/design/api/adapters/coldlight/_internal/tabs/_transport/types.js";
export type { TabsActions } from "$lib/design/api/adapters/coldlight/_internal/tabs/_transport/types.js";
```

---

## Phase 2: Recipe & Blueprint

### 2.1: Tabs recipe

**File**: `recipes/tabs.recipe.ts`

Glass-void styling. Per-slot classes:
- `root`: Container, flex column
- `list`: Glass-void bar, flex row, border-b, gap-1, p-1
- `trigger`: Transparent button, text-white/50, data-[state=active]:text-white, data-[state=active]:bg-white/10, rounded, transition, focus-visible ring
- `content`: p-4, text-white/80, animate-in on visible

### 2.2: Tabs blueprint

**File**: `blueprints/tabs.blueprint.ts`

Default blueprint: `tabs.glass.void` recipe, standard surface defaults.

---

## Phase 3: Component Layer

### 3.1: Component types

**File**: `components/tabs/types.ts`

```typescript
interface TabsProps extends ComponentSurfaceProps, BaseProps {
  value?: string;           // bindable
  orientation?: "horizontal" | "vertical";
  activateOnFocus?: boolean;
  loop?: boolean;
  children?: Snippet;
}

interface TabsListProps extends BaseProps { children?: Snippet; }
interface TabsTriggerProps extends BaseProps { value: string; disabled?: boolean; children?: Snippet; }
interface TabsContentProps extends BaseProps { value: string; children?: Snippet; }
```

### 3.2: Component context

**File**: `components/tabs/context.ts`

```typescript
interface TabsComponentContext {
  readonly transport: TabsTransport & TabsActions;
  readonly classes: Record<string, string>;
}
```

### 3.3: Root — `Tabs.svelte`

Creates transport, resolves recipe, sets context. Renderless wrapper. Binds `value`.

### 3.4: Sub-components

| File | Slot | Element | Notes |
|---|---|---|---|
| `TabsList.svelte` | list | `<div>` | `{...transport.slots.list}` |
| `TabsTrigger.svelte` | trigger | `<button>` | `{...transport.getTrigger(value, disabled)}` |
| `TabsContent.svelte` | content | `<div>` | `{...transport.getContent(value)}` |

### 3.5: Barrel + registration

**File**: `components/tabs/index.ts` — Root, List, Trigger, Content
**Update**: `components/index.ts` — add `export * as Tabs` + side-effect imports

---

## Phase 4: Tests

### 4.1: Test harness

**File**: `components/tabs/Tabs.test.svelte`

3 tabs (Settings, Profile, Notifications), one disabled. All sub-components composed.

### 4.2: Test suite

**File**: `components/tabs/Tabs.test.ts`

**Categories**:

1. **Contract** — `data-kind="tabs"`, `data-slot` on all slots, `data-state` on trigger/content
2. **ARIA** — `role="tablist"` on list, `role="tab"` on triggers, `role="tabpanel"` on content, `aria-selected`, `aria-controls` → content ID, `aria-labelledby` → trigger ID
3. **Recipe classes** — glass-void styling applied to all slots
4. **Selection** — click trigger selects tab, value updates, content visibility changes, `data-state` transitions
5. **Keyboard** — ArrowRight/Left navigates, Home/End jump, disabled skipped, loop behavior, activateOnFocus
6. **Disabled** — disabled trigger not selectable, skipped in keyboard nav, `data-disabled` present
7. **Orientation** — horizontal uses ArrowLeft/Right, vertical uses ArrowUp/Down, `aria-orientation` reflects
8. **Roving tabindex** — selected trigger has tabindex=0, others have -1, Tab key exits tablist
9. **Transport integrity** — IDs generated, aria-controls matches content ID, aria-labelledby matches trigger ID

---

## Phase 5: Verification

- [ ] `pnpm svelte-check` — zero type errors
- [ ] `pnpm vitest run` — all tabs tests pass (plus existing dialog/combobox tests)
- [ ] No `@melt-ui/svelte` imports in tabs component files
- [ ] Tabs taxonomy contract still valid
- [ ] `components/index.ts` exports Tabs

---

## Files Changed

### New Files
```
api/adapters/coldlight/_internal/tabs/_transport/types.ts
api/adapters/coldlight/_internal/tabs/_transport/factory.ts
api/adapters/coldlight/_internal/tabs/_transport/index.ts
api/adapters/coldlight/_internal/tabs/index.ts
recipes/tabs.recipe.ts
blueprints/tabs.blueprint.ts
components/tabs/types.ts
components/tabs/context.ts
components/tabs/Tabs.svelte
components/tabs/TabsList.svelte
components/tabs/TabsTrigger.svelte
components/tabs/TabsContent.svelte
components/tabs/index.ts
components/tabs/Tabs.test.svelte
components/tabs/Tabs.test.ts
```

### Modified Files
```
taxonomy/.generated/imports.gen.ts  — swap meltui → coldlight for tabs
components/index.ts                — add Tabs export + side-effect imports
```

### Cleanup
```
api/adapters/meltui/_internal/tabs/ — mark as deprecated (old store API, no longer used by component layer)
```
