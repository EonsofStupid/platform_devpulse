<!--
	@component Sticky
	@file primitives/sticky/Sticky.svelte
	@kind sticky
	@layer primitives
	@package @devpulse/coldlight

	Sticky positioning wrapper primitive — semantic HTML element with data attributes only.
	Contract: kind="sticky", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/sticky/Sticky.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/sticky/contract.ts
-->
<script lang="ts">
	import type { StickyProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: StickyProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Sticky"); });
</script>

<div data-kind="sticky" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
