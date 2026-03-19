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
import { createSkipLink } from "$lib/design/api/dsadapters/coldlight/_internal/skip-link/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import SkipLinkRoot from "$lib/design/primitives/skip-link/SkipLink.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { skipLinkRecipe } from "./recipe.js";
import type { SkipLinkComponentProps } from "./types.js";

let {
	// Kind-specific props
	href = "#main-content",
	label = "Skip to main content",
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
	size,
	// Rest spread
	...rest
}: SkipLinkComponentProps = $props();

const builder = createSkipLink({
	href: () => href,
	label: () => label,
});

// Resolve ColdLight visual
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

// Compose: structural recipe + ColdLight visual + user classes
const classes = $derived(cn(skipLinkRecipe(), visual.segments, visual.radius, className));
</script>

<SkipLinkRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</SkipLinkRoot>
