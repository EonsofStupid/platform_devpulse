# SPRINT: ColdLight Unified Catalog — Full Pipeline

**Date**: 2026-03-02
**Research**: `SPRINT-COLDLIGHT-UNIFIED-CATALOG.research.md`
**Status**: IN PROGRESS

## Goal

Build the COMPLETE SD5 → Token → Variant → SVG Filter → Component → Page pipeline. Every component is DEFAULT STYLED from the unified token registry. The chat page and dashboard use real ColdLight components. SVG neuromorphism (feSpecularLighting, feTurbulence, feFlood) is wired as the premium rendering tier — no more stacking 9 box-shadow layers for hero surfaces.

## Pipeline Chain (end-to-end)

```
SD5 Token Sources (DTCG 1.0, OKLCH)
  ↓ pnpm ds:tokens:build
tokens.css (296 custom properties) + tailwind.css (@theme) + types.ts
  ↓ variant generator reads TOKEN_CATEGORY_REGISTRY
generated/variants.css (59 @utility rules, shadow composition)
  ↓ resolveVisual() reads presets + props + encoding
ResolvedVisual { segments, encoding, cssProperties, svgFilters, svgFilterClasses }
  ↓ useColdLight() wraps resolveVisual() as Svelte 5 $derived
Component spreads: cn(recipe, visual.segments, visual.radius, className)
  ↓ premium surfaces also apply visual.svgFilterClasses
SVG neuromorphism: filter: url(#bevel-medium) — GPU composited, shape-aware
  ↓ SvgFilters.svelte (mounted in +layout.svelte)
<filter id="bevel-medium"> → feSpecularLighting + feTurbulence + feMerge
  ↓ NeuPanel / NeuGauge / NeuFrame wrap SVG blanks for layout surfaces
Chat page / Dashboard use REAL components + Neu surfaces
```

## Prerequisites

- [x] Foundation audit complete (all infrastructure verified functional)
- [x] Research document written
- [x] Per-component preset/radius/size/intent data cataloged
- [x] SVG filter infrastructure audited (bevel 3, noise 2, glow 2 = 7 filters)
- [x] SvgFilters.svelte already mounted in root +layout.svelte
- [x] NeuPanel, NeuGauge, NeuFrame already built

---

## PHASE 0: Wire SVG Filters into resolveVisual()

Currently, resolveVisual() collects cssProperties but IGNORES svgFilters from token-categories.ts. Fix this so components and VPB receive the SVG filter data.

### 0.1: Add svgFilters to ResolvedVisual

**`registry/resolve-visual.ts`** — add to ResolvedVisual interface:
```typescript
export interface ResolvedVisual {
	values: EncodingIndices;
	preset: Preset;
	encoding: string;
	segments: string;
	radius: string;
	size: SizeToken;
	cssProperties: Record<string, string>;
	variant: string | undefined;
	/** SVG filter IDs needed for premium tier: ["bevel-soft", "noise-subtle"] */
	svgFilters: string[];
	/** Tailwind filter utility classes: "filter-bevel-soft filter-noise-subtle" */
	svgFilterClasses: string;
}
```

### 0.2: Collect svgFilters in resolveVisual()

After the cssProperties collection loop, add:
```typescript
// Collect SVG filters from all non-default categories
const svgFilters: string[] = [];
for (const cat of TOKEN_CATEGORY_REGISTRY) {
	const idx = values[cat.code as keyof EncodingIndices];
	const value = cat.values[idx];
	if (value?.svgFilters) {
		for (const filterId of value.svgFilters) {
			if (!svgFilters.includes(filterId)) svgFilters.push(filterId);
		}
	}
}

// Map filter IDs to Tailwind utility classes (from svg/filters/filters.css)
const FILTER_CLASS_MAP: Record<string, string> = {
	"bevel-soft": "filter-bevel-soft",
	"bevel-medium": "filter-bevel-medium",
	"bevel-strong": "filter-bevel-strong",
	"noise-subtle": "filter-noise-subtle",
	"noise-medium": "filter-noise-medium",
	"glow-teal-svg": "filter-glow-teal",
	"glow-purple-svg": "filter-glow-purple",
};
const svgFilterClasses = svgFilters
	.map(id => FILTER_CLASS_MAP[id])
	.filter(Boolean)
	.join(" ");
```

### 0.3: Return svgFilters in the result

```typescript
return {
	values, preset, encoding, segments, radius, size, cssProperties, variant: input.preset,
	svgFilters,
	svgFilterClasses,
};
```

### Verification
- [ ] resolveVisual({ bevel: "soft" }).svgFilters → ["bevel-soft"]
- [ ] resolveVisual({ bevel: "medium" }).svgFilters → ["bevel-medium", "noise-subtle"]
- [ ] resolveVisual({ bevel: "strong" }).svgFilters → ["bevel-strong", "noise-subtle"]
- [ ] resolveVisual({ material: "metal-brushed" }).svgFilters → ["noise-subtle"]

---

## PHASE 1: Merge ui/ logic into components/ (29 components)

### VERBATIM PATTERNS

Every component follows one of 4 patterns. The EXACT code for each pattern is below.

### Pattern A: Intent-Driven (button, alert, badge, banner, callout, card)

These components have an INTENT_PRESETS map that translates intent → preset name.

**types.ts** (verbatim — button example):
```typescript
/**
 * @file Button Types
 * @kind button
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { ButtonSize } from "./recipe.js";

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

export const BUTTON_INTENT_PRESETS: Record<ButtonIntent, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
	danger: "btn-danger",
};

export { ButtonSize };

export interface ButtonProps extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled" | "type">, BaseProps, ColdLightProps {
	children?: Snippet;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	loading?: boolean;
	expanded?: boolean;
	intent?: ButtonIntent;
	size?: ButtonSize;
}
```

**{Kind}.svelte** (verbatim — button example):
```svelte
<!--
	@component Button
	@kind button
	@layer components

	ColdLight Button — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { ButtonProps } from "./types.js";
	import { BUTTON_INTENT_PRESETS } from "./types.js";
	import { createButton } from "$lib/design/api/dsadapters/coldlight/_internal/button/index.js";
	import ButtonRoot from "$lib/design/primitives/button/Button.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { buttonRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		intent = "primary",
		size = "md",
		pressed,
		onPressedChange,
		loading = false,
		disabled = false,
		expanded,
		type,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: ButtonProps = $props();

	const builder = createButton({
		disabled: () => disabled,
		pressed: () => pressed,
		loading: () => loading,
		expanded: () => expanded,
		type: () => type,
		onPressedChange: (v) => onPressedChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? BUTTON_INTENT_PRESETS[intent as keyof typeof BUTTON_INTENT_PRESETS],
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "lg", size,
		}),
	);

	const classes = $derived(
		cn(buttonRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<ButtonRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</ButtonRoot>
```

**index.ts** (verbatim — button example):
```typescript
export { default as Button } from "./Button.svelte";
export { BUTTON_INTENT_PRESETS, type ButtonProps, type ButtonIntent, type ButtonSize } from "./types.js";
```

### Pattern B: Simple Preset (checkbox, input, textarea, label, kbd, stat, spinner, skeleton, toggle, empty-state, separator, code, heading, text)

These components have a fixed default preset string (no intent map).

**types.ts** (verbatim — checkbox example):
```typescript
/**
 * @file Checkbox Types
 * @kind checkbox
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type CheckboxIntent = "default";
export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled">, BaseProps, ColdLightProps {
	children?: Snippet;
	disabled?: boolean;
	checked?: boolean;
	indeterminate?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	intent?: CheckboxIntent;
	size?: CheckboxSize;
}
```

**{Kind}.svelte** (verbatim — checkbox example):
```svelte
<!--
	@component Checkbox
	@kind checkbox
	@layer components

	ColdLight Checkbox — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { CheckboxProps } from "./types.js";
	import { createCheckbox } from "$lib/design/api/dsadapters/coldlight/_internal/checkbox/index.js";
	import CheckboxRoot from "$lib/design/primitives/checkbox/Checkbox.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { checkboxRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		intent = "default",
		size = "md",
		checked = false,
		indeterminate = false,
		disabled = false,
		onCheckedChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: CheckboxProps = $props();

	const builder = createCheckbox({
		checked: () => checked,
		indeterminate: () => indeterminate,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "input-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "sm",
		}),
	);

	const classes = $derived(
		cn(checkboxRecipe({ intent, size }), visual.segments, visual.radius, className),
	);
</script>

<CheckboxRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</CheckboxRoot>
```

### Pattern C: Compound Slot (switch, progress, avatar)

These render their own internal sub-slots. No injected class props.

**{Kind}.svelte** (verbatim — switch example):
```svelte
<!--
	@component Switch
	@kind switch
	@layer components

	ColdLight Switch — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { SwitchProps } from "./types.js";
	import { createSwitch } from "$lib/design/api/dsadapters/coldlight/_internal/switch/index.js";
	import SwitchRoot from "$lib/design/primitives/switch/Switch.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { switchRecipe, switchThumbRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		checked = false,
		disabled = false,
		onCheckedChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: SwitchProps = $props();

	const builder = createSwitch({
		checked: () => checked,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "input-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "full",
		}),
	);

	const classes = $derived(cn(switchRecipe({ size }), visual.segments, visual.radius, className));
	const thumbClasses = $derived(switchThumbRecipe({ size, checked }));
</script>

<SwitchRoot {...builder.root} {...rest} {checked} class={classes} data-encoding={visual.encoding || undefined}>
	<span class={thumbClasses}></span>
	{@render children?.()}
</SwitchRoot>
```

### Pattern D: Layout (grid, stack, hstack, box, container)

No builder. Pure structural + ColdLight visual.

**{Kind}.svelte** (verbatim — box example):
```svelte
<!--
	@component Box
	@kind box
	@layer components

	ColdLight Box — layout primitive, 8-axis visual system.
-->
<script lang="ts">
	import type { BoxProps } from "./types.js";
	import BoxRoot from "$lib/design/primitives/box/Box.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { boxRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		padding = "none",
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: BoxProps = $props();

	const visual = useColdLight(
		() => ({
			preset,
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "none",
		}),
	);

	const classes = $derived(cn(boxRecipe({ padding }), visual.segments, visual.radius, className));
</script>

<BoxRoot {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</BoxRoot>
```

---

## PER-COMPONENT SPECIFICS

| Kind | Pattern | Default Preset | Default Radius | Size Types | Intent/Variant Types | Behavioral Props |
|------|---------|---------------|----------------|------------|---------------------|-----------------|
| **button** | A | `BUTTON_INTENT_PRESETS[intent]` | `lg` | sm/md/lg | primary/secondary/ghost/danger | pressed, loading, expanded, type, disabled |
| **alert** | A | `ALERT_INTENT_PRESETS[intent]` + surface:"glass-void", depth:"z1", frame:"soft" | `lg` | — | info/success/warning/error | closable, onClose |
| **badge** | A | `BADGE_INTENT_PRESETS[intent]` | `full` | sm/md/lg | default/info/success/warning/error | — |
| **banner** | A | `BANNER_INTENT_PRESETS[intent]` | `md` | — | info/success/warning/error | closable, onClose |
| **callout** | A | `CALLOUT_VARIANT_PRESETS[variant]` | `md` | — | info/success/warning/error/tip | — |
| **card** | A | `CARD_VARIANT_PRESETS[variant]` | `lg` | sm/md/lg | default/outlined/elevated/ghost/glow | — |
| **checkbox** | B | `input-default` | `sm` | sm/md/lg | default | checked, indeterminate, disabled, onCheckedChange |
| **input** | B | `input-default` | `md` | sm/md/lg | — | disabled, placeholder, value |
| **textarea** | B | `textarea-default` | `md` | sm/md/lg | — | disabled, placeholder, value, rows |
| **label** | B | `label-default` | — | sm/md/lg | — | required |
| **kbd** | B | `kbd-default` | `sm` | sm/md/lg | — | — |
| **stat** | B | `stat-default` | `md` | sm/md/lg | — | — |
| **spinner** | B | `spinner-default` | — | sm/md/lg | — | — |
| **skeleton** | B | `skeleton-default` | — | — | text/circular/rectangular (variant) | — |
| **toggle** | B | (none) | — | sm/md/lg | — | pressed, onPressedChange, disabled |
| **empty-state** | B | (none) | `md` | sm/md/lg | — | — |
| **separator** | B | `divider-default` | `none` | — | solid/dashed/dotted (variant) | orientation |
| **code** | B | `code-inline`/`code-block` (by `inline` prop) | `sm`/`md` | — | — | language, inline |
| **heading** | B | `heading-default` | — | xs-3xl | — | level: 1-6 |
| **text** | B | `text-default` | — | xs-3xl | — | as, weight, color |
| **inline-message** | B | (none) | `md` | — | — | tone |
| **switch** | C | `input-default` | `full` | sm/md/lg | — | checked, disabled, onCheckedChange |
| **progress** | C | (none) | `full` | sm/md/lg | — | value, max |
| **avatar** | C | (none) | `full` | sm/md/lg | — | src, alt, fallback |
| **grid** | D | (none) | — | — | — | columns, gap, rows |
| **stack** | D | (none) | — | — | — | gap, align |
| **hstack** | D | (none) | — | — | — | gap, align, justify |
| **box** | D | (none) | `none` | — | — | padding |
| **container** | D | (none) | — | sm/md/lg/xl | — | — |

---

## PHASE 2: Update barrels + Delete ui/

- [ ] `design/index.ts` — change all imports from `./ui/index.js` to individual `./components/{kind}/index.js`
- [ ] Delete `interfaces/desktop/src/lib/design/ui/` (entire directory, 29 folders, 87 files)

---

## PHASE 3: Fix broken tests

- [ ] alert/Alert.test.ts — restore intent prop (now in component types)
- [ ] avatar/Avatar.test.ts — restore size prop
- [ ] empty-state/EmptyState.test.ts — restore size prop
- [ ] skeleton/Skeleton.test.ts — restore variant prop
- [ ] spinner/Spinner.test.ts — restore size prop
- [ ] label/Label.test.ts — change import back to component (not ui/)

---

## PHASE 4: Verify foundation

- [ ] `pnpm svelte-check` = 0 errors
- [ ] All test imports resolve correctly

---

## PHASE 5: Wire Chat Page to ColdLight Components

The chat page (`routes/(chat)/chat/+page.svelte`) currently hand-codes everything with raw HTML + inline styles + manual v-s1/v-s2 classes. Replace with REAL ColdLight components using the REGISTERED PRESETS that already exist:

### Registered chat presets (already in registry/presets.ts)
- `chat-bubble-ai` — glass-deep, z1, bevel-subtle
- `chat-bubble-user` — glass-smoke, z1
- `chat-bubble-system` — matte-dark, soft frame
- `chat-input` — glass-void, soft frame, fast transition

### Chat page component usage
```svelte
<!-- Thread sidebar button (active) -->
<Button intent="ghost" surface="glass-void" glow="teal" size="sm">ALPHA</Button>

<!-- AI message bubble -->
<Box preset="chat-bubble-ai" radius="lg" class="max-w-[85%] px-3 py-2">
	<HStack gap="1.5" class="mb-1">
		<Sparkles size={12} />
		<Heading level={6} size="xs" class="font-display">Maestro</Heading>
	</HStack>
	<Text size="sm">{msg.content}</Text>
</Box>

<!-- User message bubble -->
<Box preset="chat-bubble-user" radius="lg" class="max-w-[85%] px-3 py-2">
	<Text size="sm">{msg.content}</Text>
</Box>

<!-- Chat input area -->
<Input preset="chat-input" placeholder="Ask Maestro..." size="md" />
```

### Checklist
- [ ] Replace thread sidebar buttons with `<Button intent="ghost">`
- [ ] Replace message divs with `<Box preset="chat-bubble-ai">` / `<Box preset="chat-bubble-user">`
- [ ] Replace inline `<input>` with `<Input preset="chat-input">`
- [ ] Replace send/mic buttons with `<Button intent="ghost" size="sm">`
- [ ] Replace text spans with `<Text>` components
- [ ] All inline styles replaced with ColdLight props or token classes

---

## PHASE 6: Dashboard Shell

Build `routes/(dashboard)/+page.svelte` using widget presets and SVG neuromorphism surfaces.

### Registered widget presets (already in registry/presets.ts)
- `widget-stat` — glass-smoke, z1, soft frame
- `widget-chart` — glass-deep, z2, soft frame
- `widget-gauge` — glass-deep, z1, teal glow, breathe animation
- `widget-kpi` — glass-frost, z2, cyber glow
- `widget-table` — matte-dark, hard frame
- `widget-timeline` — glass-smoke, bevel-subtle

### SVG neuromorphism surfaces (already built)
- `NeuPanel` — for key dashboard panels (bevel + noise + glow)
- `NeuGauge` — for Maestro Control circular gauge (bevel-medium + noise)
- `NeuFrame` — for hero/featured content (bevel-strong + noise-medium + glow)

### Dashboard layout
```svelte
<!-- App shell -->
<Box preset="shell-app" class="h-screen flex flex-col">
	<!-- Top bar -->
	<Box preset="shell-topbar" class="h-12 flex items-center px-4">
		<Heading level={1} size="lg" class="font-display">DevPULSE</Heading>
		<Badge intent="info" size="sm">M1 POLARIZED</Badge>
	</Box>

	<!-- Main content -->
	<HStack class="flex-1 overflow-hidden">
		<!-- Maestro Control — premium SVG neuromorphism -->
		<NeuGauge size={280} bevel="strong" noise>
			<!-- Gauge arc + value overlay -->
		</NeuGauge>

		<!-- Stat widgets -->
		<Card preset="widget-stat">
			<Stat label="Build Time" value="2.1s" />
		</Card>

		<!-- Chart widget — premium surface -->
		<NeuPanel bevel="medium" noise glow="teal">
			<!-- Chart content -->
		</NeuPanel>
	</HStack>

	<!-- Status bar -->
	<Box preset="shell-statusbar" class="h-8 flex items-center px-4">
		<Text size="xs" class="text-muted">Platform healthy</Text>
	</Box>
</Box>
```

### Checklist
- [ ] Create `routes/(dashboard)/+page.svelte`
- [ ] App shell: Box preset="shell-app" + shell-topbar + shell-statusbar
- [ ] Maestro Control: NeuGauge with bevel="strong" for SVG neuromorphism
- [ ] Stat widgets: Card preset="widget-stat" wrapping Stat components
- [ ] Chart area: NeuPanel with bevel="medium" + noise + teal glow
- [ ] KPI display: Card preset="widget-kpi"
- [ ] All using registered presets — zero hardcoded styles

---

## PHASE 7: Default Loading State

- [ ] Create loading skeleton layout using Skeleton components with `skeleton-default` preset (glass-void + pulse animation)
- [ ] Wire into SvelteKit loading states

---

## SVG NEUROMORPHISM — Performance Model

**Two tiers, same token system:**

| Tier | How | When | GPU Cost |
|------|-----|------|----------|
| Default | CSS box-shadow composition (4 layers: --shadow-depth, --shadow-bevel, --shadow-glow, --shadow-frame) | All elements | Low — browser composites shadows natively |
| Premium | SVG filter: `filter: url(#bevel-medium)` via filter-* utilities or NeuPanel/NeuGauge/NeuFrame | ~10 key surfaces per viewport | Medium — GPU-composited, shape-aware |

**Why SVG filters > stacked shadows for hero surfaces:**
- `feSpecularLighting` gives REAL Phong-model 3D highlights — physically-based light simulation, not flat inset shadows
- `feTurbulence` gives REAL grain texture — machined metal appearance, not just opacity layers
- ONE filter operation composites everything vs 4 box-shadow layers
- Shape-aware — glow follows SVG contours, not rectangular box
- CSS custom properties on SVG filter params → VPB can animate specular constant, light angle, grain frequency via sliders

**Already built, ready to use:**
- `filter-bevel-soft` / `filter-bevel-medium` / `filter-bevel-strong` — @utility classes
- `filter-noise-subtle` / `filter-noise-medium` — @utility classes
- `filter-glow-teal` / `filter-glow-purple` — @utility classes
- `NeuPanel` — bevel + noise + glow prop-driven surface
- `NeuGauge` — circular gauge surface (dashboard Maestro Control)
- `NeuFrame` — hero frame surface (bevel-strong + noise-medium + glow)
- `SvgFilters.svelte` — already mounted in +layout.svelte

---

## EXECUTION CHECKLIST (ALL PHASES)

### Phase 0: SVG filter wiring
- [ ] Add svgFilters + svgFilterClasses to ResolvedVisual interface
- [ ] Collect svgFilters in resolveVisual() from resolved category values
- [ ] Map filter IDs to Tailwind utility classes
- [ ] Verify: resolveVisual({ bevel: "medium" }).svgFilters → ["bevel-medium", "noise-subtle"]

### Phase 1: Merge ui/ into components/ (29 components)

#### Pattern A — Intent-driven
- [ ] button
- [ ] alert
- [ ] badge
- [ ] banner
- [ ] callout
- [ ] card

#### Pattern B — Simple preset
- [ ] checkbox
- [ ] input
- [ ] textarea
- [ ] label
- [ ] kbd
- [ ] stat
- [ ] spinner
- [ ] skeleton
- [ ] toggle
- [ ] empty-state
- [ ] separator
- [ ] code
- [ ] heading
- [ ] text
- [ ] inline-message

#### Pattern C — Compound slot
- [ ] switch
- [ ] progress
- [ ] avatar

#### Pattern D — Layout
- [ ] grid
- [ ] stack
- [ ] hstack
- [ ] box
- [ ] container

### Phase 2: Barrels + delete
- [ ] Update design/index.ts
- [ ] Delete ui/ directory

### Phase 3: Fix tests
- [ ] alert, avatar, empty-state, skeleton, spinner, label tests

### Phase 4: Verify
- [ ] pnpm svelte-check = 0 errors

### Phase 5: Chat page
- [ ] Replace hand-coded HTML with ColdLight components
- [ ] Use registered chat presets (chat-bubble-ai, chat-bubble-user, chat-input)

### Phase 6: Dashboard
- [ ] Create dashboard route
- [ ] NeuGauge for Maestro Control
- [ ] NeuPanel for chart widgets
- [ ] Widget presets for stats/KPIs

### Phase 7: Loading state
- [ ] Skeleton loading layout with skeleton-default preset

---

## RESOLVED DECISIONS

1. **Compound components** (switch, progress, avatar): Render their own internal slots. No injected class props (no `thumbClass`, `indicatorClass`, `imageClass`). Component knows its own structure.
2. **Type naming**: `ButtonProps`, `CheckboxProps`, etc. Platform standard — Chakra, Mantine, Radix, Ark UI all use `{Kind}Props`.
3. **ColdLightProps**: Every component extends ColdLightProps. Same consistent props everywhere. VPB dogfoods these same props.
4. **SVG neuromorphism**: Premium tier for hero surfaces (~10 per viewport). Default tier uses CSS shadow composition for everything else. Same token system drives both.
5. **SVG filter data in resolveVisual()**: svgFilters + svgFilterClasses returned in ResolvedVisual so VPB can toggle premium rendering per component.

---

## BARREL: design/index.ts (after merge)

```typescript
/**
 * @file ColdLight Design System
 * @package @devpulse/coldlight
 */

// Interactive
export {
	Button, BUTTON_INTENT_PRESETS,
	type ButtonProps, type ButtonIntent, type ButtonSize,
} from "./components/button/index.js";
export { Checkbox, type CheckboxProps, type CheckboxIntent, type CheckboxSize } from "./components/checkbox/index.js";
export { Switch, type SwitchProps, type SwitchSize } from "./components/switch/index.js";

// Form
export { Input, type InputProps, type InputSize } from "./components/input/index.js";
export { Textarea, type TextareaProps, type TextareaSize } from "./components/textarea/index.js";
export { Label, type LabelProps, type LabelSize } from "./components/label/index.js";

// Typography
export { Text, type TextProps, type TextSize, type TextWeight, type TextColor, type TextAs } from "./components/text/index.js";
export { Heading, type HeadingProps, type HeadingLevel, type HeadingSize } from "./components/heading/index.js";

// Data display
export { Stat, type StatProps, type StatSize } from "./components/stat/index.js";
export {
	Badge, BADGE_INTENT_PRESETS,
	type BadgeProps, type BadgeIntent, type BadgeSize,
} from "./components/badge/index.js";
export {
	Card, CARD_VARIANT_PRESETS,
	type CardProps, type CardVariant, type CardSize,
} from "./components/card/index.js";
export { Separator, type SeparatorProps, type SeparatorOrientation, type SeparatorVariant } from "./components/separator/index.js";
export { Code, type CodeProps, type CodeLanguage } from "./components/code/index.js";
export { Kbd, type KbdProps, type KbdSize } from "./components/kbd/index.js";
export { InlineMessage, type InlineMessageProps, type InlineMessageTone } from "./components/inline-message/index.js";
export { Avatar, type AvatarProps, type AvatarSize } from "./components/avatar/index.js";

// Feedback
export {
	Alert, ALERT_INTENT_PRESETS,
	type AlertProps, type AlertIntent,
} from "./components/alert/index.js";
export { Spinner, type SpinnerProps, type SpinnerSize } from "./components/spinner/index.js";
export { Skeleton, type SkeletonProps, type SkeletonVariant } from "./components/skeleton/index.js";
export { EmptyState, type EmptyStateProps, type EmptyStateSize } from "./components/empty-state/index.js";
export {
	Callout, CALLOUT_VARIANT_PRESETS,
	type CalloutProps, type CalloutVariant,
} from "./components/callout/index.js";
export {
	Banner, BANNER_INTENT_PRESETS,
	type BannerProps, type BannerIntent,
} from "./components/banner/index.js";
export { Progress, type ProgressProps, type ProgressSize } from "./components/progress/index.js";
export { Toggle, type ToggleProps, type ToggleSize } from "./components/toggle/index.js";

// Layout
export { Grid, type GridProps, type GridColumns, type GridGap, type GridRows } from "./components/grid/index.js";
export { Stack, type StackProps, type StackGap, type StackAlign } from "./components/stack/index.js";
export { HStack, type HStackProps, type HStackGap, type HStackAlign, type HStackJustify } from "./components/hstack/index.js";
export { Box, type BoxProps, type BoxPadding, type BoxRadius } from "./components/box/index.js";
export { Container, type ContainerProps, type ContainerSize } from "./components/container/index.js";

export type { ComponentSurfaceProps } from "./components/types.js";

// SVG Neuromorphism (premium tier surfaces)
export { default as NeuPanel } from "./svg/surfaces/NeuPanel.svelte";
export { default as NeuGauge } from "./svg/surfaces/NeuGauge.svelte";
export { default as NeuFrame } from "./svg/surfaces/NeuFrame.svelte";

// Blocks
export { Widget, WidgetHeader, WidgetTabs, WidgetContent, WidgetFooter } from "./blocks/widgets/index.js";
export type { WidgetProps, WidgetTab, WidgetSize } from "./blocks/widgets/index.js";

// Block infrastructure
export { BlockNodeSchema, BlockDocumentSchema, createBlockNode, createBlockDocument, BLOCK_CATEGORIES } from "./blocks/index.js";
export type { BlockNode, BlockDocument, BlockCategory } from "./blocks/index.js";

// Renderers
export { BlockRenderer, resolveClasses } from "./renderers/index.js";
export type { RendererContext } from "./renderers/index.js";

// Recipes
export { getRecipe, getRecipesForKind, registerRecipe } from "./recipes/index.js";
export type { DsSurfaceProps, RecipeDefinition } from "./recipes/types.js";

// Recipe registration (side-effect imports)
import "./recipes/layouts/shell/index.js";
import "./recipes/blocks/widget/index.js";

// Blueprints
export { getBlueprint, getBlueprintsForKind, registerBlueprint } from "./blueprints/index.js";
export type { BlueprintDefinition } from "./blueprints/types.js";

// Tokens
export * from "./tokens/index.js";
```
