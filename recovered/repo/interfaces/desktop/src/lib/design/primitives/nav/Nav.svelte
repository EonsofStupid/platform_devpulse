<!--
	@component NavRoot
	@file primitives/nav/Nav.svelte
	@kind nav
	@layer primitives
	@package @devpulse/coldlight

	Structureless nav primitive — semantic HTML element with data attributes only.
	Contract: kind="nav", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/nav/Nav.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/nav/contract.ts
-->
<script lang="ts">
	import type { NavProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: NavProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Nav.Root"); });
</script>

<nav
	data-kind="nav"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</nav>
