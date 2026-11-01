<!--
	@component List
	@file primitives/list/List.svelte
	@kind list
	@layer primitives
	@package @devpulse/coldlight

	Structureless list primitive — semantic HTML element with data attributes only.
	Contract: kind="list", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/list/List.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/list/contract.ts
-->
<script lang="ts">
	import type { ListProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ListProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "List");
</script>

<ul data-kind="list" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</ul>
