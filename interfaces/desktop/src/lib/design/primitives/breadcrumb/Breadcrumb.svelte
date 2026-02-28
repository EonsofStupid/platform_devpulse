<!--
	@component BreadcrumbRoot
	@file primitives/breadcrumb/Breadcrumb.svelte
	@kind breadcrumb
	@layer primitives
	@package @devpulse/coldlight

	Structureless breadcrumb primitive — semantic HTML element with data attributes only.
	Contract: kind="breadcrumb", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/breadcrumb/Breadcrumb.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/breadcrumb/contract.ts
-->
<script lang="ts">
	import type { BreadcrumbProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: BreadcrumbProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Breadcrumb.Root"); });
</script>

<nav
	data-kind="breadcrumb"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</nav>
