<!--
	@component DescriptionList
	@kind description-list
	@layer components

	ColdLight DescriptionList — wraps structureless DescriptionListRoot with:
	- ARIA attributes (aria-label)
	- Builder-driven attribute binding for dt/dd semantics
	- SD5 token-driven recipe (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { DescriptionListComponentProps } from "./types.js";
	import { createDescriptionList } from "$lib/design/builders/description-list/index.js";
	import DescriptionListRoot from "$lib/design/primitives/description-list/DescriptionList.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { descriptionListRecipe } from "./recipe.js";

	let {
		size = "md",
		variant = "default",
		label,
		children,
		class: className,
		...rest
	}: DescriptionListComponentProps = $props();

	const builder = createDescriptionList({
		get label() { return label; },
	});

	const classes = $derived(cn(descriptionListRecipe({ size, variant }), className));
</script>

<DescriptionListRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</DescriptionListRoot>
