<!--
	@component NavItemRoot
	@file primitives/nav-item/NavItem.svelte
	@kind nav-item
	@layer primitives
	@package @devpulse/coldlight

	Structureless nav-item primitive — semantic HTML element with data attributes only.
	Contract: kind="nav-item", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/nav-item/NavItem.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/nav-item/contract.ts
-->
<script lang="ts">
	import type { NavItemProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: NavItemProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "NavItem.Root"); });
</script>

<a
	data-kind="nav-item"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</a>
