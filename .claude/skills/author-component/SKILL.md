# Author Component

Author or reauthor a ColdLight component per ADR-001 (2-layer enterprise pattern).
Zero exceptions. No backwards compat. No shortcuts.

## When to use
- User says "author this component" or "create this component"
- User pastes a component API reference (Spectrum S2, Ark UI, Zag, Skeleton)
- User wants an existing component reauthored
- User says "align this component"

## Architecture (2 Layers — ADR-001 LOCKED)

### Layer 1: Primitive Hook (`behaviors/{kind}/`)
- Pure behavior. WAI-ARIA APG. No styling. No schema.
- `{kind}.anatomy.ts` — `createAnatomy(kind, slots)`
- `{kind}.types.ts` — behavioral props, per-slot typed attrs, return type
- `{kind}.a11y.ts` — APG reference, keyboard, roles
- `use-{kind}.svelte.ts` — `$state` + `$derived`. ARIA, keyboard, focus.
- NO .svelte components. NO .props.ts. Hook only.

### Layer 2: Component (`components/{kind}/`) — THE PRODUCT
- What users import. Hook + StyleMacro in ONE file.
- `{Kind}.svelte` — uses hook for ARIA + StyleMacro for visual
- `{kind}.types.ts` — extends UIBaseProps from `_base`
- `index.ts` — barrel (public API)

**No `ui/` folder. No dumb middle layer. No Zod schemas. No registry.**

## MANDATORY Component Contract

Every ColdLight component MUST have ALL of the following. No exceptions.

### 1. @defaults annotation header

In the HTML comment block at the top of the .svelte file. These are the SSOT seed values. The scanner extracts them into the DTCG pipeline. Values here MUST match what's in `style-presets.json`.

```html
<!--
	@component {Kind Name}
	@kind {kind}
	@layer component
	@category {category}
	@description {one-line description}
	@container {true|false}
	@containerSlots {slot names if container}
	@compound {true|false}
	@blockCategory {block category}
	@defaultStyle {kind}-default
	@styleIds {kind}-default, {kind}-stark, {kind}-glass, {kind}-flat, {kind}-matte
	@requiredAxes backgroundColor, border, borderRadius, shadow, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(...)",
		"border-radius": "...",
		"box-shadow": "...",
		"color": "oklch(...)",
		"border-color": "oklch(...)",
		"border-width": "...",
		"backdrop-filter": "blur(...)",
		"opacity": "1"
}
-->
```

### 2. `intent` prop — THE style selector

**Every component uses `intent` as the prop that selects the DTCG style preset.** Not `style`. Not `variant`. Not `accent`. Not `tone`. `intent`.

Exception: components where the semantic concept truly IS a variant (e.g. ChatBubble `variant="ai"|"user"|"system"` where the variants are functionally different, not just visually different). In those cases use `variant` — but the styleId still derives from it.

```typescript
// Types
export type {Kind}Intent = "default" | "primary" | "ghost" | "destructive";

// Component
let { intent = "default", ... }: {Kind}Props = $props();
const styleId = $derived(`{kind}-${intent}`);
```

### 3. `styleId` via `$derived` — ALWAYS

Never hardcode `const styleId = "{kind}-default"`. Always derive:

```typescript
const styleId = $derived(`{kind}-${intent}`);
```

### 4. StyleMacro wrapper — ALWAYS

```svelte
<StyleMacro kind="{kind}" style={styleId}>
	<element data-kind="{kind}" data-slot="{slot-name}" ...>
		...
	</element>
</StyleMacro>
```

### 5. data-kind + data-slot — ALWAYS

- `data-kind="{kind}"` on the root element
- `data-slot` = the structural slot name this component fills (e.g. "topbar", "root", "mode-selector")
- For standalone components: `data-slot="root"`
- For components that fill a parent grid/layout slot: `data-slot="{zone-name}"`

### 6. WAI-ARIA — ALWAYS

Every interactive component must have proper ARIA from its primitive hook. Every structural component must have the correct landmark role.

### 7. DTCG presets in style-presets.json — ALWAYS

Every component needs AT MINIMUM a `{kind}-default` preset entry. Standard set is 5 presets:
- `{kind}-default` — neuro-elevated (the flagship look)
- `{kind}-stark` — crisp 2D, gradient background, hard edges
- `{kind}-glass` — deep glass, heavy blur, translucent
- `{kind}-flat` — minimal, no shadows, subtle borders
- `{kind}-matte` — solid, subtle shadow, no blur

Each preset has 8 axes:
```json
{
	"background-color": { "$value": "oklch(...)", "$type": "color" },
	"border-radius": { "$value": "...", "$type": "dimension" },
	"box-shadow": { "$value": "...", "$type": "shadow" },
	"color": { "$value": "oklch(...)", "$type": "color" },
	"border-color": { "$value": "oklch(...)", "$type": "color" },
	"border-width": { "$value": "...", "$type": "dimension" },
	"backdrop-filter": { "$value": "blur(...)", "$type": "dimension" },
	"opacity": { "$value": "1", "$type": "number" }
}
```

### 8. Types — UIBaseProps + .js extensions

```typescript
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export type {Kind}Intent = "default" | "stark" | "glass" | "flat" | "matte";

export interface {Kind}Props extends UIBaseProps {
	intent?: {Kind}Intent;
	// ... component-specific props
}
```

### 9. Barrel export — index.ts

```typescript
export { default as {Kind} } from "./{Kind}.svelte";
export type { {Kind}Props, {Kind}Intent } from "./{kind}.types.js";
```

### 10. All values from tokens — NO hardcoded values

- All colors: oklch from tokens
- All sizes: rem from tokens
- All shadows: from token pipeline
- All border-radius: from token pipeline
- Structural Tailwind classes (flex, grid, gap, padding) are fine — those are layout, not visual

## What to do

1. **Check if primitive hook exists** — if not, author it (anatomy + types + a11y + hook)
2. **Author component** — hook + StyleMacro in ONE file. Extends UIBaseProps. `intent` prop. `$derived` styleId.
3. **Author @defaults header** — seed values matching the default preset in style-presets.json
4. **Author DTCG style presets** — 5 presets (default, stark, glass, flat, matte) in style-presets.json
5. **Rebuild tokens** — `pnpm ds:tokens:build`
6. **Update consumers** — import from components/{kind}/
7. **Verify** — `pnpm svelte-check` 0 errors

## Reauthoring an existing component

When fixing an existing component to align:

1. Read the existing component fully
2. Check if it has a primitive hook — if not, note it but don't block on it
3. Replace hardcoded `styleId = "{kind}-default"` with `$derived(\`{kind}-${intent}\`)`
4. Add `intent` prop to the types file (with correct Intent type union)
5. Add `intent` to `$props()` destructuring with default `"default"`
6. Verify @defaults header has correct values
7. Verify @styleIds lists all available presets
8. `pnpm svelte-check` after EACH file edit

## BANNED

- `ui/` folder
- `useColdLight()`
- `registerRecipe()` / `recipes/` folder
- `registry/` folder
- Zod component schemas
- Hardcoded `styleId = "{kind}-default"` (MUST be $derived)
- `style` as a prop name for preset selection (use `intent`)
- `tone` as a prop name for preset selection (use `intent`)
- `accent` as a prop name for preset selection (use `intent`)
- Hardcoded colors in components
- Visual CSS classes that bypass the token pipeline
- `.svelte` components in behaviors
- Shorthand transforms in SD5
- Backwards compatibility shims

## Key files
- `design/ADR-001-STYLE-MACRO.md` — THE architecture
- `design/style/StyleMacro.svelte` — the provider
- `design/generated/render-base.css` — glue CSS, [data-kind] consumes --cl-*
- `design/components/_base/types.ts` — UIBaseProps
- `scripts/build/styledictionary/tokens/src/style-presets.json` — DTCG presets SSOT
