<!--
	@component List
	@kind list
	@layer components

	ColdLight List — wraps structureless ListRoot with:
	- ARIA attributes (role="list", aria-label)
	- Builder-driven attribute binding
	- SD5 token-driven recipe (variant x size x spacing)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { ListComponentProps } from "./types.js";
	import { createList } from "$lib/design/api/dsadapters/coldlight/_internal/list/index.js";
	import ListRoot from "$lib/design/primitives/list/List.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { listRecipe } from "./recipe.js";

	let {
		size = "md",
		variant = "none",
		spacing = "default",
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
	}: ListComponentProps = $props();

	const builder = createList({
		get label() { return label; },
	});

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(listRecipe({ size, variant, spacing }), visual.segments, visual.radius, className));
</script>

<ListRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</ListRoot>
