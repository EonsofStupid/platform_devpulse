<!--
	@component Breadcrumb
	@kind breadcrumb
	@layer components

	ColdLight Breadcrumb -- wraps structureless BreadcrumbRoot with:
	- ARIA attributes (aria-label="Breadcrumb" via builder)
	- Builder provides root + list + item + separator + link slots
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Breadcrumb Pattern
-->
<script lang="ts">
import { createBreadcrumb } from "$lib/design/api/dsadapters/coldlight/_internal/breadcrumb/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import BreadcrumbRoot from "$lib/design/primitives/breadcrumb/Breadcrumb.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { breadcrumbRecipe } from "./recipe.js";
import type { BreadcrumbComponentProps } from "./types.js";

let {
	label = "Breadcrumb",
	separator = "/",
	size = "md",
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
	...rest
}: BreadcrumbComponentProps = $props();

const builder = createBreadcrumb({
	label: () => label,
	separator: () => separator,
});

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

const classes = $derived(cn(breadcrumbRecipe({ size }), visual.segments, visual.radius, className));
</script>

<BreadcrumbRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</BreadcrumbRoot>
