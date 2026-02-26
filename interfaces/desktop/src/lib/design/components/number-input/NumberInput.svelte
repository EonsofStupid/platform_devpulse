<!--
	@component NumberInput
	@kind number-input
	@layer components

	ColdLight NumberInput — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, input, increment, decrement.
	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
-->
<script lang="ts">
	import type { NumberInputComponentProps } from "./types.js";
	import { createNumberInput } from "$lib/design/builders/number-input/index.js";
	import NumberInputRoot from "$lib/design/primitives/number-input/NumberInput.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { numberInputRecipe, numberInputInputRecipe, numberInputButtonRecipe } from "./recipe.js";

	let {
		size = "md",
		value = 0,
		onValueChange,
		min,
		max,
		step = 1,
		disabled = false,
		readonly: readOnly = false,
		required = false,
		valueText,
		children,
		class: className,
		...rest
	}: NumberInputComponentProps = $props();

	const builder = createNumberInput({
		value: () => value,
		onValueChange,
		min: () => min,
		max: () => max,
		step: () => step,
		disabled: () => disabled,
		readonly: () => readOnly,
		required: () => required,
		valueText: () => valueText,
		"aria-label": rest["aria-label"],
		"aria-describedby": rest["aria-describedby"],
	});

	const rootClasses = $derived(cn(numberInputRecipe({ size }), className));
	const inputClasses = $derived(cn(numberInputInputRecipe({ size })));
	const buttonClasses = $derived(cn(numberInputButtonRecipe({ size })));
</script>

<NumberInputRoot {...builder.root} {...rest} class={rootClasses}>
	<button {...builder.decrement} class={buttonClasses}>
		<span aria-hidden="true">-</span>
	</button>
	<input {...builder.input} class={inputClasses} />
	<button {...builder.increment} class={buttonClasses}>
		<span aria-hidden="true">+</span>
	</button>
	{@render children?.()}
</NumberInputRoot>
