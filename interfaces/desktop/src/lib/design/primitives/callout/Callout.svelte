<!--
	@component CalloutRoot
	@file primitives/callout/Callout.svelte
	@kind callout
	@layer primitives
	@package @devpulse/coldlight

	Structureless callout primitive — semantic HTML element with data attributes only.
	Contract: kind="callout", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/callout/Callout.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/callout/contract.ts
-->
<script lang="ts">
	import type { CalloutProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: CalloutProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Callout.Root"); });
</script>

<div
	data-kind="callout"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
