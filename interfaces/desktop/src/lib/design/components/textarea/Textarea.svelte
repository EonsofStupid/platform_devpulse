<!--
	@component Textarea
	@kind textarea
	@layer components

	ColdLight Textarea — wraps structureless TextareaRoot with:
	- ARIA attributes (aria-invalid, aria-required, aria-readonly, aria-disabled, aria-multiline)
	- State derivation (data-state)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Textarea is self-closing — no children snippet.
-->
<script lang="ts">
	import type { TextareaComponentProps } from "./types.js";
	import TextareaRoot from "$lib/design/primitives/textarea/Textarea.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { textareaRecipe } from "./recipe.js";

	let {
		size = "md",
		invalid = false,
		rows = 3,
		disabled = false,
		readonly: readonlyProp = false,
		required = false,
		class: className,
		...rest
	}: TextareaComponentProps = $props();

	const classes = $derived(cn(textareaRecipe({ size }), className));

	const dataState = $derived(
		invalid
			? "invalid"
			: disabled
				? "disabled"
				: readonlyProp
					? "readonly"
					: undefined,
	);
</script>

<TextareaRoot
	{...rest}
	class={classes}
	{rows}
	{disabled}
	readonly={readonlyProp}
	{required}
	aria-invalid={invalid || undefined}
	aria-required={required || undefined}
	aria-readonly={readonlyProp || undefined}
	aria-disabled={disabled || undefined}
	aria-multiline={true}
	data-state={dataState}
/>
