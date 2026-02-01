---
name: cl-primitive-verify
description: Verify a ColdLight primitive meets ALL gold standard requirements
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Task, TodoWrite
argument-hint: "<primitive kind name, e.g. 'button', 'dialog', or 'all'>"
---

# ColdLight Primitive Verification

Verify primitive: $ARGUMENTS

## What This Skill Does

Runs a full compliance check against a ColdLight primitive to confirm it meets the gold standard established by button/dialog/tabs. Every primitive — all 40 + 1 utility — MUST pass this verification before being considered complete.

If `$ARGUMENTS` is "all", verify every primitive found in both taxonomy and primitives directories.

## Architecture Reminder

- **Primitives are structural shells.** Zero ARIA. Zero MeltUI. Zero behavior. Zero event handlers.
- **Taxonomy declares the contract.** Types, slots, states, what ARIA the COMPONENT layer will eventually implement.
- **Primitives bind the contract.** Typed props, data attributes, snippet children, class merging. That's it.
- **MeltUI is hidden behind the import cloak.** It never appears in a primitive file. Ever.
- **ARIA belongs in the component layer.** Contracts document what the component layer needs. Primitives don't set it.

## Verification Checklist

For each primitive kind, read every file and check ALL of the following. No exceptions. No partial passes.

### 1. TAXONOMY LAYER — `src/lib/design/taxonomy/kinds/primitives/{kind}/`

#### 1a. `types.ts` exists and contains:
- [ ] `@file` header: `@file {Kind} Taxonomy Types`
- [ ] `@description` with: "Type vocabulary for the {kind} primitive"
- [ ] Header includes: `kind: "{kind}"` and `ariaStateProvider: "{provider}"`
- [ ] Import: `import type { StateToken, SlotStateMap } from "../../../types.js";`
- [ ] Section separator: `// ─── SLOT TYPES ───` (77 `─` chars after title)
- [ ] `/** All slot names for the {kind} primitive */` before slots array
- [ ] Slots array: `export const {kind}Slots = [...] as const;`
- [ ] `/** Union of {kind} slot names */` before slot type
- [ ] Slot type: `export type {Kind}Slot = (typeof {kind}Slots)[number];`
- [ ] Section separator: `// ─── STATE TYPES ───`
- [ ] `/** All state tokens applicable to the {kind} primitive */` before state array
- [ ] State array: `as const satisfies readonly StateToken[];`
- [ ] `/** Union of {kind} state tokens */` before state type
- [ ] Section separator: `// ─── SLOT STATE MAP ───`
- [ ] `/** Per-slot allowed states for {kind} */` before slot states
- [ ] Slot states: `as const satisfies SlotStateMap<{Kind}Slot, {Kind}State>;`

#### 1b. `contract.ts` exists and contains:
- [ ] `@file` header: `@file {Kind} Taxonomy Contract`
- [ ] `@description`: "ColdLight SSOT contract for the {kind} primitive"
- [ ] Header includes: `ariaStateProvider:` and parity mode (2-folder or 3-folder)
- [ ] Import: `import type { PrimitiveContract } from "../../../types.js";`
- [ ] Import: types from `"./types.js"` (slotStates, Slot type, State type)
- [ ] Section separator: `// ─── CONTRACT ───`
- [ ] `/** {Kind} primitive contract — ColdLight SSOT */` before contract
- [ ] Contract export: `export const contract: PrimitiveContract<"{kind}", {Kind}Slot, {Kind}State>`
- [ ] All contract fields present: kind, ariaStateProvider, slots, states, slotStates, slotActions, aria, keyboard

#### 1c. `index.ts` exists and contains:
- [ ] `@file` header: `@file {Kind} Taxonomy Barrel`
- [ ] `@description`: "Re-exports {kind} types + contract. Zero logic."
- [ ] Named exports for: slots array, stateTokens array, slotStates, Slot type, State type
- [ ] Named export: `export { contract } from "./contract.js";`
- [ ] Uses `.js` extensions on all imports

### 2. PRIMITIVES LAYER — `src/lib/design/primitives/{kind}/`

#### 2a. `types.ts` exists and contains:
- [ ] `@file` header: `@file {Kind} Primitive Types`
- [ ] `@description`: "Structural type declarations for the {kind} primitive"
- [ ] Header includes: `Aligned to taxonomy contract: kind="{kind}"`
- [ ] Header includes: `Slots:` with comma-separated slot list
- [ ] Header includes: `ariaStateProvider: "{provider}"`
- [ ] Import: `import type { Snippet } from "svelte";`
- [ ] Import: `import type { OmitStyle, BaseProps } from "../types.js";`
- [ ] Every interface has a one-line `/** description */` JSDoc
- [ ] Root/renderless props: `extends BaseProps` (no OmitStyle — no DOM element)
- [ ] DOM-rendering props: `extends OmitStyle<HTML{Element}Element>, BaseProps`
- [ ] DOM-rendering props include: `children?: Snippet;`
- [ ] Self-closing elements (input, img): NO children prop
- [ ] Zero ARIA attributes in any interface
- [ ] Zero MeltUI types in any interface

#### 2b. Svelte components exist and each contains:
- [ ] HTML comment: `@component {Name}`, `@description`, `Contract: kind="{kind}", slot="{slot}"`
- [ ] Script: `let { className, children, ...rest }: {Kind}{Slot}Props = $props();`
- [ ] Script: `if (import.meta.env.DEV) stripStyleProp(rest, '{Kind}.{Slot}');`
- [ ] Markup: `data-kind="{kind}"`
- [ ] Markup: `data-slot="{slot}"`
- [ ] Markup: `class={cn(className)}`
- [ ] Markup: `{...rest}` spread
- [ ] Markup: `{@render children?.()}` (unless self-closing element)
- [ ] Zero: `role=`, `aria-*=`, `id=`, `use:melt`, event handlers (`on:click`, `onclick`)
- [ ] Zero: `@melt-ui/svelte` imports
- [ ] Renderless roots (no DOM): only `{@render children?.()}`, no HTML element

#### 2c. `context.ts` (compound primitives only) exists and contains:
- [ ] `@file` header: `@file {Kind} Primitive Context`
- [ ] `@description`: "Svelte context for compound {kind} coordination"
- [ ] Description includes: "Reactive via getter when set from Svelte component with $state"
- [ ] Symbol-keyed: `const CTX_KEY = Symbol("coldlight:{kind}");`
- [ ] `/** {Kind} context shape */` before type
- [ ] Type: `export type {Kind}Context = { readonly ...; };`
- [ ] `/** Set {kind} context ... */` before set function
- [ ] `/** Get {kind} context ... */` before get function
- [ ] Uses `getContext`/`setContext` from `"svelte"`
- [ ] Zero: MeltUI imports, ARIA attributes, behavior logic

#### 2d. `index.ts` exists and contains:
- [ ] `@file` header: `@file {Kind} Primitive Barrel`
- [ ] Default exports for all Svelte components: `export { default as {Kind}{Slot} } from "./{Kind}{Slot}.svelte";`
- [ ] Type exports: `export type { ...Props } from "./types.js";`
- [ ] Context exports (if compound): `export { set{Kind}Context, get{Kind}Context, type {Kind}Context } from "./context.js";`
- [ ] Uses `.js` extensions on all imports

### 3. BARREL REGISTRATION

- [ ] `taxonomy/kinds/primitives/index.ts` has export block for this kind
- [ ] `primitives/index.ts` has `export * from "./{kind}/index.js";`

### 4. ZERO TOLERANCE

- [ ] ZERO `@melt-ui/svelte` imports anywhere in primitives/{kind}/
- [ ] ZERO `use:melt` directives
- [ ] ZERO `role=` attributes in Svelte files
- [ ] ZERO `aria-*` attributes in Svelte files
- [ ] ZERO `id=` attributes in Svelte files
- [ ] ZERO inline `style=` (enforced by OmitStyle + stripStyleProp)
- [ ] ZERO event handlers (`on:click`, `onclick`, etc.) in Svelte files
- [ ] ZERO `any` or `unknown` types
- [ ] ZERO legacy Svelte stores (`$:`, `writable`, `readable`)

## Execution

1. Read ALL files in both taxonomy and primitives directories for the kind
2. Check EVERY item in the checklist above — read the actual file content, do not assume
3. Report: PASS or FAIL per section, with specific failures listed
4. If verifying "all": produce a summary table showing pass/fail per kind

## Output Format

```
VERIFY: {kind}
  Taxonomy types.ts:    [PASS/FAIL] {details if fail}
  Taxonomy contract.ts: [PASS/FAIL] {details if fail}
  Taxonomy index.ts:    [PASS/FAIL] {details if fail}
  Primitive types.ts:   [PASS/FAIL] {details if fail}
  Primitive components:  [PASS/FAIL] {details if fail}
  Primitive context.ts: [PASS/FAIL] {details if fail} (or N/A if simple)
  Primitive index.ts:   [PASS/FAIL] {details if fail}
  Barrel registration:  [PASS/FAIL] {details if fail}
  Zero tolerance:       [PASS/FAIL] {details if fail}
  RESULT: GOLD STANDARD / NEEDS WORK
```
