<!--
	@component ColorInput
	@file primitives/color-input/ColorInput.svelte
	@kind color-input
	@layer primitives
	@package @devpulse/coldlight

	Color picker input primitive — semantic HTML element with data attributes only.
	Contract: kind="color-input", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/color-input/ColorInput.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/color-input/contract.ts
-->
<script lang="ts">
	import type { ColorInputRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ColorInputRootProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "ColorInput"); });
</script>

<div data-kind="color-input" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
