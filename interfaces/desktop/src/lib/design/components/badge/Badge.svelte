<!--
	@component Badge
	@kind badge
	@layer components

	ColdLight Badge — wraps structureless BadgeRoot with:
	- ARIA attributes (role="status", optional aria-label)
	- State derivation (data-state based on intent)
	- SD5 token-driven recipe (intent x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { BadgeComponentProps } from "./types.js";
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

	const classes = $derived(cn(badgeRecipe({ intent, size }), className));
</script>

<BadgeRoot
	{...rest}
	class={classes}
	role="status"
	data-state={intent}
>
	{@render children?.()}
</BadgeRoot>
