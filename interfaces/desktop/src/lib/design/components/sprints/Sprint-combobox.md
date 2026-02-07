# Sprint: Combobox Gold Standard — MeltUI dsAdapter Pattern

> **Scope**: `interfaces/desktop/src/lib/design/{api/adapters/meltui,recipes,blueprints,components}/combobox`
> **Depends On**: Dialog gold standard (complete), Combobox taxonomy (complete), Combobox primitive (complete), `melt` v0.44.0
> **Goal**: Establish the gold standard for MeltUI as dsAdapter using Combobox — the most complex MeltUI-backed primitive.

---

## Key Discovery: `melt` v0.44.0

The package is `melt` (NOT `@melt-ui/svelte`). Svelte 5 runes-native rewrite.

**Critical**: `melt` v0.44.0 uses the **same spread-attrs pattern** as ColdLight-native dialog:
- `new Combobox(props)` → class instance with reactive getters
- `combobox.input` → returns plain object, spread with `{...combobox.input}`
- `combobox.content` → returns plain object with `role="listbox"`, `popover="manual"`, etc.
- `combobox.getOption(value, label?)` → per-item attr factory
- NO stores, NO `melt` action — just spread

**Implication**: The old `meltui/_internal/_transport/action.ts` (imports `@melt-ui/svelte`) is dead code. The old `SlotStore`-based TransportAdapter is obsolete. The new `melt` adapter uses `SlotAttrs` (spread-ready objects) — same as ColdLight-native.

---

## Decisions

1. **Adapter lives under `api/adapters/meltui/`** — `melt` is the successor to `@melt-ui/svelte`, same project rebranded.
2. **Uses ColdLight TransportAdapter type** — Since `melt` v0.44 returns spread-ready objects, import `TransportAdapter<TSlot, TStates>` and `SlotAttrs` from `coldlight/_internal/_transport/types.ts`. Both adapters share the same interface shape now.
3. **ComboboxActions extends beyond TransportAdapter** — `getOption(value, label?)`, `isSelected(value)`, `select(value)` are methods beyond the static slots/states pattern. Exposed as a separate interface (like `DialogAttachments`).
4. **Generic over `T`** — Combobox is generic: `ComboboxTransport<T>`. Items can be strings, objects, anything. The `value` prop type follows `T`.
5. **No attachment actions** — Unlike ColdLight-native dialog (which has `attachContent`, `attachTrigger`, `attachOverlay`), melt handles lifecycle internally via event handlers in spread attrs. Components just spread.
6. **Filtering is user-provided** — Melt tracks `inputValue`, user filters items in template with `{#each}`. The component doesn't own the item list.

---

## Architecture

### MeltUI Combobox Slots (from `melt` v0.44)

| Melt Getter | ColdLight Slot | ARIA | Element |
|---|---|---|---|
| `combobox.input` | `input` | `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-owns` | `<input>` |
| `combobox.trigger` | `trigger` | (button) | `<button>` |
| `combobox.content` | `content` | `role="listbox"`, `aria-expanded`, `aria-activedescendant` | `<div popover="manual">` |
| `combobox.label` | `label` | `for` attr → input id | `<label>` |
| `combobox.getOption(v,l)` | `item` (per-instance) | `role="option"`, `aria-selected`, `data-highlighted` | `<div>` |
| — | `group` | `role="group"` | `<div>` (layout only) |
| — | `empty` | — | `<div>` (layout only) |

### Transport Interface

```typescript
// Static slots (getters on melt Combobox)
type ComboboxTransport<T> = TransportAdapter<
  "input" | "trigger" | "content" | "label",
  ComboboxTransportStates<T>
>;

// Reactive states
interface ComboboxTransportStates<T> {
  open: boolean;           // get/set
  value: T | undefined;    // get/set (single mode)
  inputValue: string;      // get/set
  highlighted: T | null;   // get/set
}

// Actions beyond static slots
interface ComboboxActions<T> {
  getOption(value: T, label?: string): SlotAttrs;
  isSelected(value: T): boolean;
  select(value: T): void;
}
```

### Component API

```svelte
<Combobox.Root bind:value bind:open bind:inputValue>
  <Combobox.Label>Pick a fruit</Combobox.Label>
  <Combobox.Input placeholder="Search..." />
  <Combobox.Trigger>▼</Combobox.Trigger>
  <Combobox.Content>
    {#each filtered as item}
      <Combobox.Item value={item} label={item.name}>
        {item.name}
      </Combobox.Item>
    {/each}
    <Combobox.Empty>No results</Combobox.Empty>
  </Combobox.Content>
</Combobox.Root>
```

---

## Phase 1: MeltUI Combobox Adapter

### 1.1: Create combobox factory

- [x] **File**: `api/adapters/meltui/_internal/combobox/factory.ts`

Wraps `new Combobox()` from `melt` package. Single import point for the raw melt instance.

```typescript
import { Combobox, type ComboboxProps } from "melt/builders";

export type MeltComboboxInstance<T> = Combobox<T, false>;
export type MeltComboboxConfig<T> = ComboboxProps<T, false>;

export function createMeltCombobox<T>(config?: MeltComboboxConfig<T>): MeltComboboxInstance<T> {
	return new Combobox<T, false>(config);
}
```

### 1.2: Create combobox transport types

- [x] **File**: `api/adapters/meltui/_internal/combobox/_transport/types.ts`

```typescript
import type { SlotAttrs, TransportAdapter } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

export interface ComboboxTransportStates<T> {
	open: boolean;
	value: T | undefined;
	inputValue: string;
	highlighted: T | null;
}

export type ComboboxTransport<T> = TransportAdapter<
	"input" | "trigger" | "content" | "label",
	ComboboxTransportStates<T>
>;

export interface ComboboxActions<T> {
	getOption(value: T, label?: string): SlotAttrs;
	isSelected(value: T): boolean;
	select(value: T): void;
}

export interface ComboboxTransportConfig<T> {
	value?: T;
	onValueChange?: (value: T | undefined) => void;
	inputValue?: string;
	onInputValueChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	highlighted?: T | null;
	onHighlightChange?: (highlighted: T | null) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	sameWidth?: boolean;
	scrollAlignment?: "nearest" | "center" | null;
}
```

### 1.3: Create combobox transport factory

- [x] **File**: `api/adapters/meltui/_internal/combobox/_transport/factory.ts`

Creates typed transport from raw melt Combobox. Maps melt getters → ColdLight slot vocabulary.

```typescript
import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltCombobox } from "../factory.js";
import type { ComboboxTransport, ComboboxActions, ComboboxTransportConfig } from "./types.js";

export function createComboboxTransport<T>(
	config?: ComboboxTransportConfig<T>,
): ComboboxTransport<T> & ComboboxActions<T> {
	const combobox = createMeltCombobox<T>({
		value: config?.value,
		onValueChange: config?.onValueChange as never,
		inputValue: config?.inputValue,
		onInputValueChange: config?.onInputValueChange,
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		highlighted: config?.highlighted,
		onHighlightChange: config?.onHighlightChange,
		closeOnEscape: config?.closeOnEscape,
		closeOnOutsideClick: config?.closeOnOutsideClick,
		sameWidth: config?.sameWidth ?? true,
		scrollAlignment: config?.scrollAlignment,
	});

	return {
		slots: {
			get input(): SlotAttrs { return combobox.input as unknown as SlotAttrs; },
			get trigger(): SlotAttrs { return combobox.trigger as unknown as SlotAttrs; },
			get content(): SlotAttrs { return combobox.content as unknown as SlotAttrs; },
			get label(): SlotAttrs { return combobox.label as unknown as SlotAttrs; },
		},
		states: {
			get open(): boolean { return combobox.open; },
			set open(v: boolean) { combobox.open = v; },
			get value(): T | undefined { return combobox.value as T | undefined; },
			set value(v: T | undefined) { combobox.value = v as never; },
			get inputValue(): string { return combobox.inputValue; },
			set inputValue(v: string) { combobox.inputValue = v; },
			get highlighted(): T | null { return combobox.highlighted; },
			set highlighted(v: T | null) { combobox.highlighted = v; },
		},
		getOption: (value: T, label?: string): SlotAttrs => combobox.getOption(value, label) as unknown as SlotAttrs,
		isSelected: (value: T): boolean => combobox.isSelected(value),
		select: (value: T): void => combobox.select(value),
	};
}
```

### 1.4: Create barrels + update imports.gen.ts

- [x] **File**: `api/adapters/meltui/_internal/combobox/_transport/index.ts`

```typescript
export type { ComboboxTransport, ComboboxActions, ComboboxTransportStates, ComboboxTransportConfig } from "./types.js";
export { createComboboxTransport } from "./factory.js";
```

- [x] **File**: `api/adapters/meltui/_internal/combobox/index.ts`

```typescript
export { createMeltCombobox, type MeltComboboxInstance, type MeltComboboxConfig } from "./factory.js";
export {
	createComboboxTransport,
	type ComboboxTransport,
	type ComboboxActions,
	type ComboboxTransportStates,
	type ComboboxTransportConfig,
} from "./_transport/index.js";
```

- [x] **File**: `taxonomy/.generated/imports.gen.ts` — add combobox cloak routing

```typescript
// combobox — meltui (melt v0.44+)
export { createComboboxTransport as createCombobox } from "$lib/design/api/adapters/meltui/_internal/combobox/_transport/factory.js";
export type { ComboboxTransport as ComboboxInstance } from "$lib/design/api/adapters/meltui/_internal/combobox/_transport/types.js";
export type { ComboboxTransportConfig as ComboboxConfig } from "$lib/design/api/adapters/meltui/_internal/combobox/_transport/types.js";
export type { ComboboxActions } from "$lib/design/api/adapters/meltui/_internal/combobox/_transport/types.js";
```

---

## Phase 2: Recipe & Blueprint

### 2.1: Create combobox recipe

- [x] **File**: `recipes/combobox.recipe.ts`

Glass-void combobox with cyberpunk styling. Per-slot classes for input, trigger, content, item, empty, group, label.

```typescript
import { registerRecipe } from "./index.js";
import type { DsSurfaceProps } from "./types.js";
import { radiusClass } from "./utils.js";
import { cn } from "$lib/design/primitives/types.js";

registerRecipe({
	id: "combobox.glass.void",
	kind: "combobox",
	label: "Glass Void Combobox",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "teal",
		bevel: "soft",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		input: cn(
			"w-full bg-transparent px-3 py-2",
			"text-sm text-white placeholder:text-white/40",
			"border border-white/8",
			radiusClass(props.radius),
			"outline-none",
			"focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30",
			"transition-colors",
		),
		trigger: cn(
			"inline-flex items-center justify-center",
			"px-2 py-2",
			"text-white/50 hover:text-white",
			"transition-colors",
			"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
		),
		content: cn(
			"glass-void",
			radiusClass(props.radius),
			"border border-white/8",
			"p-1",
			"z-50 overflow-hidden",
			"data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
		),
		item: cn(
			"relative flex w-full cursor-pointer select-none items-center",
			radiusClass(props.radius === "lg" ? "md" : props.radius),
			"px-2 py-1.5 text-sm text-white/80",
			"outline-none transition-colors",
			"data-[highlighted]:bg-white/10 data-[highlighted]:text-white",
			"aria-[selected=true]:bg-teal-500/20 aria-[selected=true]:text-teal-300",
		),
		empty: cn(
			"py-6 text-center text-sm text-white/40",
		),
		group: cn(
			"overflow-hidden",
		),
		label: cn(
			"text-sm font-medium text-white/70",
			"mb-1.5",
		),
	}),
});
```

### 2.2: Create combobox blueprint

- [x] **File**: `blueprints/combobox.blueprint.ts`

Default blueprint referencing `combobox.glass.void` recipe.

```typescript
import { registerBlueprint } from "./index.js";

registerBlueprint({
	id: "combobox.default",
	kind: "combobox",
	label: "Default Combobox",
	defaultRecipe: "combobox.glass.void",
	defaultProps: {
		accent: "teal",
		surface: "glass",
		variant: "void",
		radius: "lg",
		depth: 2,
		glow: "teal",
		bevel: "soft",
	},
	slots: {
		input: { required: true },
		trigger: { required: false },
		content: { required: true },
		item: { required: false },
		group: { required: false },
		empty: { required: false },
		label: { required: false },
	},
});
```

---

## Phase 3: Component Layer

### 3.1: Create component types

- [x] **File**: `components/combobox/types.ts`

Prop interfaces for all sub-components. Root is generic over `T`.

```typescript
import type { Snippet } from "svelte";
import type { ComponentSurfaceProps } from "../types.js";
import type { OmitStyle, BaseProps } from "$lib/design/primitives/types.js";

export interface ComboboxProps<T> extends ComponentSurfaceProps, BaseProps {
	open?: boolean;
	value?: T;
	inputValue?: string;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	sameWidth?: boolean;
	children?: Snippet;
}

export interface ComboboxInputProps extends OmitStyle<HTMLInputElement>, BaseProps {
	placeholder?: string;
}

export interface ComboboxTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

export interface ComboboxContentProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxLabelProps extends OmitStyle<HTMLLabelElement>, BaseProps {
	children?: Snippet;
}

export interface ComboboxItemProps<T> extends BaseProps {
	value: T;
	label?: string;
	children?: Snippet;
	class?: string;
}

export interface ComboboxEmptyProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxGroupProps extends BaseProps {
	children?: Snippet;
	class?: string;
}
```

### 3.2: Create component context

- [x] **File**: `components/combobox/context.ts`

```typescript
import { getContext, setContext } from "svelte";
import type { ComboboxInstance, ComboboxActions } from "$lib/design/taxonomy/.generated/imports.gen.js";

const CTX_KEY = Symbol("coldlight:components:combobox");

export interface ComboboxComponentContext<T> {
	readonly transport: ComboboxInstance<T> & ComboboxActions<T>;
	readonly classes: Record<string, string>;
}

export function setComboboxComponentContext<T>(ctx: ComboboxComponentContext<T>): void {
	setContext(CTX_KEY, ctx);
}

export function getComboboxComponentContext<T>(): ComboboxComponentContext<T> {
	return getContext<ComboboxComponentContext<T>>(CTX_KEY);
}
```

### 3.3: Create Root — `Combobox.svelte`

- [x] **File**: `components/combobox/Combobox.svelte`

Creates transport, resolves recipe, sets context. Renderless. Binds `open`, `value`, `inputValue`.

```svelte
<script lang="ts" generics="T">
	import type { ComboboxProps } from "./types.js";
	import { setComboboxComponentContext } from "./context.js";
	import { createCombobox } from "$lib/design/taxonomy/.generated/imports.gen.js";
	import { getRecipe } from "$lib/design/recipes/index.js";
	import { getBlueprint } from "$lib/design/blueprints/index.js";
	import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

	let {
		open = $bindable(false),
		value = $bindable<T>(),
		inputValue = $bindable(""),
		closeOnEscape = true,
		closeOnOutsideClick = true,
		sameWidth = true,
		recipe: recipeId,
		accent, surface, variant, size, radius, depth, glow, bevel,
		children,
	}: ComboboxProps<T> = $props();

	const blueprint = getBlueprint("combobox.default");
	const defaults = blueprint?.defaultProps ?? {};

	const transport = createCombobox<T>({
		open,
		onOpenChange: (v: boolean) => { open = v; },
		value,
		onValueChange: (v: T | undefined) => { value = v; },
		inputValue,
		onInputValueChange: (v: string) => { inputValue = v; },
		closeOnEscape,
		closeOnOutsideClick,
		sameWidth,
	});

	$effect(() => { transport.states.open = open; });
	$effect(() => { transport.states.value = value; });
	$effect(() => { transport.states.inputValue = inputValue; });

	const resolvedRecipe = getRecipe(recipeId ?? blueprint?.defaultRecipe ?? "combobox.glass.void");

	const resolvedProps: DsSurfaceProps = {
		accent: accent ?? defaults.accent ?? "teal",
		surface: surface ?? defaults.surface ?? "glass",
		variant: variant ?? defaults.variant ?? "void",
		size: size ?? defaults.size ?? "md",
		radius: radius ?? defaults.radius ?? "lg",
		depth: depth ?? defaults.depth ?? 2,
		glow: glow ?? defaults.glow ?? "teal",
		bevel: bevel ?? defaults.bevel ?? "soft",
	};

	const classes = resolvedRecipe?.classes(resolvedProps) ?? {};

	setComboboxComponentContext({ transport, classes });
</script>

{@render children?.()}
```

### 3.4: Create sub-components

- [x] **File**: `components/combobox/ComboboxInput.svelte`

```svelte
<script lang="ts">
	import type { ComboboxInputProps } from "./types.js";
	import { getComboboxComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { class: className, ...rest }: ComboboxInputProps = $props();
	const { transport, classes } = getComboboxComponentContext();
</script>

<input
	{...transport.slots.input}
	{...rest}
	data-kind="combobox"
	data-slot="input"
	class={cn(classes.input, className)}
/>
```

- [x] **File**: `components/combobox/ComboboxTrigger.svelte`

```svelte
<script lang="ts">
	import type { ComboboxTriggerProps } from "./types.js";
	import { getComboboxComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: ComboboxTriggerProps = $props();
	const { transport, classes } = getComboboxComponentContext();
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	data-kind="combobox"
	data-slot="trigger"
	class={cn(classes.trigger, className)}
>
	{@render children?.()}
</button>
```

- [x] **File**: `components/combobox/ComboboxContent.svelte`

```svelte
<script lang="ts">
	import type { ComboboxContentProps } from "./types.js";
	import { getComboboxComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: ComboboxContentProps = $props();
	const { transport, classes } = getComboboxComponentContext();
</script>

<div
	{...transport.slots.content}
	{...rest}
	data-kind="combobox"
	data-slot="content"
	data-state={transport.states.open ? "open" : "closed"}
	class={cn(classes.content, className)}
>
	{@render children?.()}
</div>
```

- [x] **File**: `components/combobox/ComboboxLabel.svelte`

```svelte
<script lang="ts">
	import type { ComboboxLabelProps } from "./types.js";
	import { getComboboxComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: ComboboxLabelProps = $props();
	const { transport, classes } = getComboboxComponentContext();
</script>

<label
	{...transport.slots.label}
	{...rest}
	data-kind="combobox"
	data-slot="label"
	class={cn(classes.label, className)}
>
	{@render children?.()}
</label>
```

- [x] **File**: `components/combobox/ComboboxItem.svelte`

Uses `transport.getOption(value, label)` — per-item factory method, not a static slot.

```svelte
<script lang="ts" generics="T">
	import type { ComboboxItemProps } from "./types.js";
	import { getComboboxComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { value, label, children, class: className, ...rest }: ComboboxItemProps<T> = $props();
	const { transport, classes } = getComboboxComponentContext<T>();
</script>

<div
	{...transport.getOption(value, label)}
	{...rest}
	data-kind="combobox"
	data-slot="item"
	class={cn(classes.item, className)}
>
	{@render children?.()}
</div>
```

- [x] **File**: `components/combobox/ComboboxEmpty.svelte`

Layout only — no transport slot.

```svelte
<script lang="ts">
	import type { ComboboxEmptyProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getComboboxComponentContext } from "./context.js";

	let { children, class: className, ...rest }: ComboboxEmptyProps = $props();
	const { classes } = getComboboxComponentContext();
</script>

<div
	{...rest}
	data-kind="combobox"
	data-slot="empty"
	class={cn(classes.empty, className)}
>
	{@render children?.()}
</div>
```

- [x] **File**: `components/combobox/ComboboxGroup.svelte`

Layout only — no transport slot.

```svelte
<script lang="ts">
	import type { ComboboxGroupProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getComboboxComponentContext } from "./context.js";

	let { children, class: className, ...rest }: ComboboxGroupProps = $props();
	const { classes } = getComboboxComponentContext();
</script>

<div
	{...rest}
	role="group"
	data-kind="combobox"
	data-slot="group"
	class={cn(classes.group, className)}
>
	{@render children?.()}
</div>
```

### 3.5: Create compound barrel

- [x] **File**: `components/combobox/index.ts`

```typescript
export { default as Root } from "./Combobox.svelte";
export { default as Input } from "./ComboboxInput.svelte";
export { default as Trigger } from "./ComboboxTrigger.svelte";
export { default as Content } from "./ComboboxContent.svelte";
export { default as Label } from "./ComboboxLabel.svelte";
export { default as Item } from "./ComboboxItem.svelte";
export { default as Empty } from "./ComboboxEmpty.svelte";
export { default as Group } from "./ComboboxGroup.svelte";
export type * from "./types.js";
```

### 3.6: Update component barrel

- [x] **File**: `components/index.ts` — add Combobox export

```typescript
// Side-effect imports: register recipes + blueprints
import "$lib/design/recipes/dialog.recipe.js";
import "$lib/design/blueprints/dialog.blueprint.js";
import "$lib/design/recipes/combobox.recipe.js";
import "$lib/design/blueprints/combobox.blueprint.js";

// Component exports
export * as Dialog from "./dialog/index.js";
export * as Combobox from "./combobox/index.js";
export type { ComponentSurfaceProps } from "./types.js";
```

---

## Phase 4: Tests

### 4.1: Create test harness

- [x] **File**: `components/combobox/Combobox.test.svelte`

Test wrapper with fruit items, filtering via inputValue. All sub-components composed.

```svelte
<script lang="ts">
	import * as Combobox from "./index.js";

	import "$lib/design/recipes/combobox.recipe.js";
	import "$lib/design/blueprints/combobox.blueprint.js";

	const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];

	interface Props {
		open?: boolean;
		value?: string;
		inputValue?: string;
		closeOnEscape?: boolean;
		closeOnOutsideClick?: boolean;
		"data-id"?: string;
	}

	let {
		open = $bindable(false),
		value = $bindable<string>(),
		inputValue = $bindable(""),
		closeOnEscape = true,
		closeOnOutsideClick = true,
		"data-id": dataId,
	}: Props = $props();

	const filtered = $derived(
		fruits.filter((f) => f.toLowerCase().includes(inputValue.toLowerCase())),
	);
</script>

<Combobox.Root bind:open bind:value bind:inputValue {closeOnEscape} {closeOnOutsideClick} data-id={dataId}>
	<Combobox.Label>Pick a fruit</Combobox.Label>
	<Combobox.Input placeholder="Search fruits..." />
	<Combobox.Trigger>▼</Combobox.Trigger>
	<Combobox.Content>
		{#each filtered as fruit}
			<Combobox.Item value={fruit} label={fruit}>
				{fruit}
			</Combobox.Item>
		{/each}
		{#if filtered.length === 0}
			<Combobox.Empty>No fruits found</Combobox.Empty>
		{/if}
	</Combobox.Content>
</Combobox.Root>
```

### 4.2: Create vitest browser test suite

- [x] **File**: `components/combobox/Combobox.test.ts`

**Test categories** (matching dialog gold standard):

- [x] 4.2a **Contract (data attributes)** — `data-kind="combobox"`, `data-slot` on all slots, `data-state` on content
- [x] 4.2b **ARIA** — `role="combobox"` on input, `role="listbox"` on content, `role="option"` on items, `aria-expanded`, `aria-controls`, `aria-selected`, `aria-activedescendant`
- [x] 4.2c **Popover API** — `popover="manual"` on content, content visible/hidden
- [x] 4.2d **Recipe classes** — glass-void on content, highlight classes on items
- [x] 4.2e **Open/close** — trigger click, input focus, Escape, closeOnEscape=false, outside click
- [x] 4.2f **Selection** — click item selects, value updates, aria-selected reflects
- [x] 4.2g **Keyboard** — ArrowDown/Up navigates, Enter selects highlighted, Escape closes, Home/End
- [x] 4.2h **Filtering** — inputValue updates on typing, items can be filtered, empty state shown
- [x] 4.2i **Highlighting** — data-highlighted on navigated item, aria-activedescendant updates
- [x] 4.2j **Transport integrity** — IDs generated, aria-controls points to content ID, input aria-owns

---

## Phase 5: Verification

- [x] 5.1 `pnpm svelte-check` — zero new type errors (3 pre-existing only)
- [x] 5.2 `pnpm vitest run` — 45/45 combobox tests pass
- [x] 5.3 Cloaking audit — no `melt` imports outside `api/adapters/meltui/_internal/`
- [x] 5.4 No `data-melt-*` attrs referenced in component files

### 5.5: Root Cause Fix — closeOnOutsideClick override

**File**: `api/adapters/meltui/_internal/combobox/_transport/factory.ts`

**Issue**: Melt's Combobox constructor sets a smart `closeOnOutsideClick` function that
recognizes trigger button clicks by DOM ID. Passing `closeOnOutsideClick: true` via props
overrides this function, causing the global `document.click` handler in the popover
attachment to treat trigger button clicks as "outside clicks" and immediately close the
combobox.

**Fix**: Only pass `closeOnOutsideClick` to melt when explicitly `false`. Otherwise, let
melt use its built-in smart function.

---

## Critical Patterns

**Spread-Only (No Attachment Actions)**:
```svelte
<!-- Dialog (ColdLight-native): spread + attach -->
<dialog {...transport.slots.content} use:transport.attachContent>

<!-- Combobox (MeltUI): spread only — melt handles lifecycle via event handlers -->
<div {...transport.slots.content} data-kind="combobox" data-slot="content">
```

Melt's spread attrs already contain `onclick`, `onkeydown`, `onfocus`, `onfocusout`, `ontoggle`, `oninput` handlers — all behavior wired through the spread.

**Per-Item Factory**:
```svelte
<!-- Dialog: static slot spread -->
<h2 {...transport.slots.title}>...</h2>

<!-- Combobox: dynamic per-item spread via factory method -->
<div {...transport.getOption(value, label)} data-kind="combobox" data-slot="item">
  {@render children?.()}
</div>
```

`getOption(value, label?)` returns a fresh attrs object per call, including the item's unique ID, `role="option"`, `aria-selected`, `data-highlighted`, `onclick`, `onmouseover`.
