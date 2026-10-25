<!--
	@component ListItem
	@file primitives/list/ListItem.svelte
	@kind list
	@layer primitives
	@package @devpulse/coldlight

	Structureless list item primitive — semantic HTML element with data attributes only.
	Contract: kind="list", slot="item"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/list/List.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/list/contract.ts
-->
<script lang="ts">
	import type { ListItemProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ListItemProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "ListItem"); });
</script>

<li data-kind="list" data-slot="item" class={cn(className)} {...rest}>
	{@render children?.()}
</li>
