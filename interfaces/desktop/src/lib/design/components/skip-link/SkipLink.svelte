<!--
	@component SkipLink
	@kind skip-link
	@layer components

	ColdLight SkipLink -- wraps structureless SkipLinkRoot with:
	- ARIA attributes (aria-label, href via builder)
	- Focus management (builder handles click -> focus target)
	- SD5 token-driven recipe (sr-only + focus-visible)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { SkipLinkComponentProps } from "./types.js";
	import { createSkipLink } from "$lib/design/api/adapters/coldlight/_internal/skip-link/index.js";
	import SkipLinkRoot from "$lib/design/primitives/skip-link/SkipLink.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { skipLinkRecipe } from "./recipe.js";

	let {
		href = "#main-content",
		label = "Skip to main content",
		children,
		class: className,
		...rest
	}: SkipLinkComponentProps = $props();

	const builder = createSkipLink({
		href: () => href,
		label: () => label,
	});
	const classes = $derived(cn(skipLinkRecipe(), className));
</script>

<SkipLinkRoot {...builder.root} {...rest} class={classes}>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</SkipLinkRoot>
