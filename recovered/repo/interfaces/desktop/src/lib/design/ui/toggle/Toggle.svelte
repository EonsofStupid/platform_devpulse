<!--
	@component ToggleUI
	@kind toggle
	@layer ui

	Styled ColdLight Toggle — COMPONENT + RECIPE = visual output.
	Wraps components/toggle (ARIA via MeltUI transport) + applies recipe + ColdLight encoding.
-->
<script lang="ts">
	import type { ToggleUIProps } from "./types.js";
	import Toggle from "$lib/design/components/toggle/Toggle.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { toggleRecipe } from "$lib/design/components/toggle/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		size = "md",
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
		// Component props (forwarded)
		children,
		class: className,
		...rest
	}: ToggleUIProps = $props();

	const visual = useColdLight(
		() => ({
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
		}),
	);

	const classes = $derived(cn(toggleRecipe({ size }), visual.segments, visual.radius, className));
</script>

<Toggle {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Toggle>
