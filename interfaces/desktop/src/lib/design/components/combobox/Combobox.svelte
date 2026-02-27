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
	import type { ComboboxProps } from "./types.js";
	import { createComboboxTransport } from "$lib/design/api/adapters/meltui/_internal/combobox/index.js";
	import { setComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";
	import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

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
	}: ComboboxProps = $props();

	const transport = createComboboxTransport({
		value,
		onValueChange,
		inputValue,
		onInputValueChange,
		open,
		onOpenChange,
	});

	// Resolve recipe from the SSOT registry
	const recipeDef = getRecipe("combobox.glass.void")!;
	const recipe = $derived(
		recipeDef.classes({
			...recipeDef.defaults,
			size,
		} as DsSurfaceProps),
	);

	setComboboxContext({
		...transport,
		get recipe() { return recipe; },
		get disabled() { return disabled; },
	});
</script>

<div
	data-kind="combobox"
	data-slot="root"
	data-adapt-action={adaptAction}
	data-adapt-purpose={adaptPurpose}
	data-adapt-simplification={adaptSimplification}
	aria-description={ariaDescription}
	aria-disabled={disabled ? "true" : undefined}
	class={cn(recipe.wrapper, disabled && "opacity-50 pointer-events-none", className)}
>
	{@render children?.()}
</div>
