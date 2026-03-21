<!--
	@component Combobox (Root)
	@kind combobox
	@layer components

	ColdLight Combobox — compound component root.
	Uses useComboBox() primitive hook for all ARIA and behavior.
	Sets context for sub-components.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { useComboBox } from "$lib/design/primitives/combobox/use-combobox.svelte.js";
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
	...rest
}: ComboboxProps = $props();

const hook = useComboBox({
	get inputValue() { return inputValue; },
	onInputChange: (v) => onInputValueChange?.(v),
	get selectedValue() { return value as string | undefined; },
	onSelectedChange: (v) => onValueChange?.(v),
	get open() { return open; },
	onOpenChange: (v) => onOpenChange?.(v),
	get disabled() { return disabled; },
});

const recipeDef = getRecipe("combobox.glass.void");
const recipeClasses = $derived(
	recipeDef?.classes?.({
		...recipeDef.defaults,
		size,
	} as DsSurfaceProps) ?? {},
);

setComboboxContext({
	get hook() { return hook; },
	get classes() { return recipeClasses; },
	get disabled() { return disabled; },
	get size() { return size; },
	dir: "ltr",
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
}));

const rootClasses = $derived(
	cn(recipeClasses.wrapper, visual.segments, visual.radius, disabled && "opacity-50 pointer-events-none", className),
);
</script>

<div
	{...hook.root}
	data-encoding={visual.encoding || undefined}
	aria-disabled={disabled ? "true" : undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</div>
