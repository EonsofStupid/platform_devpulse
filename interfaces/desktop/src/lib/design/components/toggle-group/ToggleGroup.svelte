<!--
	@component ToggleGroup
	@kind toggle-group
	@layer components

	ColdLight ToggleGroup — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, item (via getItem method).
	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script lang="ts">
	import type { ToggleGroupComponentProps } from "./types.js";
	import { createToggleGroup } from "$lib/design/api/adapters/coldlight/_internal/toggle-group/index.js";
	import ToggleGroupRoot from "$lib/design/primitives/toggle-group/ToggleGroup.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { toggleGroupRecipe, toggleGroupItemRecipe } from "./recipe.js";

	let {
		size = "md",
		items = [],
		value,
		onValueChange,
		multiple = false,
		disabled = false,
		orientation = "horizontal",
		loop = true,
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
	}: ToggleGroupComponentProps = $props();

	const builder = createToggleGroup({
		value: () => value,
		onValueChange: ((v: any) => (onValueChange as any)?.(v)) as any,
		multiple: () => multiple as any,
		disabled: () => disabled,
		orientation: () => orientation,
		loop: () => loop,
	});

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const rootClasses = $derived(cn(toggleGroupRecipe({ size, orientation }), visual.segments, visual.radius, className));
	const itemClasses = $derived(cn(toggleGroupItemRecipe({ size })));
</script>

<ToggleGroupRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
	{#each items as item (item.value)}
		<button {...builder.getItem(item.value, item.disabled)} class={itemClasses}>
			{item.label}
		</button>
	{/each}
	{@render children?.()}
</ToggleGroupRoot>
