<!--
	@component ButtonRoot
	@file primitives/button/Button.svelte
	@kind button
	@layer primitives
	@package @devpulse/coldlight

	Structureless button primitive — semantic HTML element with data attributes only.
	Contract: kind="button", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/button/Button.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/button/contract.ts (locked 2026-02-21)

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
-->
<script lang="ts">
	import type { ButtonRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ButtonRootProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Button.Root"); });
</script>

<button
	data-kind="button"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
