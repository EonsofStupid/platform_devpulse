<!--
	@component RadioGroup
	@kind radio-group
	@layer components

	ColdLight RadioGroup — compound component root.
	Creates MeltUI radio group transport and sets root context.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script lang="ts">
	import type { RadioGroupProps } from "./types.js";
	import { createRadioGroupTransport } from "$lib/design/api/dsadapters/meltui/_internal/radio-group/index.js";
	import { setRadioGroupContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { radioGroupRecipe } from "./recipe.js";

	let {
		value,
		onValueChange,
		disabled = false,
		required = false,
		loop = true,
		orientation = "vertical",
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
		// Rest spread
		...rest
	}: RadioGroupProps = $props();

	const transport = createRadioGroupTransport({
		get value() { return value; },
		onValueChange: (v: any) => onValueChange?.(v),
		get disabled() { return disabled; },
		get required() { return required; },
		get loop() { return loop; },
		get orientation() { return orientation; },
	});

	setRadioGroupContext(transport);

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const recipe = radioGroupRecipe();
</script>

<div
	{...transport.slots.root}
	class={cn(recipe.root, orientation === "horizontal" ? "flex-row" : "flex-col", visual.segments, visual.radius, className)}
	data-kind="radio-group"
	data-slot="root"
	data-orientation={orientation}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
