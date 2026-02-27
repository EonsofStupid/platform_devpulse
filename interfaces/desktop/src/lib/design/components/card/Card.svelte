<!--
	@component Card
	@kind card
	@layer components

	ColdLight Card -- wraps structureless CardRoot with:
	- ARIA attributes (role=group, aria-label, aria-labelledby via builder)
	- Builder provides root + header + content + footer slots
	- SD5 token-driven recipe (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { CardComponentProps } from "./types.js";
	import { createCard } from "$lib/design/api/adapters/coldlight/_internal/card/index.js";
	import CardRoot from "$lib/design/primitives/card/Card.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { cardRecipe } from "./recipe.js";

	let {
		label,
		labelledBy,
		size = "md",
		variant = "default",
		children,
		class: className,
		...rest
	}: CardComponentProps = $props();

	const builder = createCard({
		label: () => label,
		labelledBy: () => labelledBy,
	});
	const classes = $derived(cn(cardRecipe({ variant, size }), className));
</script>

<CardRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</CardRoot>
