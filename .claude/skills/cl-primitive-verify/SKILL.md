---
name: cl-primitive-verify
description: Verify a ColdLight primitive meets ALL gold standard requirements
user-invocable: true
disable-model-invocation: false
argument-hint: "<primitive kind name, e.g. 'button', 'dialog', or 'all'>"
---

# ColdLight Primitive Verification

Verify primitive: $ARGUMENTS

## What This Skill Does

Verifies a ColdLight primitive against the gold standard architecture (2026-03-20).
Every primitive MUST pass this checklist before being considered complete.

If `$ARGUMENTS` is "all", verify every primitive in design/behaviors/.

## Architecture (CURRENT — 2026-03-20)

- **design/ IS ColdLight.** No coldlight/ subfolder. No taxonomy/ folder.
- **Behaviors ARE behavioral hooks WITH ARIA.** They are NOT empty shells.
- **SD5 engine drives all visuals.** DTCG tokens → CSS custom properties → Tailwind @theme → TypeScript types.
- **Components consume behaviors.** Import hook from behaviors/, add visual via useColdLight() + recipes.
- **Shared infra:** `_internal/` (kbd, uid, data-attr, dismiss, scroll-lock, presence), `schema/` (a11y, anatomy).

### What a Gold Standard Primitive Looks Like

Reference: accordion, dialog, tabs, button — these are verified good.

```
behaviors/{kind}/
  use-{kind}.svelte.ts   ← Svelte 5 runes hook. ARIA, keyboard, state. The behavior.
  {kind}.types.ts         ← Hook prop and return types. Fully typed, no `any`.
  {kind}.a11y.ts          ← WAI-ARIA APG spec declaration (roles, required attrs, keyboard, focus strategy)
  {kind}.anatomy.ts       ← Slot/part definitions via createAnatomy()
  {kind}.props.ts         ← Structural shell props (extends HTML element attrs, omits style)
  {Kind}.svelte           ← Structural shell: data-kind, data-slot, class merge, children render. Zero ARIA.
  index.ts                ← Barrel: exports hook, types, a11y, anatomy, props, primitive component
```

## Verification Checklist

### 1. Hook — `use-{kind}.svelte.ts`

- [ ] Exists
- [ ] Uses Svelte 5 runes: `$state`, `$derived` (NOT `writable`, `readable`, `$:`)
- [ ] Imports shared utils from `../../_internal/` (kbd, uid, data-attr as needed)
- [ ] Imports anatomy from `./` (spreads anatomy attrs onto returned slot objects)
- [ ] Imports types from `./`
- [ ] Returns typed object with getter-wrapped reactive properties
- [ ] All slots return: `data-kind`, `data-slot`, relevant ARIA attributes
- [ ] Keyboard handling where APG requires it (Space, Enter, Arrow keys, etc.)
- [ ] Event handlers (onclick, onkeydown) where APG requires interaction
- [ ] WAI-ARIA APG pattern URL in JSDoc
- [ ] For component behaviors: proper ARIA roles (button, dialog, tablist, etc.)
- [ ] For interaction utilities (hover, press, focus): returns interaction state, no ARIA roles needed
- [ ] NO direct DOM manipulation (no `document.querySelector`)
- [ ] NO imports from third-party headless UI libraries (Melt, Bits UI, etc.)

### 2. Types — `{kind}.types.ts`

- [ ] Exists
- [ ] Exports `Use{Kind}Props` interface with JSDoc on every field
- [ ] Exports `Use{Kind}Return` interface with readonly getters
- [ ] All return properties typed (no `Record<string, unknown>` for slot attrs — use specific object types or acceptable for spread pattern)
- [ ] No `any` types
- [ ] `.js` extension on any imports

### 3. A11y Spec — `{kind}.a11y.ts`

- [ ] Exists (for ARIA behaviors; interaction utilities may skip)
- [ ] Imports `A11ySpec` type from `../../schema/a11y.schema.js`
- [ ] Declares: `roles` per slot, `requiredAttrs`, `keyboard` bindings, `focusStrategy`
- [ ] APG pattern URL
- [ ] Matches what the hook actually implements

### 4. Anatomy — `{kind}.anatomy.ts`

- [ ] Exists
- [ ] Imports `createAnatomy` from `../../schema/anatomy.schema.js`
- [ ] Declares all slots the hook returns
- [ ] Used by the hook (spread into slot return objects)

### 5. Props — `{kind}.props.ts`

- [ ] Exists
- [ ] Extends appropriate HTML element attributes (HTMLButtonAttributes, HTMLDivElement, etc.)
- [ ] Omits `style` (ColdLight components never use inline styles)
- [ ] Includes `children?: Snippet` (unless self-closing element)
- [ ] Includes `class?: string`

### 6. Structural Shell — `{Kind}.svelte`

- [ ] Exists
- [ ] Uses `$props()` (Svelte 5 runes)
- [ ] Imports `cn` from `../_shared/cn.js`
- [ ] Imports props type from `./`
- [ ] Renders appropriate HTML element
- [ ] Sets `data-kind="{kind}"` and `data-slot="root"`
- [ ] Applies `class={cn(className)}`
- [ ] Spreads `{...rest}`
- [ ] Renders `{@render children?.()}` (unless self-closing)
- [ ] ZERO: role=, aria-*, id=, onclick/onkeydown, third-party headless imports, inline styles
- [ ] The shell does NOT call the hook — that's the component layer's job

### 7. Barrel — `index.ts`

- [ ] Exists
- [ ] Exports primitive component as named export: `export { default as {Kind}Primitive } from "./{Kind}.svelte";`
- [ ] Exports hook: `export { use{Kind} } from "./use-{kind}.svelte.js";`
- [ ] Exports a11y: `export { {kind}A11y } from "./{kind}.a11y.js";`
- [ ] Exports anatomy: `export { {kind}Anatomy } from "./{kind}.anatomy.js";`
- [ ] Exports types: `export type { Use{Kind}Props, Use{Kind}Return } from "./{kind}.types.js";`
- [ ] Exports props type: `export type { {Kind}PrimitiveProps } from "./{kind}.props.js";`
- [ ] All imports use `.js` extension

### 8. Zero Tolerance

- [ ] ZERO third-party headless UI imports
- [ ] ZERO vendor-specific headless directives (e.g. `use:melt`)
- [ ] ZERO `any` types
- [ ] ZERO legacy Svelte stores (`$:`, `writable`, `readable`)
- [ ] ZERO imports from deleted paths (`coldlight/`, `dsadapters/`, `taxonomy/`, `api/`)

## Execution

1. Read ALL files in behaviors/{kind}/
2. Check EVERY item above against the actual file content
3. For "all": produce a summary table

## Output Format

```
VERIFY: {kind}
  Hook:           [PASS/FAIL] {details}
  Types:          [PASS/FAIL] {details}
  A11y Spec:      [PASS/FAIL] {details}
  Anatomy:        [PASS/FAIL] {details}
  Props:          [PASS/FAIL] {details}
  Shell:          [PASS/FAIL] {details}
  Barrel:         [PASS/FAIL] {details}
  Zero Tolerance: [PASS/FAIL] {details}
  RESULT: GOLD STANDARD / NEEDS WORK
```

## What This Skill Does NOT Check

- Component layer (that's a separate verification)
- Recipe registration
- Storybook stories
- Visual rendering
- SD5 token output
