<!--
	@component Input
	@kind input
	@layer components

	ColdLight Input — wraps structureless Input primitive with:
	- ARIA attributes (aria-invalid, aria-required, aria-readonly, aria-disabled, aria-describedby)
	- State derivation (data-state)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Note: Input has NO children (self-closing element).
-->
<script lang="ts">
	import type { InputComponentProps } from "./types.js";
	import InputRoot from "$lib/design/primitives/input/Input.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { inputRecipe } from "./recipe.js";

	let {
		size = "md",
		invalid = false,
		disabled = false,
		readonly: readonlyProp = false,
		required: requiredProp = false,
		class: className,
		...rest
	}: InputComponentProps = $props();

	const classes = $derived(cn(inputRecipe({ size }), className));

	const dataState = $derived(
		disabled
			? "disabled"
			: invalid
				? "invalid"
				: readonlyProp
					? "readonly"
					: undefined,
	);
</script>

<InputRoot
	{...rest}
	class={classes}
	{disabled}
	readonly={readonlyProp}
	required={requiredProp}
	aria-invalid={invalid || undefined}
	aria-required={requiredProp || undefined}
	aria-readonly={readonlyProp || undefined}
	aria-disabled={disabled || undefined}
	data-state={dataState}
/>
