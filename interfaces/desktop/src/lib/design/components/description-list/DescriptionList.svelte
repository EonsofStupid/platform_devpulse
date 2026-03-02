<!--
	@component DescriptionList
	@kind description-list
	@layer components

	ColdLight DescriptionList — wraps structureless DescriptionListRoot with:
	- ARIA attributes (aria-label)
	- Builder-driven attribute binding for dt/dd semantics
	- SD5 token-driven recipe (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { DescriptionListComponentProps } from "./types.js";
	import { createDescriptionList } from "$lib/design/api/adapters/coldlight/_internal/description-list/index.js";
	import DescriptionListRoot from "$lib/design/primitives/description-list/DescriptionList.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { descriptionListRecipe } from "./recipe.js";

	let {
		size = "md",
		variant = "default",
		label,
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
		...rest
	}: DescriptionListComponentProps = $props();

	const builder = createDescriptionList({
		get label() { return label; },
	});

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(descriptionListRecipe({ size, variant }), visual.segments, visual.radius, className));
</script>

<DescriptionListRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</DescriptionListRoot>
