<!--
	@component Collapsible
	@kind collapsible
	@layer components

	ColdLight Collapsible — compound component root.
	Creates MeltUI collapsible transport and sets context.
	Sub-components (CollapsibleTrigger, CollapsibleContent) consume context
	to access their slot attributes.

	MeltUI transport adapter provides ARIA (aria-expanded, aria-controls).
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script lang="ts">
	import type { CollapsibleProps } from "./types.js";
	import { createCollapsibleTransport } from "$lib/design/api/dsadapters/meltui/_internal/collapsible/index.js";
	import { setCollapsibleContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";

	let {
		open = false,
		onOpenChange,
		disabled = false,
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
		...rest
	}: CollapsibleProps = $props();

	const transport = createCollapsibleTransport({
		open: () => open,
		onOpenChange: (v: any) => onOpenChange?.(v),
		get disabled() { return disabled; },
	});

	setCollapsibleContext(transport);

	const visual = useColdLight(() => ({ preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size }));
</script>

<div
	class={cn(visual.segments, visual.radius, className)}
	data-kind="collapsible"
	data-slot="root"
	data-state={transport.states.open ? "open" : "closed"}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
