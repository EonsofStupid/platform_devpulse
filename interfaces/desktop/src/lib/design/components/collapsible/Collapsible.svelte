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
	import { createCollapsibleTransport } from "$lib/design/api/adapters/meltui/_internal/collapsible/index.js";
	import { setCollapsibleContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		open = false,
		onOpenChange,
		disabled = false,
		children,
		class: className,
		...rest
	}: CollapsibleProps = $props();

	const transport = createCollapsibleTransport({
		open: () => open,
		onOpenChange: (v: any) => onOpenChange?.(v),
		get disabled() { return disabled; },
	});

	setCollapsibleContext(transport);
</script>

<div
	class={cn(className)}
	data-kind="collapsible"
	data-slot="root"
	data-state={transport.states.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</div>
