<!--
	@component Combobox — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	ColdLight Combobox — compound component root.
	Creates MeltUI combobox transport, computes variant-driven recipe,
	and sets context for all sub-components.

	MeltUI transport adapter provides all ARIA semantics:
	- role="combobox" on input, role="listbox" on content, role="option" on items
	- aria-expanded, aria-controls, aria-activedescendant
	- Full keyboard navigation (ArrowUp/Down, Enter, Escape, Home, End, Tab)
	- Focus management via activedescendant pattern

	ColdLight adds:
	- data-kind="combobox", data-slot="root"
	- WAI-Adapt: data-adapt-action, data-adapt-purpose, data-adapt-simplification
	- ARIA 1.3: aria-description
	- Variant-driven recipe (size, disabled) via context

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
	WAI-ARIA 1.3: https://w3c.github.io/aria/
	WAI-Adapt: https://w3c.github.io/adapt/
-->
<script lang="ts">
import { createComboboxTransport } from "$lib/design/api/dsadapters/meltui/_internal/combobox/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DsSurfaceProps } from "$lib/design/recipes/types.js";
import { setComboboxContext } from "./context.js";
import type { ComboboxProps } from "./types.js";

let {
	value,
	onValueChange,
	inputValue,
	onInputValueChange,
	open,
	onOpenChange,
	size = "md",
	disabled = false,
	children,
	class: className,
	"adapt-action": adaptAction = "filter",
	"adapt-purpose": adaptPurpose = "search-term",
	"adapt-simplification": adaptSimplification = "critical",
	"aria-description": ariaDescription,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
}: ComboboxProps = $props();

const transport = createComboboxTransport({
	get value() {
		return value;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onValueChange: (v: any) => onValueChange?.(v),
	get inputValue() {
		return inputValue;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onInputValueChange: (v: any) => onInputValueChange?.(v),
	get open() {
		return open;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onOpenChange: (v: any) => onOpenChange?.(v),
});

// Resolve recipe from the SSOT registry
// biome-ignore lint/style/noNonNullAssertion: recipe is registered at module level — always present
const recipeDef = getRecipe("combobox.glass.void")!;
const recipe = $derived(
	recipeDef.classes?.({
		...recipeDef.defaults,
		size,
	} as DsSurfaceProps) ?? {},
);

setComboboxContext({
	...transport,
	get recipe() {
		return recipe as Record<string, string>;
	},
	get disabled() {
		return disabled;
	},
});

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));
</script>

<div
	data-kind="combobox"
	data-slot="root"
	data-adapt-action={adaptAction}
	data-adapt-purpose={adaptPurpose}
	data-adapt-simplification={adaptSimplification}
	{...ariaDescription ? {"aria-description": ariaDescription} : {}}
	aria-disabled={disabled ? "true" : undefined}
	class={cn(recipe.wrapper, visual.segments, visual.radius, disabled && "opacity-50 pointer-events-none", className)}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</div>
