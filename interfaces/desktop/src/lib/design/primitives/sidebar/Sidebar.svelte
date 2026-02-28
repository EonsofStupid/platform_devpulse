<!--
	@component Sidebar
	@file primitives/sidebar/Sidebar.svelte
	@kind sidebar
	@layer primitives
	@package @devpulse/coldlight

	Side navigation panel primitive — semantic HTML element with data attributes only.
	Contract: kind="sidebar", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/sidebar/Sidebar.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/sidebar/contract.ts
-->
<script lang="ts">
	import type { SidebarProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: SidebarProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Sidebar"); });
</script>

<aside data-kind="sidebar" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</aside>
