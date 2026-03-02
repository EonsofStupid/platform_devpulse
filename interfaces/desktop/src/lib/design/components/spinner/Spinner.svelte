<!--
	@component Spinner
	@kind spinner
	@layer components

	ColdLight Spinner — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { SpinnerComponentProps } from "./types.js";
	import { createSpinner } from "$lib/design/api/adapters/coldlight/_internal/spinner/index.js";
	import SpinnerRoot from "$lib/design/primitives/spinner/Spinner.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { spinnerRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		size = "md",
		active = true,
		onActiveChange,
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
	}: SpinnerComponentProps = $props();

	const builder = createSpinner({
		active: () => active,
		onActiveChange: (v: boolean) => onActiveChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "spinner-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(
		cn(spinnerRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<SpinnerRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
