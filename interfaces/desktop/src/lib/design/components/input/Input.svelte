<!--
	@component Input
	@kind input
	@layer components

	ColdLight Input — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
	Note: Input has NO children (self-closing element).
-->
<script lang="ts">
	import type { InputComponentProps } from "./types.js";
	import { createInput } from "$lib/design/api/adapters/coldlight/_internal/input/index.js";
	import InputRoot from "$lib/design/primitives/input/Input.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { inputRecipe } from "./recipe.js";

	let {
		size = "md",
		value,
		invalid = false,
		disabled = false,
		readonly: readonlyProp = false,
		required: requiredProp = false,
		onValueChange,
		class: className,
		...rest
	}: InputComponentProps = $props();

	const builder = createInput({
		value: () => value as string | undefined,
		disabled: () => disabled,
		readonly: () => readonlyProp,
		required: () => requiredProp,
		invalid: () => invalid,
		onValueChange: (v: any) => onValueChange?.(v),
	});

	const classes = $derived(cn(inputRecipe({ size }), className));
</script>

<InputRoot
	{...builder.root}
	{...rest}
	class={classes}
/>
