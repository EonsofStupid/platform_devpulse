<!--
	@component Spinner
	@kind spinner
	@layer components

	ColdLight Spinner — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { SpinnerProps } from "./types.js";
	import { createSpinner } from "$lib/design/api/dsadapters/coldlight/_internal/spinner/index.js";
	import SpinnerRoot from "$lib/design/primitives/spinner/Spinner.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { spinnerRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		active = true,
		onActiveChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		class: className,
		...rest
	}: SpinnerProps = $props();

	const builder = createSpinner({
		active: () => active,
		onActiveChange: (v: any) => onActiveChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "spinner-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(
		cn(spinnerRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<SpinnerRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined} />
