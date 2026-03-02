<!--
	@component Nav
	@kind nav
	@layer components

	ColdLight Nav — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { NavComponentProps } from "./types.js";
	import { createNav } from "$lib/design/api/adapters/coldlight/_internal/nav/index.js";
	import NavRoot from "$lib/design/primitives/nav/Nav.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { navRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		label,
		size = "md",
		orientation = "horizontal",
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
	}: NavComponentProps = $props();

	const builder = createNav({ label: () => label });

	const visual = useColdLight(
		() => ({
			preset: preset ?? "nav-group",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(
		cn(navRecipe({ size, orientation }), visual.segments, visual.radius, className),
	);
</script>

<NavRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</NavRoot>
