<!--
	@component Stat
	@file primitives/stat/Stat.svelte
	@kind stat
	@layer primitives
	@package @devpulse/coldlight

	Structureless stat primitive — semantic HTML element with data attributes only.
	Contract: kind="stat", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/stat/Stat.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/stat/contract.ts
-->
<script lang="ts">
	import type { StatProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: StatProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Stat");
</script>

<div data-kind="stat" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
