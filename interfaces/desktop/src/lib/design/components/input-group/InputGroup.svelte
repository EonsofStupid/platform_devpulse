<!--
	@component InputGroup
	@kind input-group
	@layer components

	ColdLight InputGroup — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds composition classes.

	Compound builder with slots: root, prefix, input, suffix.
	WAI-ARIA: role="group" to associate input with addons.
-->
<script lang="ts">
import { createInputGroup } from "$lib/design/api/dsadapters/coldlight/_internal/input-group/index.js";
import InputGroupRoot from "$lib/design/primitives/input-group/InputGroup.svelte";
import { cn } from "$lib/design/utils/cn.js";
import {
	inputGroupInputComposition,
	inputGroupPrefixComposition,
	inputGroupComposition,
	inputGroupSuffixComposition,
} from "./composition.js";
import type { InputGroupComponentProps } from "./types.js";

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
	get "aria-label"() {
		return rest["aria-label"];
	},
	get "aria-labelledby"() {
		return rest["aria-labelledby"];
	},
});

// Resolve ColdLight visual props
const rootClasses = $derived(
	cn(inputGroupComposition({ size }), className));
const prefixClasses = $derived(cn(inputGroupPrefixComposition({ size })));
const inputClasses = $derived(cn(inputGroupInputComposition()));
const suffixClasses = $derived(cn(inputGroupSuffixComposition({ size })));
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
