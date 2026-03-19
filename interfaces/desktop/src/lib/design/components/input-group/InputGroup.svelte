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
import { createInputGroup } from "$lib/design/api/dsadapters/coldlight/_internal/input-group/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import InputGroupRoot from "$lib/design/primitives/input-group/InputGroup.svelte";
import { cn } from "$lib/design/utils/cn.js";
import {
	inputGroupInputRecipe,
	inputGroupPrefixRecipe,
	inputGroupRecipe,
	inputGroupSuffixRecipe,
} from "./recipe.js";
import type { InputGroupComponentProps } from "./types.js";

let {
	size = "md",
	disabled = false,
	prefix,
	suffix,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	// Rest spread
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
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

const rootClasses = $derived(
	cn(inputGroupRecipe({ size }), visual.segments, visual.radius, className),
);
const prefixClasses = $derived(cn(inputGroupPrefixRecipe({ size })));
const inputClasses = $derived(cn(inputGroupInputRecipe()));
const suffixClasses = $derived(cn(inputGroupSuffixRecipe({ size })));
</script>

<InputGroupRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
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
