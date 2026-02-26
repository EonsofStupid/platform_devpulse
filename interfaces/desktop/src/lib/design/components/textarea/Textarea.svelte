<!--
	@component Textarea
	@kind textarea
	@layer components

	ColdLight Textarea — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
	Textarea is self-closing — no children snippet.
-->
<script lang="ts">
	import type { TextareaComponentProps } from "./types.js";
	import { createTextarea } from "$lib/design/builders/textarea/index.js";
	import TextareaRoot from "$lib/design/primitives/textarea/Textarea.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { textareaRecipe } from "./recipe.js";

	let {
		size = "md",
		value,
		invalid = false,
		rows = 3,
		disabled = false,
		readonly: readonlyProp = false,
		required = false,
		onValueChange,
		class: className,
		...rest
	}: TextareaComponentProps = $props();

	const builder = createTextarea({
		value: () => value as string | undefined,
		disabled: () => disabled,
		readonly: () => readonlyProp,
		required: () => required,
		invalid: () => invalid,
		rows: () => rows,
		onValueChange,
	});

	const classes = $derived(cn(textareaRecipe({ size }), className));
</script>

<TextareaRoot
	{...builder.root}
	{...rest}
	class={classes}
/>
