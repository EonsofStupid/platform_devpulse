<!--
	@component Badge
	@kind badge
	@layer components

	ColdLight Badge — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
-->
<script lang="ts">
	import type { BadgeComponentProps } from "./types.js";
	import { createBadge } from "$lib/design/builders/badge/index.js";
	import BadgeRoot from "$lib/design/primitives/badge/Badge.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { badgeRecipe } from "./recipe.js";

	let {
		intent = "default",
		size = "md",
		children,
		class: className,
		...rest
	}: BadgeComponentProps = $props();

	const builder = createBadge({
		decorative: () => false,
		variant: () => intent,
	});

	const classes = $derived(cn(badgeRecipe({ intent, size }), className));
</script>

<BadgeRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</BadgeRoot>
