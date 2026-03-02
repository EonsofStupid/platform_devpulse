<!--
	@component LinkPreview
	@kind link-preview
	@layer components

	ColdLight LinkPreview — compound component root.
	Tooltip-like hover preview for links.
	Sub-components (LinkPreviewTrigger, LinkPreviewContent) consume context
	to access their slot attributes.

	ColdLight adds data-kind, data-slot, ColdLight 8-axis visual.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
-->
<script lang="ts">
	import type { LinkPreviewProps } from "./types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		openDelay = 700,
		closeDelay = 300,
		open,
		onOpenChange,
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
	}: LinkPreviewProps = $props();

	const visual = useColdLight(() => ({ preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size }));
</script>

<div
	class={cn(visual.segments, visual.radius, className)}
	data-kind="link-preview"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</div>
