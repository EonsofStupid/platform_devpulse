<!--
	@component Label
	@kind label
	@layer components

	ColdLight Label — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Single root slot. Native <label> element with `for` attribute association.
-->
<script lang="ts">
	import type { LabelComponentProps } from "./types.js";
	import { createLabel } from "$lib/design/builders/label/index.js";
	import LabelRoot from "$lib/design/primitives/label/Label.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { labelRecipe } from "./recipe.js";

	let {
		size = "md",
		htmlFor,
		disabled = false,
		required = false,
		children,
		class: className,
		...rest
	}: LabelComponentProps = $props();

	const builder = createLabel({
		htmlFor: () => htmlFor,
		disabled: () => disabled,
	});

	const classes = $derived(cn(labelRecipe({ size }), className));
</script>

<LabelRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
	{#if required}
		<span class="text-ember-400 ml-0.5" aria-hidden="true">*</span>
	{/if}
</LabelRoot>
