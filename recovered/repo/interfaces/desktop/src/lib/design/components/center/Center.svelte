<!--
	@component Center
	@kind center
	@layer components

	ColdLight Center — builder-driven centering container.
	Builder provides data attributes. Component adds recipe classes (flex centering).
-->
<script lang="ts">
import { createCenter } from "$lib/design/api/dsadapters/coldlight/_internal/center/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import CenterRoot from "$lib/design/primitives/center/Center.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { centerRecipe } from "./recipe.js";
import type { CenterComponentProps } from "./types.js";

let {
	inline = false,
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
	...rest
}: CenterComponentProps = $props();

const builder = createCenter();

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

const classes = $derived(cn(centerRecipe({ inline }), visual.segments, visual.radius, className));
</script>

<CenterRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</CenterRoot>
