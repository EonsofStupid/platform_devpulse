<!--
	@component ColorInput
	@kind color-input
	@layer components

	ColdLight ColorInput — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, swatch, input, label.
	WAI-ARIA: Native <input type="color"> semantics.
-->
<script lang="ts">
	import type { ColorInputComponentProps } from "./types.js";
	import { createColorInput } from "$lib/design/api/adapters/coldlight/_internal/color-input/index.js";
	import ColorInputRoot from "$lib/design/primitives/color-input/ColorInput.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import {
		colorInputRecipe,
		colorInputSwatchRecipe,
		colorInputInputRecipe,
		colorInputLabelRecipe,
	} from "./recipe.js";

	let {
		size = "md",
		value = "#000000",
		onValueChange,
		disabled = false,
		required = false,
		invalid = false,
		label,
		children,
		class: className,
		...rest
	}: ColorInputComponentProps = $props();

	const builder = createColorInput({
		value: () => value,
		onValueChange,
		disabled: () => disabled,
		required: () => required,
		invalid: () => invalid,
		"aria-label": rest["aria-label"],
		"aria-labelledby": rest["aria-labelledby"],
		"aria-describedby": rest["aria-describedby"],
	});

	const rootClasses = $derived(cn(colorInputRecipe({ size }), className));
	const swatchClasses = $derived(cn(colorInputSwatchRecipe({ size })));
	const inputClasses = $derived(cn(colorInputInputRecipe()));
	const labelClasses = $derived(cn(colorInputLabelRecipe({ size })));
</script>

<ColorInputRoot {...builder.root} {...rest} class={rootClasses}>
	<div {...builder.swatch} class={swatchClasses}></div>
	<input {...builder.input} class={inputClasses} />
	{#if label}
		<label {...builder.label} class={labelClasses}>{label}</label>
	{/if}
	{@render children?.()}
</ColorInputRoot>
