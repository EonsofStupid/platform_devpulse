<!--
	@component InputUI
	@kind input
	@layer ui

	Styled ColdLight Input — COMPONENT + RECIPE = visual output.
	Self-closing — no children.
-->
<script lang="ts">
	import type { InputUIProps } from "./types.js";
	import Input from "$lib/design/components/input/Input.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { inputRecipe } from "$lib/design/components/input/recipe.js";
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
		class: className,
		...rest
	}: InputUIProps = $props();

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
			radius: radius ?? "md",
			size,
		}),
	);

	const classes = $derived(
		cn(inputRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<Input {...rest} class={classes} data-encoding={visual.encoding || undefined} />
