# SPRINT-04: Simple Atoms

> **Status**: READY FOR EXECUTION
> **Scope**: 5 primitives — label, badge, input, textarea, toggle
> **Depends On**: Sprint 03 complete (all Sprint 01 + 02 primitives at gold standard)
> **Verification**: Run `/cl-primitive-verify` on each kind after completion

---

## Current State (Audit: 2026-02-01)

| # | Primitive | Taxonomy | Primitives | Barrel (Tax) | Barrel (Prim) | Status |
|---|-----------|----------|------------|--------------|---------------|--------|
| 1 | label     | EXISTS (no JSDoc) | MISSING | MISSING | MISSING | **INCOMPLETE** |
| 2 | badge     | MISSING  | MISSING    | MISSING      | MISSING       | **NEW** |
| 3 | input     | MISSING  | MISSING    | MISSING      | MISSING       | **NEW** |
| 4 | textarea  | MISSING  | MISSING    | MISSING      | MISSING       | **NEW** |
| 5 | toggle    | MISSING  | MISSING    | MISSING      | MISSING       | **NEW** |

**After this sprint**: 19 of 41 total (14 existing + 5 new)

---

## File Inventory

| Primitive | Operation | Files | Count |
|-----------|-----------|-------|-------|
| label     | EDIT taxonomy JSDoc | taxonomy/{types,contract,index}.ts | 3 |
| label     | CREATE primitive | primitives/{types.ts, Label.svelte, index.ts} | 3 |
| badge     | CREATE taxonomy | taxonomy/{types,contract,index}.ts | 3 |
| badge     | CREATE primitive | primitives/{types.ts, Badge.svelte, index.ts} | 3 |
| input     | CREATE taxonomy | taxonomy/{types,contract,index}.ts | 3 |
| input     | CREATE primitive | primitives/{types.ts, Input.svelte, index.ts} | 3 |
| textarea  | CREATE taxonomy | taxonomy/{types,contract,index}.ts | 3 |
| textarea  | CREATE primitive | primitives/{types.ts, Textarea.svelte, index.ts} | 3 |
| toggle    | CREATE taxonomy | taxonomy/{types,contract,index}.ts | 3 |
| toggle    | CREATE primitive | primitives/{types.ts, Toggle.svelte, index.ts} | 3 |
| (barrel)  | EDIT | taxonomy/kinds/primitives/index.ts | 1 |
| (barrel)  | EDIT | primitives/index.ts | 1 |
| **TOTAL** | | | **32** |

All paths relative to `interfaces/desktop/src/lib/design/`.

---

## PRIMITIVE 1: label

**ariaStateProvider**: `"coldlight"` — native `<label>` handles semantics.
**Parity**: 2-folder (taxonomy + primitive)
**Compound**: No (simple, no context needed)

### 1.1 Taxonomy types.ts — EDIT (add gold standard JSDoc)

File: `taxonomy/kinds/primitives/label/types.ts`
Status: EXISTS but lacks @file header, section separators, JSDoc comments.

- [ ] Add `@file Label Taxonomy Types` header block
- [ ] Add `@description`: "Type vocabulary for the label primitive"
- [ ] Add `kind: "label"` and `ariaStateProvider: "coldlight"` in header
- [ ] Add section separator: `// ─── SLOT TYPES ───`
- [ ] Add JSDoc: `/** All slot names for the label primitive */` before slots array
- [ ] Add JSDoc: `/** Union of label slot names */` before slot type
- [ ] Add section separator: `// ─── STATE TYPES ───`
- [ ] Add JSDoc: `/** All state tokens applicable to the label primitive */` before state array
- [ ] Add JSDoc: `/** Union of label state tokens */` before state type
- [ ] Add section separator: `// ─── SLOT STATE MAP ───`
- [ ] Add JSDoc: `/** Per-slot allowed states for label */` before slot states

Existing content (unchanged): `labelSlots = ["root"]`, states = `["focused", "focus-visible", "hover", "active", "disabled"]`

### 1.2 Taxonomy contract.ts — EDIT (add gold standard JSDoc)

File: `taxonomy/kinds/primitives/label/contract.ts`

- [ ] Add `@file Label Taxonomy Contract` header block
- [ ] Add `@description`: "ColdLight SSOT contract for the label primitive"
- [ ] Add `ariaStateProvider: "coldlight"` and `2-folder parity` in header
- [ ] Add section separator: `// ─── CONTRACT ───`
- [ ] Add JSDoc: `/** Label primitive contract — ColdLight SSOT */` before export

Contract fields (already exist, verified correct):
- kind: `"label"`, ariaStateProvider: `"coldlight"`
- slots: `{ required: ["root"], optional: [], forbidden: [] }`
- states: `{ shared: ["focused", "focus-visible", "hover", "active", "disabled"], specific: [] }`
- slotActions: `{ root: [] }`
- aria: `{ role: "none", requiredAttrs: [], optionalAttrs: [] }`
- keyboard: `[]`

### 1.3 Taxonomy index.ts — EDIT (add gold standard JSDoc)

File: `taxonomy/kinds/primitives/label/index.ts`

- [ ] Add `@file Label Taxonomy Barrel`
- [ ] Add `@description`: "Re-exports label types + contract. Zero logic."

Existing exports: labelSlots, labelStateTokens, labelSlotStates, LabelSlot, LabelState, contract

### 1.4 Primitive types.ts — CREATE

File: `primitives/label/types.ts`

```typescript
/**
 * @file Label Primitive Types
 * @description Structural type declarations for the label primitive.
 * Aligned to taxonomy contract: kind="label"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <label> handles semantics.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Label root — structural shell for form label */
export interface LabelProps extends OmitStyle<HTMLLabelElement>, BaseProps {
	children?: Snippet;
}
```

### 1.5 Label.svelte — CREATE

File: `primitives/label/Label.svelte`

```svelte
<!--
	@component Label
	@description Structural shell for label primitive.
	Contract: kind="label", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { LabelProps } from "./types.js";

	let { children, class: className, ...rest }: LabelProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Label");
</script>

<label
	{...rest}
	data-kind="label"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</label>
```

### 1.6 Primitive index.ts — CREATE

File: `primitives/label/index.ts`

```typescript
/**
 * @file Label Primitive Barrel
 */
export { default as Label } from "./Label.svelte";
export type { LabelProps } from "./types.js";
```

---

## PRIMITIVE 2: badge

**ariaStateProvider**: `"coldlight"` — decorative element, minimal ARIA.
**Parity**: 2-folder (taxonomy + primitive)
**Compound**: No

### 2.1 Taxonomy types.ts — CREATE

File: `taxonomy/kinds/primitives/badge/types.ts`

Slots: `["root"]`
States: `["hover", "active"]`
Slot states: `{ root: ["hover", "active"] }`

```typescript
/**
 * @file Badge Taxonomy Types
 * @description Type vocabulary for the badge primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "badge"
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the badge primitive */
export const badgeSlots = ["root"] as const;

/** Union of badge slot names */
export type BadgeSlot = (typeof badgeSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the badge primitive */
export const badgeStateTokens = [
	"hover",
	"active",
] as const satisfies readonly StateToken[];

/** Union of badge state tokens */
export type BadgeState = (typeof badgeStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for badge */
export const badgeSlotStates = {
	root: ["hover", "active"],
} as const satisfies SlotStateMap<BadgeSlot, BadgeState>;
```

### 2.2 Taxonomy contract.ts — CREATE

File: `taxonomy/kinds/primitives/badge/contract.ts`

```typescript
/**
 * @file Badge Taxonomy Contract
 * @description ColdLight SSOT contract for the badge primitive.
 *
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { badgeSlotStates, type BadgeSlot, type BadgeState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Badge primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"badge", BadgeSlot, BadgeState> = {
	kind: "badge",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: { shared: ["hover", "active"], specific: [] },
	slotStates: badgeSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},
	keyboard: [],
};
```

### 2.3 Taxonomy index.ts — CREATE

File: `taxonomy/kinds/primitives/badge/index.ts`

```typescript
/**
 * @file Badge Taxonomy Barrel
 * @description Re-exports badge types + contract. Zero logic.
 */
export {
	badgeSlots,
	badgeStateTokens,
	badgeSlotStates,
	type BadgeSlot,
	type BadgeState,
} from "./types.js";
export { contract } from "./contract.js";
```

### 2.4 Primitive types.ts — CREATE

File: `primitives/badge/types.ts`

```typescript
/**
 * @file Badge Primitive Types
 * @description Structural type declarations for the badge primitive.
 * Aligned to taxonomy contract: kind="badge"
 * Slots: root
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Badge root — inline status indicator */
export interface BadgeProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
```

### 2.5 Badge.svelte — CREATE

File: `primitives/badge/Badge.svelte`

```svelte
<!--
	@component Badge
	@description Structural shell for badge primitive.
	Contract: kind="badge", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { BadgeProps } from "./types.js";

	let { children, class: className, ...rest }: BadgeProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Badge");
</script>

<span
	{...rest}
	data-kind="badge"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</span>
```

### 2.6 Primitive index.ts — CREATE

File: `primitives/badge/index.ts`

```typescript
/**
 * @file Badge Primitive Barrel
 */
export { default as Badge } from "./Badge.svelte";
export type { BadgeProps } from "./types.js";
```

---

## PRIMITIVE 3: input

**ariaStateProvider**: `"coldlight"` — native `<input>` handles semantics.
**Parity**: 2-folder (taxonomy + primitive)
**Compound**: No
**SELF-CLOSING**: `<input>` has no children — NO Snippet, NO `{@render children?.()}`

### 3.1 Taxonomy types.ts — CREATE

File: `taxonomy/kinds/primitives/input/types.ts`

Slots: `["root"]`
States: `["focused", "focus-visible", "hover", "active", "disabled", "readonly", "invalid", "valid", "required"]`
Slot states: `{ root: all states }`

```typescript
/**
 * @file Input Taxonomy Types
 * @description Type vocabulary for the input primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "input"
 * ariaStateProvider: "coldlight" — native <input> handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the input primitive */
export const inputSlots = ["root"] as const;

/** Union of input slot names */
export type InputSlot = (typeof inputSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the input primitive */
export const inputStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"readonly",
	"invalid",
	"valid",
	"required",
] as const satisfies readonly StateToken[];

/** Union of input state tokens */
export type InputState = (typeof inputStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for input */
export const inputSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "readonly", "invalid", "valid", "required"],
} as const satisfies SlotStateMap<InputSlot, InputState>;
```

### 3.2 Taxonomy contract.ts — CREATE

File: `taxonomy/kinds/primitives/input/contract.ts`

```typescript
/**
 * @file Input Taxonomy Contract
 * @description ColdLight SSOT contract for the input primitive.
 *
 * ariaStateProvider: "coldlight" — native <input> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { inputSlotStates, type InputSlot, type InputState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Input primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"input", InputSlot, InputState> = {
	kind: "input",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["readonly", "invalid", "valid", "required"],
	},
	slotStates: inputSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "textbox",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-describedby",
			"aria-invalid",
			"aria-required",
			"aria-disabled",
			"aria-placeholder",
			"aria-readonly",
		],
	},
	keyboard: [],
};
```

### 3.3 Taxonomy index.ts — CREATE

File: `taxonomy/kinds/primitives/input/index.ts`

```typescript
/**
 * @file Input Taxonomy Barrel
 * @description Re-exports input types + contract. Zero logic.
 */
export {
	inputSlots,
	inputStateTokens,
	inputSlotStates,
	type InputSlot,
	type InputState,
} from "./types.js";
export { contract } from "./contract.js";
```

### 3.4 Primitive types.ts — CREATE

File: `primitives/input/types.ts`

**IMPORTANT**: `<input>` is self-closing. NO `children?: Snippet`. NO `import type { Snippet }`.

```typescript
/**
 * @file Input Primitive Types
 * @description Structural type declarations for the input primitive.
 * Aligned to taxonomy contract: kind="input"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <input> handles semantics.
 */

import type { OmitStyle, BaseProps } from "../types.js";

/** Input root — structural shell for text input (self-closing, no children) */
export interface InputProps extends OmitStyle<HTMLInputElement>, BaseProps {}
```

### 3.5 Input.svelte — CREATE

File: `primitives/input/Input.svelte`

**SELF-CLOSING**: No `{@render children?.()}`. No `children` in destructure.

```svelte
<!--
	@component Input
	@description Structural shell for input primitive. Self-closing element.
	Contract: kind="input", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { InputProps } from "./types.js";

	let { class: className, ...rest }: InputProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Input");
</script>

<input
	{...rest}
	data-kind="input"
	data-slot="root"
	class={cn(className)}
/>
```

### 3.6 Primitive index.ts — CREATE

File: `primitives/input/index.ts`

```typescript
/**
 * @file Input Primitive Barrel
 */
export { default as Input } from "./Input.svelte";
export type { InputProps } from "./types.js";
```

---

## PRIMITIVE 4: textarea

**ariaStateProvider**: `"coldlight"` — native `<textarea>` handles semantics.
**Parity**: 2-folder (taxonomy + primitive)
**Compound**: No
**NOTE**: `<textarea>` content model is text, not elements. NO Snippet children — value comes from component layer binding.

### 4.1 Taxonomy types.ts — CREATE

File: `taxonomy/kinds/primitives/textarea/types.ts`

Slots: `["root"]`
States: same as input — `["focused", "focus-visible", "hover", "active", "disabled", "readonly", "invalid", "valid", "required"]`
Slot states: `{ root: all states }`

```typescript
/**
 * @file Textarea Taxonomy Types
 * @description Type vocabulary for the textarea primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "textarea"
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the textarea primitive */
export const textareaSlots = ["root"] as const;

/** Union of textarea slot names */
export type TextareaSlot = (typeof textareaSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the textarea primitive */
export const textareaStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"readonly",
	"invalid",
	"valid",
	"required",
] as const satisfies readonly StateToken[];

/** Union of textarea state tokens */
export type TextareaState = (typeof textareaStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for textarea */
export const textareaSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "readonly", "invalid", "valid", "required"],
} as const satisfies SlotStateMap<TextareaSlot, TextareaState>;
```

### 4.2 Taxonomy contract.ts — CREATE

File: `taxonomy/kinds/primitives/textarea/contract.ts`

```typescript
/**
 * @file Textarea Taxonomy Contract
 * @description ColdLight SSOT contract for the textarea primitive.
 *
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { textareaSlotStates, type TextareaSlot, type TextareaState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Textarea primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"textarea", TextareaSlot, TextareaState> = {
	kind: "textarea",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["readonly", "invalid", "valid", "required"],
	},
	slotStates: textareaSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "textbox",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-describedby",
			"aria-invalid",
			"aria-required",
			"aria-disabled",
			"aria-placeholder",
			"aria-readonly",
			"aria-multiline",
		],
	},
	keyboard: [],
};
```

### 4.3 Taxonomy index.ts — CREATE

File: `taxonomy/kinds/primitives/textarea/index.ts`

```typescript
/**
 * @file Textarea Taxonomy Barrel
 * @description Re-exports textarea types + contract. Zero logic.
 */
export {
	textareaSlots,
	textareaStateTokens,
	textareaSlotStates,
	type TextareaSlot,
	type TextareaState,
} from "./types.js";
export { contract } from "./contract.js";
```

### 4.4 Primitive types.ts — CREATE

File: `primitives/textarea/types.ts`

**NOTE**: `<textarea>` content model is text. NO `children?: Snippet`. NO `import type { Snippet }`.

```typescript
/**
 * @file Textarea Primitive Types
 * @description Structural type declarations for the textarea primitive.
 * Aligned to taxonomy contract: kind="textarea"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 */

import type { OmitStyle, BaseProps } from "../types.js";

/** Textarea root — structural shell for multiline text input (no Snippet children) */
export interface TextareaProps extends OmitStyle<HTMLTextAreaElement>, BaseProps {}
```

### 4.5 Textarea.svelte — CREATE

File: `primitives/textarea/Textarea.svelte`

**NOTE**: `<textarea>` renders empty. No Snippet children. Value binding is component layer concern.

```svelte
<!--
	@component Textarea
	@description Structural shell for textarea primitive. Text content model, no Snippet children.
	Contract: kind="textarea", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { TextareaProps } from "./types.js";

	let { class: className, ...rest }: TextareaProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Textarea");
</script>

<textarea
	{...rest}
	data-kind="textarea"
	data-slot="root"
	class={cn(className)}
></textarea>
```

### 4.6 Primitive index.ts — CREATE

File: `primitives/textarea/index.ts`

```typescript
/**
 * @file Textarea Primitive Barrel
 */
export { default as Textarea } from "./Textarea.svelte";
export type { TextareaProps } from "./types.js";
```

---

## PRIMITIVE 5: toggle

**ariaStateProvider**: `"coldlight"` — native `<button>` + aria-pressed at component layer.
**Parity**: 2-folder (taxonomy + primitive)
**Compound**: No

### 5.1 Taxonomy types.ts — CREATE

File: `taxonomy/kinds/primitives/toggle/types.ts`

Slots: `["root"]`
States: `["pressed", "focused", "focus-visible", "hover", "active", "disabled"]`
Slot states: `{ root: all states }`

```typescript
/**
 * @file Toggle Taxonomy Types
 * @description Type vocabulary for the toggle primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "toggle"
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the toggle primitive */
export const toggleSlots = ["root"] as const;

/** Union of toggle slot names */
export type ToggleSlot = (typeof toggleSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the toggle primitive */
export const toggleStateTokens = [
	"pressed",
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of toggle state tokens */
export type ToggleState = (typeof toggleStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for toggle */
export const toggleSlotStates = {
	root: ["pressed", "focused", "focus-visible", "hover", "active", "disabled"],
} as const satisfies SlotStateMap<ToggleSlot, ToggleState>;
```

### 5.2 Taxonomy contract.ts — CREATE

File: `taxonomy/kinds/primitives/toggle/contract.ts`

```typescript
/**
 * @file Toggle Taxonomy Contract
 * @description ColdLight SSOT contract for the toggle primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { toggleSlotStates, type ToggleSlot, type ToggleState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Toggle primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"toggle", ToggleSlot, ToggleState> = {
	kind: "toggle",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed"],
	},
	slotStates: toggleSlotStates,
	slotActions: { root: ["toggle"] },
	aria: {
		role: "button",
		requiredAttrs: ["aria-pressed"],
		optionalAttrs: ["aria-label", "aria-disabled"],
	},
	keyboard: ["Enter", "Space"],
};
```

### 5.3 Taxonomy index.ts — CREATE

File: `taxonomy/kinds/primitives/toggle/index.ts`

```typescript
/**
 * @file Toggle Taxonomy Barrel
 * @description Re-exports toggle types + contract. Zero logic.
 */
export {
	toggleSlots,
	toggleStateTokens,
	toggleSlotStates,
	type ToggleSlot,
	type ToggleState,
} from "./types.js";
export { contract } from "./contract.js";
```

### 5.4 Primitive types.ts — CREATE

File: `primitives/toggle/types.ts`

```typescript
/**
 * @file Toggle Primitive Types
 * @description Structural type declarations for the toggle primitive.
 * Aligned to taxonomy contract: kind="toggle"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Toggle root — pressable button with on/off state */
export interface ToggleProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}
```

### 5.5 Toggle.svelte — CREATE

File: `primitives/toggle/Toggle.svelte`

```svelte
<!--
	@component Toggle
	@description Structural shell for toggle primitive.
	Contract: kind="toggle", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ToggleProps } from "./types.js";

	let { children, class: className, ...rest }: ToggleProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Toggle");
</script>

<button
	{...rest}
	data-kind="toggle"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</button>
```

### 5.6 Primitive index.ts — CREATE

File: `primitives/toggle/index.ts`

```typescript
/**
 * @file Toggle Primitive Barrel
 */
export { default as Toggle } from "./Toggle.svelte";
export type { ToggleProps } from "./types.js";
```

---

## BARREL REGISTRATION

### taxonomy/kinds/primitives/index.ts — APPEND

Add after the Toolbar block:

```typescript
// Label (ColdLight)
export {
	contract as labelContract,
	labelSlots,
	labelStateTokens,
	labelSlotStates,
	type LabelSlot,
	type LabelState,
} from "./label/index.js";

// Badge (ColdLight)
export {
	contract as badgeContract,
	badgeSlots,
	badgeStateTokens,
	badgeSlotStates,
	type BadgeSlot,
	type BadgeState,
} from "./badge/index.js";

// Input (ColdLight)
export {
	contract as inputContract,
	inputSlots,
	inputStateTokens,
	inputSlotStates,
	type InputSlot,
	type InputState,
} from "./input/index.js";

// Textarea (ColdLight)
export {
	contract as textareaContract,
	textareaSlots,
	textareaStateTokens,
	textareaSlotStates,
	type TextareaSlot,
	type TextareaState,
} from "./textarea/index.js";

// Toggle (ColdLight)
export {
	contract as toggleContract,
	toggleSlots,
	toggleStateTokens,
	toggleSlotStates,
	type ToggleSlot,
	type ToggleState,
} from "./toggle/index.js";
```

### primitives/index.ts — APPEND

Add after the toolbar line in PRIMITIVES section:

```typescript
export * from "./label/index.js";
export * from "./badge/index.js";
export * from "./input/index.js";
export * from "./textarea/index.js";
export * from "./toggle/index.js";
```

---

## GATE CHECK

After all files are created/edited:

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] 0 errors
- [ ] No new warnings in primitives/ or taxonomy/ files

---

## VERIFICATION

Run `/cl-primitive-verify` on each:

- [ ] `/cl-primitive-verify label` → GOLD STANDARD
- [ ] `/cl-primitive-verify badge` → GOLD STANDARD
- [ ] `/cl-primitive-verify input` → GOLD STANDARD
- [ ] `/cl-primitive-verify textarea` → GOLD STANDARD
- [ ] `/cl-primitive-verify toggle` → GOLD STANDARD

---

## INVARIANTS

1. **ZERO** `@melt-ui/svelte` imports in any file
2. **ZERO** `role=`, `aria-*=`, `id=` in any `.svelte` file
3. **ZERO** event handlers (`on:click`, `onclick`) in any `.svelte` file
4. **ZERO** `use:melt` directives
5. **ZERO** `any` or `unknown` types (except `rest as Record<string, unknown>` for stripStyleProp)
6. **ZERO** inline `style=` attributes
7. **ZERO** legacy Svelte stores (`$:`, `writable`, `readable`)
8. Every `.ts` import uses `.js` extension
9. Every taxonomy types.ts uses `as const satisfies` pattern
10. Every contract has ALL fields: kind, ariaStateProvider, slots, states, slotStates, slotActions, aria, keyboard

---

## REMAINING AFTER SPRINT 04

19 of 41 complete. 22 remaining for future sprints:

| Group | Primitives | Notes |
|-------|-----------|-------|
| Simple structure | skeleton, alert, progress, avatar, card | coldlight, few slots |
| Navigation | navigation-menu, breadcrumb, pagination | coldlight/meltui, compound |
| Form controls | checkbox, switch, radio-group, slider | meltui, compound |
| Compound controls | toggle-group, combobox, command, pin-input | meltui, compound |
| Menus | dropdown-menu, context-menu, menubar | meltui, many slots |
| Date/Time | calendar, date-picker, date-field, time-field | meltui, complex |
| Utility | aspect-ratio | util, no taxonomy |
