<!--
	@component Toaster
	@kind toaster
	@layer components

	ColdLight Toaster — wraps MeltUI toaster transport with:
	- ARIA attributes (role="region", aria-label via transport)
	- ColdLight 8-axis visual system
	- SD5 token-driven recipe

	ColdLight OWNS all ARIA. MeltUI transport handles toast lifecycle.
-->
<script lang="ts">
	import type { ToasterComponentProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";

	let {
		// Kind-specific props
		position = "bottom-right",
		closeDelay = 5000,
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
	}: ToasterComponentProps = $props();

	// Resolve ColdLight visual
	const visual = useColdLight(() => ({ preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size }));

	// Compose: ColdLight visual + user classes
	const classes = $derived(cn(visual.segments, visual.radius, className));
</script>

<div
	{...rest}
	class={classes}
	data-kind="toaster"
	data-slot="root"
	data-position={position}
	data-encoding={visual.encoding || undefined}
	aria-label="Notifications"
	role="region"
>
	{@render children?.()}
</div>
