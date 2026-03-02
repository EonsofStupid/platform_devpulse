<!--
	@component Label
	@kind label
	@layer components

	ColdLight Label — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA semantics. useColdLight() resolves visual props.
	Native <label> element with `for` attribute association.
-->
<script lang="ts">
	import type { LabelComponentProps } from "./types.js";
	import { createLabel } from "$lib/design/api/adapters/coldlight/_internal/label/index.js";
	import LabelRoot from "$lib/design/primitives/label/Label.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { labelRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		size = "md",
		htmlFor,
		disabled = false,
		required = false,
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
	}: LabelComponentProps = $props();

	const builder = createLabel({
		htmlFor: () => htmlFor,
		disabled: () => disabled,
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "label-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(
		cn(labelRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<LabelRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
	{#if required}
		<span class="text-ember-400 ml-0.5" aria-hidden="true">*</span>
	{/if}
</LabelRoot>
