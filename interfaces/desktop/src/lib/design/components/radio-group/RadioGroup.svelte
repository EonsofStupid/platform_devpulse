<!--
	@component RadioGroup
	@kind radio-group
	@layer components

	ColdLight RadioGroup — compound component root.
	Creates MeltUI radio group transport and sets root context.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script lang="ts">
	import type { RadioGroupProps } from "./types.js";
	import { createRadioGroupTransport } from "$lib/design/api/adapters/meltui/_internal/radiogroup/index.js";
	import { setRadioGroupContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { radioGroupRecipe } from "./recipe.js";

	let {
		value,
		onValueChange,
		disabled = false,
		required = false,
		loop = true,
		orientation = "vertical",
		children,
		class: className,
		...rest
	}: RadioGroupProps = $props();

	const transport = createRadioGroupTransport({
		value,
		onValueChange,
		disabled,
		required,
		loop,
		orientation,
	});

	setRadioGroupContext(transport);
	const recipe = radioGroupRecipe();
</script>

<div
	{...transport.slots.root}
	class={cn(recipe.root, orientation === "horizontal" ? "flex-row" : "flex-col", className)}
	data-kind="radio-group"
	data-slot="root"
	data-orientation={orientation}
	{...rest}
>
	{@render children?.()}
</div>
