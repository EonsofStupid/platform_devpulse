<!--
	@component ToolbarRoot
	@file primitives/toolbar/Toolbar.svelte
	@kind toolbar
	@layer primitives
	@package @devpulse/coldlight

	Structureless toolbar primitive — semantic HTML element with data attributes only.
	Contract: kind="toolbar", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/toolbar/Toolbar.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/toolbar/contract.ts

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
-->
<script lang="ts">
	import type { ToolbarProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: ToolbarProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Toolbar.Root");
</script>

<div
	data-kind="toolbar"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
