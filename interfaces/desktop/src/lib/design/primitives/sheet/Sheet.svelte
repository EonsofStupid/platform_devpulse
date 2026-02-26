<!--
	@component SheetRoot
	@file primitives/sheet/Sheet.svelte
	@kind sheet
	@layer primitives
	@package @devpulse/coldlight

	Structureless sheet primitive — semantic HTML element with data attributes only.
	Contract: kind="sheet", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/sheet/Sheet.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/sheet/contract.ts

	Sheet is a compound primitive with trigger/overlay/content/close slots.
	The component layer orchestrates all sub-elements.
-->
<script lang="ts">
	import type { SheetContentProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: SheetContentProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Sheet");
</script>

<div data-kind="sheet" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
