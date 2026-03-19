<!--
	@component Spacer
	@kind spacer
	@layer components

	ColdLight Spacer — builder-driven flex spacer.
	Builder provides data attributes + aria-hidden. Component adds recipe classes.
	No children — purely presentational.
-->
<script lang="ts">
import { createSpacer } from "$lib/design/api/dsadapters/coldlight/_internal/spacer/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import SpacerRoot from "$lib/design/primitives/spacer/Spacer.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { spacerRecipe } from "./recipe.js";
import type { SpacerComponentProps } from "./types.js";

let {
	size = "auto",
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
}: SpacerComponentProps = $props();

const builder = createSpacer();

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
}));

const classes = $derived(cn(spacerRecipe({ size }), visual.segments, visual.radius, className));
</script>

<SpacerRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
