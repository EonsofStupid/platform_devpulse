<!--
	@component VisuallyHidden
	@kind visually-hidden
	@layer components

	ColdLight VisuallyHidden — pure CSS utility component.
	Renders content that is visually hidden but accessible to screen readers.
	Uses the sr-only pattern (position: absolute, clip, etc.).
	No builder, no transport — CSS only.
-->
<script lang="ts">
	import type { VisuallyHiddenComponentProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { visuallyHiddenRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		as = "span",
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
	}: VisuallyHiddenComponentProps = $props();

	// Resolve ColdLight visual
	const visual = useColdLight(() => ({ preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size }));

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(cn(visuallyHiddenRecipe(), visual.segments, visual.radius, className));
</script>

{#if as === "div"}
	<div
		{...rest}
		class={classes}
		data-kind="visually-hidden"
		data-slot="root"
		data-encoding={visual.encoding || undefined}
	>
		{@render children?.()}
	</div>
{:else}
	<span
		{...rest}
		class={classes}
		data-kind="visually-hidden"
		data-slot="root"
		data-encoding={visual.encoding || undefined}
	>
		{@render children?.()}
	</span>
{/if}
