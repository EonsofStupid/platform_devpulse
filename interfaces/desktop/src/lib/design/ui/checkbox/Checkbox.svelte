<!--
	@component CheckboxUI
	@kind checkbox
	@layer ui

	Styled ColdLight Checkbox — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { CheckboxUIProps } from "./types.js";
	import Checkbox from "$lib/design/components/checkbox/Checkbox.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { checkboxRecipe } from "$lib/design/components/checkbox/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		intent = "default",
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
	}: CheckboxUIProps = $props();

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
			radius: radius ?? "sm",
		}),
	);

	const classes = $derived(
		cn(checkboxRecipe({ intent, size }), visual.segments, visual.radius, className),
	);
</script>

<Checkbox {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Checkbox>
