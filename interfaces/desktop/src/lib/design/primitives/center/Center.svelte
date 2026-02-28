<!--
	@component Center
	@file primitives/center/Center.svelte
	@kind center
	@layer primitives
	@package @devpulse/coldlight

	Structureless center primitive — semantic HTML element with data attributes only.
	Contract: kind="center", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/center/Center.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/center/contract.ts
-->
<script lang="ts">
	import type { CenterProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: CenterProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Center"); });
</script>

<div data-kind="center" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
