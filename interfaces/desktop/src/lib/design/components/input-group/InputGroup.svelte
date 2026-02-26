<!--
	@component InputGroup
	@kind input-group
	@layer components

	ColdLight InputGroup — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, prefix, input, suffix.
	WAI-ARIA: role="group" to associate input with addons.
-->
<script lang="ts">
	import type { InputGroupComponentProps } from "./types.js";
	import { createInputGroup } from "$lib/design/builders/input-group/index.js";
	import InputGroupRoot from "$lib/design/primitives/input-group/InputGroup.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import {
		inputGroupRecipe,
		inputGroupPrefixRecipe,
		inputGroupInputRecipe,
		inputGroupSuffixRecipe,
	} from "./recipe.js";

	let {
		size = "md",
		disabled = false,
		prefix,
		suffix,
		children,
		class: className,
		...rest
	}: InputGroupComponentProps = $props();

	const builder = createInputGroup({
		disabled: () => disabled,
		"aria-label": rest["aria-label"],
		"aria-labelledby": rest["aria-labelledby"],
	});

	const rootClasses = $derived(cn(inputGroupRecipe({ size }), className));
	const prefixClasses = $derived(cn(inputGroupPrefixRecipe({ size })));
	const inputClasses = $derived(cn(inputGroupInputRecipe()));
	const suffixClasses = $derived(cn(inputGroupSuffixRecipe({ size })));
</script>

<InputGroupRoot {...builder.root} {...rest} class={rootClasses}>
	{#if prefix}
		<div {...builder.prefix} class={prefixClasses}>
			{@render prefix()}
		</div>
	{/if}
	<div {...builder.input} class={inputClasses}>
		{@render children?.()}
	</div>
	{#if suffix}
		<div {...builder.suffix} class={suffixClasses}>
			{@render suffix()}
		</div>
	{/if}
</InputGroupRoot>
