<!--
	@component SwitchUI
	@kind switch
	@layer ui

	Styled ColdLight Switch — COMPONENT + RECIPE = visual output.
	Passes thumbClass to component for thumb slot styling.
-->
<script lang="ts">
	import type { SwitchUIProps } from "./types.js";
	import Switch from "$lib/design/components/switch/Switch.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { switchRecipe, switchThumbRecipe } from "$lib/design/components/switch/recipe.js";
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
		checked = false,
		children,
		class: className,
		...rest
	}: SwitchUIProps = $props();

	const visual = useColdLight(
		() => ({
			preset: preset ?? "input-default",
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "full",
		}),
	);

	const classes = $derived(cn(switchRecipe({ size }), visual.segments, visual.radius, className));
	const thumbClasses = $derived(switchThumbRecipe({ size, checked }));
</script>

<Switch {...rest} {checked} thumbClass={thumbClasses} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Switch>
