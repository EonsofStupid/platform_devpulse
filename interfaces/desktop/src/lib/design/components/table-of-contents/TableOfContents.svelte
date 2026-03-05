<!--
	@component TableOfContents
	@kind table-of-contents
	@layer components

	ColdLight TableOfContents -- wraps structureless TableOfContentsRoot with:
	- ARIA attributes (aria-label via builder)
	- Active heading tracking (builder manages activeId state)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { TableOfContentsComponentProps } from "./types.js";
	import { createTableOfContents } from "$lib/design/api/dsadapters/coldlight/_internal/table-of-contents/index.js";
	import TableOfContentsRoot from "$lib/design/primitives/table-of-contents/TableOfContents.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { tableOfContentsRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		label = "Table of contents",
		activeId,
		onActiveIdChange,
		size = "md",
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
	}: TableOfContentsComponentProps = $props();

	const builder = createTableOfContents({
		label: () => label,
		activeId: () => activeId,
		onActiveIdChange: (v: string | undefined) => onActiveIdChange?.(v),
	});

	// Resolve ColdLight visual
	const visual = useColdLight(() => ({ preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size }));

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(cn(tableOfContentsRecipe({ size }), visual.segments, visual.radius, className));
</script>

<TableOfContentsRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</TableOfContentsRoot>
