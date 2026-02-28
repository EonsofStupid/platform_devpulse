<!--
	@component AspectRatio
	@file primitives/aspect-ratio/AspectRatio.svelte
	@kind aspect-ratio
	@layer primitives
	@package @devpulse/coldlight

	Fixed aspect ratio container primitive — semantic HTML element with data attributes only.
	Contract: kind="aspect-ratio", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/aspect-ratio/AspectRatio.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/aspect-ratio/contract.ts
-->
<script lang="ts">
	import type { AspectRatioProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: AspectRatioProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "AspectRatio"); });
</script>

<div data-kind="aspect-ratio" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
