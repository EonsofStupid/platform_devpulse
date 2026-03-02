<!--
	@component Stat
	@kind stat
	@layer components

	ColdLight Stat — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { StatComponentProps } from "./types.js";
	import { createStat } from "$lib/design/api/adapters/coldlight/_internal/stat/index.js";
	import StatRoot from "$lib/design/primitives/stat/Stat.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { statRecipe } from "./recipe.js";

	let {
		// Kind-specific props
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
		// Rest spread
		...rest
	}: StatComponentProps = $props();

	const builder = createStat();

	const visual = useColdLight(
		() => ({
			preset: preset ?? "stat-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md", size,
		}),
	);

	const classes = $derived(
		cn(statRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<StatRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</StatRoot>
