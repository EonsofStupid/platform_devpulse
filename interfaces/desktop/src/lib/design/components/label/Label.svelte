<!--
	@component Label
	@kind label
	@layer components

	ColdLight Label — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { LabelProps } from "./types.js";
	import { createLabel } from "$lib/design/api/adapters/coldlight/_internal/label/index.js";
	import LabelRoot from "$lib/design/primitives/label/Label.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { labelRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "md",
		htmlFor,
		disabled = false,
		required = false,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: LabelProps = $props();

	const builder = createLabel({
		htmlFor: () => htmlFor,
		disabled: () => disabled,
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "label-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(
		cn(labelRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<LabelRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
	{#if required}<span aria-hidden="true">*</span>{/if}
</LabelRoot>
